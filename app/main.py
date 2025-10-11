from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from app.routers import pdf

from app.database import get_db
from app import schemas, models
from app.routers import radar, admin, auth_routes

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

# 📤 Invia risultati sessione - CON UPSERT
@api_router.post("/assessment/{session_id}/submit", response_model=dict)
def submit(session_id: UUID, results: List[schemas.AssessmentResultCreate], db: Session = Depends(get_db)):
    # Verifica che la sessione esista
    session = db.query(models.AssessmentSession).filter(models.AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    updated = 0
    created = 0
    
    for r in results:
        # Cerca se esiste già un risultato per questa combinazione
        existing = db.query(models.AssessmentResult).filter(
            models.AssessmentResult.session_id == session_id,
            models.AssessmentResult.process == r.process,
            models.AssessmentResult.activity == r.activity,
            models.AssessmentResult.category == r.category,
            models.AssessmentResult.dimension == r.dimension
        ).first()
        
        if existing:
            # UPDATE
            existing.score = r.score
            existing.note = r.note
            existing.is_not_applicable = r.is_not_applicable
            updated += 1
        else:
            # INSERT
            db.add(models.AssessmentResult(session_id=session_id, **r.dict()))
            created += 1
    
    db.commit()
    return {"status": "submitted", "created": created, "updated": updated, "total": len(results)}

# 📊 Visualizza risultati sessione
@api_router.get("/assessment/{session_id}/results", response_model=List[schemas.AssessmentResultOut])
def results(session_id: UUID, db: Session = Depends(get_db)):
    """Restituisce i risultati ordinati secondo il modello JSON"""
    
    # Ottieni risultati dal DB
    results = db.query(models.AssessmentResult).filter(
        models.AssessmentResult.session_id == session_id
    ).all()
    
    # Ottieni il nome del modello dalla sessione
    session = db.query(models.AssessmentSession).filter(
        models.AssessmentSession.id == session_id
    ).first()
    
    if not session or not results:
        return results
    
    model_name = session.model_name or 'casoin'
    
    # Carica il JSON del modello per ottenere l'ordine
    try:
        import json
        from pathlib import Path
        
        model_path = Path(f"frontend/public/{model_name}.json")
        if not model_path.exists():
            return results  # Se il modello non esiste, restituisci senza ordinare
        
        with open(model_path, 'r', encoding='utf-8') as f:
            model_data = json.load(f)
        
        # Crea mappa di ordinamento: process -> category -> [activities in order]
        order_map = {}
        for proc in model_data:
            proc_name = proc.get('process')
            if proc_name not in order_map:
                order_map[proc_name] = {}
            
            for activity in proc.get('activities', []):
                act_name = activity.get('name')
                for category in activity.get('categories', {}).keys():
                    if category not in order_map[proc_name]:
                        order_map[proc_name][category] = []
                    if act_name not in order_map[proc_name][category]:
                        order_map[proc_name][category].append(act_name)
        
        # Ordina i risultati
        def get_sort_key(result):
            proc = result.process
            cat = result.category
            act = result.activity
            
            # Ottieni l'indice dall'order_map
            try:
                proc_order = list(order_map.keys()).index(proc)
            except (ValueError, AttributeError):
                proc_order = 999
            
            try:
                cat_order = ['Governance', 'Monitoring & Control', 'Technology', 'Organization'].index(cat)
            except ValueError:
                cat_order = 999
            
            try:
                act_order = order_map.get(proc, {}).get(cat, []).index(act)
            except (ValueError, AttributeError):
                act_order = 999
            
            return (proc_order, cat_order, act_order)
        
        results.sort(key=get_sort_key)
        
    except Exception as e:
        print(f"⚠️ Warning: Could not order results: {e}")
    
    return results

# 🗑️ Cancella assessment completo (sessione + risultati)
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

# ✅ Registra i router
app.include_router(api_router)
app.include_router(radar.router, prefix="/api")
app.include_router(pdf.router, prefix="/api", tags=["pdf"])
app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.put("/api/assessment/{session_id}/save-ai-conclusions")
async def save_ai_conclusions(session_id: str, conclusions: dict, db: Session = Depends(get_db)):
    """Salva le conclusioni AI nel database"""
    try:
        session = db.query(models.AssessmentSession).filter(
            models.AssessmentSession.id == session_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Salva nel campo raccomandazioni
        session.raccomandazioni = conclusions.get('text', '')
        db.commit()
        
        return {"message": "Conclusioni salvate con successo"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# AI Interview Router
from app.routers import ai_interview
api_router.include_router(ai_interview.router, prefix="/api", tags=["ai-interview"])
