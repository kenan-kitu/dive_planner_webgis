export type MapSymbolId =
  | 'reef'
  | 'wreck'
  | 'wall'
  | 'diveCenter'
  | 'departure'

export const MAP_SYMBOL_COLORS: Record<MapSymbolId, string> = {
  reef: '#007d88',
  wreck: '#7651a1',
  wall: '#d75413',
  diveCenter: '#d84f38',
  departure: '#234b91',
}
