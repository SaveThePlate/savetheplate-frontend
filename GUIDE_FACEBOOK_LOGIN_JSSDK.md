# Facebook Login pour le web avec le SDK JavaScript

Ce document vous guide à travers les étapes de mise en œuvre de Facebook Login avec Facebook SDK for JavaScript sur votre page web.

## Avant de commencer

Vous aurez besoin des éléments suivants :

- Un compte de développeur·se Facebook
- Un ID d'application Facebook pour un site web

## Exemple de connexion automatique de base

L'exemple de code suivant vous montre comment ajouter le SDK Facebook pour JavaScript à votre page web, initialiser le SDK et, si vous êtes connecté·e à Facebook, il affichera votre nom et votre adresse e-mail. Si vous n'êtes pas connecté·e à Facebook, la boîte de dialogue Login s'affiche automatiquement.

L'autorisation `public_profile`, qui vous permet d'obtenir des informations publiques telles que le nom et la photo de profil, et l'autorisation `email` ne nécessitent pas de contrôle de l'application et sont accordées automatiquement à toutes les applications utilisant Facebook Login.

```html
<!DOCTYPE html>
<html lang="en">
  <head></head>
  <body>
    <h2>Add Facebook Login to your webpage</h2>
    
    <!-- Set the element id for the JSON response -->
    <p id="profile"></p>

    <script>
      <!-- Add the Facebook SDK for Javascript -->
      (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));

      window.fbAsyncInit = function() {
        <!-- Initialize the SDK with your app and the Graph API version for your app -->
        FB.init({
          appId            : '{your-facebook-app-id}',
          xfbml            : true,
          version          : '{the-graph-api-version-for-your-app}'
        });
        
        <!-- If you are logged in, automatically get your name and email adress, your public profile information -->
        FB.login(function(response) {
          if (response.authResponse) {
            console.log('Welcome!  Fetching your information.... ');
            FB.api('/me', {fields: 'name, email'}, function(response) {
              document.getElementById("profile").innerHTML = 
                "Good to see you, " + response.name + ". i see your email address is " + response.email
            });
          } else { 
            <!-- If you are not logged in, the login dialog will open for you to login asking for permission to get your public profile and email -->
            console.log('User cancelled login or did not fully authorize.'); 
          }
        });
      };
    </script>
  </body>
</html>
```

## 1. Activer le SDK JavaScript pour Facebook Login

Dans l'Espace App, sélectionnez votre application, puis faites défiler la page jusqu'à **Ajouter un produit**. Dans la carte **Facebook Login**, cliquez sur **Configurer**. Dans le panneau de navigation gauche, sélectionnez **Paramètres**. Sous **Paramètres OAuth client**, saisissez votre URL de redirection dans le champ **URI de redirection OAuth valides** pour activer l'autorisation.

Pour indiquer que vous utilisez le SDK JavaScript pour la connexion, définissez le bouton à bascule **Se connecter avec un SDK JavaScript** sur **Oui** et saisissez le domaine de votre page qui héberge le SDK dans la liste **Domaines autorisés pour le SDK Javascript**. Cela garantit que les tokens d'accès sont uniquement renvoyés aux rappels dans les domaines autorisés. Seules les pages HTTPS sont prises en charge pour les actions d'authentification avec le SDK Facebook pour JavaScript.

## 2. Vérifier l'état de la connexion d'une personne

La première étape pour charger votre page web consiste à déterminer si une personne est déjà connectée à votre page web avec Facebook Login. Un appel de `FB.getLoginStatus` déclenche un appel vers Facebook pour obtenir l'état de la connexion. Facebook appelle alors votre fonction de rappel avec les résultats.

### Exemple d'appel

```javascript
FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
});
```

### Exemple de réponse JSON

```json
{
    "status": "connected",
    "authResponse": {
        "accessToken": "{access-token}",
        "expiresIn": "{unix-timestamp}",
        "reauthorize_required_in": "{seconds-until-token-expires}",
        "signedRequest": "{signed-parameter}",
        "userID": "{user-id}"
    }
}
```

### Types de Status

| Type de Status | Description |
|----------------|-------------|
| `connected` | L'utilisateur·ice est connecté·e à Facebook et à votre page web. |
| `not_authorized` | L'utilisateur·ice est connecté·e à Facebook, mais pas à votre page web. |
| `unknown` | L'utilisateur·ice n'est pas connecté·e à Facebook, donc vous ne pouvez pas savoir s'il ou elle est connecté·e à votre page web. Il est également possible que la fonction `FB.logout()` ait été appelée auparavant et, par conséquent, votre application ne peut pas se connecter à Facebook. |

### Paramètres authResponse

Si le statut est `connected`, les paramètres `authResponse` suivants sont inclus dans la réponse :

