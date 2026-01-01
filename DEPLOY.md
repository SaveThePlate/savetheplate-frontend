# 🚀 Guide de Déploiement - Frontend

## Déploiement Automatique

Ce repository frontend a son propre workflow de déploiement automatique.

### Utilisation

```bash
# Depuis le dossier leftover-frontend
./deploy.sh "Description de vos changements"
```

Le script va :
1. ✅ Ajouter tous les fichiers modifiés
2. ✅ Créer un commit avec votre message
3. ✅ Pusher vers GitHub
4. ✅ Déclencher automatiquement le déploiement sur le serveur

### Configuration GitHub Actions

Le workflow `.github/workflows/auto-deploy.yml` se déclenche automatiquement à chaque push sur `main`.

**Secrets requis dans GitHub** :
- `PROD_SERVER_IP` - Adresse IP du serveur
- `PROD_SERVER_USER` - Utilisateur SSH
- `PROD_SSH_PRIVATE_KEY` - Clé SSH privée
- `PROD_SSH_PASSPHRASE` - Passphrase (vide si pas de passphrase)

### Chemin sur le serveur

Le workflow cherche le frontend dans ces emplacements (dans l'ordre) :
- `/var/www/savetheplate/leftover-frontend`
- `~/savetheplate/leftover-frontend`
- `/home/USER/savetheplate/leftover-frontend`
- `/var/www/leftover-frontend`
- `~/leftover-frontend`

Si votre structure est différente, modifiez `.github/workflows/auto-deploy.yml`.

### Vérification

Après le déploiement, vérifiez les logs :
```bash
# Sur le serveur
ssh savethep@196.203.104.9
docker logs savetheplate-frontend
# ou
pm2 logs frontend
```

