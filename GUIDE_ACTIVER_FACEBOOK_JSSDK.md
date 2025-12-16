# Guide : Activer le SDK JavaScript Facebook

## 🔴 Erreur rencontrée

```
L'option JSSDK n'est pas activée
Veuillez configurer l'option « Se connecter avec le SDK JavaScript » sur Oui 
sur le site developers.facebook.com afin d'utiliser l'option JSSDK pour vous connecter.
```

## ✅ Solution : Activer le SDK JavaScript

### Étape 1 : Accéder à votre application Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Connectez-vous avec votre compte Facebook
3. Cliquez sur **Mes applications** (My Apps) dans le menu en haut à droite
4. Sélectionnez votre application (ou créez-en une si nécessaire)

---

### Étape 2 : Accéder aux paramètres de l'application

1. Dans le menu de gauche, cliquez sur **Paramètres** (Settings)
2. Puis cliquez sur **Paramètres de base** (Basic Settings)

---

### Étape 3 : Activer le SDK JavaScript

1. Faites défiler jusqu'à la section **"Connexion Facebook"** (Facebook Login)
2. Cherchez l'option **"Utiliser le SDK JavaScript"** ou **"Se connecter avec le SDK JavaScript"**
   - En anglais : **"Use JavaScript SDK"** ou **"Login with JavaScript SDK"**
3. **Activez cette option** en cliquant sur le bouton/switch pour la mettre sur **"Oui"** (Yes/On)

---

### Étape 4 : Configurer les domaines autorisés

Dans la même section, assurez-vous que vos domaines sont correctement configurés :

#### Domaines de l'application (App Domains)
Ajoutez vos domaines :
```
localhost
leftover.ccdev.space
savetheplate.ccdev.space
ccdev.space
```

#### URL du site (Site URL)
Ajoutez l'URL principale de votre site :
```
https://leftover.ccdev.space
```
ou
```
https://savetheplate.ccdev.space
```

#### URI de redirection OAuth valides (Valid OAuth Redirect URIs)
Ajoutez toutes les URLs de redirection possibles :
```
http://localhost:3000/auth/callback
https://leftover.ccdev.space/auth/callback
https://savetheplate.ccdev.space/auth/callback
```

---

### Étape 5 : Vérifier les paramètres de produit Facebook Login

1. Dans le menu de gauche, cliquez sur **Produits** (Products)
2. Si **Facebook Login** n'est pas listé, cliquez sur **+ Ajouter un produit** (+ Add Product)
3. Sélectionnez **Facebook Login** et cliquez sur **Configurer** (Set Up)

#### Dans les paramètres de Facebook Login :

1. Cliquez sur **Paramètres** (Settings) dans le menu de gauche sous Facebook Login
2. Vérifiez que les **Client OAuth Login** et **Web OAuth Login** sont activés
3. Dans **Valid OAuth Redirect URIs**, ajoutez :
   ```
   http://localhost:3000/auth/callback
   https://leftover.ccdev.space/auth/callback
   https://savetheplate.ccdev.space/auth/callback
   ```

---

### Étape 6 : Configurer les paramètres avancés (optionnel mais recommandé)

1. Retournez dans **Paramètres** > **Paramètres de base**
2. Faites défiler jusqu'à **"Paramètres avancés"** (Advanced Settings)
3. Vérifiez que :
   - **"Client OAuth Login"** est activé
   - **"Web OAuth Login"** est activé
   - **"Enforce HTTPS"** est activé (pour la production)

---

### Étape 7 : Vérifier l'ID de l'application

1. Dans **Paramètres** > **Paramètres de base**
2. Copiez votre **ID de l'application** (App ID)
3. Vérifiez qu'il correspond à votre variable d'environnement :
   ```env
   NEXT_PUBLIC_FACEBOOK_APP_ID=votre_app_id_ici
   ```

---

## 🔍 Vérification après activation

### Test 1 : Vérifier dans la console du navigateur

1. Ouvrez votre application en développement
2. Ouvrez la console du navigateur (F12)
3. Vérifiez qu'il n'y a pas d'erreurs liées à Facebook SDK
4. Vous devriez voir : `FB SDK initialized` ou similaire

### Test 2 : Tester la connexion Facebook

1. Allez sur votre page de connexion (`/signIn`)
2. Cliquez sur le bouton "Se connecter avec Facebook"
3. La popup Facebook devrait s'ouvrir
4. Si tout fonctionne, vous devriez pouvoir vous connecter

