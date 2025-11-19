from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from app import database, models

router = APIRouter()

class SessionUpdateRequest(BaseModel):
    azienda_nome: Optional[str] = None
    settore: Optional[str] = None
    dimensione: Optional[str] = None
    referente: Optional[str] = None
    email: Optional[str] = None
    effettuato_da: Optional[str] = None
    data_chiusura: Optional[str] = None  # Data di completamento assessment

@router.put("/assessment/session/{session_id}")
def update_session(
    session_id: UUID,
    data: SessionUpdateRequest,
    db: Session = Depends(database.get_db)
):
    """Aggiorna i dati di una sessione di assessment"""
    session = db.query(models.AssessmentSession).filter(
        models.AssessmentSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    
    # Aggiorna solo i campi forniti
    if data.azienda_nome is not None:
        session.azienda_nome = data.azienda_nome
    if data.settore is not None:
        session.settore = data.settore
    if data.dimensione is not None:
        session.dimensione = data.dimensione
    if data.referente is not None:
        session.referente = data.referente
    if data.email is not None:
        session.email = data.email
    if data.effettuato_da is not None:
        session.effettuato_da = data.effettuato_da
    if data.data_chiusura is not None:
        from datetime import datetime
        # Se stringa vuota, imposta a None per cancellare
        if data.data_chiusura == "":
            session.data_chiusura = None
        elif isinstance(data.data_chiusura, str):
            session.data_chiusura = datetime.fromisoformat(data.data_chiusura.replace('Z', '+00:00'))
        else:
            session.data_chiusura = data.data_chiusura
    
    db.commit()
    db.refresh(session)
    
    return {
        "success": True,
        "message": "Sessione aggiornata con successo",
        "session": {
            "id": str(session.id),
            "azienda_nome": session.azienda_nome,
            "settore": session.settore,
            "dimensione": session.dimensione,
            "referente": session.referente,
            "email": session.email
        }
    }


from fastapi import UploadFile, File
import os
import uuid
from pathlib import Path

@router.post("/assessment/session/{session_id}/upload-logo")
async def upload_logo(
    session_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    """Upload logo aziendale per l'assessment"""
    
    # Verifica che la sessione esista
    session = db.query(models.AssessmentSession).filter(
        models.AssessmentSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    
    # Verifica tipo file
    allowed_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato file non supportato. Usa: {', '.join(allowed_extensions)}"
        )
    
    # Crea directory se non esiste
    upload_dir = Path("/var/www/assessment_ai/uploads/logos")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Genera nome file unico
    unique_filename = f"{session_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = upload_dir / unique_filename
    
    # Salva file
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Cancella vecchio logo se esiste
        if session.logo_path:
            old_path = Path(session.logo_path)
            if old_path.exists():
                old_path.unlink()
        
        # Aggiorna database con path relativo
        session.logo_path = f"/uploads/logos/{unique_filename}"
        db.commit()
        
        return {
            "success": True,
            "message": "Logo caricato con successo",
            "logo_path": str(file_path)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel caricamento: {str(e)}")


@router.delete("/assessment/session/{session_id}/logo")
async def delete_logo(
    session_id: UUID,
    db: Session = Depends(database.get_db)
):
    """Elimina il logo aziendale"""
    
    session = db.query(models.AssessmentSession).filter(
        models.AssessmentSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    
    if session.logo_path:
        logo_path = Path(session.logo_path)
        if logo_path.exists():
            logo_path.unlink()
        
        session.logo_path = None
        db.commit()
    
    return {"success": True, "message": "Logo eliminato"}
