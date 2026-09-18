import {
  DEFAULT_CERTIFICATION_BY_AGENCY,
  getCertificationById,
  type CertificationAgency,
} from '../../config/certifications'
import { certificationTranslations } from '../../i18n/certificationTranslations'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  getAllowedPreviousQualifications,
  getAvailableAdditionalQualifications,
  type DiverProfile as DiverProfileValue,
} from '../../utils/certification'
import { AgencySelector } from './AgencySelector'
import { CertificationDetails } from './CertificationDetails'
import { CertificationSelector } from './CertificationSelector'

interface DiverProfileProps {
  profile: DiverProfileValue
  effectiveDepthLimit: number | null
  matchingSiteCount: number
  totalSiteCount: number
  onChange: (profile: DiverProfileValue) => void
}

export function DiverProfile({
  profile,
  effectiveDepthLimit,
  matchingSiteCount,
  totalSiteCount,
  onChange,
}: DiverProfileProps) {
  const { language } = useLanguage()
  const copy = certificationTranslations[language]
  const certification = getCertificationById(profile.certificationId)
  const previousOptions = getAllowedPreviousQualifications(
    profile.certificationId,
  )
  const additionalOptions = getAvailableAdditionalQualifications(profile)
  const previousQualification = profile.previousQualificationId
    ? getCertificationById(profile.previousQualificationId)
    : undefined
  const additionalQualification = profile.additionalQualificationId
    ? getCertificationById(profile.additionalQualificationId)
    : undefined
  const ageRelevantCertification = certification?.isJunior
    ? certification
    : previousQualification?.isJunior
      ? previousQualification
      : undefined
  const ageGroups = Object.keys(
    ageRelevantCertification?.ageDepthLimits ?? {},
  ) as NonNullable<DiverProfileValue['juniorAgeGroup']>[]
  const conditionRelevantCertification = [certification, previousQualification]
    .filter((item) => item !== undefined)
    .find(
      (item) =>
        item.conditionsKey === 'ssi-advanced-adventurer' ||
        item.conditionsKey === 'ssi-junior-advanced-adventurer',
    )

  const selectAgency = (agency: CertificationAgency) => {
    onChange({
      agency,
      certificationId: DEFAULT_CERTIFICATION_BY_AGENCY[agency],
    })
  }

  const selectCertification = (certificationId: string) => {
    const nextCertification = getCertificationById(certificationId)
    const nextPreviousOptions = getAllowedPreviousQualifications(certificationId)
    const nextPrevious = nextPreviousOptions[0]
    const ageRelevant = nextCertification?.isJunior
      ? nextCertification
      : nextPrevious?.isJunior
        ? nextPrevious
        : undefined
    const nextAgeGroup = Object.keys(ageRelevant?.ageDepthLimits ?? {})[0] as
      | DiverProfileValue['juniorAgeGroup']
      | undefined
    onChange({
      agency: profile.agency,
      certificationId,
      previousQualificationId: nextPrevious?.id,
      additionalQualificationId: undefined,
      juniorAgeGroup: nextAgeGroup,
      conditionalConfirmed: false,
    })
  }

  if (!certification) return null

  const matchingText = copy.ui.matchingSites
    .replace('{matching}', String(matchingSiteCount))
    .replace('{total}', String(totalSiteCount))

  return (
    <section className="diver-profile" aria-labelledby="certification-title">
      <header className="diver-profile__heading">
        <p className="eyebrow">{copy.ui.agency}</p>
        <h2 id="certification-title">{copy.ui.title}</h2>
        <p>{copy.ui.subtitle}</p>
      </header>

      <AgencySelector
        selectedAgency={profile.agency}
        copy={copy}
        onSelect={selectAgency}
      />

      <div className="profile-field-heading">{copy.ui.certification}</div>
      <CertificationSelector
        agency={profile.agency}
        selectedCertificationId={profile.certificationId}
        copy={copy}
        onSelect={selectCertification}
      />

      {previousOptions.length > 0 && (
        <label className="profile-field">
          <span>{copy.ui.previousQualification}</span>
          <select
            value={profile.previousQualificationId ?? ''}
            onChange={(event) => {
              const nextPrevious = getCertificationById(event.target.value)
              const nextAgeGroup = Object.keys(
                nextPrevious?.ageDepthLimits ?? {},
              )[0] as DiverProfileValue['juniorAgeGroup'] | undefined
              onChange({
                ...profile,
                previousQualificationId: event.target.value,
                juniorAgeGroup: nextAgeGroup,
                conditionalConfirmed: false,
              })
            }}
          >
            {previousOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <small>{copy.ui.previousQualificationHint}</small>
        </label>
      )}

      {ageRelevantCertification && (
        <label className="profile-field">
          <span>{copy.ui.age}</span>
          <select
            value={profile.juniorAgeGroup ?? ageGroups[0]}
            onChange={(event) =>
              onChange({
                ...profile,
                juniorAgeGroup: event.target
                  .value as DiverProfileValue['juniorAgeGroup'],
              })
            }
          >
            {ageGroups.map((ageGroup) => (
              <option key={ageGroup} value={ageGroup}>
                {copy.ui[`age${ageGroup.replace('-', 'to').replace('+', 'plus')}`]}
              </option>
            ))}
          </select>
          <small>{copy.ui.ageDependent}</small>
        </label>
      )}

      {conditionRelevantCertification && (
        <label className="profile-check profile-check--condition">
          <input
            type="checkbox"
            checked={profile.conditionalConfirmed ?? false}
            onChange={(event) =>
              onChange({
                ...profile,
                conditionalConfirmed: event.target.checked,
              })
            }
          />
          <span>{copy.ui.confirmDepthTraining}</span>
        </label>
      )}

      {additionalOptions.length > 0 && (
        <div className="additional-qualification">
          <label className="profile-check">
            <input
              type="checkbox"
              checked={profile.additionalQualificationId !== undefined}
              onChange={(event) =>
                onChange({
                  ...profile,
                  additionalQualificationId: event.target.checked
                    ? additionalOptions[0]?.id
                    : undefined,
                })
              }
            />
            <span>
              {copy.ui.additionalQualificationQuestion.replace(
                '{qualification}',
                additionalOptions[0].name,
              )}
            </span>
          </label>
          {profile.additionalQualificationId !== undefined &&
            additionalOptions.length > 1 && (
            <label className="profile-field profile-field--compact">
              <span>{copy.ui.additionalDepthTraining}</span>
              <select
                value={profile.additionalQualificationId}
                onChange={(event) =>
                  onChange({
                    ...profile,
                    additionalQualificationId: event.target.value,
                  })
                }
              >
                {additionalOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.maxDepthM ? ` · ${item.maxDepthM} m` : ''}
                  </option>
                ))}
              </select>
              <small>{copy.ui.additionalQualificationHint}</small>
            </label>
          )}
        </div>
      )}

      <CertificationDetails
        certification={certification}
        previousQualification={previousQualification}
        additionalQualification={additionalQualification}
        effectiveDepthLimit={effectiveDepthLimit}
        matchingText={matchingText}
        copy={copy}
      />

      <p className="certification-disclaimer">
        {copy.ui.certificationDisclaimer}
      </p>
    </section>
  )
}
