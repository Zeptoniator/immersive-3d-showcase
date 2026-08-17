import { ChevronDown, Compass, Cpu } from 'lucide-react'
import { PRODUCT_NAME } from '../../utils/content'
import { WebGLFallback, WebGLNotice } from '../ui/WebGLFallback'

interface HeroSectionProps {
  /** `false` déclenche l'affichage de l'aperçu statique à la place de la 3D. */
  webglAvailable: boolean
  fallbackReason?: string
}

/**
 * Première vue : identité du produit, promesse, appels à l'action.
 *
 * Le texte est volontairement bref et cantonné à une colonne : l'objet 3D occupe
 * l'espace restant sans jamais passer sous un bloc de texte illisible.
 */
export function HeroSection({ webglAvailable, fallbackReason }: HeroSectionProps) {
  return (
    <section id="hero" className="section section--full hero" aria-labelledby="hero-title">
      <div className="section__inner">
        <div className="hero__inner">
          <p className="hero__wordmark" data-reveal>
            {PRODUCT_NAME} — série d&apos;étude 01
          </p>

          <h1 className="hero__title" id="hero-title" data-reveal>
            Une architecture
            <span className="hero__title-accent">qui se donne à voir.</span>
          </h1>

          <p className="hero__lead" data-reveal>
            {PRODUCT_NAME} est un objet de démonstration : une structure modulaire dont la coque
            s&apos;ouvre au fil du défilement pour exposer son noyau, ses anneaux gyroscopiques et
            ses émetteurs. Tout est rendu en temps réel dans votre navigateur.
          </p>

          {/* Équivalent textuel de la scène, référencé par le canvas via
              `aria-describedby`. Il reste disponible même sans WebGL. */}
          <p className="visually-hidden" id="scene-description">
            La scène 3D montre {PRODUCT_NAME} en lévitation au-dessus d&apos;un socle holographique
            : un noyau lumineux cyan entouré de trois anneaux métalliques en rotation, enveloppé
            d&apos;une coque de six panneaux métalliques qui s&apos;écartent progressivement, et de
            quatre émetteurs violets pulsants. Un champ de particules et une grille abstraite
            composent l&apos;arrière-plan. La description détaillée de chaque élément est disponible
            dans la section Exploration.
          </p>

          <div className="btn__group" data-reveal>
            <a className="btn btn--primary" href="#interactive">
              <Compass size={18} aria-hidden="true" />
              Explorer l&apos;expérience
            </a>
            <a className="btn btn--secondary" href="#technology">
              <Cpu size={18} aria-hidden="true" />
              Découvrir la technologie
            </a>
          </div>

          {webglAvailable ? (
            <p className="hero__scroll-cue" data-reveal>
              <ChevronDown size={16} aria-hidden="true" />
              Faites défiler pour ouvrir la coque
            </p>
          ) : (
            <WebGLNotice />
          )}
        </div>

        {!webglAvailable ? (
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <WebGLFallback reason={fallbackReason} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
