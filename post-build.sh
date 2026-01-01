#!/bin/bash
# Script post-build pour copier les fichiers statiques dans standalone

cd "$(dirname "$0")"

# Copier les fichiers statiques dans standalone
if [ -d ".next/static" ] && [ -d ".next/standalone" ]; then
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/ 2>/dev/null
    echo "✓ Fichiers statiques copiés dans standalone"
fi

# Copier le répertoire public dans standalone
if [ -d "public" ] && [ -d ".next/standalone" ]; then
    cp -r public .next/standalone/ 2>/dev/null
    echo "✓ Répertoire public copié dans standalone"
fi

# Installer sharp dans standalone (requis pour l'optimisation d'images)
if [ -d ".next/standalone" ]; then
    cd .next/standalone
    npm install sharp --legacy-peer-deps --no-save 2>/dev/null
    cd ../..
    echo "✓ Sharp installé dans standalone"
fi

echo "✓ Post-build terminé"

