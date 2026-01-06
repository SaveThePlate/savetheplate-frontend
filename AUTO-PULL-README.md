# 🔄 Auto-Pull Frontend - SaveThePlate

Ce script permet au serveur de récupérer automatiquement les nouveaux commits depuis GitHub.

## 📦 Repository
- **URL**: https://github.com/SaveThePlate/savetheplate-frontend.git
- **Branche**: `main`

## 🚀 Installation Rapide

### 1. Sur le serveur, dans le dossier du projet

Le script `auto-pull.sh` est déjà dans le repository. Après avoir cloné :

```bash
cd ~/savetheplate-frontend  # ou votre chemin
chmod +x auto-pull.sh
```

### 2. Configurer le cron (toutes les 5 minutes)

```bash
crontab -e
```

Ajoutez :
```bash
*/5 * * * * cd ~/savetheplate-frontend && ./auto-pull.sh >> ./cron.log 2>&1
```

**Important**: Remplacez `~/savetheplate-frontend` par le chemin réel de votre dépôt.

### 3. Tester

```bash
./auto-pull.sh
tail -f auto-pull.log
```

## ⚙️ Configuration (Optionnel)

Le script détecte automatiquement :
- ✅ Le chemin du dépôt (là où est le script)
- ✅ Le gestionnaire de processus (PM2, Docker, systemd)
- ✅ La branche (défaut: main)

Pour personnaliser, créez un fichier `.autopull.env` :

```bash
cp .autopull.env.example .autopull.env
nano .autopull.env
```

```bash
# Exemple de personnalisation
AUTO_PULL_BRANCH=develop
PM2_APP_NAME=mon-frontend
```

Puis sourcez-le avant d'exécuter le script dans votre cron :

```bash
*/5 * * * * cd ~/savetheplate-frontend && source .autopull.env && ./auto-pull.sh >> ./cron.log 2>&1
```

## 📋 Prérequis

### SSH Git configuré

```bash
# 1. Générer une clé SSH
ssh-keygen -t ed25519 -C "serveur-prod" -f ~/.ssh/id_ed25519_github

# 2. Afficher et copier la clé publique
cat ~/.ssh/id_ed25519_github.pub

# 3. Ajouter sur GitHub
# https://github.com/settings/keys → New SSH key

# 4. Configurer SSH
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github
EOF

# 5. Tester
ssh -T git@github.com
```

### PM2 installé (recommandé)

```bash
npm install -g pm2

# Démarrer l'application
cd ~/savetheplate-frontend
npm install --legacy-peer-deps
npm run build
pm2 start npm --name savetheplate-frontend -- start

# Sauvegarder pour redémarrage auto
pm2 save
pm2 startup
```

## 🔍 Ce que fait le script

```
1. Vérification → git fetch origin
2. Comparaison → Nouveaux commits ?
   ├─ Non → Fin (rien à faire)
   └─ Oui → Suite
3. Pull → git pull origin main
4. Dépendances → npm install (si package.json changé)
5. Build → npm run build
6. Redémarrage → pm2 restart / docker restart / systemctl restart
```

## 📊 Vérifier les logs

```bash
# Logs auto-pull
tail -f auto-pull.log

# Logs cron
tail -f cron.log

# Logs PM2
pm2 logs savetheplate-frontend
```

## 🛠️ Dépannage

### Le script ne détecte pas les changements

```bash
# Tester manuellement
cd ~/savetheplate-frontend
git fetch origin main
git status
```

### Build échoue

```bash
# Vérifier les dépendances
npm install --legacy-peer-deps
npm run build
```

### L'application ne redémarre pas

```bash
# Vérifier PM2
pm2 status
pm2 describe savetheplate-frontend

# Redémarrer manuellement
pm2 restart savetheplate-frontend
```

### SSH Git échoue

```bash
# Tester la connexion
ssh -T git@github.com

# Devrait afficher : "Hi SaveThePlate! You've successfully authenticated..."
```

## 📝 Variables d'Environnement

Le script supporte ces variables (optionnelles) :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `AUTO_PULL_BRANCH` | Branche à surveiller | `main` |
| `PM2_APP_NAME` | Nom de l'app PM2 | `savetheplate-frontend` |
| `DOCKER_CONTAINER_NAME` | Nom du container Docker | `savetheplate-frontend` |
| `SYSTEMD_SERVICE_NAME` | Nom du service systemd | `savetheplate-frontend` |

## 🎯 Workflow de l'Équipe

```bash
# 1. Développeur fait ses changements
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main

# 2. Serveur détecte (max 5 minutes)
# 3. Auto-pull → Build → Redémarrage
# 4. Application à jour ! 🎉
```

## ⚠️ Important pour l'Équipe

### À faire une seule fois par serveur :
- ✅ Configurer SSH Git
- ✅ Installer PM2
- ✅ Démarrer l'application avec PM2
- ✅ Ajouter le cron job

### Chaque développeur peut :
- ✅ Push normalement sur GitHub
- ✅ Le serveur se met à jour automatiquement
- ✅ Pas de manipulation manuelle nécessaire

## 🔒 Sécurité

- ✅ Zéro port entrant nécessaire
- ✅ Communication SSH sortante uniquement
- ✅ Lock files pour éviter les exécutions simultanées
- ✅ Logs complets pour audit

## 📚 Documentation Complète

Plus de détails dans le dossier racine :
- `../QUICK-START.md` - Installation rapide
- `../DEPLOY-SERVER-AUTOPULL.md` - Guide complet
- `../MEMO-DEPLOIEMENT.md` - Aide-mémoire

## 🆘 Support

En cas de problème :
1. Vérifiez `auto-pull.log`
2. Testez manuellement : `./auto-pull.sh`
3. Vérifiez SSH : `ssh -T git@github.com`
4. Vérifiez PM2 : `pm2 status`
5. Consultez la documentation complète

---

**Le script est portable et fonctionne pour toute l'équipe !** 🚀

