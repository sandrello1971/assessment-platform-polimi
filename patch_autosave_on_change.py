with open('frontend/src/pages/TestTableFormByCategory.tsx', 'r') as f:
    lines = f.readlines()

# Trova dove inserire il nuovo useEffect (dopo la definizione di autoSave)
insert_index = None
for i, line in enumerate(lines):
    if 'const handleSubmit = async () => {' in line:
        insert_index = i
        break

if insert_index:
    # Inserisci useEffect per auto-save dopo ogni modifica
    autosave_effect = '''  // Auto-save quando answers cambia
  useEffect(() => {
    if (answers.size > 0) {
      const timer = setTimeout(() => {
        autoSave();
      }, 2000); // Salva dopo 2 secondi di inattività
      return () => clearTimeout(timer);
    }
  }, [answers]);

'''
    lines.insert(insert_index, autosave_effect)
    
    with open('frontend/src/pages/TestTableFormByCategory.tsx', 'w') as f:
        f.writelines(lines)
    
    print("✅ Auto-save su ogni modifica aggiunto!")
else:
    print("❌ Punto di inserimento non trovato")
