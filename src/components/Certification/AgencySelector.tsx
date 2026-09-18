import {
  AGENCIES,
  type CertificationAgency,
} from '../../config/certifications'
import type { CertificationCopy } from '../../i18n/certificationTranslations'

interface AgencySelectorProps {
  selectedAgency: CertificationAgency
  copy: CertificationCopy
  onSelect: (agency: CertificationAgency) => void
}

export function AgencySelector({
  selectedAgency,
  copy,
  onSelect,
}: AgencySelectorProps) {
  return (
    <section className="agency-selector" aria-label={copy.ui.agency}>
      {AGENCIES.map((agency) => (
        <button
          key={agency}
          type="button"
          className={`agency-card agency-card--${agency.toLowerCase()} ${
            selectedAgency === agency ? 'is-selected' : ''
          }`}
          aria-pressed={selectedAgency === agency}
          onClick={() => onSelect(agency)}
        >
          <span className="agency-card__badge">{agency}</span>
          <span className="agency-card__copy">
            <strong>{agency}</strong>
            <small>{copy.agencies[agency]}</small>
          </span>
        </button>
      ))}
    </section>
  )
}
