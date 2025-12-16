# Guide : Restrictions d'IP et Activation des SDK

## 📋 Table des matières
1. [Qu'est-ce que la Liste d'IP serveur autorisées ?](#liste-ip-serveur)
2. [Restrictions d'IP pour les modifications de paramètres](#restrictions-parametres)
3. [Comment activer les SDK nécessaires](#activer-sdk)
4. [Configuration pour votre projet](#configuration-projet)

---

## 🔒 Qu'est-ce que la Liste d'IP serveur autorisées ? {#liste-ip-serveur}

La **Liste d'IP serveur autorisées** est une fonctionnalité de sécurité dans Google Cloud Console qui permet de restreindre l'utilisation de vos clés API uniquement aux adresses IP spécifiées.

### Pourquoi l'utiliser ?
- ✅ **Sécurité renforcée** : Empêche l'utilisation non autorisée de vos clés API
- ✅ **Contrôle des coûts** : Limite l'utilisation aux serveurs/applications autorisés
- ✅ **Protection contre le vol** : Même si une clé est compromise, elle ne fonctionnera que depuis les IP autorisées

### Comment ça fonctionne ?
Quand vous activez cette restriction :
- Les requêtes provenant d'IPs **non autorisées** seront **bloquées**
- Seules les requêtes provenant des IPs de votre liste seront **acceptées**

---

## 🛡️ Restrictions d'IP pour les modifications de paramètres {#restrictions-parametres}

Cette restriction est spécifique à la **console Google Cloud** elle-même, pas à l'utilisation de l'API.

### Différence importante :

| Type de restriction | Portée | Utilisation |
|---------------------|--------|-------------|
| **IP serveur autorisées** | Utilisation de l'API | Limite où votre application peut utiliser la clé API |
| **IP pour modifications** | Console Google Cloud | Limite qui peut modifier les paramètres de la clé API |

### Quand utiliser les restrictions IP pour modifications ?
- ✅ Si vous travaillez en équipe et voulez limiter qui peut modifier les clés
- ✅ Pour la sécurité administrative
- ⚠️ **Attention** : Si vous activez cela, vous ne pourrez modifier les paramètres que depuis les IPs autorisées

---

## 🚀 Comment activer les SDK nécessaires {#activer-sdk}

Votre projet utilise plusieurs services Google. Voici comment activer chacun :

### 1. Google OAuth (Authentification)

#### Étape 1 : Activer l'API
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Library**
4. Recherchez **"Google+ API"** ou **"Identity Toolkit API"**
5. Cliquez sur **Enable**

#### Étape 2 : Créer les identifiants OAuth
1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Configurez :
   - **Application type** : Web application
   - **Name** : Leftover Frontend (ou votre nom)
   - **Authorized JavaScript origins** :
     ```
     http://localhost:3000
     https://leftover.ccdev.space
     https://savetheplate.ccdev.space
     ```
   - **Authorized redirect URIs** :
     ```
     http://localhost:3000/auth/callback
     https://leftover.ccdev.space/auth/callback
     https://savetheplate.ccdev.space/auth/callback
     ```
4. Copiez le **Client ID** et ajoutez-le dans votre `.env.local` :
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=votre_client_id_ici
   ```

#### Étape 3 : Restrictions (optionnel)
- **Application restrictions** : 
  - Pour développement : **None** (ou HTTP referrers avec vos domaines)
  - Pour production : **HTTP referrers** avec vos domaines autorisés
- **API restrictions** :
  - Sélectionnez **Restrict key**
  - Cochez **Google+ API** ou **Identity Toolkit API**

---

### 2. Google Maps JavaScript API

#### Étape 1 : Activer l'API
1. Dans Google Cloud Console, allez dans **APIs & Services** > **Library**
2. Recherchez **"Maps JavaScript API"**
3. Cliquez sur **Enable**

#### Étape 2 : Créer une clé API
1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **API Key**
3. Copiez la clé générée

#### Étape 3 : Configurer les restrictions

**Option A : Restrictions par HTTP referrers (recommandé pour frontend)**
```
Application restrictions : HTTP referrers (web sites)
Website restrictions :
  - http://localhost:3000/*
  - https://leftover.ccdev.space/*
  - https://savetheplate.ccdev.space/*
```

**Option B : Restrictions par IP (pour backend uniquement)**
```
Application restrictions : IP addresses (web servers, cron jobs, etc.)
IP addresses :
  - Votre IP serveur backend (ex: 123.456.789.0)
```

⚠️ **Important** : Pour une application Next.js (frontend), utilisez **HTTP referrers**, pas les restrictions IP !

#### Étape 4 : Activer les APIs nécessaires
Dans les restrictions de la clé, activez :
- ✅ Maps JavaScript API
- ✅ Geocoding API (si vous géocodez des adresses)
- ✅ Places API (si vous utilisez l'autocomplétion)

---

### 3. Google Analytics

Déjà configuré dans votre projet avec l'ID `G-CVCP72DH21`.

Pour activer :
1. Allez sur [Google Analytics](https://analytics.google.com/)
2. Créez une propriété si nécessaire
3. Récupérez votre **Measurement ID** (format : G-XXXXXXXXXX)
4. Il est déjà intégré dans `app/layout.tsx`

---

## ⚙️ Configuration pour votre projet {#configuration-projet}

### Variables d'environnement nécessaires

Créez un fichier `.env.local` à la racine du projet :

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=votre_google_client_id

# Backend URL
NEXT_PUBLIC_BACKEND_URL=https://leftover-be.ccdev.space

# Facebook (optionnel)
NEXT_PUBLIC_FACEBOOK_APP_ID=votre_facebook_app_id
```

### SDKs déjà activés dans votre code

✅ **Google OAuth** : Activé dans `app/layout.tsx`
```tsx
<GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
```

✅ **Facebook SDK** : Activé dans `components/FacebookSDK.tsx`

✅ **Google Analytics** : Activé dans `app/layout.tsx`

### Vérification que tout fonctionne

1. **Google OAuth** :
   - Testez la connexion sur `/signIn`
   - Vérifiez que le bouton Google apparaît

2. **Maps** (si vous utilisez Google Maps) :
   - Vérifiez que les cartes se chargent
   - Consultez la console pour les erreurs d'API

3. **Analytics** :
   - Vérifiez dans Google Analytics que les événements sont enregistrés

---

## 📝 Exemple de configuration complète

### Dans Google Cloud Console :

1. **Créer une clé API pour Maps** :
   ```
   Nom : Leftover Maps API Key
   Restrictions d'application : HTTP referrers
   Sites web autorisés :
     - http://localhost:3000/*
     - https://*.ccdev.space/*
   Restrictions d'API : 
     - Maps JavaScript API
     - Geocoding API
   ```

2. **Créer OAuth Client ID** :
   ```
   Nom : Leftover OAuth Client
   Type : Web application
   Origines JavaScript autorisées :
     - http://localhost:3000
     - https://leftover.ccdev.space
     - https://savetheplate.ccdev.space
   URIs de redirection autorisés :
     - http://localhost:3000/auth/callback
     - https://leftover.ccdev.space/auth/callback
   ```

---

## ⚠️ Points importants à retenir

1. **Ne jamais activer les restrictions IP pour les clés frontend** :
   - Les applications Next.js s'exécutent côté client
   - Les IPs des utilisateurs varient
   - Utilisez **HTTP referrers** à la place

2. **Restrictions IP uniquement pour backend** :
   - Si votre backend fait des appels API Google
   - Ajoutez l'IP de votre serveur backend

3. **Sécurité** :
   - Ne commitez jamais vos clés API dans Git
   - Utilisez des variables d'environnement
   - Activez les restrictions dès que possible

4. **Quotas et facturation** :
   - Surveillez l'utilisation dans Google Cloud Console
   - Configurez des alertes de quota
   - Google Maps a un quota gratuit généreux

---

## 🔗 Liens utiles

- [Google Cloud Console](https://console.cloud.google.com/)
- [Documentation Google Maps API](https://developers.google.com/maps/documentation)
- [Documentation Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Guide de sécurité des clés API](https://cloud.google.com/docs/authentication/api-keys)

---

## ❓ Questions fréquentes

**Q : Dois-je activer les restrictions IP pour mon frontend Next.js ?**
R : Non ! Utilisez les restrictions HTTP referrers à la place.

**Q : Comment trouver mon IP serveur ?**
R : Pour le backend, utilisez `curl ifconfig.me` ou consultez votre hébergeur.

**Q : Puis-je utiliser la même clé API pour plusieurs domaines ?**
R : Oui, ajoutez tous vos domaines dans les HTTP referrers.

**Q : Que faire si mes restrictions bloquent mes requêtes ?**
R : Vérifiez que vos domaines/IPs sont correctement ajoutés et que le format est correct.

