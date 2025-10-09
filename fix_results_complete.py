#!/usr/bin/env python3
import re

# Leggi backup originale
import glob
backup_files = glob.glob('frontend/src/pages/ResultsTablePage.tsx.backup_*')
backup_file = sorted(backup_files)[-1]  # Prendi il più recente

with open(backup_file, 'r') as f:
    content = f.read()

print(f"Usando backup: {backup_file}")

# 1. Aggiungi interface PRIMA di "const ResultsTablePage"
content = content.replace(
    'const ResultsTablePage = () => {',
    '''interface AISuggestions {
  critical_count: number;
  suggestions: string;
}

const ResultsTablePage = () => {'''
)

# 2. Aggiungi useState DOPO "const [loading, setLoading]"
content = content.replace(
    '  const [loading, setLoading] = useState(true);',
    '''  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);'''
)

# 3. Aggiungi fetch AI DENTRO useEffect (dopo setLoading(false))
content = re.sub(
    r'(axios\.get\(`/api/assessment/\$\{id\}/results`\).*?setLoading\(false\);\s*}\);)',
    r'''\1
    
    // Carica suggerimenti AI
    axios.get(`/api/assessment/${id}/ai-suggestions-enhanced?include_roadmap=true`)
      .then(res => setSuggestions(res.data))
      .catch(err => console.warn("AI not available:", err));''',
    content,
    flags=re.DOTALL
)

# 4. Aggiungi sezione UI PRIMA della chiusura del return (prima di "    </div>\n  );")
ai_ui = '''
        {/* AI Suggestions */}
        {suggestions && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🤖</span>
              <h3 className="text-2xl font-bold">Suggerimenti AI</h3>
            </div>
            {suggestions.critical_count > 0 && (
              <div className="mb-4 p-4 bg-red-100 rounded">
                <p className="text-red-700">⚠️ {suggestions.critical_count} aree critiche</p>
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: suggestions.suggestions }} />
          </div>
        )}
'''

# Trova pattern corretto (le ultime chiusure prima di );)
content = re.sub(
    r'(</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*)\n(\s*\)\;)',
    r'\1' + ai_ui + r'\n\2',
    content
)

# Salva
with open('frontend/src/pages/ResultsTablePage.tsx', 'w') as f:
    f.write(content)

print("✅ Tutte le modifiche applicate!")
