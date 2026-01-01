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
# Note: Avec unoptimized: true dans next.config.mjs, sharp n'est pas strictement nécessaire
# mais on l'installe quand même pour éviter les warnings
if [ -d ".next/standalone" ]; then
    echo "Installation de sharp dans standalone..."
    cd .next/standalone
    
    # Essayer d'installer sharp avec différentes méthodes
    if npm install sharp --legacy-peer-deps --no-save --force 2>&1 | tee /tmp/sharp-install.log; then
        echo "✓ Sharp installé avec succès dans standalone"
    else
        echo "⚠ Échec de l'installation de sharp (non critique si unoptimized: true)"
        # Vérifier si sharp existe déjà dans node_modules parent
        if [ -d "../../node_modules/sharp" ]; then
            echo "Tentative de copie de sharp depuis node_modules parent..."
            mkdir -p node_modules
            cp -r ../../node_modules/sharp node_modules/ 2>/dev/null && echo "✓ Sharp copié depuis node_modules parent" || echo "⚠ Échec de la copie"
        fi
    fi
    
    cd ../..
fi

echo "✓ Post-build terminé"

