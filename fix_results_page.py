import re

# Leggi il file originale
with open('frontend/src/pages/ResultsTablePage.tsx', 'r') as f:
    content = f.read()

# Trova l'ultimo import
last_import = content.rfind('import')
last_import_end = content.find(';', last_import) + 1

# Aggiungi le nuove interfacce dopo gli import esistenti
new_interfaces = '''

// 🎯 NUOVO: Interfaccia per Punti Critici
interface CriticalPoint {
  process: string;
  subprocess: string;
  governance: number | null;
  monitoring_control: number | null;
  technology: number | null;
  organization: number | null;
  process_rating: number | null;
  notes: string;
  is_critical: boolean;
}
'''

# Inserisci le nuove interfacce
content = content[:last_import_end] + new_interfaces + content[last_import_end:]

# Trova useState declarations e aggiungi activeView
useState_pattern = r"(const \[loading, setLoading\] = useState\(true\);)"
content = re.sub(
    useState_pattern,
    r"\1\n  const [activeView, setActiveView] = useState<'detailed' | 'critical'>('detailed'); // 🎯 NUOVO",
    content
)

# Salva
with open('frontend/src/pages/ResultsTablePage_fixed.tsx', 'w') as f:
    f.write(content)

print("✅ File base preparato")
