import type {
  DiveSiteEnrichment,
  EnrichmentSource,
  PhotoReference,
} from './types.ts'
import { localizedSiteFields } from './localizedContent.ts'

const source = (
  title: string,
  url: string,
  type: EnrichmentSource['type'],
  authoritative = true,
): EnrichmentSource => ({ title, url, type, authoritative })

const photo = (
  url: string,
  sourcePage: string,
  caption: string,
  attribution: string | null,
  license: string | null,
  sourceName = 'Wikimedia Commons',
): PhotoReference => ({
  url,
  sourcePage,
  sourceName,
  caption,
  attribution,
  license,
})

const NOAA_MOORINGS = source(
  'Mooring Buoy Locations',
  'https://floridakeys.noaa.gov/mbuoy/allmbuoys.html',
  'government',
)
const NOAA_SPAS = source(
  'Sanctuary Preservation Areas',
  'https://floridakeys.noaa.gov/zones/spas/',
  'government',
)
const NOAA_DIVING = source(
  'Diving and Snorkeling in Florida Keys National Marine Sanctuary',
  'https://floridakeys.noaa.gov/visitor_information/things-to-do/diving.html',
  'government',
)
const KEYS_DIVING = source(
  'Diving and Snorkeling in the Florida Keys',
  'https://visitfloridakeys.com/experiences/what-were-famous-for/diving-snorkeling',
  'official-tourism',
)
const SAIL_FISH_SITES = source(
  'Explore Key Largo Dive Sites',
  'https://sailfishscuba.com/dive-sites',
  'official-business',
)
const KEY_DIVES_SITES = source(
  'Dive Sites in the Florida Keys and Islamorada',
  'https://keydives.com/dive-sites-information/',
  'official-business',
)
const CAPTAIN_HOOKS_MARATHON = source(
  'Marathon Reefs and Snorkeling Sites',
  'https://captainhooks.com/marathon/snorkeling/',
  'official-business',
)
const CAPTAIN_HOOKS_KEYS = source(
  'Florida Keys snorkeling and dive-site overview',
  'https://captainhooks.com/readers-choice-awards-gives-florida-keys-best-snorkeling-ranking-in-all-of-the-us-and-canada/',
  'official-business',
)
const FWC_ARTIFICIAL_REEFS = source(
  'Florida Keys Artificial Reefs',
  'https://gis.myfwc.com/boating_guides/Florida_Keys/pages/art_reefs.html',
  'government',
)

const siteNames = [
  'Adelaide Baker (Shipwreck Trail)',
  'Adolphus Busch Wreck',
  'Alligator Reef',
  'Alligator Wreck',
  'Amesbury Wreck (Shipwreck Trail)',
  'Archer Key',
  'Benwood Wreck (Shipwreck Trail)',
  'Bibb Wreck',
  'Carysfort Reef',
  'Carysfort Reef South',
  'Carysfort Shoal N1',
  'Carysfort Shoal N2',
  'Carysfort Shoal N3',
  'Carysfort Shoal N4',
  'Carysfort Trench',
  'Cayman Salvor Wreck',
  'Cheeca Rocks',
  'Coffins Patch',
  'Conch Reef',
  'Conch Reef Wall',
  'Cottrell Key',
  'Crocker Reef',
  'Davis Ledge',
  'Duane Wreck (Shipwreck Trail)',
  'Eagle Wreck (Shipwreck Trail)',
  'Eastern Dry Rocks',
  'Elbow',
  'French Reef',
  'Grecian Rocks',
  'Hen and Chickens',
  'Horseshoe Reef',
  "Joe's Tug Wreck",
  'Key Largo Dry Rocks',
  'Looe Key',
  'Lost Reef',
  'Marker',
  'Molasses Reef',
  'Mule Key',
  'Newfound Harbor',
  'Nine Foot Stake',
  'North American',
  'North Dry Rocks',
  'North East Patch',
  'North North Dry Rocks',
  'North Patch',
  'Pelican Shoal',
  'Pickles Reef',
  'Rock Key',
  'Rocky Top',
  'San Pedro Wreck (Shipwreck Trail)',
  'Sand Island',
  'Sand Key Reef',
  'Snapper Ledge',
  'Sombrero Reef',
  'Spiegel Grove Wreck',
  'Three Sisters',
  'Toppinos Marker',
  'Turtle Rocks',
  'Vandenberg Wreck',
  'Western Dry Rocks',
  'Western Sambo',
  'White Banks',
  'Wolfe Reef',
] as const

const wreckSites = new Set<string>([
  'Adelaide Baker (Shipwreck Trail)',
  'Adolphus Busch Wreck',
  'Alligator Wreck',
  'Amesbury Wreck (Shipwreck Trail)',
  'Benwood Wreck (Shipwreck Trail)',
  'Bibb Wreck',
  'Cayman Salvor Wreck',
  'Duane Wreck (Shipwreck Trail)',
  'Eagle Wreck (Shipwreck Trail)',
  "Joe's Tug Wreck",
  'North American',
  'San Pedro Wreck (Shipwreck Trail)',
  'Spiegel Grove Wreck',
  'Vandenberg Wreck',
])

const wallSites = new Set<string>(['Carysfort Trench', 'Conch Reef Wall'])

const spaSites = new Set<string>([
  'Alligator Reef',
  'Carysfort Reef',
  'Cheeca Rocks',
  'Coffins Patch',
  'Conch Reef',
  'Davis Ledge',
  'Eastern Dry Rocks',
  'Elbow',
  'Grecian Rocks',
  'Hen and Chickens',
  'Key Largo Dry Rocks',
  'Looe Key',
  'Molasses Reef',
  'Newfound Harbor',
  'Rock Key',
  'Sand Key Reef',
  'Sombrero Reef',
  'Turtle Rocks',
])

const mooringSites = new Set<string>([
  'Adelaide Baker (Shipwreck Trail)',
  'Adolphus Busch Wreck',
  'Amesbury Wreck (Shipwreck Trail)',
  'Archer Key',
  'Benwood Wreck (Shipwreck Trail)',
  'Bibb Wreck',
  'Carysfort Trench',
  'Cayman Salvor Wreck',
  'Cottrell Key',
  'Conch Reef Wall',
  'Crocker Reef',
  'Duane Wreck (Shipwreck Trail)',
  'Eagle Wreck (Shipwreck Trail)',
  'Horseshoe Reef',
  'Looe Key',
  'Mule Key',
  'Nine Foot Stake',
  'North American',
  'North Dry Rocks',
  'North East Patch',
  'North North Dry Rocks',
  'Pelican Shoal',
  'Pickles Reef',
  'San Pedro Wreck (Shipwreck Trail)',
  'Sand Island',
  'Snapper Ledge',
  'Spiegel Grove Wreck',
  'Three Sisters',
  'Vandenberg Wreck',
  'Western Dry Rocks',
  'Western Sambo',
  'White Banks',
  'Wolfe Reef',
])

const noaaShipwreckSource = (slug: string, title: string) =>
  source(
    `${title} — Florida Keys Shipwreck Trail`,
    `https://floridakeys.noaa.gov/shipwrecktrail/${slug}.html`,
    'government',
  )

const noaaPhoto = (
  slug: string,
  file: string,
  caption: string,
  attribution: string,
) =>
  photo(
    `https://floridakeys.noaa.gov/media/img/${file}`,
    `https://floridakeys.noaa.gov/shipwrecktrail/${slug}.html`,
    caption,
    attribution,
    'U.S. government work; verify reuse terms on source page',
    'Florida Keys National Marine Sanctuary / NOAA',
  )