| Paramètres authResponse | Valeur |
|------------------------|--------|
| `accessToken` | Token d'accès pour la personne qui utilise la page web. |
| `expiresIn` | Horodatage UNIX d'expiration du token. Une fois le token arrivé à expiration, l'utilisateur·ice doit se reconnecter. |
| `reauthorize_required_in` | Durée, en secondes, avant que la connexion expire et que l'utilisateur·ice doive se reconnecter. |
| `signedRequest` | Paramètre signé qui contient des informations sur la personne utilisant votre page web. |
| `userID` | ID de la personne utilisant votre page web. |

Vous n'avez rien à faire de votre côté pour activer ce comportement, car le SDK JavaScript exécute automatiquement le statut de connexion.

## 3. Connecter un utilisateur ou une utilisatrice

Si une personne ouvre votre page web mais n'est pas connectée à l'application ni à Facebook, vous pouvez utiliser la boîte de dialogue Login pour l'inviter à se connecter à la fois à l'application et à la plateforme. Si elle n'est pas connectée à Facebook, elle sera d'abord invitée à se connecter, puis invitée à se connecter à votre page web.

Il y a deux manières d'inviter une personne à se connecter :

1. **Le bouton Facebook Login**
2. **La boîte de dialogue Login du SDK JavaScript**

### A. Se connecter au moyen du bouton Login

Pour utiliser le bouton Facebook Login, personnalisez le bouton Login et obtenez le code à l'aide de notre [Configurateur de plugins](https://developers.facebook.com/docs/plugins/configurator/).

### B. Se connecter à l'aide de la boîte de dialogue Login depuis le SDK JavaScript

Pour utiliser votre propre bouton Login, invoquez la boîte de dialogue Login en effectuant un appel vers `FB.login()`.

```javascript
FB.login(function(response){
  // handle the response 
});
```

### Demander des autorisations supplémentaires

Lorsqu'un utilisateur clique sur votre bouton HTML, une fenêtre contextuelle s'affiche avec la boîte de dialogue Login. Cette boîte de dialogue vous permet de demander l'autorisation d'accéder aux données d'un utilisateur. Le paramètre `scope` peut être transmis avec l'appel de fonction `FB.login()`. Ce paramètre facultatif est une liste d'autorisations, séparées par une virgule, qu'un utilisateur doit confirmer pour permettre à votre page web d'accéder à ses données. Facebook Login exige des utilisateur·ices externes l'autorisation `public_profile` avancée.

#### Exemple d'appel

Cet exemple demande à l'utilisateur qui se connecte si votre page web peut avoir l'autorisation d'accéder à son profil public et à son adresse e-mail.

```javascript
FB.login(function(response) {
  // handle the response
}, {scope: 'public_profile,email'});
```

### Gérer la réponse de la boîte de dialogue Login

Qu'il s'agisse d'une connexion ou d'une annulation, la réponse renvoie un objet `authResponse` vers le rappel spécifié lorsque vous appelez `FB.login()`. Cette réponse peut être détectée et gérée dans l'appel `FB.login()`.

#### Exemple d'appel

```javascript
FB.login(function(response) {
  if (response.status === 'connected') {
    // Logged into your webpage and Facebook.
  } else {
    // The person is not logged into your webpage or we are unable to tell. 
  }
});
```

## 4. Déconnecter un utilisateur ou une utilisatrice

Pour déconnecter un utilisateur ou une utilisatrice de votre page web, reliez la fonction `FB.logout()` du SDK JavaScript à un bouton ou à un lien.

### Exemple d'appel

```javascript
FB.logout(function(response) {
   // Person is now logged out
});
```

**Remarque** : cet appel de fonction peut également déconnecter la personne de Facebook.

### Scénarios à prendre en compte

1. Un utilisateur ou une utilisatrice se connecte à Facebook, puis se connecte à votre page web. Lorsqu'il se déconnecte de votre application, il est toujours connecté à Facebook.
2. Un utilisateur ou une utilisatrice se connecte à votre page web et à Facebook par l'intermédiaire du processus de connexion de votre application. Lorsqu'il se déconnecte de votre application, il est également déconnecté de Facebook.
3. Un utilisateur ou une utilisatrice se connecte à une autre page web et à Facebook par l'intermédiaire du processus de connexion de l'autre page web, puis se connecte à votre page web. Lorsqu'il se déconnecte de l'une ou l'autre des pages web, il est déconnecté de Facebook.

De plus, le fait de se déconnecter de votre page web ne révoque pas les autorisations que l'utilisateur a accordées à celle-ci pendant la connexion. La révocation d'autorisations doit être effectuée séparément. Créez votre page web de telle sorte qu'un utilisateur qui s'est déconnecté ne verra pas la boîte de dialogue Login lorsqu'il se reconnectera.

