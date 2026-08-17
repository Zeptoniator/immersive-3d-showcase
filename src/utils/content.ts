import type { Feature, Hotspot, PerformanceStat, SectionId } from '../types'

/** Nom du produit fictif présenté par la démonstration. */
export const PRODUCT_NAME = 'NOVA CORE'

/** Sections de la page, dans l'ordre d'apparition. Sert aussi à la navigation. */
export const SECTIONS: ReadonlyArray<{ id: SectionId; label: string }> = [
  { id: 'hero', label: 'Accueil' },
  { id: 'technology', label: 'Technologie' },
  { id: 'interactive', label: 'Exploration' },
  { id: 'performance', label: 'Performances' },
  { id: 'final', label: 'Contact' },
]

/** Les trois piliers technologiques mis en avant. */
export const FEATURES: ReadonlyArray<Feature> = [
  {
    id: 'adaptive-power',
    title: 'Puissance adaptative',
    description:
      "Le cœur module sa charge de calcul image par image. Lorsque la scène se complexifie, la densité de particules et la résolution de rendu s'ajustent avant que la fluidité ne se dégrade.",
    icon: 'zap',
  },
  {
    id: 'light-architecture',
    title: 'Architecture lumineuse',
    description:
      "Une coque en six segments s'ouvre pour révéler la structure interne. Chaque panneau porte son propre matériau physique, entre métal brossé et verre traité anti-reflet.",
    icon: 'layers',
  },
  {
    id: 'smart-control',
    title: 'Contrôle intelligent',
    description:
      'Souris, doigt ou clavier : les trois entrées pilotent la même caméra. Les gestes verticaux restent réservés au défilement de la page pour ne jamais piéger la navigation.',
    icon: 'cpu',
  },
]

/**
 * Points d'intérêt positionnés sur l'objet 3D.
 *
 * Les coordonnées sont exprimées dans l'espace local de NOVA CORE ; elles
 * restent valables si l'objet procédural est remplacé par un fichier GLB de
 * même échelle (rayon ≈ 1,6 unité).
 */
export const HOTSPOTS: ReadonlyArray<Hotspot> = [
  {
    id: 'core',
    label: 'Noyau',
    title: 'Noyau de synthèse',
    description:
      'Icosaèdre émissif au centre de la structure. Il diffuse la lumière principale de la scène et sert de repère visuel pendant les mouvements de caméra. Sa géométrie est simplifiée automatiquement en qualité faible.',
    position: [0, 0, 0],
    metric: 'Ø 1,1 unité',
  },
  {
    id: 'rings',
    label: 'Anneaux',
    title: 'Anneaux gyroscopiques',
    description:
      'Trois tores orientés sur des axes distincts tournent à des vitesses désynchronisées. Leur rotation est calculée à partir du delta temporel : elle reste identique à 30 comme à 144 images par seconde.',
    position: [1.55, 0.1, 0],
    metric: '3 axes indépendants',
  },
  {
    id: 'shell',
    label: 'Coque',
    title: 'Coque métallique segmentée',
    description:
      "Six panneaux disposés en couronne. Au défilement de la section Technologie, ils s'écartent progressivement du centre pour produire une vue éclatée, puis se referment lorsque l'on remonte.",
    position: [0, 1.35, 0.35],
    metric: '6 segments',
  },
  {
    id: 'emitters',
    label: 'Émetteurs',
    title: 'Émetteurs lumineux',
    description:
      'Quatre nœuds émissifs pulsent en décalage de phase. En qualité élevée, ils portent un halo additif qui simule un léger effet de floraison sans recourir à une passe de post-traitement supplémentaire.',
    position: [-1.1, -0.75, 0.9],
    metric: '4 nœuds',
  },
  {
    id: 'base',
    label: 'Socle',
    title: 'Socle holographique',
    description:
      "Disque de projection composé de cercles concentriques et d'une grille radiale. Il ancre visuellement l'objet et fournit la surface de réception des ombres lorsque celles-ci sont activées.",
    position: [0, -1.75, 0],
    metric: 'Ø 4,2 unités',
  },
]

/**
 * Indicateurs de la section Performances.
 *
 * Ce sont des repères techniques de la démonstration, pas des caractéristiques
 * commerciales : NOVA CORE est un produit fictif.
 */
export const PERFORMANCE_STATS: ReadonlyArray<PerformanceStat> = [
  {
    id: 'realtime',
    label: 'Rendu temps réel',
    value: '60 ips visés',
    detail:
      "Boucle de rendu à la demande, animations calculées au delta temporel et mise en pause automatique lorsque l'onglet passe en arrière-plan.",
  },
  {
    id: 'adaptive',
    label: 'Qualité adaptative',
    value: '3 niveaux',
    detail:
      "Élevée, moyenne et faible. Le niveau est déduit de la taille d\u0027écran, du ratio de pixels, du nombre de cœurs et de la fluidité réellement mesurée, avec possibilité de forcer un choix.",
  },
  {
    id: 'responsive',
    label: 'Expérience responsive',
    value: '320 → 2560 px',
    detail:
      'Mise en page fluide sur mobile portrait et paysage, tablette et grand écran, avec unités de viewport dynamiques et respect des zones sûres.',
  },
]

/** Fiche technique affichée dans la section finale. */
export const TECH_SPECS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Moteur de rendu', value: 'Three.js (WebGL2, repli WebGL1)' },
  { label: 'Couche React', value: 'React Three Fiber + Drei' },
  { label: 'Animations', value: 'GSAP + ScrollTrigger' },
  { label: 'État partagé', value: 'Zustand' },
  { label: 'Build', value: 'Vite + TypeScript strict' },
  { label: 'Tests', value: 'Vitest + Testing Library + Playwright' },
]
