#!/bin/bash
# Script post-build pour copier les fichiers statiques dans standalone

cd "$(dirname "$0")"

# Copier les fichiers statiques dans standalone
if [ -d ".next/static" ] && [ -d ".next/standalone" ]; then
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/ >/dev/null 2>&1
fi

# Copier le répertoire public dans standalone
if [ -d "public" ] && [ -d ".next/standalone" ]; then
    cp -r public .next/standalone/ >/dev/null 2>&1
fi

# Skip sharp installation since unoptimized: true in next.config.mjs
# Sharp is not needed when image optimization is disabled

