# Guide des ressources 3D

Ce document décrit la chaîne de production à suivre pour ajouter un modèle ou
une texture au projet. L'objet actuel, NOVA CORE, est entièrement procédural :
tant qu'aucune ressource externe n'est ajoutée, le site fonctionne hors ligne et
ne dépend d'aucun service tiers. Ce guide sert donc à préparer l'étape suivante
sans casser cette propriété.

---

## 1. Où placer les fichiers

| Type                         | Emplacement            | Traité par Vite           | Remarque                             |
| ---------------------------- | ---------------------- | ------------------------- | ------------------------------------ |
| Modèle utilisé par le code   | `src/assets/models/`   | oui (empreinte + hachage) | à importer avec `?url`               |
| Texture utilisée par le code | `src/assets/textures/` | oui                       | idem                                 |
| Image d'interface            | `src/assets/images/`   | oui                       | captures, visuels                    |
| Ressource à URL stable       | `public/`              | non, copiée telle quelle  | favicon, image Open Graph, manifeste |

En pratique : **tout ce qui est chargé par du code va dans `src/assets/`**. Vite
en gère alors le versionnage par empreinte, ce qui autorise un cache navigateur
d'un an sans risque de servir une version périmée.

```ts
import modelUrl from '../../assets/models/nova-core.glb?url'
```

---

## 2. Export depuis Blender

### 2.1 Préparer la scène

1. **Appliquer toutes les transformations.**
   `Objet ▸ Appliquer ▸ Toutes les transformations` (`Ctrl+A`).
   C'est l'erreur la plus fréquente : un objet exporté avec une échelle non
   appliquée arrive dans Three.js avec une taille et des normales incorrectes.

2. **Recentrer l'origine.**
   `Objet ▸ Définir l'origine ▸ Origine au centre de la géométrie`.
   L'objet doit tourner autour de son propre centre, sinon la caméra orbitale
   et les points d'intérêt seront décalés.

3. **Vérifier l'échelle réelle.**
   La scène du projet est calibrée en mètres, l'objet occupant un rayon utile
   d'environ **1,6 unité**, socle à `y = -1,85`. Un modèle exporté à une échelle
   différente devra être remis à l'échelle dans Blender, pas dans le code.

4. **Nettoyer la hiérarchie.**
   Supprimer les objets inutilisés, appliquer les modificateurs conservés,
   fusionner les maillages qui partagent un matériau (chaque matériau distinct
   coûte au moins un appel de dessin).

5. **Nommer les objets explicitement.**
   Les noms sont conservés dans le GLB et permettent de cibler une partie
   précise depuis React. Conserver la convention du projet :
   `NovaCore_Core`, `NovaCore_Shell`, `NovaCore_Rings`, `NovaCore_Emitters`,
   `NovaCore_Base`.

6. **Vérifier les normales.**
   `Maillage ▸ Normales ▸ Recalculer vers l'extérieur` (`Shift+N`). Des normales
   inversées produisent des faces noires en éclairage PBR.

7. **Déplier les UV** si des textures sont utilisées, sans chevauchement.

### 2.2 Réduire le nombre de polygones

| Usage                        | Budget conseillé           |
| ---------------------------- | -------------------------- |
| Objet principal, plein écran | 80 000 – 150 000 triangles |
| Objet secondaire             | 10 000 – 30 000 triangles  |
| Élément décoratif répété     | < 5 000 triangles          |

Méthodes, de la plus sûre à la plus agressive :

1. Modificateur **Decimate** en mode _Collapse_ (ratio 0,5 à 0,8), appliqué
   maillage par maillage.
2. Retopologie manuelle pour les silhouettes importantes.
3. Cuisson des détails fins dans une **normal map** plutôt que de les modéliser.

Contrôler le résultat dans les statistiques de la vue 3D
(`Vue ▸ Superposition ▸ Statistiques`).

### 2.3 Matériaux PBR

- N'utiliser que le nœud **Principled BSDF** : c'est le seul traduit fidèlement
  au format glTF.
- Canaux exportés : _Base Color_, _Metallic_, _Roughness_, _Normal_,
  _Emission_, _Alpha_, _Occlusion_.
