from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app import database
from app.services.excel_parser import ExcelAssessmentParser
import shutil
import json
from pathlib import Path
from datetime import datetime

router = APIRouter()

@router.post("/upload-excel-model")
async def upload_excel_model(
    file: UploadFile = File(...),
    model_name: str = None,
    db: Session = Depends(database.get_db)
):
    """
    Carica un file Excel e genera un nuovo modello JSON
    """
    try:
        # Verifica estensione file
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="File deve essere Excel (.xlsx o .xls)")
        
        # Nome modello (default: nome file senza estensione)
        if not model_name:
            model_name = Path(file.filename).stem
        
        # Salva file temporaneamente
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse Excel
        parser = ExcelAssessmentParser()
        parsed_data = parser.parse_excel_file(temp_path)
        
        # Valida dati
        is_valid, errors = parser.validate_parsed_data(parsed_data)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Excel non valido: {', '.join(errors)}")
        
        # Salva JSON in frontend/public
        json_filename = f"{model_name}.json"
        json_path = Path("frontend/public") / json_filename
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(parsed_data, f, ensure_ascii=False, indent=2)
        
        # Rimuovi file temporaneo
        Path(temp_path).unlink()
        
        return JSONResponse({
            "success": True,
            "message": f"Modello '{model_name}' creato con successo",
            "json_file": json_filename,
            "stats": {
                "processes": len(parsed_data.get("processes", [])),
                "dimensions": len(parsed_data.get("dimensions", [])),
                "questions_total": sum(len(q) for q in parsed_data.get("questions", {}).values())
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore: {str(e)}")

@router.get("/list-models")
async def list_models():
    """Lista tutti i modelli JSON disponibili"""
    try:
        public_path = Path("frontend/public")
        json_files = list(public_path.glob("*.json"))
        
        models = []
        for json_file in json_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    models.append({
                        "name": json_file.stem,
                        "filename": json_file.name,
                        "processes_count": len(data.get("processes", [])) if isinstance(data, dict) else 0,
                        "is_default": json_file.stem == "i40_assessment_fto"
                    })
            except Exception as e:
                print(f"Errore lettura {json_file.name}: {e}")
                continue
        
        return {"models": models}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
