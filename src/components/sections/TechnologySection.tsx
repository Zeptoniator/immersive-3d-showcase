import { Cpu, Layers, Zap } from 'lucide-react'
import type { Feature } from '../../types'
import { FEATURES } from '../../utils/content'

const ICONS = {
  zap: Zap,
  layers: Layers,
  cpu: Cpu,
} as const

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = ICONS[feature.icon]
  return (
    <article className="panel" data-reveal data-testid={`feature-${feature.id}`}>
      <span className="panel__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <h3 className="panel__title">{feature.title}</h3>
      <p className="panel__text">{feature.description}</p>
    </article>
  )
}

/**
 * Section Technologie.
 *
 * La section est délibérément haute (`min-height: 220svh`) : elle sert de piste
 * de défilement à la vue éclatée de l'objet, tandis que le texte reste collé
 * en haut de l'écran pour rester lisible pendant l'animation.
 */
export function TechnologySection() {
  return (
    <section id="technology" className="section technology" aria-labelledby="technology-title">
      <div className="section__inner technology__sticky">
        <p className="section-eyebrow" data-reveal>
          Technologie
        </p>
        <h2 className="section-title" id="technology-title" data-reveal>
          Trois principes, une seule boucle de rendu
        </h2>
        <p className="section-lead" data-reveal>
          Pendant que vous faites défiler cette section, la caméra contourne l&apos;objet et les six
          panneaux de la coque s&apos;écartent pour révéler la structure interne. Remontez : le
          mouvement s&apos;inverse exactement.
        </p>

        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
