# DATA AND THIRD-PARTY LICENSES

This file records the third-party software, data and services currently used or referenced by RUSSIA: LIFE & BEYOND. It is not legal advice. Check the linked terms again before changing providers or deploying a new data source.

## 1. Project code and procedural artwork

The game's own JavaScript, HTML, CSS, hand-authored scene layouts, curated notes and procedural Canvas drawings are maintained in this repository. No third-party image, sprite or audio asset files are bundled.

There is currently **no repository-wide `LICENSE` file**. This document does not grant a license to the project's own source code. The repository owner should choose and add a project license separately if redistribution is intended.

## 2. OpenStreetMap data

- Website: https://www.openstreetmap.org/
- Copyright and license: https://www.openstreetmap.org/copyright
- License: Open Data Commons Open Database License (ODbL).
- Required attribution when OSM data is displayed: **© OpenStreetMap contributors**.
- The attribution should link to the OSM copyright page and make the ODbL available to users.

OpenStreetMap is the underlying source of the OpenFreeMap tiles that the optional live map integration is designed to display. This repository does not currently ship a downloaded OSM extract or a self-hosted copy of the database.

## 3. OpenFreeMap and OpenMapTiles

- Home: https://openfreemap.org/
- Quick start: https://openfreemap.org/quick_start/
- Terms of Service: https://openfreemap.org/tos/
- Privacy policy: https://openfreemap.org/privacy/
- Style used by the optional loader: `https://tiles.openfreemap.org/styles/liberty`
- OpenFreeMap project license: MIT; map data is from OpenStreetMap, with its ODbL obligations.

OpenFreeMap says its public vector-tile service is free and does not require an API key. It also states that there is no uptime/service-level guarantee and the service may change. MapLibre normally displays the style's supplied attribution automatically. OpenFreeMap's recommended non-MapLibre attribution is:

`OpenFreeMap © OpenMapTiles Data from OpenStreetMap`

**Age / integration condition:** The OpenFreeMap Terms of Service updated 14 October 2026 state that a person integrating the public service into a website or application must be at least 18 years old and legally able to enter the agreement. The terms distinguish integrators from end users who simply view an embedded map. For that reason, the repository's HTML sets the live-map approval flag to false and the game defaults to its schematic locator view. An adult project maintainer must independently review the current terms and privacy policy before making any decision about the live integration. Do not attempt to bypass the age requirement.

## 4. MapLibre GL JS

- Website and documentation: https://maplibre.org/maplibre-gl-js/docs/
- Repository: https://github.com/maplibre/maplibre-gl-js
- Version referenced by `js/travel.js`: **6.18.0**
- License: 3-Clause BSD.
- CDN paths (loaded only if the gated live map is approved): `https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl.mjs` and `https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl.css`.

MapLibre is the renderer, not the map-data provider. Its library license does not change the license of the map data or style.

## 5. Open-Meteo weather API

- API: https://open-meteo.com/
- Terms and license information: https://open-meteo.com/en/license
- API data license: Creative Commons Attribution 4.0 International (CC BY 4.0).
- Attribution: **Weather data by Open-Meteo.com**.

The game makes an optional request for current temperature, weather code, cloud cover and wind. The engine throttles requests and falls back to a simple monthly-climate table if the request fails, the browser is offline, or weather is switched off. The free API is intended for non-commercial use and fair use; Open-Meteo asks users with more than 10,000 requests per day to contact them. This game does not use a paid plan or API key.

Where live Open-Meteo values are shown, retain the attribution link and note changes if data is transformed.

## 6. PT Sans and PT Serif fonts

- Source catalogue: https://fonts.google.com/
- Google Fonts repository: https://github.com/google/fonts
- PT Serif family metadata: https://github.com/google/fonts/tree/main/ofl/ptserif
- License: SIL Open Font License 1.1 (OFL), with the Reserved Font Names **PT Sans**, **PT Serif** and **ParaType**.

The page requests PT Sans and PT Serif from Google Fonts. Font files are not copied into this repository. System font fallbacks remain available if Google Fonts cannot be reached. Do not modify the font files under the reserved family names without checking the OFL conditions.

## 7. Sources not currently integrated

These services may appear as links or future roadmap ideas, but the current code does not call their APIs:

| Source | License / conditions to check before use | Current status |
|---|---|---|
| Wikipedia article text | Usually CC BY-SA 4.0; verify each source and provide attribution / share-alike where required. https://www.mediawiki.org/wiki/Wikimedia_APIs/Content_reuse | Source links only; no live summary API |
| Wikidata | Structured data is CC0. https://www.wikidata.org/wiki/Wikidata:Licensing | Not queried |
| GBIF occurrence data | Dataset-specific CC0, CC BY or CC BY-NC license; cite the occurrence dataset and publisher. https://www.gbif.org/terms | Not queried; species list is curated in project data |
| OSRM demo server | Public demo policy limits use and provides no uptime guarantee; don't treat it as production routing. https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server | Not queried; travel is simulated |
| Geofabrik extracts | OSM-derived data remains subject to ODbL attribution/share-alike requirements. https://www.geofabrik.de/data/ | No extract downloaded |
| PMTiles | Software/tool license and the source-data license both apply; verify the exact version and pipeline before bundling. https://github.com/protomaps/PMTiles | Not used |

## 8. Attribution text shown in the game

When the live map is not enabled, the schematic locator does not display third-party basemap tiles.

If an adult maintainer later approves the live OpenFreeMap integration, keep MapLibre's attribution control visible and verify that the displayed attribution includes OpenStreetMap contributors and the OpenFreeMap / OpenMapTiles credit required by the active provider style. Keep this file and the terms links up to date.
