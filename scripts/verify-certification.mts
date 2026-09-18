import {
  getAllowedPreviousQualifications,
  getAvailableAdditionalQualifications,
  getEffectiveDepthLimit,
  type DiverProfile,
} from '../src/utils/certification.ts'

interface DepthScenario {
  name: string
  profile: DiverProfile
  expected: number | null
}

const depthScenarios: DepthScenario[] = [
  { name: 'CMAS One Star', profile: { agency: 'CMAS', certificationId: 'cmas-one-star' }, expected: 20 },
  { name: 'CMAS Two Star', profile: { agency: 'CMAS', certificationId: 'cmas-two-star' }, expected: 30 },
  { name: 'CMAS Three Star', profile: { agency: 'CMAS', certificationId: 'cmas-three-star' }, expected: 40 },
  { name: 'PADI Junior Open Water age 10-11', profile: { agency: 'PADI', certificationId: 'padi-junior-open-water', juniorAgeGroup: '10-11' }, expected: 12 },
  { name: 'PADI Junior Open Water age 12-14', profile: { agency: 'PADI', certificationId: 'padi-junior-open-water', juniorAgeGroup: '12-14' }, expected: 18 },
  { name: 'PADI Junior Advanced age 12-14', profile: { agency: 'PADI', certificationId: 'padi-junior-advanced-open-water', juniorAgeGroup: '12-14' }, expected: 21 },
  { name: 'PADI Open Water', profile: { agency: 'PADI', certificationId: 'padi-open-water' }, expected: 18 },
  { name: 'PADI Advanced Open Water', profile: { agency: 'PADI', certificationId: 'padi-advanced-open-water' }, expected: 30 },
  { name: 'PADI Advanced + Deep Diver', profile: { agency: 'PADI', certificationId: 'padi-advanced-open-water', additionalQualificationId: 'padi-deep-diver' }, expected: 40 },
  { name: 'PADI Rescue + previous Advanced', profile: { agency: 'PADI', certificationId: 'padi-rescue-diver', previousQualificationId: 'padi-advanced-open-water' }, expected: 30 },
  { name: 'PADI Rescue + previous Advanced + Deep', profile: { agency: 'PADI', certificationId: 'padi-rescue-diver', previousQualificationId: 'padi-advanced-open-water', additionalQualificationId: 'padi-deep-diver' }, expected: 40 },
  { name: 'Reject PADI Rescue + invalid previous Open Water', profile: { agency: 'PADI', certificationId: 'padi-rescue-diver', previousQualificationId: 'padi-open-water' }, expected: null },
  { name: 'SSI Scuba Diver', profile: { agency: 'SSI', certificationId: 'ssi-scuba-diver' }, expected: 12 },
  { name: 'SSI Open Water', profile: { agency: 'SSI', certificationId: 'ssi-open-water' }, expected: 18 },
  { name: 'SSI Junior Advanced without required dive', profile: { agency: 'SSI', certificationId: 'ssi-junior-advanced-adventurer', juniorAgeGroup: '12-14' }, expected: null },
  { name: 'SSI Junior Advanced with required dive', profile: { agency: 'SSI', certificationId: 'ssi-junior-advanced-adventurer', juniorAgeGroup: '12-14', conditionalConfirmed: true }, expected: 21 },
  { name: 'SSI Advanced Adventurer without required dive', profile: { agency: 'SSI', certificationId: 'ssi-advanced-adventurer' }, expected: null },
  { name: 'SSI Advanced Adventurer with required dive', profile: { agency: 'SSI', certificationId: 'ssi-advanced-adventurer', conditionalConfirmed: true }, expected: 30 },
  { name: 'SSI eligible profile + Deep Diving', profile: { agency: 'SSI', certificationId: 'ssi-advanced-adventurer', conditionalConfirmed: true, additionalQualificationId: 'ssi-deep-diving' }, expected: 40 },
  { name: 'SSI Master + previous Open Water', profile: { agency: 'SSI', certificationId: 'ssi-master-diver', previousQualificationId: 'ssi-open-water' }, expected: 18 },
  { name: 'SSI Master + previous Open Water + Deep', profile: { agency: 'SSI', certificationId: 'ssi-master-diver', previousQualificationId: 'ssi-open-water', additionalQualificationId: 'ssi-deep-diving' }, expected: 40 },
]

for (const scenario of depthScenarios) {
  const actual = getEffectiveDepthLimit(scenario.profile)
  if (actual !== scenario.expected) {
    throw new Error(`${scenario.name}: expected ${scenario.expected}, received ${actual}`)
  }
  console.log(`PASS  ${scenario.name} => ${actual === null ? 'no limit' : `${actual} m`}`)
}

const optionScenarios = [
  { name: 'CMAS One Star has no follow-up', profile: { agency: 'CMAS', certificationId: 'cmas-one-star' } satisfies DiverProfile, expected: [] },
  { name: 'PADI Open Water has no Deep Diver option', profile: { agency: 'PADI', certificationId: 'padi-open-water' } satisfies DiverProfile, expected: [] },
  { name: 'PADI Advanced offers only Deep Diver', profile: { agency: 'PADI', certificationId: 'padi-advanced-open-water' } satisfies DiverProfile, expected: ['padi-deep-diver'] },
  { name: 'SSI Open Water has no Deep Diving option', profile: { agency: 'SSI', certificationId: 'ssi-open-water' } satisfies DiverProfile, expected: [] },
  { name: 'SSI Advanced offers only Deep Diving', profile: { agency: 'SSI', certificationId: 'ssi-advanced-adventurer' } satisfies DiverProfile, expected: ['ssi-deep-diving'] },
]

for (const scenario of optionScenarios) {
  const actual = getAvailableAdditionalQualifications(scenario.profile).map((item) => item.id)
  if (JSON.stringify(actual) !== JSON.stringify(scenario.expected)) {
    throw new Error(`${scenario.name}: expected ${scenario.expected}, received ${actual}`)
  }
  console.log(`PASS  ${scenario.name} => [${actual.join(', ')}]`)
}

const rescuePrevious = getAllowedPreviousQualifications('padi-rescue-diver').map((item) => item.id)
const expectedRescuePrevious = ['padi-advanced-open-water', 'padi-junior-advanced-open-water']
if (JSON.stringify(rescuePrevious) !== JSON.stringify(expectedRescuePrevious)) {
  throw new Error(`PADI Rescue previous options: expected ${expectedRescuePrevious}, received ${rescuePrevious}`)
}
console.log(`PASS  PADI Rescue previous options => [${rescuePrevious.join(', ')}]`)

const total = depthScenarios.length + optionScenarios.length + 1
console.log(`\n${total}/${total} prerequisite-aware certification scenarios passed.`)
