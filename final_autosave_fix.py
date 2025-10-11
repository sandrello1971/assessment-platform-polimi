#!/usr/bin/env python3
import re

with open('frontend/src/pages/TestTableFormByCategory.tsx', 'r') as f:
    content = f.read()

# 1. Aggiungi useCallback nell'import
content = content.replace(
    "import React, { useEffect, useState } from 'react';",
    "import React, { useEffect, useState, useCallback } from 'react';"
)

# 2. Aggiungi stato saving
content = content.replace(
    "const [loading, setLoading] = useState(true);",
    "const [loading, setLoading] = useState(true);\n  const [saving, setSaving] = useState(false);"
)

# 3. Trova e sostituisci la funzione handleSubmit con autoSave + handleSubmit
old_handlesubmit = """  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const results = Array.from(answers.values());
      await axios.post(`/api/assessment/${sessionId}/submit`, results);
      alert('Assessment completato!');
      navigate(`/results/${sessionId}`);
    } catch (error) {
      console.error(error);
      alert('Errore invio');
    } finally {
      setSubmitting(false);
    }
  };"""

new_code = """  // Auto-save senza validazione
  const autoSave = useCallback(async () => {
    if (!sessionId || answers.size === 0) return;
    
    setSaving(true);
    try {
      console.log('💾 Salvataggio in corso...');
      const results = Array.from(answers.values());
      await axios.post(`/api/assessment/${sessionId}/submit`, results);
      console.log('✅ Salvato!');
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('❌ Errore salvataggio:', error);
    } finally {
      setSaving(false);
    }
  }, [sessionId, answers]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const results = Array.from(answers.values());
      await axios.post(`/api/assessment/${sessionId}/submit`, results);
      alert('Assessment completato!');
      navigate(`/results/${sessionId}`);
    } catch (error) {
      console.error(error);
      alert('Errore invio');
    } finally {
      setSubmitting(false);
    }
  };"""

content = content.replace(old_handlesubmit, new_code)

# 4. Modifica il bottone Dashboard
content = re.sub(
    r'<button\s+onClick=\{\(\) => navigate\(\'/dashboard\'\)\}\s+className="fixed top-4 right-4[^"]*">\s*← Dashboard\s*</button>',
    '''<button
        onClick={async () => { await autoSave(); navigate('/dashboard'); }}
        disabled={saving}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? '💾 Salvataggio...' : '← Dashboard'}
      </button>''',
    content
)

with open('frontend/src/pages/TestTableFormByCategory.tsx', 'w') as f:
    f.write(content)

print("✅ Modifica applicata!")
