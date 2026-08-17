# NOVA CORE — application Android

Application de consultation du site NOVA CORE : une WebView plein écran, sans
barre d'adresse ni chrome de navigateur.

## Pourquoi une WebView plutôt qu'une TWA

Une _Trusted Web Activity_ aurait été le choix par défaut, mais elle exige un
fichier `assetlinks.json` servi à la **racine de l'origine**
(`https://zeptoniator.github.io/.well-known/assetlinks.json`). Le site étant
publié dans un sous-chemin GitHub Pages, cette racine n'est pas sous notre
contrôle : la TWA afficherait donc une barre d'adresse en permanence. La WebView
native donne le plein écran de façon fiable, et permet en prime de gérer
proprement le bouton Retour, la rotation et l'absence de réseau.

## Prérequis

- JDK 17
- SDK Android avec les plateformes 36 et les build-tools correspondants
- `ANDROID_HOME` renseigné (ou un fichier `local.properties` contenant
  `sdk.dir=/chemin/vers/Android/Sdk`)

## Compiler

```bash
cd android

# APK de débogage, signé avec la clé de débogage : installable immédiatement
./gradlew :app:assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk

# Installer sur un appareil branché en USB (débogage USB activé)
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Variante de production

La variante `release` n'est **pas signée** : aucune clé n'est versionnée dans ce
dépôt, et il ne faut jamais en committer une. Pour publier :

1. Créer un keystore (à conserver hors du dépôt, sauvegardé) :

   ```bash
   keytool -genkey -v -keystore ~/cles/nova-core.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias nova-core
   ```

2. Renseigner les identifiants dans `~/.gradle/gradle.properties` (fichier
   personnel, hors dépôt) :

   ```properties
   NOVA_STORE_FILE=/home/vous/cles/nova-core.jks
   NOVA_STORE_PASSWORD=…
   NOVA_KEY_ALIAS=nova-core
   NOVA_KEY_PASSWORD=…
   ```

3. Ajouter le bloc `signingConfigs` correspondant dans `app/build.gradle.kts`,
   puis `./gradlew :app:bundleRelease` pour produire un `.aab`.

## Configuration

L'URL consultée est définie une seule fois, dans `app/build.gradle.kts` :

```kotlin
buildConfigField("String", "SITE_URL", "\"https://zeptoniator.github.io/immersive-3d-showcase/\"")
buildConfigField("String", "SITE_HOST", "\"zeptoniator.github.io\"")
```

`SITE_HOST` détermine ce qui reste dans l'application : tout lien pointant
ailleurs s'ouvre dans le navigateur du système, pour que l'utilisateur voie
toujours l'origine réelle d'un site tiers.

## Thème clair et sombre

L'habillage natif suit le mode nuit du système, comme le fait le site.

| Surface                                             | Ressource                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Fond de fenêtre, écran de démarrage, écran d'erreur | `values/colors.xml` et `values-night/colors.xml`                                     |
| Contraste des icônes de barre système               | `android:windowLightStatusBar` dans `values/themes.xml` et `values-night/themes.xml` |
| Logo de démarrage                                   | `drawable/splash_logo.xml`, dont les couleurs sont des ressources                    |

L'icône de lanceur, elle, garde des couleurs fixes sur son fond sombre : une
icône d'application ne doit pas changer d'aspect selon le thème du téléphone.
C'est pourquoi `splash_logo.xml` est distinct de `ic_launcher_foreground.xml`.

Côté page, `WebSettingsCompat.setAlgorithmicDarkeningAllowed` fait suivre
`prefers-color-scheme` au mode nuit de l'application. Le site déclarant
`color-scheme: dark light`, Android utilise ses styles sombres plutôt que
d'inverser les couleurs de force, et un choix explicite fait depuis l'en-tête du
site continue de primer.

`configChanges` inclut `uiMode` pour ne pas détruire la WebView — donc le
contexte WebGL — quand le système bascule. En contrepartie, les vues déjà
gonflées gardent les couleurs résolues à leur création : `applyThemeColors()`
les repose à chaque changement de configuration.

## Débogage

La variante de débogage active deux facilités, absentes de la production :

- `WebView.setWebContentsDebuggingEnabled(true)` — la page est inspectable
  depuis `chrome://inspect` ou via le protocole DevTools ;
- `src/debug/res/xml/network_security_config_debug.xml` — le HTTP en clair est
  autorisé **uniquement** vers `127.0.0.1` et `localhost`, ce qui permet de
  tester un build local du site dans la WebView.

Servir un build local au téléphone :

```bash
# Sur la machine de développement
npm run build && npm run preview -- --port 4173
adb reverse tcp:4173 tcp:4173

# Puis, dans l'application, naviguer vers http://127.0.0.1:4173/
# (par exemple via le protocole DevTools)
adb forward tcp:9222 localabstract:$(adb shell "cat /proc/net/unix | grep -o 'webview_devtools_remote_[0-9]*'" | head -1)
```

Cette chaîne a servi à diagnostiquer deux défauts que l'inspection visuelle ne
permettait pas de trancher : un thème appliqué à l'envers et une qualité
graphique bloquée sur son niveau le plus bas. Les requêtes média d'une WebView
renvoient une valeur erronée au premier rendu puis se corrigent sans émettre
d'événement `change` — c'est mesurable ainsi, pas devinable.

## Comportement

| Situation                                 | Réponse de l'application                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| Pas de réseau au lancement                | Écran dédié « Aucune connexion » avec bouton Réessayer                         |
| Échec de chargement du document principal | Écran « Chargement impossible » avec bouton Réessayer                          |
| Ressource secondaire manquante            | Ignorée : la page reste affichée                                               |
| Bouton Retour                             | Remonte l'historique de la page, puis quitte                                   |
| Rotation d'écran                          | La WebView est conservée (`configChanges`) : le contexte WebGL n'est pas perdu |
| Passage en arrière-plan                   | Boucle de rendu et minuteries suspendues                                       |

WebGL fonctionne dans la WebView grâce à l'accélération matérielle déclarée dans
le manifeste. Si un appareil ne la supporte pas, le site bascule de lui-même sur
son repli HTML : l'application n'a rien de particulier à faire.

## Fonctionnement hors ligne (piste)

L'application consulte le site en ligne. Pour un usage hors connexion, deux
approches :

1. compiler le site avec `VITE_BASE_PATH=./` et copier `dist/` dans
   `app/src/main/assets/web/`, puis charger
   `file:///android_asset/web/index.html` en repli lorsque le réseau manque ;
2. ajouter un service worker au site, la WebView en bénéficierait
   automatiquement.

La première est plus prévisible, la seconde profite aussi aux visiteurs du site.
