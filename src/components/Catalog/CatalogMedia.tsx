import { useEffect, useState } from 'react'

interface CatalogMediaProps {
  src: string | null | undefined
  alt: string
  fallback: string
}

export function CatalogMedia({ src, alt, fallback }: CatalogMediaProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  return (
    <div className="catalog-card__media">
      {src && !failed ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{fallback}</span>
      )}
    </div>
  )
}
