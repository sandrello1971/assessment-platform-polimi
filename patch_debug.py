with open('frontend/src/pages/TestTableFormByCategory.tsx', 'r') as f:
    content = f.read()

# Aggiungi log di debug
old = '''  const autoSave = async () => {
    if (!sessionId || answers.size === 0) return;'''

new = '''  const autoSave = async () => {
    console.log('🔍 DEBUG autoSave called!', { sessionId, answersSize: answers.size });
    if (!sessionId || answers.size === 0) {
      console.log('⚠️ Skip autosave:', { sessionId, answersSize: answers.size });
      return;
    }'''

content = content.replace(old, new)

with open('frontend/src/pages/TestTableFormByCategory.tsx', 'w') as f:
    f.write(content)

print("✅ Debug aggiunto!")
