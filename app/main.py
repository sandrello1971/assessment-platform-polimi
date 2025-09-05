from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from app.routers import pdf

from app.database import get_db
from app import schemas, models
from app.routers import radar

# ✅ Init FastAPI app
app = FastAPI()

# ✅ Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Router con prefisso /api
api_router = APIRouter(prefix="/api")

# 📥 Crea sessione di assessment
@api_router.post("/assessment/session", response_model=schemas.AssessmentSessionOut)
def create_session(data: schemas.AssessmentSessionCreate, db: Session = Depends(get_db)):
    obj = models.AssessmentSession(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

# 📋 Lista sessioni
@api_router.get("/assessment/sessions", response_model=List[schemas.AssessmentSessionOut])
def list_sessions(user_id: Optional[str] = None, company_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.AssessmentSession)
    if user_id:
        q = q.filter(models.AssessmentSession.user_id == user_id)
    if company_id:
        q = q.filter(models.AssessmentSession.company_id == company_id)
    return q.order_by(models.AssessmentSession.creato_il.desc()).all()

# 📋 Dettaglio singola sessione
@api_router.get("/assessment/session/{session_id}", response_model=schemas.AssessmentSessionOut)
def get_session(session_id: UUID, db: Session = Depends(get_db)):
    session = db.query(models.AssessmentSession).filter(models.AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# 📤 Invia risultati sessione
@api_router.post("/assessment/{session_id}/submit", response_model=dict)
def submit(session_id: UUID, results: List[schemas.AssessmentResultCreate], db: Session = Depends(get_db)):
    # Verifica che la sessione esista
    session = db.query(models.AssessmentSession).filter(models.AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    for r in results:
        db.add(models.AssessmentResult(session_id=session_id, **r.dict()))
    db.commit()
    return {"status": "submitted", "count": len(results)}

# 📊 Visualizza risultati sessione
@api_router.get("/assessment/{session_id}/results", response_model=List[schemas.AssessmentResultOut])
def results(session_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.AssessmentResult).filter(models.AssessmentResult.session_id == session_id).all()

# 🗑️ Cancella assessment completo (sessione + risultati) - SPOSTATO QUI!
@api_router.delete("/assessment/{session_id}")
def delete_assessment(session_id: UUID, db: Session = Depends(get_db)):
    """Cancella completamente un assessment: sessione + tutti i risultati"""
    try:
        print(f"🗑️ DELETE: Inizio cancellazione assessment {session_id}")
        
        # Verifica che la sessione esista
        session = db.query(models.AssessmentSession).filter(
            models.AssessmentSession.id == session_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Conta i risultati da cancellare
        results_count = db.query(models.AssessmentResult).filter(
            models.AssessmentResult.session_id == session_id
        ).count()
        
        # Cancella prima tutti i risultati associati
        deleted_results = db.query(models.AssessmentResult).filter(
            models.AssessmentResult.session_id == session_id
        ).delete()
        
        # Poi cancella la sessione
        db.delete(session)
        db.commit()
        
        return {
            "status": "deleted",
            "session_id": str(session_id),
            "deleted_results": deleted_results,
            "message": f"Assessment '{session.azienda_nome}' cancellato con successo"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore cancellazione: {str(e)}")

# ✅ Registra i router (DOPO aver definito tutti gli endpoint!)
app.include_router(api_router)
app.include_router(radar.router, prefix="/api")
app.include_router(pdf.router, prefix="/api", tags=["pdf"])
