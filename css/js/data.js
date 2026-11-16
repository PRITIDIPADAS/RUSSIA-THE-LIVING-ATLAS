/* =====================================================================
   RUSSIA: LIFE & BEYOND — js/data.js
   Module 01 (GIS & data) + Module 07 content: shared helpers, places,
   transport network, discoveries, wildlife, items, missions.
   Facts are kept short and checkable; every discovery lists sources.
   ===================================================================== */
'use strict';

/* ---------- shared helpers (used by every other file) ---------- */
const T = 32;                    // tile size in pixels
const TAU = Math.PI * 2;
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rad = d => d * Math.PI / 180;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hexRGB(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) { const A = hexRGB(a), Bc = hexRGB(b); return 'rgb(' + A.map((v, i) => Math.round(v + (Bc[i] - v) * t)).join(',') + ')'; }
function shade(c, k) { return 'rgb(' + hexRGB(c).map(v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)).join(',') + ')'; }
function hav(a, b) {
  const p = rad(b.lat - a.lat), q = rad(b.lng - a.lng);
  const h = Math.sin(p / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(q / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const rub = n => '₽' + Math.round(n).toLocaleString('en-US');
function fmtDur(h) {
  if (h < 1) return Math.max(1, Math.round(h * 60)) + ' min';
  if (h < 48) return (h < 10 ? h.toFixed(1) : Math.round(h)) + ' h';
  const d = Math.floor(h / 24); return d + ' d ' + Math.round(h - d * 24) + ' h';
}
function fmtCoord(lat, lng) { return Math.abs(lat).toFixed(2) + '° ' + (lat >= 0 ? 'N' : 'S') + ', ' + Math.abs(lng).toFixed(2) + '° ' + (lng >= 0 ? 'E' : 'W'); }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function shadow(g, x, y, rx, ry) { g.fillStyle = 'rgba(18,22,30,.22)'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const seasonOf = m => (m === 11 || m <= 1) ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';

/* ---------- playable places (real coordinates) ----------
   clim = approximate monthly mean temperature (°C), used only when
   live weather is off or unavailable. tz = UTC offset in hours.      */
const LOCS = {
  msk: { name: 'Moscow', ru: 'Москва', region: 'Central Russia', lat: 55.7539, lng: 37.6208, tz: 3,
    arrive: ['msk_station', 'arrive'], fogP: .04, snowM: [11, 0, 1, 2],
    clim: [-6.5, -6.7, -1, 6.7, 13.2, 17, 19.2, 17, 11.3, 5.6, -.5, -4.4],
    what: 'Your flat, Red Square and the Kremlin, a grocery shop, a hotel, the State Historical Museum, a city park with an animal shelter, and Yaroslavsky railway station.' },
  spb: { name: 'Saint Petersburg', ru: 'Санкт-Петербург', region: 'North-West Russia', lat: 59.9398, lng: 30.3146, tz: 3,
    arrive: ['spb_embankment', 'metro'], fogP: .09, snowM: [11, 0, 1, 2],
    clim: [-5.5, -5.8, -1.3, 5.1, 11.3, 15.7, 18.8, 16.9, 11.6, 5.6, .2, -3.1],
    what: 'Palace Embankment on the Neva, the Hermitage, a bridge to Strelka and its Rostral Columns.' },
  kzn: { name: 'Kazan', ru: 'Казань', region: 'Republic of Tatarstan', lat: 55.7963, lng: 49.1088, tz: 3,
    arrive: ['kzn_station', 'arrive'], fogP: .04, snowM: [11, 0, 1, 2],
    clim: [-10.4, -9.8, -3.7, 5.5, 13.5, 17.9, 20.2, 17.7, 11.6, 4.4, -3, -8.3],
    what: 'The Kazan Kremlin and Kul Sharif Mosque, a river embankment, a shop, a hotel and Kazan station.' },
  bkl: { name: 'Listvyanka, Lake Baikal', ru: 'Листвянка', region: 'Irkutsk Oblast · Siberia', lat: 51.8536, lng: 104.8636, tz: 8,
    arrive: ['bkl_village', 'bus'], fogP: .07, snowM: [10, 11, 0, 1, 2, 3], freezeM: [0, 1, 2, 3],
    clim: [-17, -17, -9, 0, 6, 11, 15, 16, 10, 3, -6, -13],
    what: 'A village on the shore of Baikal, the Baikal Museum, a designated swimming beach and pier, and a stretch of the Great Baikal Trail with a campsite.' },
  elb: { name: 'Terskol, Mount Elbrus', ru: 'Терскол', region: 'Kabardino-Balkaria · Caucasus', lat: 43.2589, lng: 42.5083, tz: 3,
    arrive: ['elb_slope', 'bus'], fogP: .06, snowM: [10, 11, 0, 1, 2, 3, 4],
    clim: [-8, -7, -4, 1, 6, 10, 13, 13, 8, 3, -3, -6],
    what: 'A mountain village below Elbrus with a cable car, a hiking trail, a mountain hut and a shop.' },
  soc: { name: 'Sochi', ru: 'Сочи', region: 'Krasnodar Krai · Black Sea', lat: 43.5855, lng: 39.7231, tz: 3, mild: true,
    arrive: ['soc_station', 'arrive'], fogP: .03, snowM: [],
    clim: [6, 6.5, 9, 12.5, 16.5, 21, 24, 24, 20.5, 16, 11, 8],
    what: 'A Black Sea promenade and pebble beach with a designated swimming area, a pier and Sochi station.' },
  kam: { name: 'Petropavlovsk-Kamchatsky', ru: 'Петропавловск-Камчатский', region: 'Kamchatka Krai · Far East', lat: 53.0370, lng: 158.6559, tz: 12,
    arrive: ['kam_coast', 'terminal'], fogP: .12, snowM: [10, 11, 0, 1, 2, 3, 4],
    clim: [-7, -7, -4.5, 0, 4.5, 9, 12.5, 14, 10, 4, -1.5, -5],
    what: 'Avacha Bay below the Koryaksky and Avachinsky volcanoes, a tundra trail, a black-sand beach and a pier.' }
};

/* ---------- transport network (schematic; real city coordinates) ---------- */
const TRANSIT = {
  nnv: { name: 'Nizhny Novgorod', lat: 56.3269, lng: 44.0059, tz: 3 },
  ekb: { name: 'Yekaterinburg', lat: 56.8389, lng: 60.6057, tz: 5 },
  nsk: { name: 'Novosibirsk', lat: 55.0084, lng: 82.9357, tz: 7 },
  krs: { name: 'Krasnoyarsk', lat: 56.0153, lng: 92.8932, tz: 7 },
  irk: { name: 'Irkutsk', lat: 52.2870, lng: 104.3050, tz: 8 },
  uud: { name: 'Ulan-Ude', lat: 51.8335, lng: 107.5841, tz: 8 },
  vvo: { name: 'Vladivostok', lat: 43.1155, lng: 131.8855, tz: 10 },
  rnd: { name: 'Rostov-on-Don', lat: 47.2357, lng: 39.7015, tz: 3 },
  mvd: { name: 'Mineralnye Vody', lat: 44.2104, lng: 43.1373, tz: 3 }
};
const NODES = Object.assign({}, TRANSIT, LOCS);
const EDGES = [
  ['msk', 'spb', 'rail'], ['msk', 'nnv', 'rail'], ['nnv', 'kzn', 'rail'], ['kzn', 'ekb', 'rail'],
  ['ekb', 'nsk', 'rail'], ['nsk', 'krs', 'rail'], ['krs', 'irk', 'rail'], ['irk', 'uud', 'rail'],
  ['uud', 'vvo', 'rail'], ['msk', 'rnd', 'rail'], ['rnd', 'soc', 'rail'], ['rnd', 'mvd', 'rail'],
  ['irk', 'bkl', 'road'], ['mvd', 'elb', 'road'], ['vvo', 'kam', 'sea']
];
/* types[edgeType] = [vehicle, average km/h, roubles per km] */
const MODES = {
  rail: { name: 'Train & bus', note: 'Long-distance trains; a bus or ship for the last leg where there is no railway.',
    types: { rail: ['train', 65, 1.1], road: ['bus', 45, 1.4], sea: ['ship', 28, 3] } },
  drive: { name: 'Drive', note: 'Your own car along the main highway corridors (shown schematically).',
    types: { rail: ['car', 72, 2.4], road: ['car', 50, 2.4], sea: ['ship', 28, 3.5] } },
  fly: { name: 'Fly', note: 'A direct flight plus airport transfers.' }
};
const VEH_LABEL = { train: 'Long-distance train', bus: 'Intercity bus', ship: 'Passenger ship', car: 'Your car', plane: 'Flight' };

/* ---------- discoveries (Module 07) ---------- */
const SEC = { geo: 'Geography', nat: 'Natural history', eco: 'Ecosystem & wildlife', geol: 'Geology', cult: 'Culture', hist: 'History' };
const WP = p => 'https://en.wikipedia.org/wiki/' + p;
const UN = n => 'https://whc.unesco.org/en/list/' + n;
const DISC = {
  kremlin: { name: 'Moscow Kremlin', ru: 'Московский Кремль', region: 'Moscow · Central Russia', lat: 55.7520, lng: 37.6175,
    intro: 'The fortified heart of Moscow, above the Moskva River beside Red Square.',
    s: { geo: 'The Kremlin stands on Borovitsky Hill on the left bank of the Moskva River. Red Square runs along its eastern wall.',
      hist: 'Wooden fortifications stood on the hill by the 12th century. The red-brick walls and towers seen today were built in the late 15th century under Ivan III, with Italian architects. It is the official residence of the President of Russia.',
      cult: 'Inside are cathedrals, the Ivan the Great Bell Tower, the Tsar Bell and the Tsar Cannon. St Basil\'s Cathedral and the State Historical Museum stand on Red Square. The Kremlin and Red Square became a UNESCO World Heritage Site in 1990.' },
    src: [['Wikipedia — Moscow Kremlin', WP('Moscow_Kremlin')], ['UNESCO — Kremlin and Red Square, Moscow', UN(545)]] },
  baikal: { name: 'Lake Baikal', ru: 'Озеро Байкал', region: 'Siberia', lat: 51.87, lng: 104.83,
    pts: [[51.87, 104.83], [53.5, 108.0], [55.7, 109.7]], r: 70,
    intro: 'The deepest and oldest freshwater lake on Earth.',
    s: { geo: 'Baikal is about 636 km long and about 1,642 m deep at its deepest point, deeper than any other lake. It holds roughly a fifth of the world\'s unfrozen fresh surface water and lies between Irkutsk Oblast and the Republic of Buryatia.',
      geol: 'The lake fills a continental rift where the Earth\'s crust is slowly pulling apart. It is estimated to be around 25 million years old.',
      nat: 'In winter the lake usually freezes, often with ice more than a metre thick, and people travel across it.',
      eco: 'Most of its thousands of species live nowhere else, including the Baikal seal (nerpa) and the omul, a fish that is smoked and sold along the shore.',
      cult: 'Baikal is sacred in Buryat tradition. Near Listvyanka, the Shaman Stone sits at the source of the Angara, the only river that flows out of the lake. In legend, Father Baikal hurled the stone after his runaway daughter Angara.',
      hist: 'Lake Baikal was inscribed as a UNESCO World Heritage Site in 1996.' },
    src: [['Wikipedia — Lake Baikal', WP('Lake_Baikal')], ['UNESCO — Lake Baikal', UN(754)]] },
  elbrus: { name: 'Mount Elbrus', ru: 'Эльбрус', region: 'Caucasus', lat: 43.3499, lng: 42.4453, pts: [[43.3499, 42.4453]], r: 40,
    intro: 'A dormant volcano and the highest mountain in Russia.',
    s: { geo: 'At 5,642 m, Elbrus is the highest peak in Russia and, by the most common definition of the boundary, in Europe. It rises in the Greater Caucasus between Kabardino-Balkaria and Karachay-Cherkessia.',
      geol: 'Elbrus is a dormant volcano with two summits: the western reaches 5,642 m and the eastern 5,621 m. Glaciers cover its upper slopes.',
      eco: 'Its glaciers feed the Baksan, Malka and Kuban rivers. Caucasian tur, wild goats found only in the Caucasus, live on the rocky slopes.',
      hist: 'The eastern summit was first reached in 1829 during a Russian expedition. The higher western summit was climbed in 1874 by a British party with a Swiss guide.' },
    src: [['Wikipedia — Mount Elbrus', WP('Mount_Elbrus')]] },
  kamchatka: { name: 'Kamchatka Peninsula', ru: 'Камчатка', region: 'Far East', lat: 53.037, lng: 158.656,
    pts: [[53.037, 158.656], [56.056, 160.642]], r: 110,
    intro: 'A volcanic peninsula between the Sea of Okhotsk and the Pacific Ocean.',
    s: { geo: 'The peninsula is about 1,250 km long. Petropavlovsk-Kamchatsky stands on Avacha Bay, with the Koryaksky and Avachinsky volcanoes rising behind the city.',
      geol: 'Kamchatka lies on the Pacific Ring of Fire and has around 160 volcanoes, about 29 of them active. Klyuchevskaya Sopka, roughly 4,750 m high, is the tallest active volcano in Eurasia.',
      eco: 'Large brown bears, huge salmon runs, sea otters and Steller\'s sea eagles live here.',
      cult: 'Kamchatka is the homeland of the Itelmen, Koryak and Even peoples, among others.',
      hist: 'Vitus Bering\'s 18th-century expeditions sailed from Kamchatka, and Petropavlovsk was founded in 1740. The Volcanoes of Kamchatka became a UNESCO World Heritage Site in 1996.' },
    src: [['Wikipedia — Kamchatka Peninsula', WP('Kamchatka_Peninsula')], ['UNESCO — Volcanoes of Kamchatka', UN(765)]] },
  ladoga: { name: 'Lake Ladoga', ru: 'Ладожское озеро', region: 'North-West Russia', lat: 60.9, lng: 31.5, pts: [[60.9, 31.5]], r: 90,
    intro: 'The largest lake lying entirely in Europe.',
    s: { geo: 'Ladoga covers about 17,700 km². The Svir, Volkhov and Vuoksi rivers feed it, and the Neva carries its water to the Gulf of Finland at Saint Petersburg.',
      eco: 'It is home to the Ladoga ringed seal, a rare freshwater seal.',
      cult: 'The Valaam Monastery stands on islands in the north of the lake.',
      hist: 'During the Siege of Leningrad (1941–44), supplies crossed the frozen lake on the "Road of Life". The Oreshek fortress, founded in 1323, guards the source of the Neva.' },
    src: [['Wikipedia — Lake Ladoga', WP('Lake_Ladoga')]] },
  volga: { name: 'Volga River', ru: 'Волга', region: 'Volga Region', lat: 55.79, lng: 49.1,
    pts: [[56.8587, 35.9], [56.3287, 44.002], [55.79, 49.1], [53.2, 50.15], [48.708, 44.514], [46.35, 48.04]], r: 35,
    intro: 'Europe\'s longest river.',
    s: { geo: 'The Volga flows about 3,530 km from the Valdai Hills to the Caspian Sea, where it forms the largest river delta in Europe. Nizhny Novgorod, Kazan, Samara and Volgograd all stand on its banks.',
      nat: 'A chain of large dams and reservoirs now regulates the river.',
      eco: 'The delta near Astrakhan is home to sturgeon, lotus fields, pelicans and many other birds.',
      cult: 'Russians often call it "Mother Volga" (Волга-матушка). Ilya Repin\'s painting "Barge Haulers on the Volga" (1870–73) made it a symbol of hard labour and endurance.',
      hist: 'Kazan was taken by Ivan IV in 1552, opening the middle Volga to Moscow. The Battle of Stalingrad (1942–43) was fought on its banks at today\'s Volgograd.' },
    src: [['Wikipedia — Volga', WP('Volga')]] },
  transsib: { name: 'Trans-Siberian Railway', ru: 'Транссибирская магистраль', region: 'Across Russia', lat: 56.84, lng: 60.61,
    intro: 'The longest railway line in the world.',
    s: { geo: 'The main line runs about 9,289 km from Moscow to Vladivostok, spanning a seven-hour time difference.',
      hist: 'Construction began in 1891 under Alexander III. The full route on Russian territory was completed in 1916.',
      cult: 'The whole trip takes about a week. Major stops include Yekaterinburg, Novosibirsk, Krasnoyarsk, Irkutsk and Ulan-Ude.' },
    src: [['Wikipedia — Trans-Siberian Railway', WP('Trans-Siberian_Railway')]] },
  hermitage: { name: 'Saint Petersburg & the Hermitage', ru: 'Эрмитаж', region: 'North-West Russia', lat: 59.9398, lng: 30.3146,
    intro: 'Russia\'s imperial capital and one of the world\'s great art museums.',
    s: { geo: 'Saint Petersburg is built on the islands and marshes of the Neva delta, crossed by canals and hundreds of bridges.',
      hist: 'Peter the Great founded the city in 1703, and it was Russia\'s capital until 1918. The Hermitage grew from Catherine the Great\'s collection, begun in 1764, and now fills the Winter Palace and neighbouring buildings. The city survived the 872-day Siege of Leningrad in 1941–44.',
      cult: 'Around midsummer the "White Nights" keep the sky light all night. The historic centre is a UNESCO World Heritage Site (1990).' },
    src: [['Wikipedia — Hermitage Museum', WP('Hermitage_Museum')], ['UNESCO — Historic Centre of Saint Petersburg', UN(540)]] },
  geysers: { name: 'Valley of Geysers', ru: 'Долина гейзеров', region: 'Far East', lat: 54.4333, lng: 160.1333,
    intro: 'One of the largest geyser fields on Earth.',
    s: { geo: 'The valley lies in the Kronotsky Nature Reserve on Kamchatka, along the Geysernaya River, and is reached mostly by helicopter.',
      geol: 'Its geysers and hot springs are powered by volcanic heat beneath the peninsula.',
      hist: 'It was discovered in 1941 by the hydrologist Tatyana Ustinova and the local guide Anisifor Krupenin. A large mudslide buried part of the valley in 2007.',
      eco: 'Brown bears regularly roam the valley.' },
    src: [['Wikipedia — Valley of Geysers', WP('Valley_of_Geysers')]] },
  oymyakon: { name: 'Oymyakon', ru: 'Оймякон', region: 'Sakha Republic (Yakutia)', lat: 63.4608, lng: 142.7858,
    intro: 'One of the coldest permanently inhabited places on Earth.',
    s: { geo: 'A village in the Sakha Republic. A temperature of about −67.7 °C was recorded here in 1933.',
      nat: 'Winters are extreme, yet summer days can approach +30 °C, one of the widest temperature ranges anywhere.',
      cult: 'People here herd reindeer, keep hardy Yakutian horses and eat stroganina, thin shavings of frozen fish.',
      hist: 'The Kolyma Highway, built largely by Gulag prisoners and known as the "Road of Bones", passes through the region.' },
    src: [['Wikipedia — Oymyakon', WP('Oymyakon')]] },
  kizhi: { name: 'Kizhi Pogost', ru: 'Кижи', region: 'Republic of Karelia', lat: 62.0667, lng: 35.2333,
    intro: 'A masterpiece of wooden architecture on an island in Lake Onega.',
    s: { geo: 'Kizhi is an island in Lake Onega in Karelia, now an open-air museum of wooden buildings.',
      cult: 'The Church of the Transfiguration, with 22 domes, was built of wood in 1714. A local legend says its master builder threw his axe into the lake when he finished.',
      hist: 'Kizhi Pogost became a UNESCO World Heritage Site in 1990.' },
    src: [['Wikipedia — Kizhi Pogost', WP('Kizhi_Pogost')], ['UNESCO — Kizhi Pogost', UN(544)]] },
  curonian: { name: 'Curonian Spit', ru: 'Куршская коса', region: 'Kaliningrad Oblast', lat: 55.15, lng: 20.85,
    intro: 'A long, narrow sand spit between the Baltic Sea and a lagoon.',
    s: { geo: 'The 98 km spit separates the Baltic Sea from the Curonian Lagoon and is shared by Russia and Lithuania.',
      nat: 'Its moving sand dunes are among the highest in Europe, and a pine wood with strangely twisted trunks is known as the "Dancing Forest".',
      eco: 'The spit lies on a major bird-migration route; the bird station at Rybachy has studied migrants since 1901.',
      hist: 'It became a UNESCO World Heritage Site in 2000. The Kaliningrad region holds most of the world\'s known amber reserves.' },
    src: [['Wikipedia — Curonian Spit', WP('Curonian_Spit')], ['UNESCO — Curonian Spit', UN(994)]] },
  mamayev: { name: 'Mamayev Kurgan', ru: 'Мамаев курган', region: 'Volgograd · Volga Region', lat: 48.742, lng: 44.537,
    intro: 'The memorial hill above Volgograd.',
    s: { geo: 'A hill overlooking Volgograd and the Volga.',
      hist: 'The hill was at the centre of the fighting in the Battle of Stalingrad (1942–43), one of the deadliest battles in history. The statue "The Motherland Calls", 85 m tall including the sword, was unveiled in 1967.' },
    src: [['Wikipedia — Mamayev Kurgan', WP('Mamayev_Kurgan')]] },
  ural: { name: 'Ural Mountains', ru: 'Уральские горы', region: 'Urals', lat: 56.84, lng: 59.9,
    pts: [[56.84, 60.0], [57.9, 59.9], [55.2, 59.3]], r: 80,
    intro: 'The old mountain range between Europe and Asia.',
    s: { geo: 'The Urals run roughly 2,500 km from the Arctic coast south towards Kazakhstan, and are conventionally taken as part of the boundary between Europe and Asia.',
      geol: 'They are among the oldest mountain ranges on Earth, raised roughly 250–300 million years ago when ancient continents collided. The highest point, Mount Narodnaya, reaches 1,895 m.',
      nat: 'The range is rich in minerals: iron, copper, gold, malachite and gemstones.',
      hist: 'Yekaterinburg, founded in 1723 as an ironworking centre, became the main city of the Urals.' },
    src: [['Wikipedia — Ural Mountains', WP('Ural_Mountains')]] },
  taiga: { name: 'The Siberian Taiga', ru: 'Тайга', region: 'Siberia', lat: 51.9, lng: 104.9,
    intro: 'The great boreal forest that covers much of Russia.',
    s: { geo: 'The taiga, or boreal forest, is the largest land biome on Earth, and Russia holds the biggest share of it. Russia has about a fifth of the world\'s forest area.',
      nat: 'Typical trees include Siberian larch, Scots pine, Siberian pine (often called Siberian cedar), spruce, fir and birch. Larch drops its needles in autumn, which helps it survive extreme cold.',
      eco: 'Siberian pine seeds, the "pine nuts" of Siberia, feed sables, squirrels and the spotted nutcracker, which in turn spreads the seeds.' },
    src: [['Wikipedia — Taiga', WP('Taiga')]] },
  kazan: { name: 'Kazan Kremlin', ru: 'Казанский кремль', region: 'Republic of Tatarstan', lat: 55.7986, lng: 49.1059,
    intro: 'A historic fortress where a cathedral and a mosque stand side by side.',
    s: { geo: 'The citadel stands on a hill above the Kazanka River, close to where it meets the Volga.',
      hist: 'Kazan was taken by the forces of Ivan IV in 1552. The white-stone Annunciation Cathedral dates from the 1560s. The Kul Sharif Mosque, named after the imam who died defending the city in 1552, was rebuilt inside the walls and opened in 2005. The Kremlin became a UNESCO World Heritage Site in 2000.',
      cult: 'The Orthodox cathedral and the mosque stand side by side, reflecting Tatarstan\'s Russian and Tatar heritage. The leaning Söyembikä Tower is linked to many local legends.' },
    src: [['Wikipedia — Kazan Kremlin', WP('Kazan_Kremlin')], ['UNESCO — Kazan Kremlin', UN(980)]] },
  sochi: { name: 'Sochi & the Black Sea coast', ru: 'Сочи', region: 'Krasnodar Krai', lat: 43.5855, lng: 39.7231,
    intro: 'Russia\'s best-known seaside resort, between the sea and the Caucasus.',
    s: { geo: 'Greater Sochi stretches for around 145 km along the Black Sea, backed by the western Caucasus. Its mild climate lets palms grow outdoors.',
      hist: 'Sochi hosted the 2014 Winter Olympic and Paralympic Games, with mountain events at Krasnaya Polyana.',
      nat: 'Sochi National Park, created in 1983, protects forests on the Caucasus slopes behind the city.',
      eco: 'Bottlenose dolphins of a Black Sea subspecies are regularly seen offshore.' },
    src: [['Wikipedia — Sochi', WP('Sochi')], ['Wikipedia — Sochi National Park', WP('Sochi_National_Park')]] }
};

/* ---------- wildlife for the field journal (real species) ---------- */
const SPECIES = {
  squirrel: { name: 'Eurasian red squirrel', sci: 'Sciurus vulgaris' },
  crow: { name: 'Hooded crow', sci: 'Corvus cornix' },
  roe: { name: 'Siberian roe deer', sci: 'Capreolus pygargus' },
  nutcracker: { name: 'Spotted nutcracker', sci: 'Nucifraga caryocatactes' },
  nerpa: { name: 'Baikal seal (nerpa)', sci: 'Pusa sibirica' },
  mgull: { name: 'Mongolian gull', sci: 'Larus mongolicus' },
  hgull: { name: 'European herring gull', sci: 'Larus argentatus' },
  ygull: { name: 'Yellow-legged gull', sci: 'Larus michahellis' },
  sbgull: { name: 'Slaty-backed gull', sci: 'Larus schistisagus' },
  tur: { name: 'Caucasian tur', sci: 'Capra caucasica' },
  geagle: { name: 'Golden eagle', sci: 'Aquila chrysaetos' },
  bear: { name: 'Kamchatka brown bear', sci: 'Ursus arctos beringianus' },
  otter: { name: 'Sea otter', sci: 'Enhydra lutris' },
  seagle: { name: 'Steller\'s sea eagle', sci: 'Haliaeetus pelagicus' },
  dolphin: { name: 'Black Sea bottlenose dolphin', sci: 'Tursiops truncatus ponticus' }
};

/* ---------- items, outfits ---------- */
const ITEMS = {
  bread:   { name: 'Rye bread', ru: 'ржаной хлеб', price: 70, eat: { hunger: 22, mood: 1 } },
  kefir:   { name: 'Kefir', ru: 'кефир', price: 90, eat: { hunger: 10, thirst: 22 } },
  pelmeni: { name: 'Pelmeni (frozen)', ru: 'пельмени', price: 260, cook: { hunger: 55, mood: 7 } },
  water:   { name: 'Bottled water', ru: 'вода', price: 50, drink: { thirst: 40 } },
  tea:     { name: 'Black tea', ru: 'чай', price: 60, drink: { thirst: 25, mood: 4 } },
  omul:    { name: 'Smoked omul', ru: 'копчёный омуль', price: 320, eat: { hunger: 40, mood: 8 } },
  fruit:   { name: 'Fresh fruit', ru: 'фрукты', price: 150, eat: { hunger: 14, thirst: 12, mood: 4 } },
  salmon:  { name: 'Raw salmon', ru: 'лосось', price: 420, cook: { hunger: 60, mood: 8 } },
  fish:    { name: 'Your catch', ru: 'улов', price: 0, cook: { hunger: 45, mood: 6 } },
  petfood: { name: 'Pet food', ru: 'корм', price: 180 },
  tent:    { name: 'Tent', ru: 'палатка', price: 3500, tool: true }
};
const OUTFITS = {
  everyday: { name: 'Everyday clothes', warmth: 1, price: 0, look: { top: '#34546c', legs: '#2a2f3a' } },
  parka:    { name: 'Winter parka & ushanka', warmth: 3, price: 4800, look: { top: '#7a3a2c', legs: '#2a2f3a', coat: true, hat: 'ushanka' } },
  hiking:   { name: 'Hiking gear', warmth: 2, price: 3600, look: { top: '#4f6b45', legs: '#4a4033', pack: true, hat: 'beanie', beanie: '#a8822c' } },
  sport:    { name: 'Tracksuit', warmth: 1, price: 2200, look: { top: '#2c3f7a', legs: '#2c3f7a', stripe: '#e9e4d8' } },
  summer:   { name: 'Summer clothes', warmth: 0, price: 1600, look: { top: '#d9c27a', legs: '#6b7f8f' } },
  swim:     { name: 'Swimwear', warmth: 0, price: 1400, look: { top: '#2f6f8f', legs: null, swim: true } }
};
const PET_NAMES = { dog: ['Laika', 'Belka', 'Strelka', 'Sharik', 'Druzhok'], cat: ['Murka', 'Barsik', 'Vaska', 'Pushok', 'Masya'] };
const PET_COLORS = { dog: ['#b07a43', '#3b3330', '#d9c9a8'], cat: ['#8d8a86', '#c9813e', '#2e2a28'] };

/* ---------- people say (Russian with translation) ---------- */
const LINES = [
  ['Доброе утро!', 'Good morning!'],
  ['Хорошая погода сегодня.', 'Nice weather today.'],
  ['Вы откуда?', 'Where are you from?'],
  ['Попробуйте пельмени в кафе.', 'Try the pelmeni at the café.'],
  ['Байкал — это надо увидеть.', 'Baikal — you have to see it.'],
  ['Поезд до Владивостока идёт почти неделю.', 'The train to Vladivostok takes almost a week.'],
  ['В музее сегодня интересная выставка.', 'There\'s a good exhibition at the museum today.'],
  ['Спасибо, всего доброго!', 'Thanks, all the best!']
];
const LINES_EXTRA = {
  bkl: [['Вода в Байкале холодная даже летом.', 'Baikal\'s water is cold even in summer.'], ['Попробуйте копчёный омуль!', 'Try the smoked omul!']],
  kam: [['Осторожно, медведи! Близко не подходите.', 'Careful, bears! Don\'t go near them.'], ['В ясный день видно вулканы.', 'On a clear day you can see the volcanoes.']],
  elb: [['На Эльбрусе погода меняется быстро.', 'The weather on Elbrus changes fast.']],
  soc: [['Море сегодня тёплое?', 'Is the sea warm today?']],
  spb: [['Ночью мосты разводят.', 'At night the bridges are raised.']],
  kzn: [['Рэхим итегез!', 'Welcome! (Tatar)'], ['Попробуйте чак-чак.', 'Try chak-chak.']],
  msk: [['Не замёрзни!', 'Don\'t freeze out there!']]
};

/* ---------- journey encounters (generic, not claimed as real events) ---------- */
const ENC = [
  { t: 'The carriage attendant (проводница) brings fresh bed linen and offers tea in a metal glass holder.', veh: ['train'], fx: { mood: 4 } },
  { t: 'At a long station stop, passengers step onto the platform to stretch their legs and buy pastries from kiosks.', veh: ['train', 'bus'], fx: { mood: 3 } },
  { t: 'Your compartment neighbours share boiled eggs, cucumbers and stories.', veh: ['train'], fx: { social: 12, mood: 3 } },
  { t: 'The train rumbles across a wide river on a long steel bridge.', veh: ['train'], biome: ['birch', 'taiga', 'ural', 'baikal'], fx: { mood: 2 } },
  { t: 'Hour after hour of birch forest, broken by villages of wooden houses.', biome: ['birch', 'taiga'], fx: { mood: 2 } },
  { t: 'The taiga stretches unbroken to the horizon.', biome: ['taiga', 'baikal'], fx: { mood: 2 } },
  { t: 'Low forested ridges close in. You are crossing the Urals.', biome: ['ural'], fx: { mood: 3 } },
  { t: 'The line runs along the shore and the lake shines between the trees.', biome: ['baikal'], fx: { mood: 6 } },
  { t: 'Flat, open steppe under an enormous sky.', biome: ['steppe'], fx: { mood: 2 } },
  { t: 'Snow-capped peaks rise on the horizon.', biome: ['caucasus'], fx: { mood: 4 } },
  { t: 'A roadside café sells hot soup and pirozhki. You stop for a break.', veh: ['car', 'bus'], fx: { mood: 3, energy: 3 } },
  { t: 'Gulls follow the ship as the coastline slips past.', veh: ['ship'], fx: { mood: 4 } },
  { t: 'Fog rolls over the sea and the ship sounds its horn.', veh: ['ship'], fx: { mood: 1 } },
  { t: 'Below the window, clouds lie like a white plain.', veh: ['plane'], fx: { mood: 3 } },
  { t: 'Fresh snow covers the fields; smoke rises straight up from chimneys.', season: ['winter'], fx: { mood: 2 } },
  { t: 'Autumn has turned the birches gold.', season: ['autumn'], biome: ['birch', 'taiga', 'ural'], fx: { mood: 3 } },
  { t: 'Long northern daylight: it is still bright late into the evening.', season: ['summer'], fx: { mood: 2 } },
  { t: 'Darkness outside; the lights of a distant town drift past.', night: true, veh: ['train', 'bus', 'car'], fx: { mood: 1 } }
];

/* ---------- missions (Module 07) ---------- */
const nDisc = s => Object.keys(s.disc).length;
const QUESTS = [
  { id: 'morning', t: 'A Moscow morning', d: 'Start your day at home.', r: 600, steps: [
    ['Eat something', s => s.stats.meals >= 1], ['Have a drink', s => s.stats.drinks >= 1],
    ['Shower or wash', s => s.stats.showers >= 1], ['Get dressed for the weather', s => s.stats.changes >= 1]] },
  { id: 'kremlin', t: 'Heart of the capital', d: 'Walk from your street to Red Square.', r: 800, steps: [['Discover the Moscow Kremlin', s => !!s.disc.kremlin]] },
  { id: 'pet', t: 'A friend for life', d: 'Adopt a pet from the shelter in the city park and look after it.', r: 900, steps: [
    ['Adopt a pet', s => !!s.pet], ['Feed your pet', s => s.stats.petFeeds >= 1], ['Play with your pet', s => s.stats.petPlays >= 1]] },
  { id: 'run', t: 'Morning run', d: 'Run 1 km (hold Shift, or tap Run on a touch screen).', r: 500, steps: [['Run 1 km', s => s.stats.runM >= 1000]] },
  { id: 'museum', t: 'Museum visitor', d: 'Read an exhibit in any museum.', r: 500, steps: [['Read an exhibit', s => s.stats.exhibits >= 1]] },
  { id: 'social', t: 'Making friends', d: 'Talk to local people.', r: 600, steps: [['Talk to 6 people', s => s.stats.talks >= 6]] },
  { id: 'baikal', t: 'The sacred sea', d: 'Travel east and discover Lake Baikal.', r: 3000, steps: [['Discover Lake Baikal', s => !!s.disc.baikal]] },
  { id: 'swim', t: 'Into the water', d: 'Swim in a designated swimming area.', r: 700, steps: [['Swim 50 m', s => s.stats.swimM >= 50]] },
  { id: 'hike', t: 'Trail tracker', d: 'Hike on marked trails.', r: 900, steps: [['Hike 1 km', s => s.stats.hikeM >= 1000]] },
  { id: 'camp', t: 'A night in the taiga', d: 'Sleep in a tent at a campsite.', r: 900, steps: [['Camp overnight', s => s.stats.camps >= 1]] },
  { id: 'wild', t: 'Field naturalist', d: 'Record wildlife in your field journal.', r: 1200, steps: [['Spot 4 species', s => Object.keys(s.species).length >= 4], ['Spot 8 species', s => Object.keys(s.species).length >= 8]] },
  { id: 'ural', t: 'Between Europe and Asia', d: 'Cross the Ural Mountains.', r: 1500, steps: [['Discover the Urals', s => !!s.disc.ural]] },
  { id: 'atlas', t: 'Explorer of Russia', d: 'Fill your atlas with discoveries.', r: 4000, steps: [['Discover 5 landmarks', s => nDisc(s) >= 5], ['Discover 10 landmarks', s => nDisc(s) >= 10]] },
  { id: 'cross', t: 'From sea to sea', d: 'Visit five of the seven places you can explore.', r: 5000, steps: [['Visit 5 places', s => Object.keys(s.visited).length >= 5]] }
];
