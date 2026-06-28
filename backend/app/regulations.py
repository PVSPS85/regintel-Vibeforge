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
    status: str = "PROCESSING"
    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RAGQuery(BaseModel):
    query: str

class WebhookTaskCreate(BaseModel):
    branch_id: str
    regulation_id: Optional[str] = None
    tasks: List[Dict[str, Any]]


def map_department_to_team(db: Session, branch_uuid: Optional[UUID], dept_name: str) -> Optional[UUID]:
    """
    Normalizes LLM output department strings and maps them to real Supabase Team UUIDs.
    Ensures zero tasks end up unassigned so frontend dashboard work distribution updates cleanly.
    """
    if not branch_uuid:
        first_b = db.query(models.Branch).first()
        branch_uuid = first_b.id if first_b else None
    if not branch_uuid:
        return None

    teams = db.query(models.Team).filter(models.Team.branch_id == branch_uuid).all()
    if not teams:
        first_b = db.query(models.Branch).first()
        if first_b:
            teams = db.query(models.Team).filter(models.Team.branch_id == first_b.id).all()
    if not teams:
        return None

    clean_dept = (dept_name or "").strip().lower()

    # 1. Exact match
    for t in teams:
        if t.name.strip().lower() == clean_dept:
            return t.id

    # 2. Substring match against actual team names
    for t in teams:
        t_name = t.name.strip().lower()
        if clean_dept in t_name or t_name in clean_dept:
            return t.id

    # 3. Category keyword mapping
    keyword_map = {
        "it": ["it", "tech", "sec", "cyber", "system", "portal", "2fa", "data", "software", "network", "information"],
        "risk": ["risk", "audit", "aml", "fraud", "monitoring", "threat"],
        "comp": ["comp", "kyc", "regulat", "sop", "policy", "mandate", "guideline", "due diligence"],
        "leg": ["leg", "law", "counsel", "contract", "disclosure", "court", "ownership"],
        "ret": ["ret", "bank", "ops", "oper", "branch", "cust", "loan", "account", "onboard", "staff", "retail"]
    }

    for target_key, keywords in keyword_map.items():
        if any(kw in clean_dept for kw in keywords):
            for t in teams:
                t_name = t.name.lower()
                if target_key == "it" and any(w in t_name for w in ["it", "sec", "tech"]):
                    return t.id
                if target_key == "risk" and any(w in t_name for w in ["risk", "audit"]):
                    return t.id
                if target_key == "comp" and "comp" in t_name:
                    return t.id
                if target_key == "leg" and any(w in t_name for w in ["leg", "law"]):
                    return t.id
                if target_key == "ret" and any(w in t_name for w in ["ret", "bank", "ops", "branch"]):
                    return t.id

    # 4. Fallback to Compliance team or first team to ensure FK constraint is satisfied and dashboard charts update
    for t in teams:
        if "comp" in t.name.lower():
            return t.id

    return teams[0].id