## Exemple de code complet

Ce code charge et initialise le SDK JavaScript dans votre page HTML. Remplacez `{app-id}` par votre ID d'app, et `{api-version}` par la version de l'API Graph à utiliser. Spécifiez la version la plus récente, à moins d'avoir une raison particulière d'utiliser une version plus ancienne : `v24.0`.

```html
<!DOCTYPE html>
<html>
<head>
<title>Facebook Login JavaScript Example</title>
<meta charset="UTF-8">
</head>
<body>
<script>
  function statusChangeCallback(response) {  // Called with the results from FB.getLoginStatus().
    console.log('statusChangeCallback');
    console.log(response);                   // The current login status of the person.
    if (response.status === 'connected') {   // Logged into your webpage and Facebook.
      testAPI();  
    } else {                                 // Not logged into your webpage or we are unable to tell.
      document.getElementById('status').innerHTML = 'Please log ' +
        'into this webpage.';
    }
  }

  function checkLoginState() {               // Called when a person is finished with the Login Button.
    FB.getLoginStatus(function(response) {   // See the onlogin handler
      statusChangeCallback(response);
    });
  }

  window.fbAsyncInit = function() {
    FB.init({
      appId      : '{app-id}',
      cookie     : true,                     // Enable cookies to allow the server to access the session.
      xfbml      : true,                     // Parse social plugins on this webpage.
      version    : '{api-version}'           // Use this Graph API version for this call.
    });

    FB.getLoginStatus(function(response) {   // Called after the JS SDK has been initialized.
      statusChangeCallback(response);        // Returns the login status.
    });
  };
 
  function testAPI() {                      // Testing Graph API after login.  See statusChangeCallback() for when this call is made.
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
      console.log('Successful login for: ' + response.name);
      document.getElementById('status').innerHTML =
        'Thanks for logging in, ' + response.name + '!';
    });
  }
</script>

<!-- The JS SDK Login Button -->
<fb:login-button scope="public_profile,email" onlogin="checkLoginState();">
</fb:login-button>

<div id="status">
</div>

<!-- Load the JS SDK asynchronously -->
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>
</body>
</html>
```

## Implémentation dans Next.js

Dans ce projet, l'implémentation Facebook Login est répartie entre deux fichiers principaux :

### 1. `components/FacebookSDK.tsx`

Ce composant charge et initialise le SDK Facebook :

- Charge le script SDK de manière asynchrone
- Initialise le SDK avec l'App ID et la version de l'API Graph
- Configure les callbacks pour gérer les changements d'état de connexion
- Vérifie automatiquement l'état de connexion au chargement

### 2. `app/signIn/page.tsx`

Cette page gère l'interface utilisateur et l'authentification :

- Affiche le bouton de connexion Facebook
- Gère le clic sur le bouton avec `handleFacebookLogin()`
- Appelle `FB.login()` pour ouvrir la boîte de dialogue de connexion
- Envoie le token d'accès au backend pour authentification
- Gère les erreurs et les redirections

### Utilisation

1. Assurez-vous que `NEXT_PUBLIC_FACEBOOK_APP_ID` est défini dans vos variables d'environnement
2. Le composant `FacebookSDK` doit être inclus dans votre layout principal
3. Utilisez `handleFacebookLogin()` pour déclencher la connexion

## Ressources supplémentaires

- [Documentation sur le bouton Login](https://developers.facebook.com/docs/facebook-login/web/login-button)
- [Référence de FB.login()](https://developers.facebook.com/docs/reference/javascript/FB.login)
- [Référence de FB.getLoginStatus()](https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus)
- [Référence du SDK JavaScript](https://developers.facebook.com/docs/javascript)
- [Guide : Activer le SDK JavaScript Facebook](./GUIDE_ACTIVER_FACEBOOK_JSSDK.md)
- [Guide : Restrictions IP SDK](./GUIDE_RESTRICTIONS_IP_SDK.md)

## Checklist de configuration

- [ ] Application Facebook créée sur developers.facebook.com
- [ ] Produit "Facebook Login" ajouté et configuré
- [ ] Option "Se connecter avec le SDK JavaScript" activée
- [ ] Domaines de l'application configurés
- [ ] URL du site configurée
- [ ] URIs de redirection OAuth configurées
- [ ] Domaines autorisés pour le SDK Javascript configurés
- [ ] App ID copié dans `.env.local` comme `NEXT_PUBLIC_FACEBOOK_APP_ID`
- [ ] Version de l'API Graph spécifiée (v24.0 recommandé)
- [ ] Serveur redémarré après modification de `.env.local`
- [ ] Test de connexion Facebook réussi

