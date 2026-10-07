import { useEffect, useState, type CSSProperties } from 'react'
import {
  MAP_ANALYSIS_STYLES,
  MAP_SYMBOL_COLORS,
  MAP_SYMBOLS,
  type BasemapId,
  type MapSymbolId,
  type MapSymbolVariant,
} from '../../config/mapStyles'
import { useLanguage } from '../../i18n/LanguageContext'

interface MapOverlayControlsProps {
  basemap: BasemapId
  nauticalVisible: boolean
  onBasemapChange: (basemap: BasemapId) => void
  onNauticalChange: (visible: boolean) => void
  canShowOtherDiveSites: boolean
  showOtherDiveSites: boolean
  onShowOtherDiveSitesChange: (visible: boolean) => void
  showLegend: boolean
}

interface SymbolLegendItem {
  symbol: MapSymbolId
  variant: MapSymbolVariant
  label: string
}

function LegendSymbol({ symbol, variant }: Omit<SymbolLegendItem, 'label'>) {
  const definition = MAP_SYMBOLS[symbol]
  return (
    <span
      className={`map-symbol map-symbol--legend map-symbol--${symbol} map-symbol--${variant}`}
      style={{
        '--map-symbol-color': MAP_SYMBOL_COLORS[symbol],
      } as CSSProperties}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: `<svg viewBox="${definition.viewBox}">${definition.body}</svg>`,
      }}
    />
  )
}

export function MapOverlayControls({
  basemap,
  nauticalVisible,
  onBasemapChange,
  onNauticalChange,
  canShowOtherDiveSites,
  showOtherDiveSites,
  onShowOtherDiveSitesChange,
  showLegend,
}: MapOverlayControlsProps) {
  const { t } = useLanguage()
  const [legendOpen, setLegendOpen] = useState(() =>
    window.matchMedia('(min-width: 761px)').matches,
  )
  const [stylesOpen, setStylesOpen] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 761px)')
    const sync = () => setLegendOpen(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const siteItems: SymbolLegendItem[] = [
    { symbol: 'reef', variant: 'matching', label: t.map.reef },
    { symbol: 'wreck', variant: 'matching', label: t.map.wreck },
    { symbol: 'wall', variant: 'matching', label: t.map.wall },
  ]
  const otherItems: SymbolLegendItem[] = [
    { symbol: 'diveCenter', variant: 'default', label: t.map.diveCenter },
    { symbol: 'departure', variant: 'default', label: t.map.departurePoint },
    { symbol: 'departure', variant: 'selected', label: t.map.selectedDeparture },
    { symbol: 'reef', variant: 'selected', label: t.map.selectedDiveSite },
    { symbol: 'diveCenter', variant: 'nearby', label: t.map.nearbyDiveCenter },
  ]

  return (
    <div className="map-overlay-controls">
      {canShowOtherDiveSites ? (
        <button
          type="button"
          className="map-result-visibility"
          aria-pressed={showOtherDiveSites}
          onClick={() => onShowOtherDiveSitesChange(!showOtherDiveSites)}
        >
          {showOtherDiveSites
            ? t.catalog.hideOtherDiveSites
            : t.catalog.showOtherDiveSites}
        </button>
      ) : null}
      <section className={`map-style-control${stylesOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="map-overlay-toggle"
          aria-expanded={stylesOpen}
          onClick={() => setStylesOpen((current) => !current)}
        >
          <span aria-hidden="true">▦</span>
          {t.map.mapStyle}
        </button>
        {stylesOpen ? (
          <div className="map-style-control__panel">
            <strong>{t.map.basemap}</strong>
            {(['light', 'street', 'satellite'] as BasemapId[]).map((item) => (
              <label key={item}>
                <input
                  type="radio"
                  name="basemap"
                  value={item}
                  checked={basemap === item}
                  onChange={() => onBasemapChange(item)}
                />
                <span>{t.map[item]}</span>
              </label>
            ))}
            <label className="map-style-control__overlay">
              <input
                type="checkbox"
                checked={nauticalVisible}
                onChange={(event) => onNauticalChange(event.target.checked)}
              />
              <span>{t.map.nautical}</span>
            </label>
            <small>{t.map.nauticalDisclaimer}</small>
          </div>
        ) : null}
      </section>

      {showLegend ? <section className={`map-legend${legendOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="map-overlay-toggle"
          aria-expanded={legendOpen}
          onClick={() => setLegendOpen((current) => !current)}
        >
          <span aria-hidden="true">◫</span>
          {t.map.legend}
        </button>
        {legendOpen ? (
          <div className="map-legend__panel">
            <div className="map-legend__group">
              <strong>{t.map.diveSites}</strong>
              {siteItems.map((item) => (
                <div key={item.label}>
                  <LegendSymbol symbol={item.symbol} variant={item.variant} />
                  <span>{item.label}</span>
                </div>
              ))}
              <div>
                <span className="map-legend__community" aria-hidden="true" />
                <span>{t.map.communityDiveSite}</span>
              </div>
            </div>
            <div className="map-legend__group">
              <strong>{t.map.otherPoints}</strong>
              {otherItems.map((item) => (
                <div key={item.label}>
                  <LegendSymbol symbol={item.symbol} variant={item.variant} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="map-legend__group">
              <strong>{t.map.analysis}</strong>
              <div>
                <LegendSymbol symbol="reef" variant="matching" />
                <span>{t.map.matchingDiveSite}</span>
              </div>
              <div>
                <LegendSymbol symbol="reef" variant="muted" />
                <span>{t.map.nonMatchingDiveSite}</span>
              </div>
              <div>
                <span
                  className="map-legend__area"
                  style={{
                    borderColor: MAP_ANALYSIS_STYLES.reachZone.color,
                    background: MAP_ANALYSIS_STYLES.reachZone.fillColor,
                  }}
                  aria-hidden="true"
                />
                <span>{t.map.reachZone}</span>
              </div>
              <div>
                <span
                  className="map-legend__route"
                  style={{ borderColor: MAP_ANALYSIS_STYLES.directRoute.color }}
                  aria-hidden="true"
                />
                <span>{t.map.directRoute}</span>
              </div>
            </div>
          </div>
        ) : null}
      </section> : null}
    </div>
  )
}
