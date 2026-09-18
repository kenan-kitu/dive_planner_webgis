import type { Feature, FeatureCollection, Point } from 'geojson'

export interface DiveSiteProperties {
  site_name: string
  mooring_count: number | null
  site_type: string | null
  depth_m: number | null
  depth_source: string | null
  data_quality: string | null
  min_depth_m: number | null
  max_depth_m: number | null
  access_type: string | null
  depth_class: string | null
  data_origin: 'official' | 'demo' | string
  description: string | null
}

export type DiveSiteFeature = Feature<Point, DiveSiteProperties>
export type DiveSiteCollection = FeatureCollection<Point, DiveSiteProperties>

export interface DiveCenterProperties {
  record_id: number
  name: string
  category: string | null
  phone: string | null
  website: string | null
  address: string | null
  osm_id: number | string | null
  source: string | null
  nearest_dive_m: number | null
}

export type DiveCenterFeature = Feature<Point, DiveCenterProperties>
export type DiveCenterCollection = FeatureCollection<Point, DiveCenterProperties>

export interface DeparturePointProperties {
  record_id: number
  name: string
  type: string | null
  operator: string | null
  website: string | null
  osm_id: number | string | null
  source: string | null
  nearest_dive_m: number | null
}

export type DeparturePointFeature = Feature<Point, DeparturePointProperties>
export type DeparturePointCollection = FeatureCollection<
  Point,
  DeparturePointProperties
>
