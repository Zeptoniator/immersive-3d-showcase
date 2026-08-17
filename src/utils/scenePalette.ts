import * as THREE from 'three'
import type { Theme } from './theme'

/**
 * Palette de la scène 3D, par thème.
 *
 * Pendant CSS de `styles/tokens.css` : aucun composant de la scène ne code une
 * couleur en dur, tout passe par ici.
 *
 * Le point qui rend un mode clair non trivial en WebGL est le **mode de
 * fusion**. En thème sombre, les halos, le champ de particules et les cercles
 * du socle utilisent `AdditiveBlending` : chaque pixel ajoute de la lumière au
 * fond, ce qui produit la lueur. Sur un fond clair, ajouter de la lumière à du
 * quasi-blanc ne change rien — ces éléments deviennent purement et simplement
 * invisibles. Le thème clair repasse donc en fusion normale, avec des couleurs
 * sombres : ce n'est plus de la lumière ajoutée mais de l'encre déposée, ce qui
 * est exactement le registre de la « planche imprimée » côté interface.
 *
 * Les ombres portées, à l'inverse, sont beaucoup plus lisibles sur fond clair :
 * le socle y est plus opaque pour les recevoir franchement.
 */
export interface ScenePalette {
  /** Fusion additive (thème sombre) ou normale (thème clair). */
  additive: boolean

  /* --- Environnement ----------------------------------------------------- */
  fog: string
  fogDensity: number
  gridMajor: string
  gridMinor: string
  gridOpacity: number
  /** Intensité des `Lightformer` qui génèrent la carte d'environnement. */
  environmentIntensity: number
  environmentColor: string

  /* --- Éclairage ---------------------------------------------------------- */
  ambientColor: string
  ambientIntensity: number
  hemisphereSky: string
  hemisphereGround: string
  hemisphereIntensity: number
  keyLightColor: string
  /** Intensité de la lumière principale, du début à la fin du défilement. */
  keyLightRange: [number, number]
  cyanRimColor: string
  cyanRimRange: [number, number]
  violetRimColor: string
  violetRimRange: [number, number]
  coreLightIntensity: number

  /* --- NOVA CORE ---------------------------------------------------------- */
  coreColor: string
  coreEmissive: string
  coreEmissiveIntensity: number
  wireColor: string
  wireOpacity: number
  haloColor: string
  haloOpacity: number
  panelColor: string
  panelRoughness: number
  panelMetalness: number
  ringColor: string
  ringEmissive: string
  ringEmissiveIntensity: number
  emitterColor: string
  emitterGlowColor: string
  emitterGlowOpacity: number
  baseRingColor: string
  baseRingOpacity: number
  basePlateColor: string
  basePlateOpacity: number
  spokeColor: string
  spokeOpacity: number

  /* --- Particules --------------------------------------------------------- */
  particleNear: string
  particleFar: string
  particleOpacity: number
  particleSize: number
}

const DARK: ScenePalette = {
  additive: true,

  fog: '#04060e',
  fogDensity: 0.052,
  gridMajor: '#2f5bd0',
  gridMinor: '#16234a',
  gridOpacity: 0.35,
  environmentIntensity: 1,
  environmentColor: '#9fc6ff',

  ambientColor: '#5f7ec9',
  ambientIntensity: 0.35,
  hemisphereSky: '#4d7dff',
  hemisphereGround: '#050912',
  hemisphereIntensity: 0.55,
  keyLightColor: '#dce8ff',
  keyLightRange: [1.6, 3.1],
  cyanRimColor: '#35e0ff',
  cyanRimRange: [18, 42],
  violetRimColor: '#a855f7',
  violetRimRange: [12, 46],
  coreLightIntensity: 6,

  coreColor: '#0d1b3a',
  coreEmissive: '#35e0ff',
  coreEmissiveIntensity: 1.5,
  wireColor: '#7aa2ff',
  wireOpacity: 0.28,
  haloColor: '#35e0ff',
  haloOpacity: 0.13,
  panelColor: '#93a6cc',
  panelRoughness: 0.24,
  panelMetalness: 0.94,
  ringColor: '#cfe4ff',
  ringEmissive: '#3b73ff',
  ringEmissiveIntensity: 0.9,
  emitterColor: '#bff4ff',
  emitterGlowColor: '#a855f7',
  emitterGlowOpacity: 0.22,
  baseRingColor: '#35e0ff',
  baseRingOpacity: 0.35,
  basePlateColor: '#060b18',
  basePlateOpacity: 0.55,
  spokeColor: '#3b73ff',
  spokeOpacity: 0.28,

  particleNear: '#8ce9ff',
  particleFar: '#4a63d8',
  particleOpacity: 0.85,
  particleSize: 6.5,
}