def dispatch_ai_pipeline_and_save_tasks(regulation_id: UUID, file_path: str, branch_id_str: str):
    """
    Background worker thread: dispatches uploaded PDF to modular AIServiceInterface.
    Once obligations and action points are extracted, inserts real Task records
    into Supabase PostgreSQL mapped to internal departments.
    """
    logger.info(f"[RegIntel AI Worker] Ingesting regulation {regulation_id} from {file_path}...")
    db = SessionLocal()
    try:
        extracted_text_content = ""
        try:
            import fitz
            doc = fitz.open(file_path)
            pages = []
            for page in doc:
                pages.append(page.get_text("text"))
            doc.close()
            extracted_text_content = "\n".join(pages).strip()
            if len(extracted_text_content.split()) == 0:
                raise ValueError(f"Extracted 0 words from PDF '{file_path}'.")
        except Exception as e:
            logger.warning(f"Could not extract text with fitz: {e}")
            raise ValueError(f"PDF extraction failed: {e}")

        # Save extracted text immediately so frontend preview can show real text
        reg = db.query(models.Regulation).filter(models.Regulation.id == regulation_id).first()
        if reg and extracted_text_content:
            reg.extracted_text = extracted_text_content[:15000]
            db.commit()

        ai_service = get_ai_service()
        # Execute async AI pipeline dispatch
        result = asyncio.run(ai_service.process_regulation_pipeline(file_path, branch_id_str, str(regulation_id)))
        tasks_list = result.get("tasks", [])
        report_content = result.get("report", "AI compliance analysis completed.")

        # Prevent duplicate insertion if webhook seeded first
        existing_count = db.query(models.Task).filter(models.Task.regulation_id == regulation_id).count()

        branch_uuid = UUID(branch_id_str) if branch_id_str else None
        if not branch_uuid:
            first_b = db.query(models.Branch).first()
            branch_uuid = first_b.id if first_b else None

        if branch_uuid and tasks_list and existing_count == 0:
            for t in tasks_list:
                dept_name = t.get("department", "Compliance")
                team_id = map_department_to_team(db, branch_uuid, str(dept_name))

                prio_str = str(t.get("priority", "Medium")).upper()
                prio_enum = getattr(models.TaskPriority, prio_str, models.TaskPriority.MEDIUM)

                due_days = int(t.get("due_days", 14))
                due_date = datetime.utcnow().date() + timedelta(days=due_days)

                new_task = models.Task(
                    title=t.get("title") or t.get("task_title") or t.get("task") or t.get("action") or "Mandatory Regulatory Action Item",
                    description=t.get("detailed_explanation") or t.get("description") or t.get("details") or t.get("action_required") or t.get("instructions") or "Automated compliance obligation extracted via CrewAI",
                    branch_id=branch_uuid,
                    assigned_to_team=team_id,
                    regulation_id=regulation_id,
                    status=models.TaskStatus.PENDING,
                    priority=prio_enum,
                    due_date=due_date
                )
                db.add(new_task)
            logger.info(f"[RegIntel AI Worker] Successfully seeded {len(tasks_list)} tasks into Supabase DB.")

        reg = db.query(models.Regulation).filter(models.Regulation.id == regulation_id).first()
        if reg:
            reg.status = "PROCESSED"
            if extracted_text_content:
                reg.extracted_text = extracted_text_content[:15000]
            reg.summary = report_content
        db.commit()
    except Exception as e:
        logger.error(f"[RegIntel AI Worker Error] Pipeline ingestion failed: {e}")
        try:
            reg = db.query(models.Regulation).filter(models.Regulation.id == regulation_id).first()
            if reg:
                reg.status = "FAILED"
                if extracted_text_content:
                    reg.extracted_text = extracted_text_content[:15000]
            db.commit()
        except Exception:
            pass
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
        uploaded_by=current_user.id,
        status="PROCESSING"
    )
    
    db.add(new_regulation)
    db.commit()
    db.refresh(new_regulation)
    
    branch_id_str = str(current_user.branch_id) if current_user.branch_id else ""
    background_tasks.add_task(dispatch_ai_pipeline_and_save_tasks, new_regulation.id, file_path, branch_id_str)
    
    return new_regulation


# ── STATIC PATHS MUST COME BEFORE /{id} PARAMETERIZED ROUTES ─────────────────
# FastAPI matches routes in registration order. Any static path like
# /internal-webhook-tasks or /rag-query would be swallowed by /{id} if
# the parameterized routes were registered first.

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

    reg_uuid = None
    if payload.regulation_id:
        try:
            reg_uuid = UUID(payload.regulation_id)
        except Exception:
            pass

    existing_count = 0
    if reg_uuid:
        existing_count = db.query(models.Task).filter(models.Task.regulation_id == reg_uuid).count()

    if existing_count == 0:
        for t in payload.tasks:
            dept_name = t.get("department", "Compliance")
            team_id = map_department_to_team(db, branch_uuid, str(dept_name))

            prio_str = str(t.get("priority", "Medium")).upper()
            prio_enum = getattr(models.TaskPriority, prio_str, models.TaskPriority.MEDIUM)

            due_days = int(t.get("due_days", 14))
            due_date = datetime.utcnow().date() + timedelta(days=due_days)

            new_t = models.Task(
                title=t.get("title") or t.get("task_title") or t.get("task") or t.get("action") or "Regulatory Action Item",
                description=t.get("detailed_explanation") or t.get("description") or t.get("details") or t.get("action_required") or t.get("instructions") or "Extracted via AI Webhook",
                branch_id=branch_uuid,
                assigned_to_team=team_id,
                regulation_id=reg_uuid,
                status=models.TaskStatus.PENDING,
                priority=prio_enum,
                due_date=due_date
            )
            db.add(new_t)

    if reg_uuid:
        reg = db.query(models.Regulation).filter(models.Regulation.id == reg_uuid).first()
        if reg:
            reg.status = "PROCESSED"
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


