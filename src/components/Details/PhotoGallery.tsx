import { useEffect, useMemo, useState } from 'react'
import type { PhotoReference } from '../../data/enrichment/types.ts'
import { useLanguage } from '../../i18n/LanguageContext'
import { availablePhotos } from '../../utils/enrichment.ts'

interface PhotoGalleryProps {
  photos: readonly PhotoReference[]
  title: string
}

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const { t } = useLanguage()
  const [activeUrl, setActiveUrl] = useState(photos[0]?.url ?? null)
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set())
  const visiblePhotos = useMemo(
    () => availablePhotos(photos, failedUrls),
    [failedUrls, photos],
  )
  const activePhoto =
    visiblePhotos.find((photo) => photo.url === activeUrl) ??
    visiblePhotos[0] ??
    null

  useEffect(() => {
    setActiveUrl(photos[0]?.url ?? null)
    setFailedUrls(new Set())
  }, [photos])

  if (!activePhoto) return null

  const markFailed = (url: string) => {
    setFailedUrls((current) => new Set(current).add(url))
  }

  return (
    <figure className="detail-gallery">
      <div className="detail-gallery__cover">
        <img
          src={activePhoto.url}
          alt={activePhoto.caption || title}
          onError={() => markFailed(activePhoto.url)}
        />
      </div>
      {visiblePhotos.length > 1 && (
        <div className="detail-gallery__thumbnails" aria-label={t.details.photoGallery}>
          {visiblePhotos.map((photo, index) => (
            <button
              className={photo.url === activePhoto.url ? 'is-active' : ''}
              type="button"
              key={photo.url}
              aria-label={`${t.details.showPhoto} ${index + 1}`}
              aria-pressed={photo.url === activePhoto.url}
              onClick={() => setActiveUrl(photo.url)}
            >
              <img
                src={photo.url}
                alt=""
                onError={() => markFailed(photo.url)}
              />
            </button>
          ))}
        </div>
      )}
      <figcaption>
        {activePhoto.caption}
        {(activePhoto.attribution || activePhoto.sourceName) && (
          <span>
            {t.details.imageCredit}:{' '}
            {activePhoto.sourcePage ? (
              <a href={activePhoto.sourcePage} target="_blank" rel="noreferrer">
                {activePhoto.attribution ?? activePhoto.sourceName}
              </a>
            ) : (
              activePhoto.attribution ?? activePhoto.sourceName
            )}
            {activePhoto.license ? ` · ${activePhoto.license}` : ''}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
