# RUSSIA: LIFE & BEYOND — The Living Atlas

A browser-based 2D life-simulation prototype set in real Russian locations. It combines hand-built local scenes, a character and needs simulation, a coordinate-based travel network, and a curated discovery journal.

**Play:** https://pritidipadas.github.io/RUSSIA-THE-LIVING-ATLAS/

## Current state

This repository is a playable prototype, not a complete simulation of the Russian Federation.

- **34 hand-built scene areas** across **7 playable destinations**: Moscow, Saint Petersburg, Kazan, Listvyanka/Lake Baikal, Terskol/Mount Elbrus, Sochi and Petropavlovsk-Kamchatsky.
- The first scene is the player's Moscow flat.
- The local renderer uses Canvas 2D and original procedural drawings in `js/art.js` and `js/art2.js`.
- The local environment is a hand-authored game template anchored to a real destination coordinate. It is not an exact, surveyed replica of every street or building.
- The travel network uses a small set of real city/settlement coordinates connected by **schematic routes**. Journeys are simulated and do not represent timetables, guaranteed roads, rail services, ticket prices or real navigation.
- The default map panel currently uses a **schematic locator view**. Live OpenFreeMap tile loading is disabled in the shipped page pending review of the provider's current age and integration terms by an adult project maintainer.
- Current weather is optional. If Open-Meteo is unavailable, the game uses a simple monthly-climate fallback.
- Save data is stored in the browser's localStorage. It is not uploaded to a game server.

## What works in this prototype

- Start a new game or continue a local save.
- Walk around the illustrated scene with a following camera.
- Use the keyboard or on-screen touch controls.
- Interact with the flat's bed, kitchen, shower, restroom, wardrobe and nearby scene objects.
- Track energy, hunger, thirst, hygiene, bladder, mood and social needs.
- Buy items, use food and water from the bag, and choose outfits.
- Visit the animal shelter scene, adopt a dog, and use the bag controls to feed or play with the pet.
- Talk to scene NPCs, collect nearby wildlife records and complete some mission conditions.
- Visit the seven playable destinations through the simulated travel network.
- Open the journal for the curated discovery facts and source links.
- Use the on-screen error panel if a script or runtime error occurs.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | WASD or arrow keys | Drag the on-screen joystick |
| Run | Hold Shift | Hold Run |
| Interact | E or Space | Use |
| World map | M | Map button |
| Journal | J | Journal button |
| Bag | I | Bag button |
| Menu | Escape | Menu button |

## Run and publish

The project has no npm install, bundler, build step or API key.

1. Keep the repository's existing folder structure.
2. In GitHub, open **Settings → Pages**.
3. Choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
4. Open the Play link above after GitHub Pages has finished deploying.

The page loads local JavaScript files in this order:

1. `css/js/data.js`
2. `js/art.js`
3. `js/art2.js`
4. `js/scenes.js`
5. `js/engine.js`
6. `js/travel.js`
7. `js/ui.js`

The data file is intentionally kept at its existing repository path, `css/js/data.js`. Do not rename it unless every script reference is updated in the same approved change.

## Saves and network behaviour

- Saves live in localStorage in the browser used to play. Clearing site data or switching browsers/devices can remove or separate saves.
- Open-Meteo is called only for optional current weather. The engine throttles requests and falls back to local monthly climate values if the request fails.
- Fonts are requested from Google Fonts, but CSS fallback fonts are declared.
- The schematic map and local Canvas scenes do not require map tiles.
- The live OpenFreeMap loader is present in `js/travel.js`, but the page sets its adult-approval gate to false. The current OpenFreeMap Terms of Service (updated 14 October 2026) say a person integrating the public service into a website or application must be at least 18. Do not activate that integration unless an adult project maintainer has independently reviewed and accepted the current terms. This project does not attempt to bypass that requirement.
- There is no service worker or offline asset cache. A fresh page load still needs GitHub Pages to deliver the game files. The map tiles, Google Fonts and weather service are not bundled locally.

## Test checklist

A browser smoke-test page is available at [tests/smoke.html](https://pritidipadas.github.io/RUSSIA-THE-LIVING-ATLAS/tests/smoke.html). It checks the scene catalogue, grid sizes, scene links, designated swimming tiles, discovery sources, artwork registrations and module entry points. It does not modify the game save.

Manual gameplay checks to perform in the published game:

1. Start a new game and confirm the character can move around the flat in all four directions.
2. Walk to the bed, use it, and confirm energy rises and the clock advances.
3. Use the shower, restroom, wardrobe and kitchen interactions.
4. Open the bag and eat bread / drink water. Confirm inventory decreases and needs improve.
5. Exit to the Moscow street; enter the shop and park through their scene links.
6. Adopt a pet in the park, then feed and play with it from the bag.
7. Visit Red Square and confirm the Kremlin discovery appears in the journal.
8. Open the map, choose a playable destination and complete a simulated journey.
9. Visit Baikal and Sochi. Confirm only their designated beach tiles are swimmable; Kamchatka's black-sand beach is not marked for swimming.
10. Close and reopen the page, select Continue, and confirm the save is restored.

**Automated checks completed in this development pass (16 November 2026):**

- JavaScript parser checks passed for `scenes.js`, `engine.js`, `travel.js`, `ui.js`, and the inline startup script.
- All 34 scene records have valid 27 × 19 tile grids and all scene links resolve.
- The seven playable place IDs are present.
- The two designated beach areas have swim tiles; Kamchatka's black-sand beach has none.
- The procedural `ART` and `ART2` registries load in a simulated browser environment.
- A mocked-browser engine check passed for start-at-Moscow 08:00, keyboard movement, joystick plus Run, bed sleep, shower, eating, pet adoption and feeding, Kremlin discovery, local-time conversion to Baikal, and localStorage save/Continue restoration.

**Testing honesty:** These are static, scene-structure and mocked-browser runtime checks. I could not run a full real Chrome session against the published GitHub Pages site or test a physical phone in this development environment. The manual checklist above remains necessary before calling the game fully playtested.

## Known limitations

- Only seven destinations have playable local templates. Most of Russia is not a walkable game environment.
- Local scene coordinates are approximate offsets around a real place anchor, not precise OSM building footprints.
- The map fallback is a simplified schematic shape, not a geographic basemap.
- Live vector tiles are disabled by default pending adult maintainer review of the provider's terms.
- The travel graph is schematic. There are no real schedules, ticketing systems, road directions or live vehicle positions.
- Some activities, character animations, pet behaviours, mission chains, NPC routines and wildlife interactions remain simplified or incomplete.
- Sound effects are not implemented; the setting is disabled.
- Wikipedia, Wikidata, GBIF and OSRM APIs are not currently called by the game. Discovery panels use short curated project notes with source links; wildlife records use a small curated species list.
- Geofabrik extracts, local PMTiles and a complete OpenStreetMap GIS pipeline have not been added.
- There is no repo-wide `LICENSE` file yet. See [DATA_LICENSES.md](DATA_LICENSES.md) for third-party components and data obligations. Third-party licenses do not automatically license the project's own source code.

## Main files

```text
index.html
README.md
DATA_LICENSES.md
css/
  style.css
  js/
    data.js
js/
  art.js
  art2.js
  scenes.js
  engine.js
  travel.js
  ui.js
tests/
  smoke.html
```