# ── PARAMETERIZED ROUTES LAST ─────────────────────────────────────────────────

@router.get("/{id}", response_model=RegulationResponse)
def get_regulation(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Returns status of a specific regulation for frontend visual tracking."""
    reg = db.query(models.Regulation).filter(models.Regulation.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")
    return reg


@router.get("/{id}/tasks")
def get_regulation_tasks(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Returns extracted compliance tasks seeded for this regulatory circular."""
    tasks = db.query(models.Task).filter(models.Task.regulation_id == id).all()
    res = []
    for t in tasks:
        team_name = t.assigned_team.name if t.assigned_team else "Compliance"
        res.append({
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "department": team_name,
            "priority": t.priority.value if hasattr(t.priority, 'value') else str(t.priority),
            "due_date": t.due_date.strftime("%b %d") if t.due_date else "Jul 10"
        })
    return res


@router.post("/{id}/distribute")
def distribute_regulation_tasks(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Smart distribute endpoint — two-phase logic:
    Phase 1: If tasks already exist in DB for this regulation → promote them to IN_PROGRESS.
    Phase 2: If no tasks exist yet (LLM wrote JSON to summary but worker failed) →
             parse the regulation.summary JSON and bulk-insert tasks fresh, then set IN_PROGRESS.
    This ensures clicking the Distribute button ALWAYS populates the team workspace dashboards.
    """
    import json, re, ast

    reg = db.query(models.Regulation).filter(models.Regulation.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")

    branch_uuid = current_user.branch_id
    if not branch_uuid:
        first_b = db.query(models.Branch).first()
        branch_uuid = first_b.id if first_b else None

    existing_tasks = db.query(models.Task).filter(models.Task.regulation_id == id).all()

    # ── Phase 1: Tasks already seeded — just promote them ──────────────────────
    if existing_tasks:
        for t in existing_tasks:
            if t.status == models.TaskStatus.PENDING:
                t.status = models.TaskStatus.IN_PROGRESS
        db.commit()
        logger.info(f"[Distribute] Promoted {len(existing_tasks)} existing tasks to IN_PROGRESS for reg {id}")
        return {
            "status": "success",
            "action": "promoted",
            "distributed_count": len(existing_tasks)
        }

    # ── Phase 2: No tasks in DB — parse the summary JSON and insert fresh ──────
    logger.info(f"[Distribute] No tasks found for reg {id}. Attempting to parse summary JSON...")

    raw_summary = reg.summary or ""
    tasks_list: list = []

    def _extract_json_array(text: str) -> list:
        """Extract a JSON array from arbitrary text (handles markdown fences, prose, trailing commas)."""
        # Strip markdown fences
        fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
        if fence:
            text = fence.group(1).strip()
        # Find outermost [ ... ]
        start = text.find('[')
        end = text.rfind(']')
        if start == -1 or end == -1 or end <= start:
            return []
        candidate = text[start:end + 1]
        # Remove trailing commas before } or ]
        candidate = re.sub(r",\s*([\]}])", r"\1", candidate)
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
        try:
            parsed = ast.literal_eval(candidate)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
        return []

    tasks_list = _extract_json_array(raw_summary)

    if not tasks_list:
        logger.warning(f"[Distribute] Could not parse any tasks from summary for reg {id}.")
        raise HTTPException(
            status_code=422,
            detail=(
                "No compliance tasks are stored for this regulation, and the AI summary "
                "does not contain parseable JSON. Please re-upload the PDF so the AI can "
                "regenerate tasks, then try distributing again."
            )
        )

    inserted = 0
    for t in tasks_list:
        dept_name = t.get("department") or t.get("team") or t.get("assigned_team") or "Compliance"
        team_id = map_department_to_team(db, branch_uuid, str(dept_name))

        raw_prio = str(t.get("priority", "Medium")).strip().upper()
        # Normalize: "HIGH" → HIGH, "MEDIUM" → MEDIUM, "LOW" → LOW
        prio_map = {"HIGH": models.TaskPriority.HIGH, "MEDIUM": models.TaskPriority.MEDIUM, "LOW": models.TaskPriority.LOW}
        prio_enum = prio_map.get(raw_prio, models.TaskPriority.MEDIUM)

        try:
            due_days = int(t.get("due_days", 14))
        except (ValueError, TypeError):
            due_days = 14
        due_date = datetime.utcnow().date() + timedelta(days=due_days)

        new_task = models.Task(
            title=t.get("title") or t.get("task_title") or t.get("task") or t.get("action") or "Regulatory Compliance Action",
            description=t.get("detailed_explanation") or t.get("description") or t.get("details") or t.get("action_required") or t.get("instructions") or "Extracted from AI compliance analysis.",
            branch_id=branch_uuid,
            assigned_to_team=team_id,
            regulation_id=id,
            status=models.TaskStatus.PENDING,
            priority=prio_enum,
            due_date=due_date,
        )
        db.add(new_task)
        inserted += 1

    reg.status = "PROCESSED"
    db.commit()
    logger.info(f"[Distribute] Inserted {inserted} fresh tasks from summary JSON for reg {id}")
    return {
        "status": "success",
        "action": "inserted_and_distributed",
        "distributed_count": inserted
    }


class BulkTaskItem(BaseModel):
    """Schema for a single task coming from the frontend Distribute button."""
    title: str
    description: Optional[str] = None
    detailed_explanation: Optional[str] = None
    department: Optional[str] = "Compliance"
    priority: Optional[str] = "Medium"
    due_days: Optional[int] = 14
    regulation_id: Optional[str] = None


class BulkTaskRequest(BaseModel):
    tasks: List[BulkTaskItem]
    regulation_id: Optional[str] = None  # top-level fallback


@router.post("/bulk-distribute", status_code=status.HTTP_201_CREATED)
def bulk_distribute_tasks(
    payload: BulkTaskRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Direct bulk-insert endpoint called by the frontend 'Distribute Work' button.
    Accepts a JSON array of task objects, maps string department names to real team UUIDs,
    and commits every task to Supabase in a single transaction.

    POST /regulations/bulk-distribute
    Body: { "regulation_id": "...", "tasks": [ { "title": "...", "department": "IT Security", ... } ] }
    """
    branch_uuid = current_user.branch_id
    if not branch_uuid:
        first_b = db.query(models.Branch).first()
        branch_uuid = first_b.id if first_b else None

    if not branch_uuid:
        raise HTTPException(status_code=400, detail="No branch found. Ensure your account is linked to a branch.")

    # Resolve regulation UUID (payload-level takes precedence)
    reg_uuid: Optional[UUID] = None
    raw_reg_id = payload.regulation_id or (payload.tasks[0].regulation_id if payload.tasks else None)
    if raw_reg_id:
        try:
            reg_uuid = UUID(raw_reg_id)
        except ValueError:
            pass

    # Guard: prevent duplicate bulk inserts for the same regulation
    if reg_uuid:
        existing = db.query(models.Task).filter(models.Task.regulation_id == reg_uuid).count()
        if existing > 0:
            # Already seeded — just promote pending ones
            db.query(models.Task).filter(
                models.Task.regulation_id == reg_uuid,
                models.Task.status == models.TaskStatus.PENDING
            ).update({"status": models.TaskStatus.IN_PROGRESS})
            db.commit()
            return {"status": "already_distributed", "promoted_count": existing}

    created_ids = []
    for item in payload.tasks:
        team_id = map_department_to_team(db, branch_uuid, item.department or "Compliance")

        raw_prio = (item.priority or "Medium").strip().upper()
        prio_map = {"HIGH": models.TaskPriority.HIGH, "MEDIUM": models.TaskPriority.MEDIUM, "LOW": models.TaskPriority.LOW}
        prio_enum = prio_map.get(raw_prio, models.TaskPriority.MEDIUM)

        due_days = item.due_days or 14
        due_date = datetime.utcnow().date() + timedelta(days=due_days)

        new_task = models.Task(
            title=item.title,
            description=item.detailed_explanation or item.description or "Bulk-distributed compliance obligation.",
            branch_id=branch_uuid,
            assigned_to_team=team_id,
            regulation_id=reg_uuid,
            status=models.TaskStatus.PENDING,
            priority=prio_enum,
            due_date=due_date,
        )
        db.add(new_task)
        db.flush()  # get ID without final commit
        created_ids.append(str(new_task.id))

    # Mark regulation as processed if we have one
    if reg_uuid:
        reg = db.query(models.Regulation).filter(models.Regulation.id == reg_uuid).first()
        if reg:
            reg.status = "PROCESSED"

    db.commit()
    logger.info(f"[BulkDistribute] Inserted {len(created_ids)} tasks for branch {branch_uuid}")
    return {
        "status": "success",
        "created_count": len(created_ids),
        "task_ids": created_ids
    }


