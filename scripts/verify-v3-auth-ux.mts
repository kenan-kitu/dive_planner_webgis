import { AUTH_PASSWORD_POLICY, meetsPasswordPolicy } from '../src/config/authPolicy.ts'

const checks: Array<[string, boolean]> = [
  ['minimum length is 12', AUTH_PASSWORD_POLICY.minLength === 12],
  ['maximum length is 128', AUTH_PASSWORD_POLICY.maxLength === 128],
  ['valid password passes', meetsPasswordPolicy('ValidPassword1')],
  ['short password fails', !meetsPasswordPolicy('Short1A')],
  ['uppercase is required', !meetsPasswordPolicy('lowercase1234')],
  ['lowercase is required', !meetsPasswordPolicy('UPPERCASE1234')],
  ['number is required', !meetsPasswordPolicy('NoNumberHere')],
]

for (const [label, passed] of checks) {
  if (!passed) throw new Error(`Auth UX check failed: ${label}`)
}

console.log(`V3 auth UX checks passed (${checks.length}/${checks.length}).`)
