import type { LayerState, MapLayerKey } from '../../App'
import { useLanguage } from '../../i18n/LanguageContext'
import type { Translation } from '../../i18n/translations'

interface ProjectSidebarProps {
  counts: LayerState<number>
  loading: LayerState<boolean>
  errors: LayerState<string | null>
  visibility: LayerState<boolean>
  onToggleLayer: (layer: MapLayerKey) => void
  onRetry: () => void
}

const LAYER_KEYS: MapLayerKey[] = [
  'diveSites',
  'diveCenters',
  'departurePoints',
]

function localizedError(error: string, t: Translation): string {
  if (error === 'INVALID_GEOJSON') return t.status.invalidResponse
  if (error === 'UNKNOWN_ERROR') return t.status.unknownError
  return error
}

export function ProjectSidebar({
  counts,
  loading,
  errors,
  visibility,
  onToggleLayer,
  onRetry,
}: ProjectSidebarProps) {
  const { t } = useLanguage()
  const hasErrors = Object.values(errors).some(Boolean)

  return (
    <div className="map-controls">
      <div>
        <p className="eyebrow">{t.sidebar.eyebrow}</p>
        <h2>{t.sidebar.title}</h2>
        <p className="sidebar__intro">{t.sidebar.intro}</p>
      </div>

      <section className="dataset-card" aria-live="polite">
        <div className="dataset-card__header">
          <h3>{t.sidebar.layerCounts}</h3>
          <span>{t.sidebar.liveData}</span>
        </div>
        {LAYER_KEYS.map((layer) => (
          <div className="dataset-row" key={layer}>
            <span
              className={`legend__marker legend__marker--${layer}`}
              aria-hidden="true"
            />
            <span>{t.layers[layer]}</span>
            <strong>
              {loading[layer]
                ? t.status.loading
                : errors[layer]
                  ? '—'
                  : counts[layer]}
            </strong>
            {errors[layer] && (
              <small>
                {t.status.layerLoadFailed} GeoServer:{' '}
                {localizedError(errors[layer], t)}
              </small>
            )}
          </div>
        ))}
      </section>

      {hasErrors && (
        <section className="error-card" role="alert">
          <h3>{t.status.loadFailed}</h3>
          <p>{t.status.checkGeoServer}</p>
          <button type="button" onClick={onRetry}>
            {t.status.tryAgain}
          </button>
        </section>
      )}

      <section className="layer-control" aria-labelledby="layer-control-title">
        <h3 id="layer-control-title">{t.sidebar.layerVisibility}</h3>
        {LAYER_KEYS.map((layer) => (
          <label key={layer}>
            <input
              type="checkbox"
              checked={visibility[layer]}
              onChange={() => onToggleLayer(layer)}
            />
            <span
              className={`legend__marker legend__marker--${layer}`}
              aria-hidden="true"
            />
            <span>{t.layers[layer]}</span>
          </label>
        ))}
      </section>

      <section className="legend" aria-label={t.sidebar.mapLegend}>
        <h3>{t.sidebar.mapLegend}</h3>
        {LAYER_KEYS.map((layer) => (
          <div className="legend__item" key={layer}>
            <span
              className={`legend__marker legend__marker--${layer}`}
              aria-hidden="true"
            />
            <span>{t.layers[layer]}</span>
          </div>
        ))}
      </section>

      <p className="sidebar__hint">{t.sidebar.hint}</p>
    </div>
  )
}
