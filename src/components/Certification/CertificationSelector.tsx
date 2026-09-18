import {
  getPrimaryCertifications,
  type CertificationAgency,
} from '../../config/certifications'
import type { CertificationCopy } from '../../i18n/certificationTranslations'

interface CertificationSelectorProps {
  agency: CertificationAgency
  selectedCertificationId: string
  copy: CertificationCopy
  onSelect: (certificationId: string) => void
}

export function CertificationSelector({
  agency,
  selectedCertificationId,
  copy,
  onSelect,
}: CertificationSelectorProps) {
  const primaryCertifications = getPrimaryCertifications(agency)

  return (
    <div className="certification-selector">
      <label className="profile-field">
        <span>{copy.ui.primaryCertification}</span>
        <select
          value={selectedCertificationId}
          onChange={(event) => onSelect(event.target.value)}
        >
          {primaryCertifications.map((certification) => (
            <option key={certification.id} value={certification.id}>
              {certification.name}
            </option>
          ))}
        </select>
        <small>{copy.ui.primaryCertificationHint}</small>
      </label>
    </div>
  )
}
