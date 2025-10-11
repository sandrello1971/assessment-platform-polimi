#!/usr/bin/env python3

with open('frontend/src/pages/TestTableFormByCategory.tsx', 'r') as f:
    lines = f.readlines()

# Trova la riga di handleSubmit
for i, line in enumerate(lines):
    if 'const handleSubmit = async () => {' in line:
        # Inserisci autoSave prima di handleSubmit
        autosave_code = '''  // Auto-save senza validazione
  const autoSave = async () => {
    if (!sessionId || answers.size === 0) return;
    
    try {
      console.log('💾 Auto-salvataggio in corso...');
      const results = Array.from(answers.values());
      await axios.post(`/api/assessment/${sessionId}/submit`, results);
      console.log('✅ Auto-salvataggio completato');
    } catch (error) {
      console.error('⚠️ Errore durante auto-salvataggio:', error);
    }
  };

'''
        lines.insert(i, autosave_code)
        break

# Modifica il bottone Dashboard (riga ~158)
for i, line in enumerate(lines):
    if "onClick={() => navigate('/dashboard')}" in line:
        lines[i] = line.replace(
            "onClick={() => navigate('/dashboard')}",
            "onClick={async () => { await autoSave(); navigate('/dashboard'); }}"
        )
        break

with open('frontend/src/pages/TestTableFormByCategory.tsx', 'w') as f:
    f.writelines(lines)

print("✅ Patch applicata!")
