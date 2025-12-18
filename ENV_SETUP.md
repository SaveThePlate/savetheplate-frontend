# Configuration des Variables d'Environnement

Ce guide explique comment configurer les variables d'environnement pour le projet.

## ⚠️ IMPORTANT - Sécurité

**Les variables avec le préfixe `NEXT_PUBLIC_` sont exposées au client (navigateur).**
- ✅ Les IDs d'application (App ID) peuvent être publics
- ❌ **JAMAIS** de clés secrètes, tokens privés, ou mots de passe dans les variables `NEXT_PUBLIC_*`

## Configuration Facebook

### Frontend (ce projet)

Créez un fichier `.env.local` à la racine du projet avec :

```env
# Facebook App ID (public - peut être exposé)
NEXT_PUBLIC_FACEBOOK_APP_ID=2359090251275497

# Backend URL
NEXT_PUBLIC_BACKEND_URL=https://leftover-be.ccdev.space

# Google OAuth (si utilisé)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Backend (projet séparé)

⚠️ **La clé secrète Facebook doit être configurée UNIQUEMENT dans le backend** :

```env
# Dans le backend .env (NE PAS mettre dans le frontend !)
FACEBOOK_APP_ID=2359090251275497
FACEBOOK_APP_SECRET=cba2a9855a97953d68973408e535c138
```

## Variables d'environnement complètes

### Fichier `.env.local` (Frontend)

```env
# ============================================
# Backend Configuration
# ============================================
NEXT_PUBLIC_BACKEND_URL=https://leftover-be.ccdev.space

# ============================================
# Google OAuth
# ============================================
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# ============================================
# Facebook Login
# ============================================
# ID de l'application Facebook (public)
NEXT_PUBLIC_FACEBOOK_APP_ID=2359090251275497

# ⚠️ NE PAS ajouter la clé secrète ici !
# La clé secrète doit être uniquement dans le backend
```

## Instructions de configuration

1. **Créez le fichier `.env.local`** à la racine du projet (même niveau que `package.json`)

2. **Copiez les variables ci-dessus** et remplissez les valeurs

3. **Redémarrez le serveur de développement** après avoir créé/modifié `.env.local` :
   ```bash
   npm run dev
   ```

4. **Vérifiez que les variables sont chargées** :
   - Le composant `FacebookSDK` devrait se charger sans erreur
   - La console du navigateur ne devrait pas afficher d'erreurs liées à l'App ID manquant

## Vérification

### Vérifier Facebook App ID

1. Ouvrez la console du navigateur (F12)
2. Allez sur la page de connexion (`/signIn`)
3. Cliquez sur "Se connecter avec Facebook"
4. Dans la console, vous devriez voir : `Attempting Facebook login with App ID: 2359090251275497`

### Vérifier que la clé secrète n'est pas exposée

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Sources" ou "Network"
3. Recherchez dans le code compilé : vous ne devriez **PAS** trouver `cba2a9855a97953d68973408e535c138`
4. Si vous la trouvez, c'est une **faille de sécurité** - retirez-la immédiatement du frontend

## Configuration Facebook Developers

Assurez-vous que dans [Facebook Developers](https://developers.facebook.com/apps/2359090251275497) :

- ✅ **App ID** : `2359090251275497`
- ✅ **Login with JavaScript SDK** : Activé (Oui)
- ✅ **App Domains** : Configurés avec vos domaines
- ✅ **Valid OAuth Redirect URIs** : Configurés

Pour plus de détails, voir :
- [GUIDE_ACTIVER_FACEBOOK_JSSDK.md](./GUIDE_ACTIVER_FACEBOOK_JSSDK.md)
- [GUIDE_FACEBOOK_LOGIN_JSSDK.md](./GUIDE_FACEBOOK_LOGIN_JSSDK.md)

## Dépannage

### Le SDK Facebook ne se charge pas

1. Vérifiez que `.env.local` existe et contient `NEXT_PUBLIC_FACEBOOK_APP_ID`
2. Redémarrez le serveur de développement
3. Videz le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
4. Vérifiez la console pour les erreurs

### Erreur "App Not Setup"

1. Vérifiez que l'App ID dans `.env.local` correspond à celui dans Facebook Developers
2. Vérifiez que "Login with JavaScript SDK" est activé dans Facebook Developers
3. Attendez 2-5 minutes après avoir modifié les paramètres Facebook

## Notes importantes

- Le fichier `.env.local` est ignoré par git (dans `.gitignore`)
- Ne commitez **JAMAIS** de fichiers `.env.local` avec des secrets
- Pour la production, configurez les variables d'environnement dans votre plateforme d'hébergement (Vercel, Netlify, etc.)

