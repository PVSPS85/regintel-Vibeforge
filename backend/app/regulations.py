import os
import shutil
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.dependencies import get_current_active_user, RequireRole

router = APIRouter(prefix="/regulations", tags=["Regulations"])

# Local schemas
class RegulationResponse(BaseModel):
    id: UUID
    title: str
    uploaded_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class RAGQuery(BaseModel):
    query: str

def process_pdf_background(regulation_id: UUID, file_path: str):
    """
    Placeholder background task.
    Eventually, this will load the PDF, chunk the text, generate embeddings via Gemini,
    and upsert the vectors into ChromaDB.
    """
    print(f"Background Task Triggered: Processing regulation {regulation_id} from {file_path}")
    pass

@router.get("/", response_model=List[RegulationResponse])
def get_regulations(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Returns a list of all uploaded regulations (metadata only).
    Available to all authenticated users.
    """
    return db.query(models.Regulation).order_by(models.Regulation.created_at.desc()).all()

@router.post("/", response_model=RegulationResponse, status_code=status.HTTP_201_CREATED)
def upload_regulation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Upload a regulatory PDF. Protected by manager roles.
    Creates a Regulation record and schedules background processing for the RAG pipeline.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    final_title = title if title else file.filename
    
    # Save file locally (basic implementation for now)
    upload_dir = "uploads/regulations"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    new_regulation = models.Regulation(
        title=final_title,
        file_path=file_path,
        uploaded_by=current_user.id
    )
    
    db.add(new_regulation)
    db.commit()
    db.refresh(new_regulation)
    
    # Trigger background task for RAG ingestion
    background_tasks.add_task(process_pdf_background, new_regulation.id, file_path)
    
    return new_regulation

@router.post("/rag-query")
def rag_query(
    query_data: RAGQuery,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Query the regulations via the RAG pipeline.
    Currently returns a mocked response pending full ChromaDB/Gemini integration.
    """
    # This is a stub. Future implementation will embed the query, query ChromaDB, 
    # and pass context to Gemini to stream a synthesized response.
    return {
        "answer": "AI integration pending",
        "sources": []
    }
