with open('frontend/src/pages/CompanyForm.tsx', 'r') as f:
    content = f.read()

# 1. Aggiungi model_name all'interfaccia CompanyData
old_interface = '''interface CompanyData {
  azienda_nome: string;
  settore: string;
  dimensione: string;
  referente: string;
  email: string;
  user_id?: string;
  company_id?: number;
}'''

new_interface = '''interface CompanyData {
  azienda_nome: string;
  settore: string;
  dimensione: string;
  referente: string;
  email: string;
  user_id?: string;
  company_id?: number;
  model_name?: string;
}'''

content = content.replace(old_interface, new_interface)

# 2. Aggiungi useState per models list
import_line = "import { useState } from 'react';"
new_imports = """import { useState, useEffect } from 'react';"""

content = content.replace(import_line, new_imports)

# 3. Aggiungi stato per models
state_line = "  const [error, setError] = useState('');"
new_states = """  const [error, setError] = useState('');
  const [models, setModels] = useState<Array<{name: string; filename: string; is_default: boolean}>>([]);

  useEffect(() => {
    axios.get('/api/admin/list-models')
      .then(res => setModels(res.data.models))
      .catch(err => console.error('Errore caricamento modelli:', err));
  }, []);"""

content = content.replace(state_line, new_states)

# 4. Aggiungi model_name nel formData iniziale
old_init = """  const [formData, setFormData] = useState<CompanyData>({
    azienda_nome: '',
    settore: '',
    dimensione: '',
    referente: '',
    email: '',
    user_id: undefined,
    company_id: undefined
  });"""

new_init = """  const [formData, setFormData] = useState<CompanyData>({
    azienda_nome: '',
    settore: '',
    dimensione: '',
    referente: '',
    email: '',
    user_id: undefined,
    company_id: undefined,
    model_name: 'i40_assessment_fto'
  });"""

content = content.replace(old_init, new_init)

# 5. Aggiungi model_name nella chiamata POST
old_post = """      const response = await axios.post('/api/assessment/session', {
        azienda_nome: formData.azienda_nome,
        settore: formData.settore,
        dimensione: formData.dimensione,
        referente: formData.referente,
        email: formData.email,
        user_id: formData.user_id || undefined,
        company_id: formData.company_id || undefined
      });"""

new_post = """      const response = await axios.post('/api/assessment/session', {
        azienda_nome: formData.azienda_nome,
        settore: formData.settore,
        dimensione: formData.dimensione,
        referente: formData.referente,
        email: formData.email,
        user_id: formData.user_id || undefined,
        company_id: formData.company_id || undefined,
        model_name: formData.model_name || 'i40_assessment_fto'
      });"""

content = content.replace(old_post, new_post)

with open('frontend/src/pages/CompanyForm.tsx', 'w') as f:
    f.write(content)

print("✅ Model selector aggiunto al backend del form")
