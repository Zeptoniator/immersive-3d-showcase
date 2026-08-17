/** Niveaux de qualité graphique proposés par l'expérience. */
export type QualityLevel = 'high' | 'medium' | 'low'

/** Choix de qualité de l'utilisateur : `auto` délègue la décision au moteur. */
export type QualityPreference = QualityLevel | 'auto'

/** Réglages concrets dérivés d'un niveau de qualité. */
export interface QualitySettings {
  /** Bornes du device pixel ratio confiées au renderer. */
  dpr: [number, number]
  /** Nombre de particules du champ d'étoiles. */
  particleCount: number
  /** Activation des ombres portées. */
  shadows: boolean
  /** Résolution de la shadow map (px). */
  shadowMapSize: number
  /** Subdivisions des géométries principales. */
  geometryDetail: number
  /** Halos additifs façon bloom (post-traitement léger, sans dépendance externe). */
  glow: boolean
  /** Anticrénelage matériel du contexte WebGL. */
  antialias: boolean
  /** Réflexions d'environnement (matériaux verre / métal). */
  environmentReflections: boolean
}

/** Identifiants des sections de la page, utilisés pour la navigation et l'ancrage. */
export type SectionId = 'hero' | 'technology' | 'interactive' | 'performance' | 'final'

/** Point d'intérêt cliquable sur l'objet 3D. */
export interface Hotspot {
  id: string
  /** Libellé court affiché sur le marqueur et dans la liste HTML. */
  label: string
  /** Titre de la fiche descriptive. */
  title: string
  /** Description textuelle (également utilisée comme équivalent accessible). */
  description: string
  /** Position du marqueur dans l'espace local de NOVA CORE. */
  position: [number, number, number]
  /** Caractéristique chiffrée illustrative (démonstration, valeur fictive). */
  metric: string
}

/** Caractéristique mise en avant dans la section Technologie. */
export interface Feature {
  id: string
  title: string
  description: string
  /** Nom de l'icône lucide-react associée. */
  icon: 'zap' | 'layers' | 'cpu'
}

/** Indicateur illustratif de la section Performances. */
export interface PerformanceStat {
  id: string
  label: string
  value: string
  detail: string
}
