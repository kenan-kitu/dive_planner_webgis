import {
  CERTIFICATION_CATALOG,
  getCertificationById,
  type CertificationAgeGroup,
  type CertificationAgency,
  type CertificationLevel,
} from '../config/certifications.ts'

export type JuniorAgeGroup = CertificationAgeGroup

export interface DiverProfile {
  agency: CertificationAgency
  certificationId: string
  previousQualificationId?: string
  additionalQualificationId?: string
  juniorAgeGroup?: JuniorAgeGroup
  conditionalConfirmed?: boolean
  customDepthM?: number
}

function validCustomDepth(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0 && value <= 100
}

function requiresTrainingConfirmation(certification: CertificationLevel) {
  return (
    certification.conditionsKey === 'ssi-advanced-adventurer' ||
    certification.conditionsKey === 'ssi-junior-advanced-adventurer'
  )
}

function directDepth(
  certification: CertificationLevel,
  profile: DiverProfile,
): number | null {
  if (certification.ageDepthLimits) {
    if (!profile.juniorAgeGroup) return null
    if (requiresTrainingConfirmation(certification) && !profile.conditionalConfirmed) {
      return null
    }
    return certification.ageDepthLimits[profile.juniorAgeGroup] ?? null
  }

  if (certification.depthRuleType === 'fixed') {
    return certification.maxDepthM ?? null
  }

  if (
    certification.depthRuleType === 'conditional' &&
    profile.conditionalConfirmed
  ) {
    return certification.maxDepthM ?? null
  }

  return null
}

export function getAllowedPreviousQualifications(
  certificationId: string,
): CertificationLevel[] {
  const certification = getCertificationById(certificationId)
  if (!certification?.allowedPreviousQualificationIds) return []

  return certification.allowedPreviousQualificationIds
    .map((id) => getCertificationById(id))
    .filter(
      (item): item is CertificationLevel =>
        item !== undefined && item.agency === certification.agency,
    )
}

export function getAvailableAdditionalQualifications(
  profile: DiverProfile,
): CertificationLevel[] {
  const certification = getCertificationById(profile.certificationId)
  if (
    !certification ||
    certification.agency !== profile.agency ||
    !certification.allowedAdditionalQualificationIds
  ) {
    return []
  }

  const allowedIds = new Set(certification.allowedAdditionalQualificationIds)
  return CERTIFICATION_CATALOG.filter(
    (item) =>
      item.agency === profile.agency &&
      allowedIds.has(item.id) &&
      item.affectsDepth === true &&
      item.prerequisiteIds?.includes(certification.id) === true,
  )
}

export function getDepthOptionsForCertification(profile: DiverProfile) {
  return {
    previousQualifications: getAllowedPreviousQualifications(
      profile.certificationId,
    ),
    additionalQualifications: getAvailableAdditionalQualifications(profile),
  }
}

export function getEffectiveDepthLimit(profile: DiverProfile): number | null {
  if (validCustomDepth(profile.customDepthM)) return profile.customDepthM

  const certification = getCertificationById(profile.certificationId)
  if (!certification || certification.agency !== profile.agency) return null

  let baseDepth: number | null = null

  if (certification.depthRuleType === 'inherited') {
    const allowedPrevious = getAllowedPreviousQualifications(certification.id)
    const previous = profile.previousQualificationId
      ? getCertificationById(profile.previousQualificationId)
      : undefined
    if (
      previous &&
      allowedPrevious.some((item) => item.id === previous.id)
    ) {
      baseDepth = directDepth(previous, profile)
    }
  } else {
    baseDepth = directDepth(certification, profile)
  }

  const availableAdditional = getAvailableAdditionalQualifications(profile)
  const additional = availableAdditional.find(
    (item) => item.id === profile.additionalQualificationId,
  )
  if (additional?.maxDepthM !== undefined) return additional.maxDepthM

  return baseDepth
}
