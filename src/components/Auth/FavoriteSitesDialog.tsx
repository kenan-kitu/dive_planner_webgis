import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import { listFavorites } from '../../services/community'
import type { DiveSiteFeature } from '../../types/gis'
import { useAuth } from './AuthContext'

interface FavoriteSitesDialogProps {
  onSelectSite: (siteId: number) => void
}

export function FavoriteSitesDialog({ onSelectSite }: FavoriteSitesDialogProps) {
  const { t } = useLanguage()
  const {
    token,
    favoritesOpen,
    favoritesRevision,
    closeFavorites,
  } = useAuth()
  const [sites, setSites] = useState<DiveSiteFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!favoritesOpen || !token) return
    setLoading(true)
    setError(false)
    listFavorites(token)
      .then((result) => setSites(result.features))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [favoritesOpen, favoritesRevision, token])

  if (!favoritesOpen || !token) return null

  return createPortal(
    <div className="auth-dialog-backdrop" role="presentation" onMouseDown={closeFavorites}>
      <section
        className="auth-dialog favorites-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="auth-dialog__heading">
          <div>
            <small>{t.community.community}</small>
            <h2 id="favorites-dialog-title">{t.community.myFavorites}</h2>
          </div>
          <button type="button" onClick={closeFavorites} aria-label={t.community.closeFavorites}>
            ×
          </button>
        </div>
        {loading ? <p>{t.community.loading}</p> : null}
        {error ? <p className="auth-dialog__error">{t.community.loadFailed}</p> : null}
        {!loading && !error && sites.length === 0 ? (
          <p className="favorites-dialog__empty">{t.community.noFavorites}</p>
        ) : null}
        <div className="favorites-dialog__list">
          {sites.map((site) => (
            <button
              key={String(site.id)}
              type="button"
              onClick={() => {
                onSelectSite(Number(site.id))
                closeFavorites()
              }}
            >
              <span>{site.properties.site_type ?? t.dataValues.diveSite}</span>
              <strong>{site.properties.site_name}</strong>
              <small>{t.community.openDiveSite} →</small>
            </button>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  )
}
