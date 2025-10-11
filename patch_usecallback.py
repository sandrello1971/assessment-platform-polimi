with open('frontend/src/pages/TestTableFormByCategory.tsx', 'r') as f:
    content = f.read()

# 1. Aggiungi useCallback nell'import
old_import = "import React, { useEffect, useState } from 'react';"
new_import = "import React, { useEffect, useState, useCallback } from 'react';"
content = content.replace(old_import, new_import)

# 2. Wrappa autoSave con useCallback
old_autosave_def = "  const autoSave = async () => {"
new_autosave_def = "  const autoSave = useCallback(async () => {"

content = content.replace(old_autosave_def, new_autosave_def)

# 3. Chiudi useCallback dopo la funzione autoSave
old_autosave_end = """      setSaving(false);
    }
  };
  const handleSubmit = async () => {"""

new_autosave_end = """      setSaving(false);
    }
  }, [sessionId, answers, setSaving]);
  
  const handleSubmit = async () => {"""

content = content.replace(old_autosave_end, new_autosave_end)

with open('frontend/src/pages/TestTableFormByCategory.tsx', 'w') as f:
    f.write(content)

print("✅ useCallback aggiunto!")
