import type { CertificationLevel } from '../../config/certifications'
import type { CertificationCopy } from '../../i18n/certificationTranslations'

interface CertificationCardProps {
  certification: CertificationLevel
  copy: CertificationCopy
  selected: boolean
  onSelect: (certificationId: string) => void
}

export function CertificationCard({
  certification,
  copy,
  selected,
  onSelect,
}: CertificationCardProps) {
  const depthLabel = certification.maxDepthM
    ? copy.ui.metres.replace('{depth}', String(certification.maxDepthM))
    : copy.rules[certification.depthRuleType]

  return (
    <button
      type="button"
      className={`certification-card ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(certification.id)}
    >
      <span className="certification-card__main">
        <strong>{certification.name}</strong>
        <small>{copy.categories[certification.category]}</small>
      </span>
      <span className="certification-card__meta">
        <span className={`rule-badge rule-badge--${certification.depthRuleType}`}>
          {copy.rules[certification.depthRuleType]}
        </span>
        <b>{depthLabel}</b>
      </span>
      <span className="visually-hidden">
        {selected ? copy.ui.selected : copy.ui.select}
      </span>
    </button>
  )
}
