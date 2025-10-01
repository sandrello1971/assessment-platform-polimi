import re

files_to_fix = [
    'frontend/src/pages/AssessmentFormByDimension.tsx',
    'frontend/src/pages/TestTableForm.tsx',
    'frontend/src/pages/TestTableFormByCategory.tsx'
]

for file_path in files_to_fix:
    print(f"Fixing {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern 1: Per AssessmentFormByDimension (simile ad AssessmentForm)
    if 'AssessmentFormByDimension' in file_path:
        content = re.sub(
            r"(const sessionResponse = await axios\.get\(`/api/assessment/session/\$\{sessionId\}`\);[\s\S]*?setCompanyName\(session\.azienda_nome.*?\);)\s*(const jsonResponse = await axios\.get\('/i40_assessment_fto\.json'\);)",
            r"\1\n\n        const modelName = session.model_name || 'i40_assessment_fto';\n        console.log('Loading model:', modelName);\n\n        const jsonResponse = await axios.get(`/${modelName}.json`);",
            content
        )
    
    # Pattern 2: Per TestTableForm e TestTableFormByCategory
    else:
        content = re.sub(
            r"const questionsRes = await axios\.get\('/i40_assessment_fto\.json'\);",
            r"// Carica il model_name dalla sessione\n        const sessionRes = await axios.get(`/api/assessment/session/${id}`);\n        const modelName = sessionRes.data.model_name || 'i40_assessment_fto';\n        console.log('Loading model:', modelName);\n        \n        const questionsRes = await axios.get(`/${modelName}.json`);",
            content
        )
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"✅ {file_path} fixed")

print("\n✅ Tutti i form aggiornati per caricare JSON dinamico")