- Regrouper _Occlusion_, _Roughness_ et _Metallic_ dans un seul fichier ORM
  (canaux R, G, B) : trois textures deviennent une.
- Éviter les nœuds procéduraux (Noise, Voronoi, Musgrave…) : ils ne sont pas
  exportés. Les cuire en texture au préalable.
- Le nombre de matériaux distincts détermine directement le nombre d'appels de
  dessin : viser moins de dix pour un objet principal.

### 2.4 Exporter

`Fichier ▸ Exporter ▸ glTF 2.0 (.glb/.gltf)`

| Réglage                    | Valeur                  | Raison                                       |
| -------------------------- | ----------------------- | -------------------------------------------- |
| Format                     | **glTF binaire (.glb)** | Un seul fichier, pas de requête annexe       |
| Include                    | _Selected Objects_      | Évite d'embarquer caméras et lampes inutiles |
| Transform ▸ +Y Up          | activé                  | Convention de Three.js                       |
| Geometry ▸ Apply Modifiers | activé                  | Fige les modificateurs                       |
| Geometry ▸ UVs, Normals    | activés                 | Requis par les matériaux PBR                 |
| Geometry ▸ Tangents        | activé si normal maps   | Sinon calculés à l'exécution                 |
| Compression ▸ Draco        | activé                  | Réduit la géométrie de 70 à 90 %             |
| Animation                  | seulement si nécessaire | Chaque piste alourdit le fichier             |

---

## 3. Compression

### 3.1 Géométrie — Draco ou Meshopt

|                     | Draco                                 | Meshopt                           |
| ------------------- | ------------------------------------- | --------------------------------- |
| Taux de compression | très élevé                            | élevé                             |
| Décodage            | plus lent, nécessite un décodeur WASM | très rapide                       |
| Recommandé pour     | modèles statiques volumineux          | modèles animés, chargement rapide |

Avec Draco, `useGLTF` de Drei charge le décodeur depuis un CDN par défaut. Pour
rester **hors ligne**, copier le décodeur dans `public/draco/` et le déclarer :

```bash
cp node_modules/three/examples/jsm/libs/draco/gltf/* public/draco/
```

```tsx
useGLTF(modelUrl, '/draco/')
```

Avec Meshopt, aucun fichier externe n'est requis : le décodeur est embarqué dans
le bundle.

### 3.2 Textures — KTX2 / Basis Universal

Le format KTX2 est **compressé côté GPU** : contrairement à un JPEG ou un WebP,
il reste compressé en mémoire vidéo, divisant l'empreinte VRAM par quatre à huit.

```bash
npx @gltf-transform/cli optimize entree.glb sortie.glb \
  --texture-compress ktx2 \
  --compress draco
```

Le transcodeur Basis doit lui aussi être servi localement pour rester hors ligne :

```bash
cp node_modules/three/examples/jsm/libs/basis/* public/basis/
```

### 3.3 Dimensions de textures recommandées

