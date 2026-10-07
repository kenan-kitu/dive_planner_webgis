export const AUTH_PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  htmlPattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+',
} as const

export function meetsPasswordPolicy(value: string): boolean {
  return (
    value.length >= AUTH_PASSWORD_POLICY.minLength &&
    value.length <= AUTH_PASSWORD_POLICY.maxLength &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value)
  )
}
