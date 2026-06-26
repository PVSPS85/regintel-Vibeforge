from typing import List, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # SECRET_KEY is a plain str in config.py (not SecretStr)
        secret_key = settings.SECRET_KEY if isinstance(settings.SECRET_KEY, str) else settings.SECRET_KEY.get_secret_value()
        payload = jwt.decode(token, secret_key, algorithms=[settings.ALGORITHM])
        
        # We assume the JWT payload contains the 'user_id'
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
            
        token_data = schemas.TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
        
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    # Included for future compatibility (e.g., checking if user is deactivated or banned)
    return current_user


class RequireRole:
    """
    Dependency class to enforce Role-Based Access Control (RBAC).
    Accepts a list of allowed roles.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: models.User = Depends(get_current_active_user)) -> models.User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
