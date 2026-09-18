import type { CertificationLevel } from '../../config/certifications'
import type { CertificationCopy } from '../../i18n/certificationTranslations'

interface CertificationDetailsProps {
  certification: CertificationLevel
  previousQualification?: CertificationLevel
  additionalQualification?: CertificationLevel
  effectiveDepthLimit: number | null
  matchingText: string
  copy: CertificationCopy
}

export function CertificationDetails({
  certification,
  previousQualification,
  additionalQualification,
  effectiveDepthLimit,
  matchingText,
  copy,
}: CertificationDetailsProps) {
  const description = copy.descriptions[certification.descriptionKey]
  const condition = certification.conditionsKey
    ? copy.conditions[certification.conditionsKey]
    : undefined

  return (
    <article className={`certification-details agency-theme--${certification.agency.toLowerCase()}`}>
      <header>
        <span className="certification-details__agency">
          {certification.agency}
        </span>
        <div>
          <small>{copy.ui.selectedCertification}</small>
          <h3>{certification.name}</h3>
        </div>
      </header>

      <dl className="certification-summary">
        <div>
          <dt>{copy.ui.selectedCertification}</dt>
          <dd>{certification.agency} {certification.name}</dd>
        </div>
        {previousQualification && (
          <div>
            <dt>{copy.ui.previousQualification}</dt>
            <dd>{previousQualification.name}</dd>
          </div>
        )}
        {additionalQualification && (
          <div>
            <dt>{copy.ui.additionalQualification}</dt>
            <dd>{additionalQualification.name}</dd>
          </div>
        )}
        <div className="certification-summary__depth">
          <dt>{copy.ui.planningDepthLimit}</dt>
          <dd>
            {effectiveDepthLimit === null
              ? copy.ui.noPlanningDepth
              : copy.ui.metres.replace(
                  '{depth}',
                  String(effectiveDepthLimit),
                )}
          </dd>
          <small>{matchingText}</small>
        </div>
      </dl>

      {condition && (
        <div className="certification-condition">
          <strong>{copy.ui.important}</strong>
          <p>{condition}</p>
        </div>
      )}

      <details className="certification-about">
        <summary>{copy.ui.aboutCertification}</summary>
        <p className="certification-details__description">{description}</p>
        {certification.officialSourceUrl && (
          <a
            className="certification-source"
            href={certification.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.ui.officialSource}
          </a>
        )}
      </details>
    </article>
  )
}