const LIGHT: ScenePalette = {
  // Fusion normale : sur fond clair, l'additif ne produirait rien de visible.
  additive: false,

  fog: '#eef2f9',
  // Brouillard plus dense : il fond la grille dans le fond de page plus tôt,
  // ce qui évite un maillage bleu trop insistant sur du blanc.
  fogDensity: 0.06,
  gridMajor: '#6f86b8',
  gridMinor: '#aebbd4',
  gridOpacity: 0.4,
  // Un environnement plus clair et plus intense : les métaux doivent refléter
  // une pièce éclairée, pas un vide noir.
  environmentIntensity: 2.1,
  environmentColor: '#ffffff',

  ambientColor: '#c9d7f0',
  ambientIntensity: 1.15,
  hemisphereSky: '#ffffff',
  hemisphereGround: '#b9c6de',
  hemisphereIntensity: 1.1,
  keyLightColor: '#ffffff',
  keyLightRange: [2.1, 3.4],
  // Les liserés deviennent des touches de couleur mesurées : à pleine
  // puissance, ils délaveraient un objet déjà posé sur du clair.
  cyanRimColor: '#0b6b86',
  cyanRimRange: [8, 20],
  violetRimColor: '#7c3aed',
  violetRimRange: [6, 22],
  coreLightIntensity: 3,

  // L'objet s'assombrit pour se détacher du fond : c'est l'inverse exact du
  // thème sombre, où il devait s'éclairer.
  coreColor: '#0f3b4d',
  coreEmissive: '#0b6b86',
  coreEmissiveIntensity: 0.75,
  wireColor: '#1e3763',
  wireOpacity: 0.4,
  haloColor: '#7fa3c9',
  // En fusion normale, un halo est un disque plat et non une lueur : il doit
  // rester à la limite du perceptible pour suggérer le volume sans donner
  // l'impression d'une tache posée devant l'objet.
  haloOpacity: 0.05,
  panelColor: '#54658a',
  panelRoughness: 0.3,
  panelMetalness: 0.88,
  ringColor: '#3c5480',
  ringEmissive: '#2a54c8',
  ringEmissiveIntensity: 0.25,
  emitterColor: '#0b6b86',
  emitterGlowColor: '#7c3aed',
  emitterGlowOpacity: 0.09,
  baseRingColor: '#4a6fb8',
  baseRingOpacity: 0.5,
  // Socle plus opaque et plus clair : les ombres portées, bien plus lisibles
  // sur fond clair, deviennent ici un vrai élément de lecture du volume.
  basePlateColor: '#dbe3f1',
  basePlateOpacity: 0.85,
  spokeColor: '#5f7bb0',
  spokeOpacity: 0.4,

  particleNear: '#425a86',
  particleFar: '#8497bb',
  particleOpacity: 0.55,
  particleSize: 5,
}

/** Palette correspondant au thème demandé. */
export function scenePalette(theme: Theme): ScenePalette {
  return theme === 'light' ? LIGHT : DARK
}

/** Mode de fusion à utiliser pour les éléments lumineux, selon le thème. */
export function glowBlending(palette: ScenePalette): THREE.Blending {
  return palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending
}
