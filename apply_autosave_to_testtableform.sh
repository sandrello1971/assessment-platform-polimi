#!/bin/bash

FILE="frontend/src/pages/TestTableForm.tsx"

# 1. Fix import
sed -i "1s/.*/import { useEffect, useState, useCallback } from 'react';/" $FILE

# 2. Aggiungi stato saving dopo loading
sed -i '/const \[loading, setLoading\] = useState(true);/a\  const [saving, setSaving] = useState(false);' $FILE

# 3. Trova riga handleSubmit
LINE=$(grep -n "const handleSubmit = async () => {" $FILE | cut -d: -f1)

# 4. Inserisci autoSave PRIMA di handleSubmit
sed -i "${LINE}i\\  // Auto-save senza validazione\n  const autoSave = useCallback(async () => {\n    if (!sessionId || answers.size === 0) return;\n    \n    setSaving(true);\n    try {\n      console.log('💾 Salvataggio in corso...');\n      const results = Array.from(answers.values());\n      await axios.post(\`/api/assessment/\${sessionId}/submit\`, results);\n      console.log('✅ Salvato!');\n      await new Promise(resolve => setTimeout(resolve, 300));\n    } catch (error) {\n      console.error('❌ Errore salvataggio:', error);\n    } finally {\n      setSaving(false);\n    }\n  }, [sessionId, answers]);\n\n" $FILE

# 5. Trova e modifica il bottone Dashboard
LINE_BTN=$(grep -n "onClick={() => navigate('/dashboard')}" $FILE | cut -d: -f1)
if [ ! -z "$LINE_BTN" ]; then
  sed -i "${LINE_BTN}s/.*/        onClick={async () => { await autoSave(); navigate('\/dashboard'); }}/" $FILE
  NEXT=$((LINE_BTN + 1))
  sed -i "${NEXT}s/.*/        disabled={saving}/" $FILE
  NEXT=$((LINE_BTN + 2))
  sed -i "${NEXT}s/.*/        className=\"fixed top-4 right-4 z-50 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed\"/" $FILE
  NEXT=$((LINE_BTN + 3))
  sed -i "${NEXT}s/.*/      >/" $FILE
  NEXT=$((LINE_BTN + 4))
  sed -i "${NEXT}s/.*/        {saving ? \"💾 Salvataggio...\" : \"← Dashboard\"}/" $FILE
fi

echo "✅ Modifiche applicate a TestTableForm.tsx"
