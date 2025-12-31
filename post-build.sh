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

echo "✓ Post-build terminé"

