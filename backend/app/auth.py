from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt

from app.database import get_db
from app import models, schemas
from app.config import settings
from app.dependencies import get_current_user, RequireRole

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY.get_secret_value(), 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

@router.post("/request-access", status_code=status.HTTP_201_CREATED)
def request_access(user_data: schemas.RequestAccessCreate, db: Session = Depends(get_db)):
    # Verify branch_code
    branch = db.query(models.Branch).filter(models.Branch.code == user_data.branch_code).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch code not found")
        
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = get_password_hash(user_data.password)
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_pw,
        role=models.UserRole.EMPLOYEE,
        branch_id=branch.id,
        is_active=False  # Pending state
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Access request submitted successfully. Please wait for branch manager approval."}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is pending approval or inactive."
        )

    # JWT payload
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "user_id": str(user.id),
            "role": user.role.value,
            "branch_id": str(user.branch_id) if user.branch_id else None
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/approve-user/{user_id}")
def approve_user(
    user_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    user_to_approve = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_approve:
        raise HTTPException(status_code=404, detail="User not found")

    user_to_approve.is_active = True
    db.commit()
    
    return {"message": f"User {user_to_approve.email} approved successfully."}

@router.post("/deny-user/{user_id}")
def deny_user(
    user_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    user_to_deny = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_deny:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_to_deny.is_active:
        raise HTTPException(status_code=400, detail="Cannot deny an already active user.")
        
    db.delete(user_to_deny)
    db.commit()
    
    return {"message": f"User {user_to_deny.email} access request denied and deleted."}
