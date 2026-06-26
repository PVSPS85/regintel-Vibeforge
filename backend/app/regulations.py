import os
import shutil
import asyncio
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Form, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db, SessionLocal
from app import models
from app.dependencies import get_current_active_user, RequireRole
from app.ai_service import get_ai_service

logger = logging.getLogger(__name__)

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

class WebhookTaskCreate(BaseModel):
    branch_id: str
    tasks: List[Dict[str, Any]]


def dispatch_ai_pipeline_and_save_tasks(regulation_id: UUID, file_path: str, branch_id_str: str):
    """
    Background worker thread: dispatches uploaded PDF to modular AIServiceInterface.
    Once obligations and action points are extracted, inserts real Task records
    into Supabase PostgreSQL mapped to internal departments.
    """
    logger.info(f"[RegIntel AI Worker] Ingesting regulation {regulation_id} from {file_path}...")
    db = SessionLocal()
    try:
        ai_service = get_ai_service()
        # Execute async AI pipeline dispatch
        result = asyncio.run(ai_service.process_regulation_pipeline(file_path, branch_id_str))
        tasks_list = result.get("tasks", [])

        branch_uuid = UUID(branch_id_str) if branch_id_str else None
        if not branch_uuid:
            first_b = db.query(models.Branch).first()
            branch_uuid = first_b.id if first_b else None

        if branch_uuid and tasks_list:
            for t in tasks_list:
                dept_name = t.get("department", "Compliance")
                team = db.query(models.Team).filter(
                    models.Team.branch_id == branch_uuid,
                    models.Team.name.ilike(f"%{dept_name}%")
                ).first()
                team_id = team.id if team else None

                prio_str = str(t.get("priority", "Medium")).upper()
                prio_enum = getattr(models.TaskPriority, prio_str, models.TaskPriority.MEDIUM)

                due_days = int(t.get("due_days", 14))
                due_date = datetime.utcnow().date() + timedelta(days=due_days)

                new_task = models.Task(
                    title=t.get("title", "Mandatory Regulatory Action Item"),
                    description=t.get("description", "Automated compliance obligation extracted via CrewAI"),
                    branch_id=branch_uuid,
                    assigned_to_team=team_id,
                    status=models.TaskStatus.PENDING,
                    priority=prio_enum,
                    due_date=due_date
                )
                db.add(new_task)
            db.commit()
            logger.info(f"[RegIntel AI Worker] Successfully seeded {len(tasks_list)} tasks into Supabase DB.")
    except Exception as e:
        logger.error(f"[RegIntel AI Worker Error] Pipeline ingestion failed: {e}")
    finally:
        db.close()


@router.get("/", response_model=List[RegulationResponse])
def get_regulations(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Returns a list of all uploaded regulatory circulars.
    Available to all authenticated employees.
    """
    return db.query(models.Regulation).order_by(models.Regulation.created_at.desc()).all()


@router.post("/", response_model=RegulationResponse, status_code=status.HTTP_201_CREATED)
@router.post("/upload", response_model=RegulationResponse, status_code=status.HTTP_201_CREATED)
def upload_regulation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Secure PDF Upload Endpoint. Protected by Manager/Admin roles.
    Saves file reference and triggers AI Service layer for extraction & task generation.
    """
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF circular files are supported.")
        
    final_title = title if title else file.filename
    
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
    
    branch_id_str = str(current_user.branch_id) if current_user.branch_id else ""
    background_tasks.add_task(dispatch_ai_pipeline_and_save_tasks, new_regulation.id, file_path, branch_id_str)
    
    return new_regulation


@router.post("/internal-webhook-tasks", status_code=status.HTTP_201_CREATED)
def internal_webhook_create_tasks(
    payload: WebhookTaskCreate,
    db: Session = Depends(get_db)
):
    """
    Internal Webhook receiver for microservice direct DB commits.
    """
    try:
        branch_uuid = UUID(payload.branch_id)
    except Exception:
        first_b = db.query(models.Branch).first()
        branch_uuid = first_b.id if first_b else None

    if not branch_uuid:
        return {"status": "ignored", "reason": "No valid branch"}

    for t in payload.tasks:
        dept_name = t.get("department", "Compliance")
        team = db.query(models.Team).filter(
            models.Team.branch_id == branch_uuid,
            models.Team.name.ilike(f"%{dept_name}%")
        ).first()
        team_id = team.id if team else None

        prio_str = str(t.get("priority", "Medium")).upper()
        prio_enum = getattr(models.TaskPriority, prio_str, models.TaskPriority.MEDIUM)

        new_t = models.Task(
            title=t.get("title", "Regulatory Action Item"),
            description=t.get("description", "Extracted via AI Webhook"),
            branch_id=branch_uuid,
            assigned_to_team=team_id,
            status=models.TaskStatus.PENDING,
            priority=prio_enum
        )
        db.add(new_t)
    db.commit()
    return {"status": "success", "tasks_seeded": len(payload.tasks)}


@router.post("/rag-query")
def rag_query(
    query_data: RAGQuery,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Synthesize answers from uploaded circulars via RAG.
    """
    ai_service = get_ai_service()
    return asyncio.run(ai_service.rag_query(query_data.query))
