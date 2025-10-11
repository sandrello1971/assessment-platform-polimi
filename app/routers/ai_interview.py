from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
import openai
import os
from typing import Optional
import json

router = APIRouter()

# Configura OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/ai-interview/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
):
    """Trascrivi un file audio usando Whisper"""
    try:
        # Salva temporaneamente il file
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        
        # Trascrivi con Whisper
        with open(temp_path, "rb") as audio_file:
            transcript = openai.Audio.transcribe("whisper-1", audio_file)
        
        os.remove(temp_path)
        
        return {
            "transcript": transcript["text"],
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai-interview/analyze/{session_id}")
async def analyze_interview(
    session_id: str,
    transcript: dict,  # {"text": "trascrizione..."}
    db: Session = Depends(get_db)
):
    """Analizza la trascrizione e genera risposte per l'assessment"""
    
    # Carica il modello di assessment
    session = db.query(models.AssessmentSession).filter(
        models.AssessmentSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    
    model_name = session.model_name or "Casoinfinal"
    
    # Carica le domande dal JSON
    import json
    with open(f'frontend/public/{model_name}.json', 'r') as f:
        model_data = json.load(f)
    
    # Crea il prompt per GPT-4
    prompt = f"""Sei un esperto di Digital Transformation Industry 4.0.

Analizza questa trascrizione di un'intervista con un'azienda:
{transcript['text']}

Basandoti SOLO sulle informazioni presenti nell'intervista, rispondi alle seguenti domande dell'assessment digitale.
Per ogni domanda, assegna un punteggio da 0 a 5:
- 0: Non implementato / Non presente
- 1: Livello iniziale
- 2: Livello base
- 3: Livello intermedio
- 4: Livello avanzato
- 5: Livello eccellente / Best in class

Se nell'intervista NON ci sono informazioni sufficienti per rispondere, metti "N/A".

Modello di assessment da compilare:
{json.dumps(model_data, indent=2)}

Rispondi in formato JSON con questa struttura:
{{
  "results": [
    {{
      "process": "nome processo",
      "activity": "nome attività",
      "category": "Governance",
      "dimension": "nome dimensione",
      "score": 3,
      "note": "Motivazione del punteggio basata sull'intervista",
      "is_not_applicable": false,
      "confidence": 0.8
    }}
  ]
}}
"""
    
    try:
        # Chiamata a GPT-4
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "Sei un esperto di assessment Industry 4.0. Rispondi SOLO in formato JSON valido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4000
        )
        
        # Estrai e parsifica la risposta
        ai_response = response.choices[0].message.content
        results = json.loads(ai_response)
        
        return {
            "status": "success",
            "results": results["results"],
            "model_used": "gpt-4-turbo-preview"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore analisi AI: {str(e)}")