---

## 🐛 Dépannage

### Problème : L'option n'apparaît pas

**Solution** :
1. Assurez-vous que le produit **Facebook Login** est ajouté à votre application
2. Vérifiez que vous avez les droits administrateur sur l'application
3. Essayez de rafraîchir la page ou de vous déconnecter/reconnecter

### Problème : Erreur "App Not Setup"

**Solution** :
1. Vérifiez que votre **App ID** est correct dans `.env.local`
2. Assurez-vous que l'application n'est pas en mode **Développement** avec des restrictions
3. Vérifiez que votre domaine est dans la liste des domaines autorisés

### Problème : Erreur "Invalid OAuth Redirect URI"

**Solution** :
1. Vérifiez que l'URL de redirection dans votre code correspond exactement à celle configurée
2. Les URLs doivent correspondre **exactement** (y compris le protocole http/https)
3. Ajoutez toutes les variantes possibles (avec et sans trailing slash)

### Problème : Le SDK ne se charge pas

**Solution** :
1. Vérifiez que `NEXT_PUBLIC_FACEBOOK_APP_ID` est défini dans `.env.local`
2. Redémarrez votre serveur de développement après avoir modifié `.env.local`
3. Vérifiez la console pour les erreurs de chargement de script

---

## 📝 Checklist de configuration complète

- [ ] Application Facebook créée sur developers.facebook.com
- [ ] Produit "Facebook Login" ajouté et configuré
- [ ] Option "Se connecter avec le SDK JavaScript" activée
- [ ] Domaines de l'application configurés
- [ ] URL du site configurée
- [ ] URIs de redirection OAuth configurées
- [ ] App ID copié dans `.env.local` comme `NEXT_PUBLIC_FACEBOOK_APP_ID`
- [ ] Serveur redémarré après modification de `.env.local`
- [ ] Test de connexion Facebook réussi

---

## 🔗 Liens utiles

