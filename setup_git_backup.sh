#!/bin/bash

# Script per preparare backup completo su Git
# Assessment Platform - Modello Politecnico di Milano

echo "🔄 Inizializzazione backup Git per Assessment Platform..."

# 1. VERIFICA se Git è già inizializzato
if [ -d ".git" ]; then
    echo "✅ Repository Git già esistente"
    git status
else
    echo "🆕 Inizializzazione nuovo repository Git..."
    git init
fi

# 2. CREAZIONE .gitignore se non esiste
if [ ! -f ".gitignore" ]; then
    echo "📝 Creazione .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
*/dist/
*/build/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/

# Logs
*.log
logs/

# Database
*.db
*.sqlite

# Backup files (manteniamo solo quelli intenzionali)
*.bak
*~

# Temporary files
.tmp/
temp/
EOF
    echo "✅ .gitignore creato"
fi

# 3. AGGIUNTA di tutti i file (prima commit completa)
echo "📦 Aggiunta file al repository..."
git add .

# 4. CONTROLLO status prima del commit
echo "📋 Status del repository:"
git status

echo ""
echo "🎯 PRONTO PER IL COMMIT INIZIALE"
echo "Esegui: git commit -m 'Initial commit: Assessment Platform - Modello Politecnico Milano'"
echo ""
echo "📥 SETUP REMOTE (se necessario):"
echo "git remote add origin https://github.com/TUO_USERNAME/assessment-platform.git"
echo "git branch -M main"
echo "git push -u origin main"
