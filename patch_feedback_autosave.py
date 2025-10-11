with open('frontend/src/pages/TestTableFormByCategory.tsx', 'r') as f:
    content = f.read()

# 1. Aggiungi stato per il feedback
old_state = "const [loading, setLoading] = useState(true);"
new_state = """const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);"""

content = content.replace(old_state, new_state)

# 2. Modifica autoSave per mostrare feedback
old_autosave = """  const autoSave = async () => {
    console.log('🔍 DEBUG autoSave called!', { sessionId, answersSize: answers.size });
    if (!sessionId || answers.size === 0) {
      console.log('⚠️ Skip autosave:', { sessionId, answersSize: answers.size });
      return;
    }
    
    try {
      console.log('💾 Auto-salvataggio in corso...');
      const results = Array.from(answers.values());
      await axios.post(`/api/assessment/${sessionId}/submit`, results);
      console.log('✅ Auto-salvataggio completato');
    } catch (error) {
      console.error('⚠️ Errore durante auto-salvataggio:', error);
    }
  };"""

new_autosave = """  const autoSave = async () => {
    console.log('🔍 DEBUG autoSave called!', { sessionId, answersSize: answers.size });
    if (!sessionId || answers.size === 0) {
      console.log('⚠️ Skip autosave:', { sessionId, answersSize: answers.size });
      return;
    }
    
    setSaving(true);
    try {
      console.log('💾 Auto-salvataggio in corso...');
      const results = Array.from(answers.values());
      await axios.post(`/api/assessment/${sessionId}/submit`, results);
      console.log('✅ Auto-salvataggio completato');
      // Piccola pausa per assicurarsi che il DB abbia processato
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('⚠️ Errore durante auto-salvataggio:', error);
      alert('Errore durante il salvataggio automatico');
    } finally {
      setSaving(false);
    }
  };"""

content = content.replace(old_autosave, new_autosave)

# 3. Modifica il bottone Dashboard per mostrare stato
old_button = """      <button
        onClick={async () => { await autoSave(); navigate('/dashboard'); }}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-lg font-semibold flex items-center gap-2"
      >
        ← Dashboard
      </button>"""

new_button = """      <button
        onClick={async () => { await autoSave(); navigate('/dashboard'); }}
        disabled={saving}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? '💾 Salvataggio...' : '← Dashboard'}
      </button>"""

content = content.replace(old_button, new_button)

with open('frontend/src/pages/TestTableFormByCategory.tsx', 'w') as f:
    f.write(content)

print("✅ Feedback di salvataggio aggiunto!")