- [Facebook Developers Console](https://developers.facebook.com/apps/)
- [Documentation Facebook Login](https://developers.facebook.com/docs/facebook-login/web)
- [Guide de configuration Facebook Login](https://developers.facebook.com/docs/facebook-login/web/login-button)
- [Testeur de connexion Facebook](https://developers.facebook.com/tools/debug/accesstoken/)

---

## 🔓 Accéder au SDK AVANT l'approbation de l'application

### ⚠️ Important : Mode Développement

Par défaut, Facebook limite l'accès à votre application en **mode développement**. Seuls les utilisateurs avec des **rôles spécifiques** peuvent utiliser l'application avant qu'elle soit approuvée.

### ✅ Solution : Ajouter des rôles (Administrateurs, Développeurs, Testeurs)

#### Étape 1 : Accéder à la gestion des rôles

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Sélectionnez votre application
3. Dans le menu de gauche, cliquez sur **Rôles** (Roles)
4. Vous verrez différentes sections : **Administrateurs**, **Développeurs**, **Testeurs**

#### Étape 2 : Ajouter des administrateurs/développeurs

1. Dans la section **Administrateurs** ou **Développeurs**
2. Cliquez sur **Ajouter** (Add)
3. Entrez l'**adresse email Facebook** ou le **nom** de la personne
4. Sélectionnez le rôle :
   - **Administrateur** : Accès complet à tous les paramètres
   - **Développeur** : Peut modifier le code et tester l'application
   - **Testeur** : Peut uniquement tester l'application

#### Étape 3 : Ajouter des testeurs

Pour permettre à d'autres utilisateurs de tester votre application :

1. Dans la section **Testeurs**
2. Cliquez sur **Ajouter des testeurs** (Add Testers)
3. Entrez les emails Facebook des personnes à ajouter
4. Cliquez sur **Inviter** (Invite)

⚠️ **Note** : Les testeurs recevront une invitation par email et devront l'accepter.

#### Étape 4 : Vérifier le mode de l'application

1. Allez dans **Paramètres** > **Paramètres de base**
2. Vérifiez le **Mode de l'application** (App Mode) :
   - **Développement** : Seuls les rôles ajoutés peuvent utiliser l'app
   - **Live** : L'application est publique (nécessite l'approbation Facebook)

### 🎯 Rôles et permissions

| Rôle | Peut utiliser l'app | Peut modifier les paramètres | Peut voir les analytics |
|------|---------------------|------------------------------|-------------------------|
| **Administrateur** | ✅ Oui | ✅ Oui | ✅ Oui |
| **Développeur** | ✅ Oui | ✅ Oui (limité) | ✅ Oui |
| **Testeur** | ✅ Oui | ❌ Non | ❌ Non |
| **Public** | ❌ Non (en mode dev) | ❌ Non | ❌ Non |

### 🔧 Configuration pour le développement

#### Option 1 : Mode Développement (recommandé pour tester)

1. Laissez l'application en **Mode Développement**
2. Ajoutez tous les utilisateurs de test comme **Testeurs**
3. Ils pourront utiliser Facebook Login pour se connecter
4. **Avantage** : Pas besoin d'approbation Facebook
5. **Inconvénient** : Seuls les testeurs peuvent utiliser l'app

#### Option 2 : Mode Live (pour la production)

1. Passez l'application en **Mode Live**
2. Soumettez votre application pour **App Review** si nécessaire
3. Une fois approuvée, tout le monde peut utiliser l'app
4. **Avantage** : Accessible à tous
5. **Inconvénient** : Nécessite l'approbation Facebook (peut prendre plusieurs jours)

### 📋 Checklist pour tester avant l'approbation

- [ ] Application créée sur developers.facebook.com
- [ ] Produit "Facebook Login" ajouté
- [ ] SDK JavaScript activé
- [ ] Domaines configurés
- [ ] URIs de redirection configurées
- [ ] **Rôles ajoutés** (Administrateurs/Développeurs/Testeurs)
- [ ] App ID dans `.env.local`
- [ ] Serveur redémarré
- [ ] Test de connexion avec un compte testeur

### 🧪 Tester avec un compte testeur

1. **Ajoutez-vous comme testeur** (si ce n'est pas déjà fait)
2. Connectez-vous à votre application avec ce compte Facebook
3. Allez sur `/signIn`
4. Cliquez sur "Se connecter avec Facebook"
5. La popup Facebook devrait s'ouvrir
6. Autorisez l'application
7. Vous devriez être connecté !

### ⚠️ Erreurs courantes en mode développement

#### Erreur : "App Not Setup: This app is still in development mode"

**Cause** : L'utilisateur n'est pas dans la liste des rôles autorisés

**Solution** :
1. Allez dans **Rôles** > **Testeurs**
2. Ajoutez l'email Facebook de l'utilisateur
3. L'utilisateur doit accepter l'invitation
4. Réessayez la connexion

#### Erreur : "User is not authorized to use this app"

**Cause** : L'utilisateur n'a pas accepté l'invitation de test

**Solution** :
1. Vérifiez que l'utilisateur a reçu et accepté l'invitation
2. L'invitation est envoyée par email
3. L'utilisateur doit cliquer sur "Accepter" dans l'email

### 🚀 Passer en production (quand prêt)

Quand vous êtes prêt à rendre l'application publique :

1. Allez dans **Paramètres** > **Paramètres de base**
2. Faites défiler jusqu'à **Mode de l'application**
3. Cliquez sur **Basculer en mode Live** (Switch to Live Mode)
4. Facebook vous demandera de soumettre l'application pour révision si nécessaire
5. Une fois approuvée, tout le monde pourra utiliser l'application

---

## 💡 Notes importantes

1. **Mode Développement** : En mode développement, seuls les administrateurs/testeurs peuvent se connecter
2. **HTTPS requis** : Pour la production, HTTPS est obligatoire pour Facebook Login
3. **Permissions** : Vérifiez que vous demandez les bonnes permissions (`email`, `public_profile`)
4. **App Review** : Pour la production publique, vous devrez peut-être soumettre votre application pour révision
5. **Rôles** : Ajoutez toujours les utilisateurs de test comme Testeurs pour pouvoir tester avant l'approbation

---

## 🎯 Configuration rapide (résumé)

1. **developers.facebook.com** → Votre app → **Paramètres** → **Paramètres de base**
2. Activer **"Se connecter avec le SDK JavaScript"** → **Oui**
3. Ajouter vos domaines dans **Domaines de l'application**
4. Configurer **Facebook Login** → **Paramètres** → Ajouter les URIs de redirection
5. Copier l'**App ID** dans `.env.local`
6. Redémarrer le serveur
7. Tester !

---

Si vous rencontrez toujours des problèmes après avoir suivi ce guide, vérifiez :
- Les erreurs dans la console du navigateur
- Les logs du serveur backend
- Que votre App ID est correct
- Que tous les domaines sont bien configurés

