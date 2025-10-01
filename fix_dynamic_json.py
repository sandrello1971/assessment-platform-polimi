with open('frontend/src/pages/AssessmentForm.tsx', 'r') as f:
    content = f.read()

# Trova e sostituisci il caricamento JSON statico con dinamico
old_code = """        const sessionResponse = await axios.get(`/api/assessment/session/${sessionId}`);
        const session = sessionResponse.data;
        console.log('Session data:', session);

        setCompanyName(session.azienda_nome || 'Azienda');

        const jsonResponse = await axios.get('/i40_assessment_fto.json', {"""

new_code = """        const sessionResponse = await axios.get(`/api/assessment/session/${sessionId}`);
        const session = sessionResponse.data;
        console.log('Session data:', session);

        setCompanyName(session.azienda_nome || 'Azienda');

        // Usa il model_name dalla sessione, default a i40_assessment_fto
        const modelName = session.model_name || 'i40_assessment_fto';
        console.log('Loading model:', modelName);

        const jsonResponse = await axios.get(`/${modelName}.json`, {"""

content = content.replace(old_code, new_code)

with open('frontend/src/pages/AssessmentForm.tsx', 'w') as f:
    f.write(content)

print("✅ AssessmentForm modificato per caricare JSON dinamico")
