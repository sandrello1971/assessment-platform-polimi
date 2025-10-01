with open('app/schemas.py', 'r') as f:
    content = f.read()

# Aggiungi model_name a AssessmentSessionCreate
old_schema = '''class AssessmentSessionCreate(BaseModel):
    user_id: Optional[str] = None
    company_id: Optional[int] = None
    azienda_nome: str
    settore: Optional[str] = None
    dimensione: Optional[str] = None
    referente: Optional[str] = None
    email: Optional[str] = None
    risposte_json: Optional[str] = None
    punteggi_json: Optional[str] = None
    raccomandazioni: Optional[str] = None'''

new_schema = '''class AssessmentSessionCreate(BaseModel):
    user_id: Optional[str] = None
    company_id: Optional[int] = None
    azienda_nome: str
    settore: Optional[str] = None
    dimensione: Optional[str] = None
    referente: Optional[str] = None
    email: Optional[str] = None
    model_name: Optional[str] = 'i40_assessment_fto'
    risposte_json: Optional[str] = None
    punteggi_json: Optional[str] = None
    raccomandazioni: Optional[str] = None'''

content = content.replace(old_schema, new_schema)

with open('app/schemas.py', 'w') as f:
    f.write(content)

print("✅ model_name aggiunto allo schema")