const sitePhotos: Record<string, PhotoReference[]> = {
  'Adelaide Baker (Shipwreck Trail)': [
    noaaPhoto('adelaide', '20240126-adelaide-baker-header-1000.jpg', 'Diver viewing the iron mast remains.', 'Nicole Grinnan / Florida Public Archaeology Network'),
    noaaPhoto('adelaide', '20240126-divers-with-scattered-ship-remains-1000.jpg', 'Divers over the scattered wreck remains.', 'John Ireton / Florida Public Archaeology Network'),
    noaaPhoto('adelaide', '20240126-diver-with-adelaide-baker-mast-1000.jpg', 'Diver beside the marine-life-covered mast.', 'Matthew Lawrence / NOAA'),
  ],
  'Amesbury Wreck (Shipwreck Trail)': [
    noaaPhoto('amesbury', '20240126-amesbury-at-port-1000.jpg', 'USS Amesbury in port.', 'U.S. National Archives'),
    noaaPhoto('amesbury', '20240126-amesbury-first-launched-400.jpg', 'Historic image of Amesbury being launched.', 'U.S. Navy'),
    noaaPhoto('amesbury', '20240126-amesbury-bow-1000.jpg', 'Marine-life-covered bow on the seabed.', 'Brenda Altmeier / NOAA'),
  ],
  'Benwood Wreck (Shipwreck Trail)': [
    noaaPhoto('benwood', '20240126-benwood-crushed-bow-1000.jpg', 'Diver viewing Benwood’s crushed bow.', 'Matthew Lawrence / NOAA'),
    noaaPhoto('benwood', '20240126-benwood-aground-1000.jpg', 'Historic photograph of Benwood.', 'Monroe County Library'),
    noaaPhoto('benwood', '20240126-benwood-bow-1000.jpg', 'Diver swimming above Benwood’s bow.', 'Matt Lawrence / NOAA'),
  ],
  'Duane Wreck (Shipwreck Trail)': [
    noaaPhoto('duane', '20240201-coast-guard-cutter-duane-1000.jpg', 'Diver over the USCGC Duane wreck.', 'Matt Lawrence / NOAA'),
    noaaPhoto('duane', '20240201-1987-duane-bow-1000.jpg', 'Duane being towed to the artificial-reef site.', 'Stephen Frink'),
    noaaPhoto('duane', '20240201-duane-black-and-white-photo-1000.jpg', 'USCGC Duane underway during World War II.', 'U.S. Coast Guard'),
  ],
  'Eagle Wreck (Shipwreck Trail)': [
    noaaPhoto('eagle', '20240201-eagle-starboard-side-1000.jpg', 'Diver alongside Eagle on its starboard side.', 'Matt Lawrence / NOAA'),
    noaaPhoto('eagle', '20240201-eagle-waiting-to-be-sunk-1000.jpg', 'Eagle awaiting its artificial-reef sinking.', 'Mike White'),
    noaaPhoto('eagle', '20240201-raila-dan-400.jpg', 'The vessel as Raila Dan in 1962.', 'Bjarne Johansen'),
  ],
  'North American': [
    noaaPhoto('northamerica', '20240201-north-america-remains-1000.jpg', 'Diver photographing wooden wreck remains.', 'Matt Lawrence / NOAA'),
    noaaPhoto('northamerica', '20240201-the-ship-macon-painting-1000.jpg', 'Period vessel used to illustrate North America’s appearance.', 'Metropolitan Museum of Art'),
    noaaPhoto('northamerica', '20240201-north-america-ballast-pile-1000.jpg', 'Hull timbers projecting from the ballast pile.', 'Matt Lawrence / NOAA'),
  ],
  'San Pedro Wreck (Shipwreck Trail)': [
    noaaPhoto('sanpedro', '20240201-san-pedro-anchor-1000.jpg', 'Diver viewing the historic anchor.', 'Matt Lawrence / NOAA'),
    noaaPhoto('sanpedro', '20240201-san-pedro-wreckage-1000.jpg', 'Diver hovering above the flattened wreckage.', 'Matt Lawrence / NOAA'),
    noaaPhoto('sanpedro', '20240201-san-pedro-stones-1000.jpg', 'Ballast stones covered with marine life.', 'Matt Lawrence / NOAA'),
  ],
  'Spiegel Grove Wreck': [
    photo('https://upload.wikimedia.org/wikipedia/commons/8/8d/Bow_of_the_Spiegel_Grove_wreck%2C_Key_Largo%2C_Florida.jpg', 'https://commons.wikimedia.org/wiki/File:Bow_of_the_Spiegel_Grove_wreck,_Key_Largo,_Florida.jpg', 'Bow of the Spiegel Grove wreck.', 'Aquaimages', 'CC BY-SA 2.5'),
    photo('https://upload.wikimedia.org/wikipedia/commons/d/d8/Diver_near_an_old_gun_mount%2C_Spiegel_Grove_wreck%2C_Key_Largo%2C_Florida.jpg', 'https://commons.wikimedia.org/wiki/File:Diver_near_an_old_gun_mount,_Spiegel_Grove_wreck,_Key_Largo,_Florida.jpg', 'Diver near a former gun mount.', 'Aquaimages', 'CC BY-SA 2.5'),
    photo('https://upload.wikimedia.org/wikipedia/commons/5/53/Spiegel_Grove_wreck%2C_large_reel_on_deck%2C_Key_Largo%2C_Florida.jpg', 'https://commons.wikimedia.org/wiki/File:Spiegel_Grove_wreck,_large_reel_on_deck,_Key_Largo,_Florida.jpg', 'Large reel on the wreck’s deck.', 'Clark Anderson', 'CC BY-SA 2.5'),
  ],
  'Alligator Reef': [
    photo('https://upload.wikimedia.org/wikipedia/commons/e/ed/Alligator-reef-lh.JPG', 'https://commons.wikimedia.org/wiki/File:Alligator-reef-lh.JPG', 'Alligator Reef Lighthouse.', null, 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/e/eb/Alligator_Reef_Lighthouse_20230712.jpg', 'https://commons.wikimedia.org/wiki/File:Alligator_Reef_Lighthouse_20230712.jpg', 'Alligator Reef Lighthouse in 2023.', 'Jstuby', 'CC0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/f/f5/Buoys_in_Alligator_Reef_Sanctuary_Preservation_Area.jpg', 'https://commons.wikimedia.org/wiki/File:Buoys_in_Alligator_Reef_Sanctuary_Preservation_Area.jpg', 'Buoys in Alligator Reef Sanctuary Preservation Area.', 'NOAA', 'Public domain'),
  ],
  'Sombrero Reef': [
    photo('https://upload.wikimedia.org/wikipedia/commons/b/bf/Sombrero_Key_20191128.jpg', 'https://commons.wikimedia.org/wiki/File:Sombrero_Key_20191128.jpg', 'Sombrero Key and lighthouse.', 'USGS', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/a/aa/USCGSombrero_key_1971_sm.jpg', 'https://commons.wikimedia.org/wiki/File:USCGSombrero_key_1971_sm.jpg', 'Sombrero Key Lighthouse in 1971.', 'PH3 Dan R. Boyd / U.S. Coast Guard', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/5/51/Sombrero_Key_Lighthouse.jpg', 'https://commons.wikimedia.org/wiki/File:Sombrero_Key_Lighthouse.jpg', 'Sombrero Key Lighthouse.', 'Haligator987', 'CC BY-SA 4.0'),
  ],
  'Sand Key Reef': [
    photo('https://upload.wikimedia.org/wikipedia/commons/4/4d/Sand_Key_Light_2005.jpg', 'https://commons.wikimedia.org/wiki/File:Sand_Key_Light_2005.jpg', 'Sand Key Light.', 'James Brooks / U.S. Navy', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/f/f6/Sand_Key_Lighthouse_-_Key_West_%2816520630481%29.jpg', 'https://commons.wikimedia.org/wiki/File:Sand_Key_Lighthouse_-_Key_West_(16520630481).jpg', 'Sand Key Lighthouse near Key West.', 'Florida Memory', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/f/fb/Photocopy_of_color_postcard_Photographer_unknown%2C_ca._1907_LIGHTHOUSE_AND_WEATHER_BUREAU_STATION_-_Sand_Key_Lighthouse%2C_Sand_Key%2C_Key_West%2C_Monroe_County%2C_FL_HABS_FLA%2C44-KEY%2C17-5.tif', 'https://commons.wikimedia.org/wiki/File:Photocopy_of_color_postcard_Photographer_unknown,_ca._1907_LIGHTHOUSE_AND_WEATHER_BUREAU_STATION_-_Sand_Key_Lighthouse,_Sand_Key,_Key_West,_Monroe_County,_FL_HABS_FLA,44-KEY,17-5.tif', 'Historic Sand Key Lighthouse postcard.', null, 'Public domain'),
  ],
  'Carysfort Reef': [
    photo('https://upload.wikimedia.org/wikipedia/commons/6/64/Carysfort-reef-lh.JPG', 'https://commons.wikimedia.org/wiki/File:Carysfort-reef-lh.JPG', 'Carysfort Reef Lighthouse.', 'U.S. government', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/4/4f/Florida_-_Carysfort_Reef_-_DPLA_-_4ba97bd77e8c69e64c9cf3a4a599e2ce.jpg', 'https://commons.wikimedia.org/wiki/File:Florida_-_Carysfort_Reef_-_DPLA_-_4ba97bd77e8c69e64c9cf3a4a599e2ce.jpg', 'Historic Carysfort Reef image.', 'U.S. Bureau of Lighthouses', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/3/3d/Snorkeler_underwater_near_the_Carysfort_Reef_Lighthouse-_Key_Largo%2C_Florida_%283247324955%29.jpg', 'https://commons.wikimedia.org/wiki/File:Snorkeler_underwater_near_the_Carysfort_Reef_Lighthouse-_Key_Largo,_Florida_(3247324955).jpg', 'Snorkeler near Carysfort Reef Lighthouse.', 'State Library and Archives of Florida', 'Public domain'),
  ],
  'Looe Key': [
    photo('https://upload.wikimedia.org/wikipedia/commons/3/35/Looe_Key_satellite_1992.PNG', 'https://commons.wikimedia.org/wiki/File:Looe_Key_satellite_1992.PNG', 'Satellite view of Looe Key.', 'NOAA', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/c/c1/Looe_Key_Reef.PNG', 'https://commons.wikimedia.org/wiki/File:Looe_Key_Reef.PNG', 'Mapped view of Looe Key Reef.', 'Shawn Verne / NOAA', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/5/57/Elkhorn_01_Looe_Key_2010.jpg', 'https://commons.wikimedia.org/wiki/File:Elkhorn_01_Looe_Key_2010.jpg', 'Elkhorn coral at Looe Key.', 'Jstuby', 'Public domain'),
  ],
  'Molasses Reef': [
    photo('https://upload.wikimedia.org/wikipedia/commons/8/8f/Molasses_Reef_divers_reposition_reef_support_modules.png', 'https://commons.wikimedia.org/wiki/File:Molasses_Reef_divers_reposition_reef_support_modules.png', 'Divers reposition reef-support modules.', 'Florida Keys National Marine Sanctuary / NOAA', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/3/31/Molasses_Reef_diver_stretches_level_line.png', 'https://commons.wikimedia.org/wiki/File:Molasses_Reef_diver_stretches_level_line.png', 'Diver working with a level line at Molasses Reef.', 'Florida Keys National Marine Sanctuary / NOAA', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/0/06/Molasses_Reef_diver_transplants_sea_plume.png', 'https://commons.wikimedia.org/wiki/File:Molasses_Reef_diver_transplants_sea_plume.png', 'Diver transplanting a sea plume.', 'Florida Keys National Marine Sanctuary / NOAA', 'Public domain'),
  ],
  'Key Largo Dry Rocks': [
    photo('https://upload.wikimedia.org/wikipedia/commons/d/da/Christ_of_the_Abyss_Key_Largo_%282027447382%29.jpg', 'https://commons.wikimedia.org/wiki/File:Christ_of_the_Abyss_Key_Largo_(2027447382).jpg', 'Christ of the Abyss at Key Largo Dry Rocks.', 'Serge Melki', 'CC BY 2.0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/a/a2/Christ_of_the_Abyss%2C_Key_Largo%2C_FL_-_panoramio.jpg', 'https://commons.wikimedia.org/wiki/File:Christ_of_the_Abyss,_Key_Largo,_FL_-_panoramio.jpg', 'Christ of the Abyss statue.', 'Sebastian Carlosena', 'CC BY-SA 3.0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/7/7c/Jesus_statue_-_panoramio.jpg', 'https://commons.wikimedia.org/wiki/File:Jesus_statue_-_panoramio.jpg', 'Underwater statue at Key Largo Dry Rocks.', '巫迪文', 'CC BY 3.0'),
  ],
  'Vandenberg Wreck': [
    photo('https://upload.wikimedia.org/wikipedia/commons/1/14/Diver_at_USNS_General_Hoyt_S._Vandenberg_%28T-AGM-10%29_wreck_off_Key_West_in_January_2015.JPG', 'https://commons.wikimedia.org/wiki/File:Diver_at_USNS_General_Hoyt_S._Vandenberg_(T-AGM-10)_wreck_off_Key_West_in_January_2015.JPG', 'Diver at the USNS General Hoyt S. Vandenberg wreck.', 'Mass Communication Specialist 2nd Class Nicholas S. Tenorio / U.S. Navy', 'Public domain'),
  ],
  'Cheeca Rocks': [
    photo('https://upload.wikimedia.org/wikipedia/commons/8/8a/Map_of_Cheeca_Rocks_Sanctuary_Preservation_Area.jpg', 'https://commons.wikimedia.org/wiki/File:Map_of_Cheeca_Rocks_Sanctuary_Preservation_Area.jpg', 'Map of Cheeca Rocks Sanctuary Preservation Area.', 'NOAA', 'Public domain'),
  ],
  'Coffins Patch': [
    photo('https://upload.wikimedia.org/wikipedia/commons/e/e3/Map_of_Coffins_Patch_Sanctuary_Preservation_Area.jpg', 'https://commons.wikimedia.org/wiki/File:Map_of_Coffins_Patch_Sanctuary_Preservation_Area.jpg', 'Map of Coffins Patch Sanctuary Preservation Area.', 'NOAA', 'Public domain'),
  ],
  'Conch Reef': [
    photo('https://upload.wikimedia.org/wikipedia/commons/e/ef/Corals_Conch_Reef_20230713.jpg', 'https://commons.wikimedia.org/wiki/File:Corals_Conch_Reef_20230713.jpg', 'Corals at Conch Reef.', 'Jstuby', 'CC0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/e/ee/Corals_2_Conch_Reef_20230713.jpg', 'https://commons.wikimedia.org/wiki/File:Corals_2_Conch_Reef_20230713.jpg', 'Coral habitat at Conch Reef.', 'Jstuby', 'CC0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/9/9d/Diver_capturing_Aquarius_Reef_Base.jpg', 'https://commons.wikimedia.org/wiki/File:Diver_capturing_Aquarius_Reef_Base.jpg', 'Diver photographing Aquarius Reef Base at Conch Reef.', 'NOAA / Maya Walton', 'Public domain'),
  ],
  'Crocker Reef': [
    photo('https://upload.wikimedia.org/wikipedia/commons/c/c5/Buoys_at_Crocker_Reef.jpg', 'https://commons.wikimedia.org/wiki/File:Buoys_at_Crocker_Reef.jpg', 'Mooring buoys at Crocker Reef.', 'NOAA', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/d/d6/Catlin_Seaview_tripod_system_at_Crocker_reef_1.jpg', 'https://commons.wikimedia.org/wiki/File:Catlin_Seaview_tripod_system_at_Crocker_reef_1.jpg', 'Reef survey equipment at Crocker Reef.', 'NOAA / Maya Walton', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/3/37/Catlin_Seaview_tripod_system_at_Crocker_reef_2.jpg', 'https://commons.wikimedia.org/wiki/File:Catlin_Seaview_tripod_system_at_Crocker_reef_2.jpg', 'Diver using survey equipment at Crocker Reef.', 'NOAA / Maya Walton', 'Public domain'),
  ],
  'Davis Ledge': [
    photo('https://upload.wikimedia.org/wikipedia/commons/0/0b/Coral_Davis_Reef_20230712.jpg', 'https://commons.wikimedia.org/wiki/File:Coral_Davis_Reef_20230712.jpg', 'Coral at Davis Reef.', 'Jstuby', 'CC0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/8/8d/Budha_statue_Davis_Reef_20230712.jpg', 'https://commons.wikimedia.org/wiki/File:Budha_statue_Davis_Reef_20230712.jpg', 'Underwater Buddha statue at Davis Reef.', 'Jstuby', 'CC0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/2/24/Blue_Tang_Davis_Reef_20230712.jpg', 'https://commons.wikimedia.org/wiki/File:Blue_Tang_Davis_Reef_20230712.jpg', 'Blue tang at Davis Reef.', 'Jstuby', 'CC0'),
  ],
  'Eastern Dry Rocks': [
    photo('https://upload.wikimedia.org/wikipedia/commons/c/c1/Sand_Key_Rock_Key_Eastern_Dry_Rocks_1970_1VCLP00010044.jpg', 'https://commons.wikimedia.org/wiki/File:Sand_Key_Rock_Key_Eastern_Dry_Rocks_1970_1VCLP00010044.jpg', 'Aerial view including Eastern Dry Rocks.', 'James Stuby, based on USGS imagery', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/0/0c/Map_of_Eastern_Dry_Rocks_Sanctuary_Preservation_Area.jpg', 'https://commons.wikimedia.org/wiki/File:Map_of_Eastern_Dry_Rocks_Sanctuary_Preservation_Area.jpg', 'Map of Eastern Dry Rocks Sanctuary Preservation Area.', 'NOAA', 'Public domain'),
  ],
  'Elbow': [
    photo('https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/City_Of_Washington_%2838741160925%29.jpg/1920px-City_Of_Washington_%2838741160925%29.jpg', 'https://commons.wikimedia.org/wiki/File:City_Of_Washington_(38741160925).jpg', 'The City of Washington wreck at the Elbow reef.', 'National Marine Sanctuaries', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/f/fa/Map_of_the_Elbow_Sanctuary_Preservation_Area.jpg', 'https://commons.wikimedia.org/wiki/File:Map_of_the_Elbow_Sanctuary_Preservation_Area.jpg', 'Map of the Elbow Sanctuary Preservation Area.', 'NOAA', 'Public domain'),
  ],
  'French Reef': [
    photo('https://upload.wikimedia.org/wikipedia/commons/3/3e/French_Reef%2C_Key_Largo_%2815438400026%29.jpg', 'https://commons.wikimedia.org/wiki/File:French_Reef,_Key_Largo_(15438400026).jpg', 'Coral formations at French Reef.', 'Matt Kieffer', 'CC BY-SA 2.0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/d/dd/Filefish_on_French_Reef%2C_Key_Largo_%2815274917287%29.jpg', 'https://commons.wikimedia.org/wiki/File:Filefish_on_French_Reef,_Key_Largo_(15274917287).jpg', 'Filefish at French Reef.', 'Matt Kieffer', 'CC BY-SA 2.0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/5/53/Glassy_Sweeper_Fish_inside_cave_on_French_Reef%2C_Key_Largo_%2815461169962%29.jpg', 'https://commons.wikimedia.org/wiki/File:Glassy_Sweeper_Fish_inside_cave_on_French_Reef,_Key_Largo_(15461169962).jpg', 'Glassy sweepers in an open formation at French Reef.', 'Matt Kieffer', 'CC BY-SA 2.0'),
  ],
  'Grecian Rocks': [
    photo('https://upload.wikimedia.org/wikipedia/commons/d/d2/Map_of_Grecian_Rocks_Sanctuary_Preservation_Area.jpg', 'https://commons.wikimedia.org/wiki/File:Map_of_Grecian_Rocks_Sanctuary_Preservation_Area.jpg', 'Map of Grecian Rocks Sanctuary Preservation Area.', 'NOAA', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/1/13/SVII_camera_system_at_Grecian_Rocks.jpg', 'https://commons.wikimedia.org/wiki/File:SVII_camera_system_at_Grecian_Rocks.jpg', 'NOAA imaging work at Grecian Rocks.', 'NOAA / Maya Walton', 'Public domain'),
  ],
  'Hen and Chickens': [
    photo('https://upload.wikimedia.org/wikipedia/commons/7/77/Hen_Chicken_reef_1999.jpg', 'https://commons.wikimedia.org/wiki/File:Hen_Chicken_reef_1999.jpg', 'Coral habitat at Hen and Chickens Reef.', 'Jstuby', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/e/e5/Gray_Angelfish_Hen_and_Chickens_Reef_1999.jpg', 'https://commons.wikimedia.org/wiki/File:Gray_Angelfish_Hen_and_Chickens_Reef_1999.jpg', 'Gray angelfish at Hen and Chickens Reef.', 'Jstuby', 'CC0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/0/0c/Knobby_Star_Coral_Hen_and_Chickens_Reef_1999.jpg', 'https://commons.wikimedia.org/wiki/File:Knobby_Star_Coral_Hen_and_Chickens_Reef_1999.jpg', 'Knobby star coral at Hen and Chickens Reef.', 'Jstuby', 'CC0'),
  ],
  'Nine Foot Stake': [
    photo('https://upload.wikimedia.org/wikipedia/commons/b/bd/Grunts_9-ft_2010.jpg', 'https://commons.wikimedia.org/wiki/File:Grunts_9-ft_2010.jpg', 'Grunts at Nine Foot Stake Reef.', 'Jstuby', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/3/34/Chromis_9ft_Stake_2010.jpg', 'https://commons.wikimedia.org/wiki/File:Chromis_9ft_Stake_2010.jpg', 'Chromis at Nine Foot Stake Reef.', 'Jstuby', 'CC0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/e/e0/Brain_coral_9ft_Stake_2010.jpg', 'https://commons.wikimedia.org/wiki/File:Brain_coral_9ft_Stake_2010.jpg', 'Brain coral at Nine Foot Stake Reef.', 'Jstuby', 'CC0'),
  ],
  'Newfound Harbor': [
    photo('https://upload.wikimedia.org/wikipedia/commons/e/ea/Map_of_Newfound_Harbor_Key_Sanctuary_Preservation_Area.jpg', 'https://commons.wikimedia.org/wiki/File:Map_of_Newfound_Harbor_Key_Sanctuary_Preservation_Area.jpg', 'Map of Newfound Harbor Key Sanctuary Preservation Area.', 'NOAA', 'Public domain'),
    photo('https://upload.wikimedia.org/wikipedia/commons/5/53/Newfound_Harbor_SPA_1979_1VEOR00120235.jpg', 'https://commons.wikimedia.org/wiki/File:Newfound_Harbor_SPA_1979_1VEOR00120235.jpg', 'Aerial view of the Newfound Harbor sanctuary area.', 'James Stuby, based on USGS imagery', 'Public domain'),
  ],
  'Pickles Reef': [
    photo('https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Acropora_palmata_01_Pickles_Reef_20230713.jpg/1920px-Acropora_palmata_01_Pickles_Reef_20230713.jpg', 'https://commons.wikimedia.org/wiki/File:Acropora_palmata_01_Pickles_Reef_20230713.jpg', 'Elkhorn coral at Pickles Reef.', 'Jstuby', 'CC0'),
    photo('https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Acropora_palmata_02_Pickles_Reef_20230713.jpg/1920px-Acropora_palmata_02_Pickles_Reef_20230713.jpg', 'https://commons.wikimedia.org/wiki/File:Acropora_palmata_02_Pickles_Reef_20230713.jpg', 'Elkhorn coral habitat at Pickles Reef.', 'Jstuby', 'CC0'),
    photo('https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Acropora_palmata_03_Pickles_Reef_20230713.jpg/1920px-Acropora_palmata_03_Pickles_Reef_20230713.jpg', 'https://commons.wikimedia.org/wiki/File:Acropora_palmata_03_Pickles_Reef_20230713.jpg', 'Elkhorn coral colony at Pickles Reef.', 'Jstuby', 'CC0'),
  ],
  'Rock Key': [
    photo('https://upload.wikimedia.org/wikipedia/commons/a/a5/Map_of_Rock_Key_Sanctuary_Preservation_Area.jpg', 'https://commons.wikimedia.org/wiki/File:Map_of_Rock_Key_Sanctuary_Preservation_Area.jpg', 'Map of Rock Key Sanctuary Preservation Area.', 'NOAA', 'Public domain'),
    photo('https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Sand_Key_Rock_Key_Eastern_Dry_Rocks_1970_1VCLP00010044.jpg/1920px-Sand_Key_Rock_Key_Eastern_Dry_Rocks_1970_1VCLP00010044.jpg', 'https://commons.wikimedia.org/wiki/File:Sand_Key_Rock_Key_Eastern_Dry_Rocks_1970_1VCLP00010044.jpg', 'Aerial view including Rock Key.', 'James Stuby, based on USGS imagery', 'Public domain'),
  ],
  'Snapper Ledge': [
    photo('https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Black-ball_sponge_Snapper_Ledge_20080310.jpg/1920px-Black-ball_sponge_Snapper_Ledge_20080310.jpg', 'https://commons.wikimedia.org/wiki/File:Black-ball_sponge_Snapper_Ledge_20080310.jpg', 'Black-ball sponge at Snapper Ledge.', 'Jstuby', 'CC0'),
    photo('https://upload.wikimedia.org/wikipedia/commons/8/81/Brain_coral_Snapper_Ledge_20080310.jpg', 'https://commons.wikimedia.org/wiki/File:Brain_coral_Snapper_Ledge_20080310.jpg', 'Brain coral at Snapper Ledge.', 'Jstuby', 'CC0'),
    photo('https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Caribean_Barrel_Sponge_Snapper_Ledge_20080310.jpg/1920px-Caribean_Barrel_Sponge_Snapper_Ledge_20080310.jpg', 'https://commons.wikimedia.org/wiki/File:Caribean_Barrel_Sponge_Snapper_Ledge_20080310.jpg', 'Caribbean barrel sponge at Snapper Ledge.', 'Jstuby', 'CC0'),
  ],
  'Turtle Rocks': [
    photo('https://upload.wikimedia.org/wikipedia/commons/4/44/Buoys_at_Turtle_Rocks.jpg', 'https://commons.wikimedia.org/wiki/File:Buoys_at_Turtle_Rocks.jpg', 'Mooring buoys at Turtle Rocks.', 'NOAA', 'Public domain'),
  ],
  'Western Sambo': [
    photo('https://upload.wikimedia.org/wikipedia/commons/1/17/Map_of_Western_Sambo_Ecological_Reserve.jpg', 'https://commons.wikimedia.org/wiki/File:Map_of_Western_Sambo_Ecological_Reserve.jpg', 'Map of Western Sambo Ecological Reserve.', 'NOAA', 'Public domain'),
  ],
}

const overrides: Record<string, Partial<DiveSiteEnrichment>> = {
  'Adelaide Baker (Shipwreck Trail)': {
    canonicalName: 'Adelaide Baker', aliases: ['Conrad', 'F. W. Carver'], summary: 'Scattered remains of a nineteenth-century wooden bark on Coffins Patch Reef.', description: 'The iron-rigged, iron-reinforced wooden hull lies in about 20 feet of water. NOAA describes two main artifact clusters, including mast sections, tanks, rigging and structural iron now supporting gorgonians, sponges and encrusting corals.', knownDepth: { minimumMeters: null, maximumMeters: 6.1, sourceText: 'NOAA: 20 feet' }, characteristics: ['Scattered historic wreckage', 'Shallow reef setting'], highlights: ['A 77-foot iron mast', 'Two main archaeology clusters'], marineLife: ['Gorgonians', 'Sponges', 'Encrusting corals'], experienceNotes: 'Shallow water, but archaeological remains are fragile and must not be disturbed.', history: 'Built in Maine in 1863 as F. W. Carver, later renamed Adelaide Baker; wrecked in 1889 after striking Coffins Patch Reef.', sources: [noaaShipwreckSource('adelaide', 'Adelaide Baker')], matchStatus: 'verified',
  },
  'Amesbury Wreck (Shipwreck Trail)': {
    canonicalName: 'USS Amesbury', aliases: ["Alexander's Wreck", 'DE-66', 'APD-46'], summary: 'A broken former U.S. Navy destroyer escort and high-speed transport west of Key West.', description: 'Two major hull and superstructure sections lie roughly 600 feet apart, with gun mounts, collapsed bridge material, davits and other debris visible.', knownDepth: { minimumMeters: null, maximumMeters: 9.1, sourceText: 'NOAA: less than 30 feet' }, characteristics: ['Two separated wreck sections', 'Artificial reef'], highlights: ['Five-inch gun mount', 'Twin 40 mm gun mount', 'Landing-craft davits'], history: 'Commissioned in 1943, Amesbury served in Atlantic and Pacific operations. It grounded and broke apart in a storm while being moved for artificial-reef sinking.', sources: [noaaShipwreckSource('amesbury', 'Amesbury')], matchStatus: 'verified',
  },
  'Benwood Wreck (Shipwreck Trail)': {
    canonicalName: 'Benwood', aliases: ['SS Benwood'], summary: 'A popular World War II-era freighter wreck between French Reef and Dixie Shoals.', description: 'The wreck ranges from about 25 to 45 feet. Its crushed bow has the greatest relief; much of the remaining hull structure is open and spread across a broad area.', knownDepth: { minimumMeters: 7.6, maximumMeters: 13.7, sourceText: 'NOAA: 25–45 feet' }, characteristics: ['Historic freighter wreck', 'Low-profile reef and sand'], highlights: ['Crushed bow', 'Open hull framing'], marineLife: ['Schools of grunts', 'Porkfish'], history: 'The Norwegian-owned freighter collided with Robert C. Tuttle during blackout conditions on April 9, 1942, and was later salvaged and used for target practice.', sources: [noaaShipwreckSource('benwood', 'Benwood'), KEYS_DIVING], matchStatus: 'verified',
  },
  'Duane Wreck (Shipwreck Trail)': {
    canonicalName: 'USCGC Duane', aliases: ['WPG-33', 'WHEC-33'], summary: 'An upright, largely intact Treasury-class Coast Guard cutter off Key Largo.', description: 'The cutter stands upright on sand in 120 feet, with the crow’s nest near 60 feet, bridge near 70 feet, superstructure deck near 90 feet and main deck near 100 feet.', knownDepth: { minimumMeters: 18.3, maximumMeters: 36.6, sourceText: 'NOAA: crow’s nest 60 feet; bottom 120 feet' }, characteristics: ['Deep upright wreck', 'Artificial reef'], highlights: ['Crow’s nest', 'Bridge and superstructure', 'Original rudders and propellers'], currentNotes: 'NOAA notes that deeper Shipwreck Trail sites may experience swift current.', experienceNotes: 'A deep wreck requiring training and planning appropriate to depth and conditions.', history: 'Built in 1936, Duane served in wartime, rescue and law-enforcement roles before being sunk as an artificial reef on November 27, 1987.', sources: [noaaShipwreckSource('duane', 'Duane')], matchStatus: 'verified',
  },
  'Eagle Wreck (Shipwreck Trail)': {
    canonicalName: 'Eagle', aliases: ['Raila Dan', 'Arron K.', 'Eagle Tire Company'], summary: 'A 287-foot artificial reef lying on its starboard side northeast of Alligator Reef Light.', description: 'Deck railings are near 70 feet and the propeller and rudder near 110 feet. Hurricane Georges split the wreck in two in 1998.', knownDepth: { minimumMeters: 21.3, maximumMeters: 33.5, sourceText: 'NOAA: railings 70 feet; bottom features 110 feet' }, characteristics: ['Deep artificial reef', 'Freighter wreck on starboard side'], highlights: ['Cargo booms', 'Mast assemblies', 'Anchor chain'], history: 'Launched in 1962, the fire-damaged freighter was prepared and sunk as an artificial reef in 1985.', sources: [noaaShipwreckSource('eagle', 'Eagle'), KEY_DIVES_SITES], matchStatus: 'verified',
  },
  'North American': {
    canonicalName: 'North America', aliases: ['North American', 'Delta Shoal Shipwreck Site D'], summary: 'A shallow wooden wreck believed, but not conclusively proven, to be the 1842 loss North America.', description: 'Lower wooden hull remains and an oval ballast pile rest in about 14 feet of water in sand and turtle grass near Delta Shoals.', knownDepth: { minimumMeters: null, maximumMeters: 4.3, sourceText: 'NOAA: 14 feet' }, characteristics: ['Shallow archaeological wreck', 'Ballast pile and buried timbers'], highlights: ['Exposed wooden hull timbers', 'Stone ballast'], history: 'Court records describe a three-masted vessel named North America lost on Delta Shoals in 1842. NOAA explicitly notes that the identification is not confirmed.', sources: [noaaShipwreckSource('northamerica', 'North America')], matchStatus: 'partial', researchNotes: 'GIS name is “North American”; NOAA uses “North America.” The near-exact name and Florida Keys context support the match, but NOAA states the wreck identity itself is unconfirmed.',
  },
  'San Pedro Wreck (Shipwreck Trail)': {
    canonicalName: 'San Pedro', aliases: ['San Pedro Underwater Archaeological Preserve'], summary: 'A shallow 1733 Spanish treasure-fleet wreck and underwater archaeological preserve south of Indian Key.', description: 'Ballast stones, replica cannons, an interpretive plaque and an anchor form a shallow artificial patch reef accessible to divers and snorkelers.', knownDepth: { minimumMeters: null, maximumMeters: 5.5, sourceText: 'NOAA and Florida State Parks: 18 feet' }, characteristics: ['Historic wreck', 'Shallow archaeological preserve'], highlights: ['Ballast pile', 'Replica cannons', 'Interpretive plaque'], marineLife: ['Grunts', 'Snappers', 'Spadefish', 'Groupers', 'Moray eels'], experienceNotes: 'Florida State Parks describes the site as suitable for beginning snorkelers and divers; artifacts and marine life are protected.', history: 'The Dutch-built vessel sank with the 1733 Spanish fleet during a hurricane. It was heavily salvaged before later state and federal protection.', sources: [noaaShipwreckSource('sanpedro', 'San Pedro'), source('San Pedro Underwater Archaeological Preserve State Park', 'https://www.floridastateparks.org/SanPedro', 'government')], matchStatus: 'verified',
  },
  'Adolphus Busch Wreck': {
    canonicalName: 'Adolphus Busch Sr.', aliases: ['London', 'Topsail Star', 'Windsor Trader', 'Ocean Alley'], summary: 'A 210-foot Lower Keys artificial reef resting upright on sand.', description: 'The intact freighter was intentionally sunk in 112 feet in 1998. Its wheelhouse is near 70 feet and main deck near 90 feet, with prepared openings in the hull.', knownDepth: { minimumMeters: 21.3, maximumMeters: 34.1, sourceText: 'Official Keys tourism: wheelhouse 70 feet; bottom 112 feet' }, characteristics: ['Deep upright artificial reef', 'Prepared wreck access points'], highlights: ['Wheelhouse', 'Main deck', 'Large hull openings'], marineLife: ['Goliath grouper', 'Tarpon', 'Snappers', 'Barracuda', 'Reef sharks'], experienceNotes: 'Depth makes this an advanced dive even though the wreck has prepared openings.', history: 'Built in Scotland in 1951 and sunk as the Lower Keys’ first artificial reef in 1998.', sources: [source('Adolphus Busch Sr. Wreck', 'https://visitfloridakeys.com/experiences/what-were-famous-for/diving-snorkeling/shipwrecks/adolphus-busch-sr', 'official-tourism')], matchStatus: 'verified',
  },
  'Spiegel Grove Wreck': {
    canonicalName: 'USS Spiegel Grove', aliases: ['LSD-32'], summary: 'A 510-foot former U.S. Navy landing ship dock and major Key Largo artificial reef.', description: 'The immense wreck sits upright with the sandy bottom around 130 feet. Its scale, superstructure and developing reef ecosystem make it a multi-dive site.', knownDepth: { minimumMeters: null, maximumMeters: 39.6, sourceText: 'Official Keys tourism: sandy bottom about 130 feet' }, characteristics: ['Very large deep wreck', 'Artificial reef'], highlights: ['Massive superstructure', 'Commemorative plaque', 'Multiple mooring buoys'], marineLife: ['Large groupers', 'Schools of fish', 'Tropical reef fish', 'Coral growth'], currentNotes: 'Current and visibility vary; the official source notes the superstructure may fade from view even on a single dive.', experienceNotes: 'Official tourism guidance says this is not a beginner dive and recommends advanced qualification or equivalent reviewed experience; penetration requires overhead-environment training.', history: 'The ship served from 1956 to 1989 and was sunk off Key Largo in 2002; Hurricane Dennis moved it upright in 2005.', sources: [source('The Spiegel Grove Wreck', 'https://visitfloridakeys.com/experiences/what-were-famous-for/diving-snorkeling/shipwrecks/spiegel-grove', 'official-tourism')], matchStatus: 'verified',
  },
  'Vandenberg Wreck': {
    canonicalName: 'USNS General Hoyt S. Vandenberg', aliases: ['Gen. Hoyt S. Vandenberg', 'T-AGM-10'], summary: 'A 524-foot former missile-tracking ship intentionally sunk as an artificial reef south of Key West.', description: 'The ship rests upright in nearly 150 feet, with trimmed structures providing roughly 40–45 feet of surface clearance.', knownDepth: { minimumMeters: 12.2, maximumMeters: 45.7, sourceText: 'Official Keys tourism: 40–45 feet clearance; nearly 150 feet bottom' }, characteristics: ['Very large deep wreck', 'Artificial reef'], highlights: ['Former tracking antennas and superstructure', 'Extensive prepared wreck'], experienceNotes: 'A deep wreck for appropriately trained and experienced divers.', history: 'The former troop transport and Cold War missile-tracking ship was cleaned and intentionally sunk on May 27, 2009.', sources: [source('Vandenberg Wreck', 'https://visitfloridakeys.com/experiences/what-were-famous-for/diving-snorkeling/shipwrecks/vandenberg', 'official-tourism')], matchStatus: 'verified',
  },
  'Bibb Wreck': {
    canonicalName: 'USCGC Bibb', aliases: ['WPG-31', 'WHEC-31'], summary: 'A deep Treasury-class Coast Guard cutter sunk as an artificial reef off Key Largo.', description: 'The Bibb is one of Key Largo’s signature deep wrecks and is listed by NOAA among sanctuary artificial-reef mooring locations.', characteristics: ['Deep artificial reef', 'Coast Guard cutter'], currentNotes: 'Deep-wreck trips can encounter strong currents.', experienceNotes: 'Advanced/deep-diving experience is appropriate.', sources: [NOAA_MOORINGS, SAIL_FISH_SITES], matchStatus: 'verified',
  },
  'Cayman Salvor Wreck': {
    canonicalName: 'Cayman Salvager', aliases: ['Cayman Salvor'], summary: 'A Key West artificial-reef wreck listed in NOAA’s sanctuary mooring system.', description: 'Local operator information identifies Cayman Salvager as one of the wreck dives commonly visited from Key West.', characteristics: ['Artificial reef wreck'], sources: [NOAA_MOORINGS, CAPTAIN_HOOKS_KEYS], matchStatus: 'partial', researchNotes: 'The GIS uses “Cayman Salvor”; local sources commonly use “Cayman Salvager.”',
  },
  'Alligator Reef': {
    canonicalName: 'Alligator Reef', summary: 'A protected Islamorada reef centered near the historic Alligator Reef Lighthouse.', description: 'Key Dives describes a shallow, fish-rich reef used for diving, snorkeling and coral-restoration work.', knownDepth: { minimumMeters: null, maximumMeters: 7.6, sourceText: 'Key Dives: approximately 25 feet' }, characteristics: ['Shallow coral reef', 'Sanctuary Preservation Area'], highlights: ['Historic lighthouse', 'Coral restoration sites'], marineLife: ['Moray eels', 'Nurse sharks', 'Sea turtles', 'Abundant reef fish'], experienceNotes: 'Shallow profile is generally suitable for recreational divers; conditions still require operator assessment.', sources: [NOAA_SPAS, KEY_DIVES_SITES], matchStatus: 'verified',
  },
  'Coffins Patch': {
    canonicalName: 'Coffins Patch', summary: 'A group of shallow patch reefs offshore of Marathon and Key Colony Beach.', description: 'The protected reef complex has multiple moorings, pillar coral, a staghorn nursery and typically mild current.', knownDepth: { minimumMeters: null, maximumMeters: 7.6, sourceText: 'Captain Hook’s: approximately 20–25 feet' }, characteristics: ['Shallow patch-reef complex', 'Sanctuary Preservation Area'], highlights: ['Pillar coral formation', 'Staghorn coral nursery'], marineLife: ['Tropical reef fish', 'Lobsters', 'Occasional eagle rays'], visibility: 'Official operator guidance says visibility is generally good but can be reduced by disturbed sand.', currentNotes: 'Official operator guidance describes current as usually minimal.', experienceNotes: 'Described by the operator as suitable for snorkelers, novice divers and training dives.', sources: [NOAA_SPAS, source('Coffins Patch Reef Guide', 'https://captainhooks.com/coffins-patch/', 'official-business')], matchStatus: 'verified',
  },
  'Crocker Reef': {
    canonicalName: 'Crocker Reef', summary: 'An expansive Islamorada reef tract with shallow formations and deeper valleys.', description: 'The site includes spur-and-groove structure, sand channels and sections dropping toward deeper sand.', knownDepth: { minimumMeters: 9.1, maximumMeters: 27.4, sourceText: 'Key Dives: 30–90 feet' }, characteristics: ['Spur-and-groove reef', 'Deep valleys and sand'], marineLife: ['Sea turtles', 'Nurse sharks', 'Stingrays', 'Angelfish', 'Butterflyfish'], sources: [NOAA_MOORINGS, KEY_DIVES_SITES], matchStatus: 'verified',
  },
  'Davis Ledge': {
    canonicalName: 'Davis Reef', aliases: ['Davis Ledge'], summary: 'A shallow Islamorada reef with a low ledge, sea fans and overhangs.', description: 'The reef is known for its decorated Buddha shrine, turtle habitat and coral-restoration work.', knownDepth: { minimumMeters: 4.6, maximumMeters: 6.1, sourceText: 'Key Dives: 15–20 feet' }, characteristics: ['Shallow ledge reef', 'Overhangs'], highlights: ['Underwater Buddha shrine', 'I.CARE coral outplanting'], marineLife: ['Sea turtles', 'Nurse sharks', 'Sea fans'], experienceNotes: 'Shallow site used for relaxed dives and night diving.', sources: [NOAA_SPAS, KEY_DIVES_SITES], matchStatus: 'verified',
  },
  'French Reef': {
    canonicalName: 'French Reef', summary: 'A large shallow Key Largo reef known for open swim-through formations.', description: 'The reef extends along the outer reef line with coral formations, sand areas, ledges and named openings such as Christmas Tree Cave and Hourglass Cave.', knownDepth: { minimumMeters: 6.1, maximumMeters: 13.7, sourceText: 'Sail Fish Scuba: 20–45 feet' }, characteristics: ['Shallow coral reef', 'Open swim-throughs and overhangs'], highlights: ['Christmas Tree Cave', 'Sand Bottom Cave', 'Hourglass Cave'], experienceNotes: 'Good buoyancy control is important around coral; the named “caves” are open reef formations rather than enclosed caves.', sources: [source('French Reef', 'https://sailfishscuba.com/french-reef', 'official-business')], matchStatus: 'verified',
  },
  'Key Largo Dry Rocks': {
    canonicalName: 'Key Largo Dry Rocks', aliases: ['Christ of the Abyss'], summary: 'A shallow protected reef best known for the Christ of the Abyss statue.', description: 'The bronze statue stands among coral formations in shallow water and can be viewed by both divers and snorkelers.', knownDepth: { minimumMeters: null, maximumMeters: 7.6, sourceText: 'Official Keys tourism: statue in about 25 feet' }, characteristics: ['Shallow coral reef', 'Sanctuary Preservation Area'], highlights: ['Christ of the Abyss statue'], experienceNotes: 'Popular with snorkelers and recreational divers; use moorings and avoid coral contact.', sources: [NOAA_SPAS, source('Key Largo Diving and Snorkeling', 'https://fla-keys.com/key-largo/diving/', 'official-tourism')], matchStatus: 'verified',
  },
  'Looe Key': {
    canonicalName: 'Looe Key Reef', summary: 'A protected Lower Keys spur-and-groove reef with high fish and coral diversity.', description: 'Looe Key supports shallow patch reefs and deeper reef structure and is served by sanctuary mooring buoys.', characteristics: ['Spur-and-groove coral reef', 'Sanctuary Preservation Area'], highlights: ['Extensive coral formations', 'Long-established sanctuary site'], marineLife: ['Sea turtles', 'Snook', 'Permit', 'Trumpetfish', 'Octopus', 'Diverse reef fish'], sources: [NOAA_SPAS, KEYS_DIVING, CAPTAIN_HOOKS_MARATHON], matchStatus: 'verified',
  },
  'Molasses Reef': {
    canonicalName: 'Molasses Reef', summary: 'A large, heavily visited Key Largo reef with many moorings and varied reef profiles.', description: 'The reef spans many individual sites, including coral heads, sand channels, historic wreck traces and restoration areas.', knownDepth: { minimumMeters: 3, maximumMeters: 18.3, sourceText: 'Sail Fish Scuba: 10–60 feet' }, characteristics: ['Large barrier-reef complex', 'Sanctuary Preservation Area'], highlights: ['Hole in the Wall', 'Spanish Anchor', 'Winch Hole', 'Wellwood restoration area'], marineLife: ['Groupers', 'Reef sharks', 'Eagle rays', 'Tropical reef fish'], sources: [NOAA_SPAS, SAIL_FISH_SITES], matchStatus: 'verified',
  },
  'Rocky Top': {
    canonicalName: 'Rocky Top', summary: 'A shallow Islamorada patch reef associated with coral restoration.', description: 'Key Dives describes healthy coral, schools of grunts and an I.CARE coral-outplanting area.', knownDepth: { minimumMeters: null, maximumMeters: 7.6, sourceText: 'Key Dives: approximately 25 feet' }, characteristics: ['Shallow patch reef'], highlights: ['I.CARE coral outplanting'], marineLife: ['Green sea turtles', 'Tomtate', 'Smallmouth grunts'], sources: [KEY_DIVES_SITES], matchStatus: 'verified',
  },
  'Sombrero Reef': {
    canonicalName: 'Sombrero Reef', aliases: ['Sombrero Key Reef'], summary: 'A protected Marathon reef marked by the historic Sombrero Key Lighthouse.', description: 'The reef has shallow coral gardens and spur-and-groove formations and is widely used for snorkeling and recreational diving.', knownDepth: { minimumMeters: 4.6, maximumMeters: 9.1, sourceText: 'Captain Hook’s: approximately 15–30+ feet' }, characteristics: ['Shallow spur-and-groove reef', 'Sanctuary Preservation Area'], highlights: ['Sombrero Key Lighthouse'], marineLife: ['Sea turtles', 'Nurse sharks', 'Southern stingrays', 'Parrotfish', 'Yellowtail snapper'], currentNotes: 'Current can be present even on otherwise calm days.', sources: [NOAA_SPAS, source('Sombrero Reef Guide', 'https://captainhooks.com/sombrero-reef/', 'official-business')], matchStatus: 'verified',
  },
  'Western Sambo': {
    canonicalName: 'Western Sambo', summary: 'A protected Key West reef with classic spur-and-groove formations.', description: 'Official operator information describes reef depths from very shallow water to about 30 feet and abundant coral and marine life.', knownDepth: { minimumMeters: 0.9, maximumMeters: 9.1, sourceText: 'Captain Hook’s: 3–30 feet' }, characteristics: ['Spur-and-groove coral reef', 'Ecological reserve / protected area'], marineLife: ['Sharks', 'Sea turtles', 'Stingrays', 'Reef fish'], sources: [NOAA_MOORINGS, CAPTAIN_HOOKS_MARATHON], matchStatus: 'verified',
  },
  'Conch Reef Wall': {
    canonicalName: 'Conch Reef Wall',
    summary: 'The deeper edge of Conch Reef, which NOAA describes as one of the best-developed reef-wall systems in the Florida Keys.',
    description: 'NOAA sources describe Conch Reef as a tiered reef with a well-developed wall; the named wall site is also listed in the sanctuary mooring-buoy system.',
    characteristics: ['Reef wall', 'Deeper reef edge'],
    sources: [NOAA_MOORINGS, NOAA_SPAS],
    matchStatus: 'verified',
  },
  "Joe's Tug Wreck": {
    canonicalName: "Joe's Tug",
    summary: 'A 90-foot steel tug used as an artificial reef off Key West.',
    description: 'The Florida Fish and Wildlife Conservation Commission lists Joe’s Tug as a steel artificial reef in about 65 feet of water.',
    knownDepth: { minimumMeters: null, maximumMeters: 19.8, sourceText: 'FWC: 65 feet' },
    characteristics: ['Steel tug wreck', 'Artificial reef'],
    sources: [FWC_ARTIFICIAL_REEFS],
    matchStatus: 'verified',
  },
  'Toppinos Marker': {
    canonicalName: "Toppino's Reef",
    aliases: ['Marker Reef #1', 'Red 32'],
    summary: 'A shallow Key West reef also known as Toppino’s Reef or Marker Reef #1.',
    description: 'The official operator guide describes coral fingers, spur-and-groove formations and three mooring buoys in water no deeper than about 25 feet.',
    knownDepth: { minimumMeters: null, maximumMeters: 7.6, sourceText: 'Key West Dive Center: maximum 25 feet' },
    characteristics: ['Shallow reef', 'Coral fingers', 'Spur-and-groove formations'],
    highlights: ['Tall coral fingers', 'Three mooring buoys'],
    marineLife: ['Grunts', 'Yellowtail snapper', 'Butterflyfish', 'Parrotfish', 'Tangs'],
    experienceNotes: 'Suitable for shallow diving and snorkeling; the operator also identifies it as a night-diving site.',
    sources: [source("Toppino's Reef", 'https://www.keywestdivecenter.com/toppinos-reef/', 'official-business')],
    matchStatus: 'verified',
  },
}

function genericSources(siteName: string): EnrichmentSource[] {
  if (spaSites.has(siteName)) return [NOAA_SPAS, NOAA_MOORINGS]
  if (mooringSites.has(siteName)) return [NOAA_MOORINGS]
  return []
}

function genericDescription(siteName: string): string | null {
  if (spaSites.has(siteName)) {
    return 'NOAA identifies this named reef within a Sanctuary Preservation Area, where diving and snorkeling are allowed and mooring buoys help prevent anchor damage.'
  }
  if (mooringSites.has(siteName)) {
    return 'NOAA lists this named location in the Florida Keys National Marine Sanctuary mooring-buoy network used to support reef or wreck access without anchoring.'
  }
  return null
}

export const diveSitesEnrichment: DiveSiteEnrichment[] = siteNames.map(
  (siteName) => {
    const recordOverride = overrides[siteName] ?? {}
    const sources = recordOverride.sources ?? genericSources(siteName)

    const record: DiveSiteEnrichment = {
      siteName,
      canonicalName: recordOverride.canonicalName ?? siteName,
      aliases: recordOverride.aliases ?? [],
      summary:
        recordOverride.summary ??
        (sources.length > 0
          ? 'Named Florida Keys National Marine Sanctuary reef or wreck location.'
          : null),
      description:
        recordOverride.description ?? genericDescription(siteName),
      diveType: wreckSites.has(siteName)
        ? 'wreck'
        : wallSites.has(siteName)
          ? 'wall'
          : 'reef',
      knownDepth: recordOverride.knownDepth ?? null,
      characteristics: recordOverride.characteristics ?? [],
      highlights: recordOverride.highlights ?? [],
      marineLife: recordOverride.marineLife ?? [],
      visibility: recordOverride.visibility ?? null,
      currentNotes: recordOverride.currentNotes ?? null,
      experienceNotes: recordOverride.experienceNotes ?? null,
      history: recordOverride.history ?? null,
      photos: sitePhotos[siteName] ?? [],
      sources,
      matchStatus:
        recordOverride.matchStatus ??
        (sources.length > 0 ? 'partial' : 'unresolved'),
      inferredFields: recordOverride.inferredFields ?? [],
      researchNotes:
        recordOverride.researchNotes ??
        (sources.length === 0
          ? 'No sufficiently specific, reliable public source was matched during Phase 8A research.'
          : null),
    }
    return { ...record, ...localizedSiteFields(record) }
  },
)

export const diveSiteEnrichmentSourceNotes = {
  researchedAt: '2026-09-20',
  scope:
    'Source-linked content references only. Live conditions are intentionally not asserted; divers must use current operator and authority guidance.',
  sourcePolicy:
    'Government and official tourism sources are authoritative. Official dive-operator pages are used for local site descriptions and clearly identified as business sources.',
  coreDataPolicy:
    'Depth values marked as demonstration data in the GIS layer were not copied into enrichment. Only depths explicitly stated by a cited source are included.',
  generalSafetySource: NOAA_DIVING,
}
