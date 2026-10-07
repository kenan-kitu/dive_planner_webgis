import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import type { UserRole } from '../../services/auth'
import { FavoriteSitesDialog } from './FavoriteSitesDialog'
import { useAuth } from './AuthContext'
import { AdminPanel } from '../Portal/AdminPanel'
import { DiveCenterPortal } from '../Portal/DiveCenterPortal'

interface AuthControlsProps {
  onSelectFavorite: (siteId: number) => void
  onCommunityChanged: () => void
}

export function AuthControls({
  onSelectFavorite,
  onCommunityChanged,
}: AuthControlsProps) {
  const { t } = useLanguage()
  const {
    user,
    authMode: mode,
    openSignIn,
    openRegister,
    closeAuth,
    openFavorites,
    signIn,
    register,
    signOut,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [managementView, setManagementView] = useState<
    'dive-center' | 'admin' | null
  >(null)

  const closeDialog = () => {
    closeAuth()
    setError(null)
    setPassword('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!mode) return

    setIsSubmitting(true)
    setError(null)
    try {
      if (mode === 'register') {
        await register({
          email,
          password,
          display_name: displayName,
        })
      } else {
        await signIn(email, password)
      }
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

  const handleSignOut = () => {
    setManagementView(null)
    signOut()
  }

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
                if (mode === 'login') openRegister()
                else openSignIn()
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
          <button
            className="auth-button auth-button--quiet auth-button--favorites"
            type="button"
            onClick={openFavorites}
            aria-label={t.community.myFavorites}
          >
            <span aria-hidden="true">♥</span>
            <span className="auth-button__label">{t.community.myFavorites}</span>
          </button>
          {user.role === 'DIVE_CENTER' ? (
            <button
              className="auth-button auth-button--quiet auth-button--management"
              type="button"
              onClick={() => setManagementView('dive-center')}
              aria-label={t.portal.diveCenterDashboard}
            >
              <span aria-hidden="true">⌂</span>
              <span className="auth-button__label">{t.portal.diveCenterDashboard}</span>
            </button>
          ) : null}
          {user.role === 'ADMIN' ? (
            <button
              className="auth-button auth-button--quiet auth-button--management"
              type="button"
              onClick={() => setManagementView('admin')}
              aria-label={t.portal.adminPanel}
            >
              <span aria-hidden="true">⚙</span>
              <span className="auth-button__label">{t.portal.adminPanel}</span>
            </button>
          ) : null}
          <button className="auth-button auth-button--quiet" type="button" onClick={handleSignOut}>
            {t.auth.signOut}
          </button>
        </>
      ) : (
        <button className="auth-button" type="button" onClick={openSignIn}>
          {t.auth.signIn}
        </button>
      )}

      {authDialog}
      <FavoriteSitesDialog onSelectSite={onSelectFavorite} />
      <DiveCenterPortal
        open={managementView === 'dive-center'}
        onClose={() => setManagementView(null)}
      />
      <AdminPanel
        open={managementView === 'admin'}
        onClose={() => setManagementView(null)}
        onCommunityChanged={onCommunityChanged}
      />
    </div>
  )
}
