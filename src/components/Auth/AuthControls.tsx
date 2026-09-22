import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  getCurrentUser,
  loginAccount,
  registerAccount,
  type AuthUser,
  type UserRole,
} from '../../services/auth'

const TOKEN_STORAGE_KEY = 'dive-planner-access-token'

type AuthMode = 'login' | 'register'

export function AuthControls() {
  const { t } = useLanguage()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [mode, setMode] = useState<AuthMode | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) return

    getCurrentUser(token)
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_STORAGE_KEY))
  }, [])

  const closeDialog = () => {
    setMode(null)
    setError(null)
    setPassword('')
  }

  const signOut = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setUser(null)
    closeDialog()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!mode) return

    setIsSubmitting(true)
    setError(null)
    try {
      if (mode === 'register') {
        await registerAccount({
          email,
          password,
          display_name: displayName,
        })
      }
      const result = await loginAccount(email, password)
      localStorage.setItem(TOKEN_STORAGE_KEY, result.access_token)
      setUser(result.user)
      setEmail('')
      setDisplayName('')
      closeDialog()
    } catch {
      setError(t.auth.requestFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleLabel = (role: UserRole) => t.auth.roles[role]

  const authDialog = mode
    ? createPortal(
        <div className="auth-dialog-backdrop" role="presentation" onMouseDown={closeDialog}>
          <section
            className="auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="auth-dialog__heading">
              <div>
                <small>{t.auth.optional}</small>
                <h2 id="auth-dialog-title">
                  {mode === 'login' ? t.auth.signIn : t.auth.register}
                </h2>
              </div>
              <button type="button" onClick={closeDialog} aria-label={t.auth.close}>
                ×
              </button>
            </div>

            <form onSubmit={submit}>
              {mode === 'register' && (
                <label>
                  {t.auth.displayName}
                  <input
                    type="text"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    required
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </label>
              )}
              <label>
                {t.auth.email}
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                {t.auth.password}
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error && <p className="auth-dialog__error">{error}</p>}
              <button className="auth-dialog__submit" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t.auth.working
                  : mode === 'login'
                    ? t.auth.signIn
                    : t.auth.register}
              </button>
            </form>

            <button
              className="auth-dialog__switch"
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
            >
              {mode === 'login' ? t.auth.needAccount : t.auth.haveAccount}
            </button>
          </section>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="auth-controls">
      {user ? (
        <>
          <div className="auth-user" title={user.email}>
            <strong>{user.display_name}</strong>
            <span>{roleLabel(user.role)}</span>
          </div>
          <button className="auth-button auth-button--quiet" type="button" onClick={signOut}>
            {t.auth.signOut}
          </button>
        </>
      ) : (
        <button className="auth-button" type="button" onClick={() => setMode('login')}>
          {t.auth.signIn}
        </button>
      )}

      {authDialog}
    </div>
  )
}