| Usage                              | Taille                       | Format                                           |
| ---------------------------------- | ---------------------------- | ------------------------------------------------ |
| Base color d'un objet principal    | 2048 × 2048                  | KTX2 (UASTC)                                     |
| Base color d'un objet secondaire   | 1024 × 1024                  | KTX2 (ETC1S)                                     |
| Normal map                         | 1024 – 2048                  | KTX2 (UASTC — l'ETC1S dégrade trop les normales) |
| ORM (occlusion/roughness/metallic) | 1024                         | KTX2 (ETC1S)                                     |
| Émission                           | 512 – 1024                   | KTX2 (ETC1S)                                     |
| Carte d'environnement HDR          | 1024 × 512 équirectangulaire | HDR ou EXR                                       |

Toujours des **puissances de deux** : c'est la condition du mipmapping, sans
lequel les textures scintillent en mouvement.

Sur mobile, prévoir une variante réduite de moitié et la sélectionner à partir du
niveau de qualité (`QUALITY_PRESETS` dans `src/utils/quality.ts`).

---

## 4. Chargement dans le projet

### 4.1 Chargement différé

La couche 3D entière est déjà importée dynamiquement dans
`src/pages/HomePage.tsx` : Three.js n'est téléchargé qu'après une détection
positive de WebGL. Un modèle importé depuis un composant du dossier
`components/canvas/` hérite automatiquement de ce comportement.

### 4.2 Préchargement contrôlé

```tsx
import { useGLTF } from '@react-three/drei'
import modelUrl from '../../assets/models/nova-core.glb?url'

export function NovaCoreModel() {
  const { scene } = useGLTF(modelUrl)
  return <primitive object={scene} />
}

// Démarre le téléchargement dès l'évaluation du module, sans bloquer le rendu.
useGLTF.preload(modelUrl)
```

Le préchargement doit rester ciblé : précharger cinq modèles annule le bénéfice
du chargement différé.

### 4.3 Progression réelle

`src/components/canvas/LoadingReporter.tsx` est déjà branché sur le gestionnaire
de chargement de Three.js. Dès qu'une ressource externe est ajoutée, l'écran de
chargement affiche sa progression réelle sans modification supplémentaire.

### 4.4 Libération des ressources

Les objets créés à la main (géométries, matériaux, textures) doivent être
libérés au démontage — le modèle est visible dans `NovaCore.tsx` :

```tsx
useEffect(
  () => () => {
    Object.values(geometries).forEach((geometry) => geometry.dispose())
  },
  [geometries]
)
```

`useGLTF` gère son propre cache ; utiliser `useGLTF.clear(url)` pour l'invalider
si un modèle est remplacé à l'exécution.

---

## 5. Contrôle qualité avant intégration

```bash
# Inspecter le contenu d'un GLB (maillages, matériaux, textures, poids)
npx @gltf-transform/cli inspect modele.glb

# Valider la conformité au format
npx gltf-validator modele.glb
```

Objectifs à viser pour un objet principal :

- **Poids du fichier** : moins de 3 Mo après compression.
- **Appels de dessin** : moins de 30 pour l'ensemble de la scène.
- **Triangles** : moins de 150 000.
- **Textures** : moins de 8 fichiers, aucun au-delà de 2048 px.

---

## 6. Licences — point non négociable

Toute ressource ajoutée au dépôt doit être **soit créée localement, soit
explicitement libre de droits**, et sa provenance documentée dans le tableau
ci-dessous.

| Fichier               | Auteur / source     | Licence                | Ajouté le  |
| --------------------- | ------------------- | ---------------------- | ---------- |
| `public/favicon.svg`  | Créé pour ce projet | MIT (licence du dépôt) | 2026-08-17 |
| `public/og-image.png` | Créé pour ce projet | MIT (licence du dépôt) | 2026-08-17 |

### Sources de ressources libres fiables

| Source                                                                           | Licence typique                       | Attribution             |
| -------------------------------------------------------------------------------- | ------------------------------------- | ----------------------- |
| [Poly Haven](https://polyhaven.com/)                                             | CC0                                   | non requise             |
| [ambientCG](https://ambientcg.com/)                                              | CC0                                   | non requise             |
| [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) | variable, indiquée par modèle         | selon le modèle         |
| [Sketchfab](https://sketchfab.com/)                                              | variable — **vérifier chaque modèle** | souvent requise (CC-BY) |

### Points de vigilance

- Une licence **CC-BY** impose de citer l'auteur, y compris dans un projet
  commercial : ajouter la mention dans le tableau ci-dessus **et** dans la
  section « Crédits et licences » du `README.md`.
- Une licence **NonCommercial (NC)** interdit tout usage commercial, même
  indirect (site vitrine d'entreprise inclus).
- Les modèles de marques réelles (voitures, appareils, logos) sont presque
  toujours protégés indépendamment de la licence du fichier 3D.
- **Aucun secret, identifiant ou clé d'API ne doit figurer dans le dépôt**, y
  compris dans les métadonnées d'un fichier 3D.

---

## 7. Rester hors ligne

Le projet ne doit dépendre d'aucun service externe à l'exécution. Si une
ressource ou un décodeur provient d'un CDN, en copier une version locale dans
`public/` et pointer explicitement dessus. Cela vaut pour :

- le décodeur Draco (`public/draco/`) ;
- le transcodeur Basis / KTX2 (`public/basis/`) ;
- les cartes d'environnement HDRI (le projet en génère une localement avec des
  `Lightformer`, précisément pour éviter un téléchargement) ;
- les polices (le projet n'utilise que des polices système).
