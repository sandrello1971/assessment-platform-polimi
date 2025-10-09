#!/usr/bin/env python3
import re

# Leggi il file
with open('frontend/src/pages/ResultsTablePage.tsx', 'r') as f:
    content = f.read()

# Rimuovi la sezione AI mal posizionata (dopo };)
content = re.sub(
    r'\n\s*{/\* AI Suggestions Section \*/}.*?dangerouslySetInnerHTML.*?\n\s*</div>\s*\n\s*</div>\s*\n\s*}\)\s*\n',
    '\n',
    content,
    flags=re.DOTALL
)

# Trova l'ultima chiusura prima di );
# Cerca "      </div>\n    </div>\n  );"
ai_section = '''
        {/* AI Suggestions Section */}
        {suggestions && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🤖</span>
              <h3 className="text-2xl font-bold">Suggerimenti AI</h3>
            </div>
            {suggestions.critical_count > 0 && (
              <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
                <p className="text-red-700 font-medium">
                  ⚠️ {suggestions.critical_count} aree critiche identificate
                </p>
              </div>
            )}
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: suggestions.suggestions }}
            />
          </div>
        )}
'''

# Inserisci PRIMA della chiusura del return
content = content.replace(
    '      </div>\n    </div>\n  );',
    '      </div>\n' + ai_section + '\n    </div>\n  );'
)

# Salva
with open('frontend/src/pages/ResultsTablePage.tsx', 'w') as f:
    f.write(content)

print("✅ File corretto!")
