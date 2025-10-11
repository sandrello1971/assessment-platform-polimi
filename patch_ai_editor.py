#!/usr/bin/env python3

with open('frontend/src/pages/ResultsByCategoryPage.tsx', 'r') as f:
    content = f.read()

# 1. Aggiungi stati per editing e riformattazione
old_state = "const [aiConclusions, setAiConclusions] = useState<string>('');"
new_state = """const [aiConclusions, setAiConclusions] = useState<string>('');
  const [isEditingAI, setIsEditingAI] = useState(false);
  const [editedConclusions, setEditedConclusions] = useState<string>('');
  const [reformatting, setReformatting] = useState(false);"""

content = content.replace(old_state, new_state)

# 2. Aggiungi funzione per riformattare con AI
reformat_function = """
  // Riformatta conclusioni con AI
  const handleReformat = async () => {
    setReformatting(true);
    try {
      const response = await axios.post(`/api/assessment/${id}/reformat-conclusions`, {
        text: editedConclusions
      });
      setEditedConclusions(response.data.formatted_text);
      alert('✅ Testo riformattato!');
    } catch (error) {
      console.error('Errore riformattazione:', error);
      alert('❌ Errore durante la riformattazione');
    } finally {
      setReformatting(false);
    }
  };

  // Salva conclusioni finali
  const handleSaveConclusions = async () => {
    try {
      await axios.post(`/api/assessment/${id}/save-conclusions`, {
        text: editedConclusions
      });
      setAiConclusions(editedConclusions);
      setIsEditingAI(false);
      alert('✅ Conclusioni salvate!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('❌ Errore durante il salvataggio');
    }
  };
"""

# Inserisci prima della sezione Conclusioni AI
content = content.replace(
    "                {/* Conclusioni AI */}",
    reformat_function + "\n                {/* Conclusioni AI */}"
)

# 3. Sostituisci la sezione di visualizzazione con l'editor
old_display = """          {loadingAI ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
              <p className="text-lg font-semibold text-gray-700">Generazione raccomandazioni AI...</p>
            </div>
          ) : aiConclusions ? (
            <div 
              className="prose max-w-none space-y-4"
              dangerouslySetInnerHTML={{ 
                __html: aiConclusions
                  .replace(/###\s*(.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-800 border-b-2 border-blue-200 pb-2">$1</h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                  .replace(/\n\n/g, '<br><br>')
                  .replace(/\n/g, ' ')
              }} 
            />
          ) : (
            <p className="text-gray-500 italic text-center py-8">⚠️ Suggerimenti AI non disponibili</p>
          )}"""

new_display = """          {loadingAI ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
              <p className="text-lg font-semibold text-gray-700">Generazione raccomandazioni AI...</p>
            </div>
          ) : aiConclusions ? (
            <div>
              {!isEditingAI ? (
                <>
                  {/* Visualizzazione normale */}
                  <div 
                    className="prose max-w-none space-y-4 mb-6"
                    dangerouslySetInnerHTML={{ 
                      __html: aiConclusions
                        .replace(/###\s*(.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-800 border-b-2 border-blue-200 pb-2">$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                        .replace(/\n\n/g, '<br><br>')
                        .replace(/\n/g, ' ')
                    }} 
                  />
                  <button
                    onClick={() => {
                      setIsEditingAI(true);
                      setEditedConclusions(aiConclusions);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                  >
                    ✏️ Modifica Conclusioni
                  </button>
                </>
              ) : (
                <>
                  {/* Modalità editing */}
                  <textarea
                    value={editedConclusions}
                    onChange={(e) => setEditedConclusions(e.target.value)}
                    rows={20}
                    className="w-full p-4 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 mb-4 font-mono text-sm"
                    placeholder="Modifica le conclusioni..."
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={handleReformat}
                      disabled={reformatting}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold disabled:opacity-50"
                    >
                      {reformatting ? '🔄 Riformattazione...' : '🤖 Riformatta con AI'}
                    </button>
                    <button
                      onClick={handleSaveConclusions}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                    >
                      💾 Salva
                    </button>
                    <button
                      onClick={() => setIsEditingAI(false)}
                      className="px-6 py-3 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 font-semibold"
                    >
                      ❌ Annulla
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic text-center py-8">⚠️ Suggerimenti AI non disponibili</p>
          )}"""

content = content.replace(old_display, new_display)

with open('frontend/src/pages/ResultsByCategoryPage.tsx', 'w') as f:
    f.write(content)

print("✅ Editor AI aggiunto!")
