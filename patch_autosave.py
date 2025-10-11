#!/usr/bin/env python3

with open('frontend/src/pages/AssessmentForm.tsx', 'r') as f:
    lines = f.readlines()

# Trova la riga di handleSubmit (dovrebbe essere intorno alla 344)
for i, line in enumerate(lines):
    if 'const handleSubmit = async () => {' in line:
        # Inserisci autoSave prima di handleSubmit
        autosave_code = '''  // Auto-save senza validazione (per salvataggio parziale)
  const autoSave = async () => {
    if (!sessionId || answers.length === 0) return;
    
    try {
      console.log('💾 Auto-salvataggio in corso...');
      await axios.post(`/api/assessment/${sessionId}/submit`, answers, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Auto-salvataggio completato');
    } catch (error) {
      console.error('⚠️ Errore durante auto-salvataggio:', error);
    }
  };

'''
        lines.insert(i, autosave_code)
        break

# Modifica i bottoni Dashboard
for i, line in enumerate(lines):
    if "onClick={() => navigate('/dashboard')}" in line:
        lines[i] = line.replace(
            "onClick={() => navigate('/dashboard')}",
            "onClick={async () => { await autoSave(); navigate('/dashboard'); }}"
        )

with open('frontend/src/pages/AssessmentForm.tsx', 'w') as f:
    f.writelines(lines)

print("✅ Patch applicata con successo!")
