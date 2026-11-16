/* =====================================================================
   RUSSIA: LIFE & BEYOND — js/art.js   (Module 08, part A: the world)
   Original procedural art drawn with Canvas 2D. No image files.
   This file: colour helpers, ground tiles, water, skies and mountain
   backdrops, buildings, Russian landmarks and trees.
   js/art2.js adds people, pets, wildlife, furniture, props, vehicles,
   light, weather and the journey view, using the same registry.

   API used by engine.js / travel.js:
     ART.tile(g, ch, tx, ty, env, at)       static ground tile (engine caches it)
     ART.water(g, ch, tx, ty, env, t, at)   animated water or ice tile
     ART.backdrop(g, kind, x, y, w, h, env, t)
     ART.def(type, w, h, solid, draw, flag) register an object type
     ART.foot(o) ART.solid(o) ART.base(o) ART.isFlat(o) ART.isOver(o)
     ART.draw(g, o, env, t)
     ART.SOLID  tiles nobody can walk on     ART.SWIM  tiles you can swim in
   Tile codes:
     . grass  , meadow  n tundra  d trail  e flowerbed  : paving  # cobbles
     = road  q bridge  s sand  p pebbles  b black sand  * snow
     R rocky ground  v volcanic scree  r rock (solid)  g granite  o pier
     f wood floor  m marble  t tiles  c carpet  W wall (solid)
     ~ deep water (solid)  w designated swimming water  (space) backdrop
   env = { season, snow 0–1, day 0–1, dusk 0–1, hour, wind 0–1, cloud 0–1,
           kind, temp, frozen, water, wall, windows, biome, indoor }
   ===================================================================== */
'use strict';

const ART = (() => {
  /* ---------- colour + drawing helpers ---------- */
  const LINE = 'rgba(29,34,48,.55)', SNOWC = '#eef1f3', GOLD = '#c9a640';
  const memo = new Map();
  const rgbOf = c => c[0] === '#' ? hexRGB(c) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
  function mx(a, b, t) {
    t = Math.round(clamp(t, 0, 1) * 50) / 50;
    const key = a + '|' + b + '|' + t; let v = memo.get(key); if (v) return v;
    const A = rgbOf(a), B = rgbOf(b);
    v = 'rgb(' + A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(',') + ')';
    if (memo.size > 5000) memo.clear(); memo.set(key, v); return v;
  }
  function sh(c, k) {
    const key = c + '^' + k; let v = memo.get(key); if (v) return v;
    v = 'rgb(' + rgbOf(c).map(x => Math.round(k < 0 ? x * (1 + k) : x + (255 - x) * k)).join(',') + ')';
    memo.set(key, v); return v;
  }
  const snowy = (c, env, k = 1) => env.snow > .02 ? mx(c, SNOWC, env.snow * k) : c;
  const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, TAU); g.fill(); };
  const ell = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); g.fill(); };
  const ln = (g, a, b, c, d) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
  const poly = (g, p) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const edge = (g, w) => { g.strokeStyle = LINE; g.lineWidth = w || 1; g.stroke(); };
  const mod = (a, n) => ((a % n) + n) % n;
  function box(g, x, y, w, h, th, top, front) {
    g.fillStyle = front; g.fillRect(x, y + th, w, h - th);
    g.fillStyle = top; g.fillRect(x, y, w, th);
    g.strokeStyle = LINE; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, w - 1, h - 1); ln(g, x, y + th + .5, x + w, y + th + .5);
  }
  function noise1(u, seed) {
    const i = Math.floor(u), f = u - i;
    const a = hash(seed + ':' + i) % 1009 / 1009, b = hash(seed + ':' + (i + 1)) % 1009 / 1009;
    return a + (b - a) * f * f * (3 - 2 * f);
  }

  /* ---------- ground ---------- */
  const GRASS = { spring: '#86a85a', summer: '#6e9a4b', autumn: '#a1975a', winter: '#7e8866' };
  function grassCol(env) {
    let c = GRASS[env.season] || GRASS.summer;
    if (env.biome === 'mountain') c = mx(c, '#8d8f6a', .35);
    else if (env.biome === 'tundra') c = mx(c, '#9a9064', .45);
    else if (env.biome === 'steppe') c = mx(c, '#b5a463', env.season === 'summer' ? .45 : .2);
    else if (env.biome === 'coast' && env.season === 'winter') c = '#71905a';
    return snowy(c, env);
  }

  function tile(g, ch, tx, ty, env, at) {
    if (ch === ' ' || ch === '~' || ch === 'w') return;
    const x = tx * T, y = ty * T, r = rng(hash(tx + ':' + ty)), s = env.snow;
    const sp = (n, c, w, h) => { g.fillStyle = c; for (let i = 0; i < n; i++) g.fillRect(x + r() * (T - w), y + r() * (T - h), w, h); };
    const blend = (set, c) => {
      g.fillStyle = c;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        if (!set.includes(at(tx + dx, ty + dy))) continue;
        for (let i = 0; i < 6; i++) circ(g, dx ? (dx < 0 ? x : x + T) : x + r() * T, dy ? (dy < 0 ? y : y + T) : y + r() * T, 3 + r() * 4);
      }
    };
    const flat = (c, k) => { const b = k === 0 ? c : snowy(c, env, k === undefined ? 1 : k); g.fillStyle = b; g.fillRect(x, y, T, T); return b; };
    g.save(); g.beginPath(); g.rect(x, y, T, T); g.clip();
    switch (ch) {
      case '.': case ',': {
        const b = flat(grassCol(env), 0);
        if (s < .85) { sp(7, sh(b, -.12), 2, 3); sp(4, sh(b, .1), 2, 2); }
        if (ch === ',') {
          sp(6, sh(b, -.22), 1, 5);
          if (s < .3 && (env.season === 'summer' || env.season === 'spring'))
            for (let i = 0; i < 3; i++) { g.fillStyle = pick(r, ['#efe8d0', '#e2c14c', '#a98bc4', '#d9846b']); circ(g, x + 4 + r() * 24, y + 4 + r() * 24, 1.6); }
        }
        if (s > .5) { sp(3, '#ffffff', 3, 2); sp(3, '#d3dce5', 4, 2); }
        break;
      }
      case 'n': {
        const b = flat(mx(grassCol(env), '#8b8456', .3), 0);
        sp(8, sh(b, -.15), 3, 2); sp(5, s > .5 ? '#ffffff' : '#c8c29a', 2, 2);
        if (env.season === 'autumn') sp(5, '#9b4a2c', 3, 2);
        break;
      }
      case 'd': { const b = flat('#9b8562', .75); sp(6, sh(b, -.16), 3, 2); sp(4, sh(b, .14), 2, 2); blend(['.', ',', 'n'], grassCol(env)); break; }
      case 'e': {
        const b = flat('#6b5139', .9); g.fillStyle = sh(b, -.25); g.fillRect(x, y, T, 2); g.fillRect(x, y + T - 2, T, 2);
        if (s < .4 && env.season !== 'winter') for (let i = 0; i < 9; i++) {
          const fx = x + 4 + r() * 24, fy = y + 5 + r() * 22;
          g.fillStyle = '#4f6b45'; g.fillRect(fx - .7, fy, 1.5, 4);
          g.fillStyle = env.season === 'autumn' ? pick(r, ['#c97a2c', '#9b3324', '#d9b23a']) : pick(r, ['#c23b4b', '#e2c14c', '#f1ece0', '#8a5fb0']);
          circ(g, fx, fy, 2.2);
        }
        break;
      }
      case ':': {
        const b = flat('#b9b3a6', .8); g.strokeStyle = sh(b, -.1); g.lineWidth = 1; g.beginPath();
        for (const o of [.5, 16.5]) { g.moveTo(x + o, y); g.lineTo(x + o, y + T); g.moveTo(x, y + o); g.lineTo(x + T, y + o); }
        g.stroke(); sp(3, sh(b, -.06), 3, 3); break;
      }
      case '#': {
        const b = flat('#5f5a57', .7); g.fillStyle = sh(b, -.3); g.fillRect(x, y, T, T);
        for (let row = 0; row < 4; row++) {
          const off = (row + ty) % 2 ? -4 : 0;
          for (let c = 0; c < 5; c++) { g.fillStyle = mx(b, r() < .5 ? '#77706a' : '#4f4a47', .3 + r() * .5); rr(g, x + c * 8 + off + .5, y + row * 8 + .5, 7, 7, 2); g.fill(); }
        }
        break;
      }
      case '=': case 'q': {
        const b = flat('#4d5056', .35); sp(6, sh(b, .08), 2, 2); sp(4, sh(b, -.15), 2, 2);
        const road = c => c === '=' || c === 'q', cw = ch === 'q' ? 6 : 3;
        g.fillStyle = ch === 'q' ? '#a59e95' : '#9a968d';
        if (!road(at(tx, ty - 1))) g.fillRect(x, y, T, cw);
        if (!road(at(tx, ty + 1))) g.fillRect(x, y + T - cw, T, cw);
        if (!road(at(tx - 1, ty))) g.fillRect(x, y, cw, T);
        if (!road(at(tx + 1, ty))) g.fillRect(x + T - cw, y, cw, T);
        if (ch === '=' && road(at(tx, ty - 1)) && !road(at(tx, ty - 2)) && tx % 2 === 0) { g.fillStyle = '#e8e2cf'; g.fillRect(x + 6, y, 20, 2); }
        if (s > .4) { g.fillStyle = 'rgba(240,244,246,.55)'; g.fillRect(x, y, T, 4); g.fillRect(x, y + T - 4, T, 4); }
        break;
      }
      case 's': {
        const b = flat('#d8c690', .85); g.strokeStyle = sh(b, -.08); g.lineWidth = 1;
        for (let i = 0; i < 2; i++) { const yy = y + 8 + i * 13 + r() * 4; g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + 16, yy - 3, x + T, yy); g.stroke(); }
        sp(4, sh(b, .12), 2, 2); break;
      }
      case 'p': {
        flat('#9e988d', .6);
        for (let i = 0; i < 14; i++) { g.fillStyle = mx('#7d776e', '#c9c3b8', r()); ell(g, x + r() * T, y + r() * T, 2 + r() * 2.5, 1.5 + r() * 1.5); }
        if (s > .5) sp(5, '#ffffff', 4, 2);
        break;
      }
      case 'b': { const b = flat('#3e3a37', .5); sp(10, sh(b, .12), 2, 2); sp(3, '#8a8f96', 1, 1); break; }
      case '*': { flat('#e8edf1', 0); g.fillStyle = '#d3dce5'; for (let i = 0; i < 3; i++) ell(g, x + r() * T, y + r() * T, 6 + r() * 6, 2); sp(4, '#ffffff', 2, 2); break; }
      case 'R': {
        flat(mx(grassCol({ season: env.season, snow: 0, biome: 'mountain' }), '#857d72', .7), .8);
        for (let i = 0; i < 5; i++) { g.fillStyle = mx('#6f685f', '#a39b8f', r()); ell(g, x + r() * T, y + r() * T, 2 + r() * 3, 1.5 + r() * 2); }
        if (s > .4) sp(4, '#ffffff', 3, 2);
        break;
      }
      case 'v': { flat('#5b524b', .7); for (let i = 0; i < 8; i++) { g.fillStyle = mx('#3f3833', '#7d5a48', r()); ell(g, x + r() * T, y + r() * T, 1.5 + r() * 2.5, 1 + r() * 1.5); } break; }
      case 'r': {
        flat('#6d665e', 0); const up = at(tx, ty - 1) === 'r', dn = at(tx, ty + 1) === 'r';
        g.fillStyle = '#857d73'; for (let i = 0; i < 3; i++) ell(g, x + 6 + r() * 20, y + 6 + r() * 14, 7 + r() * 5, 5 + r() * 3);
        g.strokeStyle = '#4c4640'; g.lineWidth = 1; ln(g, x + r() * T, y + 4, x + r() * T, y + T - 6);
        if (!dn) { g.fillStyle = '#4f4943'; g.fillRect(x, y + T - 8, T, 8); }
        if (!up) { g.fillStyle = snowy('#9a9288', env); g.fillRect(x, y, T, 3); }
        if (s > .2) { g.fillStyle = 'rgba(240,244,246,' + (.5 + s * .4) + ')'; for (let i = 0; i < 3; i++) ell(g, x + 4 + r() * 24, y + 4 + r() * 10, 6, 2.5); }
        break;
      }
      case 'g': {
        const b = flat('#a39b91', .6); g.strokeStyle = sh(b, -.18); g.lineWidth = 1; g.beginPath();
        const j1 = ty % 2 ? 8 : 24, j2 = ty % 2 ? 24 : 8;
        g.moveTo(x, y + 15.5); g.lineTo(x + T, y + 15.5);
        g.moveTo(x + j1 + .5, y); g.lineTo(x + j1 + .5, y + 16); g.moveTo(x + j2 + .5, y + 16); g.lineTo(x + j2 + .5, y + T);
        g.stroke(); sp(5, sh(b, .08), 2, 2); break;
      }
      case 'o': {
        g.fillStyle = '#2c4a58'; g.fillRect(x, y, T, T);
        for (let i = 0; i < 4; i++) { g.fillStyle = snowy(i % 2 ? '#8b6b47' : '#7d603f', env, .8); g.fillRect(x, y + i * 8, T, 7); }
        g.fillStyle = '#4a3a2a'; g.fillRect(x + 3, y, 2, T); g.fillRect(x + T - 5, y, 2, T);
        break;
      }
      case 'f': {
        const b = '#a87b4f'; g.fillStyle = b; g.fillRect(x, y, T, T);
        for (let i = 0; i < 4; i++) {
          g.fillStyle = i % 2 ? sh(b, -.05) : sh(b, .05); g.fillRect(x, y + i * 8, T, 7);
          g.fillStyle = sh(b, -.28); g.fillRect(x, y + i * 8 + 7, T, 1); g.fillRect(x + ((i * 13 + tx * 7) % T), y + i * 8, 1, 7);
        }
        break;
      }
      case 'm': {
        g.fillStyle = (tx + ty) % 2 ? '#d9d3c8' : '#c4bcae'; g.fillRect(x, y, T, T);
        g.strokeStyle = 'rgba(120,110,100,.25)'; g.lineWidth = 1; ln(g, x + r() * T, y, x + r() * T, y + T);
        g.strokeStyle = 'rgba(80,70,60,.2)'; g.strokeRect(x + .5, y + .5, T - 1, T - 1); break;
      }
      case 't': {
        g.fillStyle = '#dfe4e5'; g.fillRect(x, y, T, T); g.strokeStyle = '#bcc5c8'; g.lineWidth = 1; g.beginPath();
        for (let i = 0; i <= T; i += 8) { g.moveTo(x + i + .5, y); g.lineTo(x + i + .5, y + T); g.moveTo(x, y + i + .5); g.lineTo(x + T, y + i + .5); }
        g.stroke(); break;
      }
      case 'c': {
        const b = '#7b3a34'; g.fillStyle = b; g.fillRect(x, y, T, T);
        g.fillStyle = sh(b, .1); poly(g, [x + 16, y + 6, x + 26, y + 16, x + 16, y + 26, x + 6, y + 16]);
        g.fillStyle = GOLD; circ(g, x + 16, y + 16, 2);
        if (at(tx, ty - 1) !== 'c') g.fillRect(x, y + 2, T, 2);
        if (at(tx, ty + 1) !== 'c') g.fillRect(x, y + T - 4, T, 2);
        break;
      }
      case 'W': {
        const below = at(tx, ty + 1);
        if (below !== undefined && below !== 'W' && below !== ' ') {
          const wc = env.wall || '#c9b99a'; g.fillStyle = wc; g.fillRect(x, y, T, T);
          g.fillStyle = sh(wc, -.07); for (let i = 3; i < T; i += 8) g.fillRect(x + i, y, 2, T - 7);
          g.fillStyle = sh(wc, .12); g.fillRect(x, y, T, 3);
          g.fillStyle = '#6b5240'; g.fillRect(x, y + T - 6, T, 6);
          if (env.windows && (tx * 5 + ty) % 4 === 1) {
            g.fillStyle = '#ece7da'; g.fillRect(x + 5, y + 4, 22, 18); g.fillStyle = '#93b2c2'; g.fillRect(x + 7, y + 6, 18, 14);
            g.fillStyle = '#ece7da'; g.fillRect(x + 15, y + 6, 2, 14); g.fillRect(x + 7, y + 12, 18, 2);
            g.fillStyle = 'rgba(155,51,36,.75)'; g.fillRect(x + 3, y + 3, 4, 20); g.fillRect(x + 25, y + 3, 4, 20);
          }
        } else { g.fillStyle = '#3a3431'; g.fillRect(x, y, T, T); g.fillStyle = '#4a423d'; g.fillRect(x, y, T, 2); }
        break;
      }
      default: flat(grassCol(env), 0);
    }
    g.restore();
  }

  /* ---------- water (drawn every frame) ---------- */
  const WATER = { lake: '#3d7d92', river: '#46677a', sea: '#2f6787', pond: '#4f7466', pacific: '#2b5266' };
  const isLand = c => c !== undefined && c !== '~' && c !== 'w' && c !== ' ';
  function water(g, ch, tx, ty, env, t, at) {
    const x = tx * T, y = ty * T;
    if (env.frozen) {
      const r = rng(hash('ice' + tx + ':' + ty)); g.fillStyle = '#a9c9d4'; g.fillRect(x, y, T, T);
      g.strokeStyle = 'rgba(245,250,252,.75)'; g.lineWidth = 1; g.beginPath();
      let px = x + r() * T, py = y; g.moveTo(px, py);
      for (let i = 0; i < 3; i++) { px = x + r() * T; py += T / 3; g.lineTo(px, py); }
      g.stroke();
      if (env.snow > .3) { g.fillStyle = 'rgba(240,244,246,.8)'; ell(g, x + 8 + r() * 16, y + 8 + r() * 16, 7, 3); }
      return;
    }
    let b = WATER[env.water] || WATER.lake; if (ch === 'w') b = sh(b, .2);
    g.fillStyle = b; g.fillRect(x, y, T, T);
    if (ch === 'w' && at(tx, ty - 1) === '~') { g.fillStyle = 'rgba(20,40,55,.25)'; g.fillRect(x, y, T, 3); }
    const wind = env.wind || 0, ph = t / 900 + tx * .7 + ty * 1.3;
    g.strokeStyle = 'rgba(255,255,255,' + (.1 + .1 * wind) + ')'; g.lineWidth = 1.5;
    for (let k = 0; k < 2; k++) {
      const yy = y + 9 + k * 13 + Math.sin(ph + k) * 2, xx = x + 7 + mod(t / 60 * (.3 + wind) + k * 11 + tx * 7, T - 14);
      g.beginPath(); g.moveTo(xx - 5, yy); g.quadraticCurveTo(xx, yy - 2.5, xx + 5, yy); g.stroke();
    }
    const f = .5 + .5 * Math.sin(t / 650 + tx * .9 + ty * .6), fw = 2 + 2.5 * f;
    g.fillStyle = 'rgba(238,244,246,' + (.3 + .3 * f) + ')';
    if (isLand(at(tx, ty - 1))) g.fillRect(x, y, T, fw);
    if (isLand(at(tx, ty + 1))) g.fillRect(x, y + T - fw, T, fw);
    if (isLand(at(tx - 1, ty))) g.fillRect(x, y, fw, T);
    if (isLand(at(tx + 1, ty))) g.fillRect(x + T - fw, y, fw, T);
  }

  /* ---------- sky + backdrops ---------- */
  function skyCols(env) {
    const grey = (env.cloud || 0) > .75 || /rain|snow|fog|storm/.test(env.kind) ? 1 : 0;
    let top = mx('#121a2b', grey ? '#8a949b' : '#6f9dc0', env.day), bot = mx('#252e47', grey ? '#b8bdbd' : '#cfdde3', env.day);
    if (env.dusk > 0) { top = mx(top, '#5f5579', env.dusk * .5); bot = mx(bot, '#e8a06a', env.dusk * .75); }
    return [top, bot];
  }
  function stars(g, x, y, w, h, env, t) {
    const a = (.55 - env.day) * (1 - (env.cloud || 0)); if (a <= 0) return;
    const r = rng(77); g.fillStyle = '#ffffff';
    for (let i = 0; i < 80; i++) { g.globalAlpha = a * (.55 + .45 * Math.sin(t / 600 + i * 1.7)); g.fillRect(x + r() * w, y + r() * h, 1.5, 1.5); }
    g.globalAlpha = 1;
  }
  function sunMoon(g, x, y, w, h, env) {
    const hr = env.hour === undefined ? 12 : env.hour; if ((env.cloud || 0) > .85) return;
    const su = (hr - 5) / 14;
    if (su > 0 && su < 1 && env.day > .1) {
      const sx = x + w * su, sy = y + h * (.9 - Math.sin(su * Math.PI) * .7);
      g.fillStyle = 'rgba(255,236,190,.25)'; circ(g, sx, sy, 24); g.fillStyle = env.dusk > .3 ? '#f4b06a' : '#fff1c9'; circ(g, sx, sy, 11);
    }
    const mu = mod(hr - 19, 24) / 12;
    if (mu > 0 && mu < 1 && env.day < .6) {
      const sx = x + w * mu, sy = y + h * (.85 - Math.sin(mu * Math.PI) * .65);
      g.fillStyle = '#e8ecef'; circ(g, sx, sy, 8); g.fillStyle = skyCols(env)[0]; circ(g, sx + 3.5, sy - 2.5, 7);
    }
  }
  function ridge(g, x0, w, base, amp, col, seed, scale, off, snow) {
    const p = new Path2D(); p.moveTo(x0, base);
    for (let x = 0; x <= w + 8; x += 8) {
      const u = (x + off) / scale;
      p.lineTo(x0 + x, base - amp * (.55 * noise1(u, seed) + .3 * noise1(u * 2.3, seed + 7) + .15 * noise1(u * 5.1, seed + 13)));
    }
    p.lineTo(x0 + w + 8, base); p.closePath(); g.fillStyle = col; g.fill(p);
    if (snow) { g.save(); g.clip(p); g.fillStyle = 'rgba(238,242,245,.92)'; g.fillRect(x0, base - amp * 1.05, w + 8, amp * snow); g.restore(); }
    return p;
  }
  function skyClouds(g, x, y, w, h, env, t) {
    const n = Math.round(2 + (env.cloud || 0) * 6), c = rgbOf(mx('#ffffff', skyCols(env)[1], .35)).join(',');
    g.fillStyle = 'rgba(' + c + ',' + (.45 + (env.cloud || 0) * .35) + ')';
    for (let i = 0; i < n; i++) {
      const cx = x + mod(i * 331 + t * .004 * (1 + (env.wind || 0) * 3), w + 240) - 120, cy = y + h * (.15 + (i % 3) * .12);
      ell(g, cx, cy, 55, 12); ell(g, cx + 28, cy - 6, 30, 11); ell(g, cx - 26, cy - 3, 26, 9);
    }
  }
  function backdrop(g, kind, x, y, w, h, env, t) {
    const [a, b] = skyCols(env), gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(x, y, w, h);
    stars(g, x, y, w, h * .7, env, t); sunMoon(g, x, y, w, h * .85, env);
    const base = y + h, dim = c => mx(mx(c, b, .3), '#0d1324', (1 - env.day) * .65), cold = env.season !== 'summer';
    if (kind === 'baikal') {            // Khamar-Daban range across the lake
      ridge(g, x, w, base - h * .06, h * .62, dim('#66798a'), 21, 170, 0, cold ? .4 : .14);
      ridge(g, x, w, base - h * .06, h * .3, dim('#3f5a4c'), 22, 110, 0);
      g.fillStyle = env.frozen ? dim('#b9d3dc') : dim(WATER.lake); g.fillRect(x, base - h * .07, w, h * .07);
    } else if (kind === 'elbrus') {     // twin-summited, glaciated volcano
      ridge(g, x, w, base, h * .45, dim('#7b8692'), 11, 150, 0, .3);
      const cx = x + w * .5, H = h * .92, p = new Path2D();
      p.moveTo(cx - w * .4, base); p.quadraticCurveTo(cx - w * .2, base - H * .5, cx - w * .085, base - H);
      p.quadraticCurveTo(cx - w * .03, base - H * .86, cx + w * .02, base - H * .87);
      p.quadraticCurveTo(cx + w * .06, base - H * .995, cx + w * .1, base - H * .965);
      p.quadraticCurveTo(cx + w * .24, base - H * .5, cx + w * .42, base); p.closePath();
      g.fillStyle = dim('#59606b'); g.fill(p);
      g.save(); g.clip(p);
      g.fillStyle = dim('#e9eef2'); g.fillRect(x, base - H, w, H * .78);
      g.fillStyle = dim('#c9d4dc'); g.fillRect(cx + w * .01, base - H, w * .45, H * .78);
      g.strokeStyle = dim('#b3c0cb'); g.lineWidth = 2;
      for (let i = -6; i <= 6; i++) ln(g, cx + i * w * .025, base - H * .9, cx + i * w * .06, base - H * .2);
      g.restore();
      ridge(g, x, w, base, h * .28, dim('#4b5a52'), 12, 90, 0, cold ? .35 : 0);
    } else if (kind === 'volcanoes') {  // Koryaksky (left) and Avachinsky (right)
      const cone = (cx, hw, H, flat, col) => {
        const p = new Path2D(); p.moveTo(cx - hw, base); p.quadraticCurveTo(cx - hw * .3, base - H * .7, cx - flat, base - H);
        p.lineTo(cx + flat, base - H); p.quadraticCurveTo(cx + hw * .3, base - H * .7, cx + hw, base); p.closePath();
        g.fillStyle = col; g.fill(p); g.save(); g.clip(p);
        g.fillStyle = dim('#edf1f4'); g.fillRect(cx - hw, base - H, hw * 2, H * (env.season === 'summer' ? .3 : .62));
        g.strokeStyle = dim('#5d5a5e'); g.lineWidth = 1.5;
        for (let i = -4; i <= 4; i++) ln(g, cx + i * 3, base - H, cx + i * hw * .2, base - H * .35);
        g.restore();
      };
      ridge(g, x, w, base, h * .3, dim('#6e7680'), 31, 120, 0, cold ? .3 : 0);
      cone(x + w * .3, w * .2, h * .9, 4, dim('#5d5a5e'));
      cone(x + w * .66, w * .17, h * .7, 16, dim('#615b58'));
      const vx = x + w * .66, vy = base - h * .7;
      for (let i = 0; i < 6; i++) { const k = mod(t / 3200 + i / 6, 1); g.fillStyle = 'rgba(235,238,240,' + (.5 * (1 - k)) + ')'; circ(g, vx + k * 40 * (.3 + (env.wind || 0)), vy - 4 - k * h * .35, 4 + k * 14); }
      g.fillStyle = dim('#2b3a40'); g.fillRect(x, base - h * .05, w, h * .05);
    } else if (kind === 'hills') {      // western Caucasus behind Sochi
      ridge(g, x, w, base, h * .7, dim('#6f8a7a'), 41, 200, 0, env.season === 'winter' ? .2 : 0);
      ridge(g, x, w, base, h * .45, dim('#4f7346'), 42, 120, 0);
      const r = rng(43); g.fillStyle = dim('#efe6d0'); for (let i = 0; i < 26; i++) g.fillRect(x + r() * w, base - r() * h * .25 - 4, 4, 3);
    }
    skyClouds(g, x, y, w, h * .7, env, t);
  }

  /* ---------- object registry ---------- */
  const DEF = {};
  function def(t, w, h, solid, draw, flag) { DEF[t] = { w, h, solid, draw, flag: flag || '' }; }
  function foot(o) { const d = DEF[o.t] || {}; return { w: o.w || d.w || 1, h: o.h || d.h || 1 }; }
  function solid(o) {
    const d = DEF[o.t]; if (!d || !d.solid) return null;
    const f = foot(o), s = d.solid === 1 ? [0, 0, f.w, f.h] : d.solid;
    return { x: (o.x + s[0]) * T, y: (o.y + s[1]) * T, w: s[2] * T, h: s[3] * T };
  }
  function base(o) { const d = DEF[o.t] || {}; return d.flag === 'over' ? 1e9 : (o.y + foot(o).h) * T; }
  const isFlat = o => (DEF[o.t] || {}).flag === 'flat', isOver = o => (DEF[o.t] || {}).flag === 'over';
  function draw(g, o, env, t) { const d = DEF[o.t]; if (d && d.draw) d.draw(g, o, env, t); }

  /* ---------- buildings ---------- */
  const BST = {
    panel:    { wall: '#cfc8b8', roof: 'flat', roofc: '#7f7d79', trim: '#ece7db', win: '#6d8592', panel: 1, balcony: 1 },
    stucco:   { wall: '#d8c27c', roof: 'pitched', roofc: '#5d7a5c', trim: '#f1ece0', win: '#6d8592', pil: 1 },
    brick:    { wall: '#a2533c', roof: 'pitched', roofc: '#4b5157', trim: '#e7dfcf', win: '#6d8592', brick: 1 },
    izba:     { wall: '#8a6240', roof: 'pitched', roofc: '#6f6b64', trim: '#eef0ea', win: '#55707e', logs: 1, carved: '#3f6f9a' },
    chalet:   { wall: '#9b7a55', roof: 'pitched', roofc: '#3f4448', trim: '#e9e2d0', win: '#55707e', stone: 1 },
    station:  { wall: '#e4d8b8', roof: 'flat', roofc: '#6d7a74', trim: '#fbf7ee', win: '#6d8592', arch: 1, clock: 1, pil: 1 },
    palace:   { wall: '#86b8a0', roof: 'flat', roofc: '#8a948f', trim: '#f4f1e8', win: '#5f7884', arch: 1, cols: 1, statues: 1 },
    exchange: { wall: '#e1d6c2', roof: 'flat', roofc: '#8a8f8c', trim: '#f7f3ea', win: '#5f7884', cols: 1 },
    histmus:  { wall: '#9b3a2a', roof: 'pitched', roofc: '#5c6066', trim: '#efe9dd', win: '#5f7884', turrets: 1, brick: 1, arch: 1 },
    modern:   { wall: '#8fa3ad', roof: 'flat', roofc: '#6e7378', trim: '#d9e1e4', win: '#4d6572', glass: 1 }
  };
  function bLayout(o) {
    if (o._L) return o._L;
    const st = Object.assign({}, BST[o.style || 'stucco'], o.c || {});
    const X = o.x * T, Y = o.y * T, W = o.w * T, H = o.h * T, floors = o.floors || 2;
    const fh = Math.round(Math.min(H - 10, (o.fh || (floors * .9 + .45)) * T)), fy = Y + H - fh;
    const rowH = (fh - 12) / floors, cols = Math.max(1, Math.round(W / (st.arch ? 30 : 26))), cw = W / cols;
    const dc = o.door === undefined ? -1 : Math.floor((o.door + .5) * T / cw);
    const wins = []; let i = 0;
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      if (f === floors - 1 && c === dc) continue;
      const ww = Math.min(cw * .5, st.arch ? 14 : 12), wh = Math.min(rowH * .62, st.arch ? 20 : 15);
      wins.push({ x: X + cw * (c + .5) - ww / 2, y: fy + 8 + rowH * f + (rowH - wh) * .45, w: ww, h: wh, lit: hash(o.x + ':' + o.y + ':' + (i++)) % 100 < (o.lit || 45) });
    }
    const door = o.door === undefined ? null : { x: X + (o.door + .5) * T - 9, y: Y + H - 26, w: 18, h: 25 };
    return (o._L = { st, X, Y, W, H, fh, fy, rowH, cols, cw, wins, door });
  }
  function winShape(g, w, arch) {
    g.beginPath();
    if (arch) { g.moveTo(w.x, w.y + w.h); g.lineTo(w.x, w.y + w.w / 2); g.arc(w.x + w.w / 2, w.y + w.w / 2, w.w / 2, Math.PI, 0); g.lineTo(w.x + w.w, w.y + w.h); g.closePath(); }
    else g.rect(w.x, w.y, w.w, w.h);
  }
  function win(g, w, st, env) {
    if (st.carved) { g.fillStyle = st.carved; poly(g, [w.x - 4, w.y - 2, w.x + w.w / 2, w.y - 9, w.x + w.w + 4, w.y - 2]); g.fillRect(w.x - 4, w.y + w.h, w.w + 8, 4); }
    g.fillStyle = st.trim; winShape(g, { x: w.x - 2, y: w.y - 2, w: w.w + 4, h: w.h + 4 }, st.arch); g.fill();
    g.fillStyle = mx(st.win, '#1a2233', (1 - env.day) * .6); winShape(g, w, st.arch); g.fill();
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(w.x + 1, w.y + w.h * .3, w.w * .35, w.h * .6);
    g.fillStyle = st.trim; g.fillRect(w.x + w.w / 2 - .5, w.y + 2, 1, w.h - 2); g.fillRect(w.x, w.y + w.h * .4, w.w, 1);
    g.fillStyle = sh(st.trim, -.15); g.fillRect(w.x - 3, w.y + w.h + 1, w.w + 6, 2);
    if (env.snow > .3) { g.fillStyle = SNOWC; g.fillRect(w.x - 3, w.y + w.h, w.w + 6, 2); }
  }
  function clockFace(g, cx, cy, r, hour) {
    g.fillStyle = '#1d2a3a'; circ(g, cx, cy, r + 1.5); g.fillStyle = '#efe6cc'; circ(g, cx, cy, r);
    g.strokeStyle = GOLD; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
    const h = hour === undefined ? 12 : hour, ah = (h % 12) / 12 * TAU - Math.PI / 2, am = (h % 1) * TAU - Math.PI / 2;
    g.strokeStyle = '#1d2230'; g.lineCap = 'round';
    g.lineWidth = 1.7; ln(g, cx, cy, cx + Math.cos(ah) * r * .5, cy + Math.sin(ah) * r * .5);
    g.lineWidth = 1; ln(g, cx, cy, cx + Math.cos(am) * r * .8, cy + Math.sin(am) * r * .8);
  }
  function smoke(g, x, y, t, env) {
    if ((env.temp || 0) > 12 && env.season === 'summer') return;
    for (let i = 0; i < 5; i++) {
      const k = mod(t / 2600 + i / 5, 1);
      g.fillStyle = 'rgba(220,224,228,' + (.45 * (1 - k)) + ')';
      circ(g, x + k * 18 * (.3 + (env.wind || 0)) + Math.sin(k * 6 + i) * 2, y - k * 30, 2.5 + k * 6);
    }
  }
  function roof(g, o, L, env, t) {
    const st = L.st, X = L.X, Y = L.Y, W = L.W, fy = L.fy, h = fy - Y; if (h <= 2) return;
    const c0 = snowy(st.roofc, env, .95);
    if (st.roof === 'flat') {
      g.fillStyle = c0; g.fillRect(X, Y, W, h);
      g.fillStyle = sh(c0, .14); g.fillRect(X, Y, W, 3); g.fillRect(X, Y, 3, h); g.fillRect(X + W - 3, Y, 3, h);
      g.fillStyle = sh(c0, -.2); g.fillRect(X, fy - 3, W, 3);
      const r = rng(hash('rf' + o.x + ':' + o.y));
      if (h > 30) for (let i = 0; i < Math.floor(W / 80) + 1; i++) box(g, X + 10 + r() * (W - 34), Y + 6 + r() * (h - 26), 14, 12, 5, snowy('#b4b2ad', env), '#8a8884');
      if (st.statues) {
        g.fillStyle = st.trim; g.fillRect(X, fy - 7, W, 3);
        for (let sx = X + 14; sx < X + W - 8; sx += 28) { g.fillStyle = '#e9e4d6'; g.fillRect(sx - 1.5, fy - 17, 3, 10); circ(g, sx, fy - 19, 2.5); }
      }
    } else {
      const ry = Y + h * .4;
      g.fillStyle = sh(c0, .12); g.fillRect(X - 4, Y, W + 8, ry - Y);
      g.fillStyle = c0; g.fillRect(X - 4, ry, W + 8, fy - ry + 2);
      if (env.snow < .5) { g.strokeStyle = sh(c0, -.14); g.lineWidth = 1; g.beginPath(); for (let sx = X + 3; sx < X + W; sx += 7) { g.moveTo(sx + .5, ry); g.lineTo(sx + .5, fy); } g.stroke(); }
      g.fillStyle = sh(c0, -.3); g.fillRect(X - 4, ry - 1, W + 8, 2);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X - 4, fy - 2, W + 8, 3);
      g.strokeStyle = LINE; g.lineWidth = 1; g.strokeRect(X - 3.5, Y + .5, W + 7, fy - Y);
      if (st.turrets) for (const u of [.12, .32, .5, .68, .88]) {
        const tx = X + W * u, k = u === .5 ? 1.4 : 1;
        g.fillStyle = st.wall; g.fillRect(tx - 5 * k, ry - 6, 10 * k, 14); g.fillStyle = st.trim; g.fillRect(tx - 5 * k, ry - 6, 10 * k, 2);
        g.fillStyle = snowy('#d9dde0', env); poly(g, [tx - 6 * k, ry - 6, tx, ry - 26 * k, tx + 6 * k, ry - 6]);
        g.fillStyle = GOLD; g.fillRect(tx - .7, ry - 31 * k, 1.4, 6);
      }
      if (!o.nochim) {
        const cx = X + W * .74, cy = Y + h * .15;
        g.fillStyle = sh(st.wall, -.25); g.fillRect(cx, cy, 8, 12); g.fillStyle = snowy('#4a3f38', env); g.fillRect(cx - 1, cy - 2, 10, 3);
        smoke(g, cx + 4, cy - 3, t, env);
      }
    }
  }
  function bld(g, o, env, t) {
    const L = bLayout(o), st = L.st, X = L.X, Y = L.Y, W = L.W, H = L.H, fy = L.fy, fh = L.fh, wall = st.wall, floors = o.floors || 2;
    g.fillStyle = 'rgba(18,22,30,.2)'; g.fillRect(X + 5, Y + H, W, 6);
    roof(g, o, L, env, t);
    g.fillStyle = wall; g.fillRect(X, fy, W, fh);
    if (st.brick) { g.fillStyle = sh(wall, -.1); for (let yy = fy + 7; yy < Y + H - 6; yy += 5) g.fillRect(X, yy, W, 1); }
    if (st.panel) { g.fillStyle = sh(wall, -.09); for (let c = 1; c < L.cols; c++) g.fillRect(X + L.cw * c, fy + 4, 1, fh - 8); }
    if (st.logs) for (let yy = fy + 4; yy < Y + H - 2; yy += 6) {
      g.fillStyle = sh(wall, .1); g.fillRect(X, yy, W, 3); g.fillStyle = sh(wall, -.25); g.fillRect(X, yy + 4.5, W, 1);
      g.fillStyle = sh(wall, -.08); circ(g, X + 1, yy + 2.5, 3.2); circ(g, X + W - 1, yy + 2.5, 3.2);
    }
    if (st.stone) {
      const sy = Y + H - fh * .45; g.fillStyle = '#8b8780'; g.fillRect(X, sy, W, Y + H - sy); g.fillStyle = '#a19c94';
      for (let yy = sy + 2, n = 0; yy < Y + H - 4; yy += 7, n++) for (let xx = X + (n % 2) * 6; xx < X + W - 6; xx += 12) { rr(g, xx + 1, yy, 10, 6, 2); g.fill(); }
    }
    if (st.glass) { g.fillStyle = sh(wall, -.12); for (let xx = X + 8; xx < X + W; xx += 16) g.fillRect(xx, fy + 4, 1, fh - 8); }
    if (st.pil || st.cols) for (let c = 1; c < L.cols; c++) {
      const px = X + L.cw * c;
      if (st.cols) { g.fillStyle = st.trim; g.fillRect(px - 3, fy + 5, 6, fh - 10); g.fillStyle = sh(st.trim, -.12); g.fillRect(px + 1, fy + 5, 2, fh - 10); g.fillStyle = GOLD; g.fillRect(px - 4, fy + 5, 8, 2); }
      else { g.fillStyle = sh(st.trim, -.05); g.fillRect(px - 2, fy + 4, 4, fh - 8); }
    }
    for (let f = 1; f < floors; f++) { g.fillStyle = sh(wall, .1); g.fillRect(X, fy + 8 + L.rowH * f - 3, W, 1.5); }
    g.fillStyle = st.trim; g.fillRect(X - 2, fy, W + 4, 4);
    g.fillStyle = sh(wall, -.32); g.fillRect(X, Y + H - 5, W, 5);
    for (const w of L.wins) win(g, w, st, env);
    if (st.balcony) L.wins.forEach((w, i) => { if (i % 3 === 1 && w.y < Y + H - L.rowH) box(g, w.x - 4, w.y + w.h - 1, w.w + 8, 8, 2, sh(wall, .1), sh(wall, -.1)); });
    if (st.clock) {
      const cx = X + W / 2, ty = fy - 30; g.fillStyle = wall; g.fillRect(cx - 16, ty, 32, 30);
      g.beginPath(); g.rect(cx - 15.5, ty + .5, 31, 29); edge(g);
      g.fillStyle = st.trim; poly(g, [cx - 19, ty, cx, ty - 12, cx + 19, ty]); clockFace(g, cx, ty + 14, 9, env.hour);
    }
    if (L.door) {
      const d = L.door;
      g.fillStyle = sh(st.trim, -.1); g.fillRect(d.x - 3, d.y - 3, d.w + 6, d.h + 3);
      g.fillStyle = st.glass ? '#4d6572' : (o.doorc || '#5a3d2a'); g.fillRect(d.x, d.y, d.w, d.h);
      g.fillStyle = 'rgba(255,255,255,.13)'; g.fillRect(d.x + 2, d.y + 2, d.w / 2 - 3, d.h - 4);
      g.fillStyle = '#d8c27a'; g.fillRect(d.x + d.w - 5, d.y + d.h / 2, 2, 3);
      g.fillStyle = '#9d978c'; g.fillRect(d.x - 5, d.y + d.h - 2, d.w + 10, 3);
      g.fillStyle = sh(st.roofc, -.1); g.fillRect(d.x - 6, d.y - 7, d.w + 12, 4);
    }
    if (o.sign) {
      g.font = 'bold 10px "PT Sans", sans-serif';
      const tw = g.measureText(o.sign).width + 12, sx = (L.door ? L.door.x + 9 : X + W / 2) - tw / 2, sy = L.door ? L.door.y - 23 : fy + 6;
      g.fillStyle = o.signc || '#1d2230'; g.fillRect(sx, sy, tw, 14);
      g.fillStyle = '#f1ece0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.sign, sx + tw / 2, sy + 7.5);
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    }
    g.strokeStyle = LINE; g.lineWidth = 1; g.strokeRect(X + .5, fy + .5, W - 1, fh - 1);
    if (env.snow > .3) { g.fillStyle = SNOWC; g.fillRect(X - 2, fy - 1, W + 4, 2.5); }
  }

  /* ---------- landmarks ---------- */
  function star(g, cx, cy, r, fill) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); }
    g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = GOLD; g.lineWidth = 1.4; g.stroke();
  }
  function onion(g, cx, by, w, h, c1, c2, pat) {
    const p = new Path2D(); p.moveTo(cx - w * .38, by);
    p.bezierCurveTo(cx - w * .62, by - h * .35, cx - w * .5, by - h * .62, cx, by - h);
    p.bezierCurveTo(cx + w * .5, by - h * .62, cx + w * .62, by - h * .35, cx + w * .38, by); p.closePath();
    g.fillStyle = c1; g.fill(p);
    if (pat && c2) {
      g.save(); g.clip(p); g.strokeStyle = c2; g.fillStyle = c2;
      if (pat === 'spiral') { g.lineWidth = w * .13; for (let i = -4; i < 5; i++) { g.beginPath(); g.moveTo(cx + i * w * .28 - w * .3, by); g.quadraticCurveTo(cx + i * w * .28, by - h * .5, cx + i * w * .28 + w * .25, by - h); g.stroke(); } }
      else if (pat === 'zig') { g.lineWidth = 2; for (let row = 1; row < 5; row++) { const yy = by - h * row / 5; g.beginPath(); for (let i = 0; i <= 8; i++) g.lineTo(cx - w * .6 + i * w * .15, yy + (i % 2 ? -3 : 3)); g.stroke(); } }
      else if (pat === 'stars') { const r = rng(hash('st' + Math.round(cx))); for (let i = 0; i < 9; i++) circ(g, cx - w * .4 + r() * w * .8, by - h * .1 - r() * h * .75, 1.3); }
      g.restore();
    }
    g.fillStyle = 'rgba(255,255,255,.22)'; ell(g, cx - w * .14, by - h * .55, w * .07, h * .16);
    g.strokeStyle = LINE; g.lineWidth = 1; g.stroke(p);
    g.strokeStyle = GOLD; g.lineWidth = 1.5; ln(g, cx, by - h, cx, by - h - 8); ln(g, cx - 3, by - h - 5.5, cx + 3, by - h - 5.5);
  }
  function drum(g, cx, by, w, h, c, trim) {
    g.fillStyle = c; g.fillRect(cx - w / 2, by - h, w, h); g.strokeStyle = LINE; g.lineWidth = 1; g.strokeRect(cx - w / 2 + .5, by - h + .5, w - 1, h - 1);
    g.fillStyle = trim; g.fillRect(cx - w / 2, by - h, w, 2);
    const n = 3, sw = Math.max(2, (w - 6) / n - 3);
    g.fillStyle = '#3a3a44'; for (let i = 0; i < n; i++) { rr(g, cx - w / 2 + 4 + i * (w - 6) / n, by - h + 5, sw, h * .45, 2); g.fill(); }
  }
  function kwall(g, o, env) {
    const X = o.x * T, Y = o.y * T, W = o.w * T, H = (o.h || 2) * T, red = o.white ? '#e6e0d2' : '#9c3a2a', ft = Y + H * .38;
    g.fillStyle = 'rgba(18,22,30,.2)'; g.fillRect(X, Y + H, W, 5);
    g.fillStyle = snowy(sh(red, -.28), env); g.fillRect(X, Y, W, ft - Y);
    g.fillStyle = red; g.fillRect(X, ft, W, Y + H - ft);
    g.fillStyle = sh(red, -.1); for (let yy = ft + 4; yy < Y + H; yy += 5) g.fillRect(X, yy, W, 1);
    g.fillStyle = sh(red, -.3); g.fillRect(X, Y + H - 4, W, 4);
    for (let i = X; i < X + W - 4; i += 12) {   // swallowtail merlons
      g.fillStyle = sh(red, .06); poly(g, [i + 2, ft + 1, i + 2, ft - 9, i + 5.5, ft - 6, i + 9, ft - 9, i + 9, ft + 1]);
      g.strokeStyle = LINE; g.lineWidth = 1; g.stroke();
      if (env.snow > .3) { g.fillStyle = SNOWC; g.fillRect(i + 2, ft - 10, 7, 2); }
    }
    g.beginPath(); g.rect(X + .5, ft + .5, W - 1, Y + H - ft - 1); edge(g);
  }
  function ktower(g, o, env) {
    const f = foot(o), X = o.x * T, W = f.w * T, base = (o.y + f.h) * T, cx = X + W / 2, H = (o.vh || 7) * T;
    const red = o.white ? '#ebe5d8' : '#a23d2c', trim = o.white ? '#d6cdb9' : '#efe9dd';
    shadow(g, cx + 5, base, W * .55, 7);
    const b1 = base - H * .42, b2 = base - H * .64, b3 = base - H * .76, w2 = W * .72, w3 = W * .46, tip = base - H + 14;
    g.fillStyle = red; g.fillRect(X, b1, W, base - b1); g.beginPath(); g.rect(X + .5, b1 + .5, W - 1, base - b1 - 1); edge(g);
    g.fillStyle = sh(red, -.1); for (let yy = b1 + 6; yy < base; yy += 5) g.fillRect(X, yy, W, 1);
    g.fillStyle = trim; g.fillRect(X, b1, W, 3); g.fillRect(X, base - H * .2, W, 2);
    if (!o.small) { g.fillStyle = '#2a2420'; g.beginPath(); g.moveTo(cx - 11, base); g.lineTo(cx - 11, base - 20); g.arc(cx, base - 20, 11, Math.PI, 0); g.lineTo(cx + 11, base); g.fill(); }
    g.fillStyle = sh(red, .05); g.fillRect(cx - w2 / 2, b2, w2, b1 - b2); g.beginPath(); g.rect(cx - w2 / 2 + .5, b2 + .5, w2 - 1, b1 - b2 - 1); edge(g);
    g.fillStyle = trim; for (const sx of [-1, 1]) poly(g, [cx + sx * w2 / 2 - 3, b1, cx + sx * w2 / 2, b1 - 12, cx + sx * w2 / 2 + 3, b1]);
    if (!o.small) clockFace(g, cx, (b1 + b2) / 2, Math.min(w2 * .28, 13), env.hour);
    g.fillStyle = red; g.fillRect(cx - w3 / 2, b3, w3, b2 - b3); g.fillStyle = trim; g.fillRect(cx - w3 / 2, b3, w3, 2); g.fillRect(cx - w3 / 2, b2 - 2, w3, 2);
    g.fillStyle = o.white ? '#3f6b55' : '#3d6a4c'; poly(g, [cx - w3 / 2 - 2, b3, cx, tip, cx + w3 / 2 + 2, b3]);
    g.beginPath(); g.moveTo(cx - w3 / 2 - 2, b3); g.lineTo(cx, tip); g.lineTo(cx + w3 / 2 + 2, b3); edge(g);
    if (o.white) { g.strokeStyle = GOLD; g.lineWidth = 2; ln(g, cx, tip, cx, tip - 10); } else star(g, cx, tip - 7, o.small ? 5 : 7, '#b8322a');
  }
  function belltower(g, o) {
    const X = o.x * T, W = 2 * T, base = (o.y + 2) * T, cx = X + W / 2, white = '#f0ebe0';
    shadow(g, cx + 6, base, W * .6, 7);
    let y = base, w = W * .95;
    for (let i = 0; i < 3; i++) {
      const h = T * (2 - i * .35);
      g.fillStyle = white; g.fillRect(cx - w / 2, y - h, w, h); g.beginPath(); g.rect(cx - w / 2 + .5, y - h + .5, w - 1, h - 1); edge(g);
      g.fillStyle = sh(white, -.12); g.fillRect(cx - w / 2, y - h, w, 3);
      g.fillStyle = '#3a3a44';
      for (let k = 0; k < 2; k++) { const ax = cx - w * .22 + k * w * .44; g.beginPath(); g.moveTo(ax - 4, y - h * .25); g.lineTo(ax - 4, y - h * .62); g.arc(ax, y - h * .62, 4, Math.PI, 0); g.lineTo(ax + 4, y - h * .25); g.fill(); }
      y -= h; w *= .8;
    }
    drum(g, cx, y, w * .8, 20, white, '#e0d9cc'); onion(g, cx, y - 20, w, 32, GOLD);
  }
  function stbasil(g, o) {
    const X = o.x * T, W = 8 * T, base = (o.y + 4) * T, cx = X + W / 2, brick = '#a8452f', white = '#efe9dd';
    shadow(g, cx + 6, base, W * .55, 10);
    g.fillStyle = brick; g.fillRect(X + 4, base - 1.8 * T, W - 8, 1.8 * T); g.beginPath(); g.rect(X + 4.5, base - 1.8 * T + .5, W - 9, 1.8 * T - 1); edge(g);
    g.fillStyle = white; g.fillRect(X + 4, base - 1.8 * T, W - 8, 3);
    for (let i = 0; i < 11; i++) {
      const ax = X + 14 + i * (W - 28) / 10;
      g.fillStyle = '#5a2a20'; g.beginPath(); g.moveTo(ax - 5, base - 6); g.lineTo(ax - 5, base - 22); g.arc(ax, base - 22, 5, Math.PI, 0); g.lineTo(ax + 5, base - 6); g.fill();
      g.strokeStyle = white; g.lineWidth = 1.2; g.stroke();
    }
    const by = base - 1.8 * T;
    for (const [k, c1, c2, p] of [[-2.4, '#2f8a5a', '#e2c14c', 'spiral'], [-1.05, '#c23b2b', '#f1ece0', 'spiral'], [1.05, '#2f5f9a', '#f1ece0', 'zig'], [2.4, '#e2c14c', '#2f8a5a', 'zig']]) {
      const dx = cx + k * T; drum(g, dx, by, 22, 1.3 * T, brick, white); onion(g, dx, by - 1.3 * T, 28, 34, c1, c2, p);
    }
    g.fillStyle = brick; g.fillRect(cx - 15, by - 2.6 * T, 30, 2.6 * T); g.beginPath(); g.rect(cx - 14.5, by - 2.6 * T + .5, 29, 2.6 * T - 1); edge(g);
    const tb = by - 2.6 * T, tt = tb - 3.2 * T;
    g.fillStyle = '#d9b45a'; poly(g, [cx - 17, tb, cx, tt, cx + 17, tb]);
    g.fillStyle = '#3d6a4c'; for (let i = 0; i < 6; i++) { const yy = tb - i * T * .5 - 8, ww = 15 * (1 - i / 6.4); poly(g, [cx - ww * .5, yy, cx, yy - 6, cx + ww * .5, yy]); }
    g.beginPath(); g.moveTo(cx - 17, tb); g.lineTo(cx, tt); g.lineTo(cx + 17, tb); edge(g);
    onion(g, cx, tt + 4, 12, 14, GOLD);
    for (const [k, c1, c2, p] of [[-3.1, '#c23b2b', '#2f8a5a', 'zig'], [-1.5, '#2f8a5a', '#e2c14c', 'spiral'], [1.5, '#e2c14c', '#c23b2b', 'spiral'], [3.1, '#2f5f9a', '#e2c14c', 'zig']]) {
      const dx = cx + k * T; drum(g, dx, by + 4, 24, .9 * T, brick, white); onion(g, dx, by + 4 - .9 * T, 34, 40, c1, c2, p);
    }
  }
  function church(g, o, env) {
    const f = foot(o), X = o.x * T, W = f.w * T, base = (o.y + f.h) * T, cx = X + W / 2, wood = !!o.wood;
    const wall = wood ? '#8a6542' : '#f1ede4', bh = 1.9 * T, D = o.domes || [{ c: GOLD }];
    shadow(g, cx + 5, base, W * .55, 8);
    g.fillStyle = wall; g.fillRect(X + 6, base - bh, W - 12, bh); g.beginPath(); g.rect(X + 6.5, base - bh + .5, W - 13, bh - 1); edge(g);
    if (wood) { g.fillStyle = sh(wall, -.22); for (let yy = base - bh + 5; yy < base; yy += 6) g.fillRect(X + 6, yy, W - 12, 1); }
    g.fillStyle = '#4a5662';
    for (let i = 0; i < 3; i++) { const wx = X + 16 + i * (W - 32) / 2; g.beginPath(); g.moveTo(wx - 4, base - 14); g.lineTo(wx - 4, base - bh + 18); g.arc(wx, base - bh + 18, 4, Math.PI, 0); g.lineTo(wx + 4, base - 14); g.fill(); }
    g.fillStyle = wood ? snowy('#9aa0a3', env) : sh(wall, -.08); g.fillRect(X + 4, base - bh - 6, W - 8, 8);
    const by = base - bh - 4;
    D.slice(1).forEach((d, i) => {
      const dx = cx + (i % 2 ? 1 : -1) * W * (i > 1 ? .36 : .26);
      drum(g, dx, by, 16, 18, wall, wood ? '#9aa0a3' : '#e0d9cc');
      onion(g, dx, by - 18, 20, 24, d.c, d.c2 || (d.p === 'stars' ? GOLD : null), d.p);
    });
    if (wood) {
      g.fillStyle = snowy('#8f969a', env); poly(g, [cx - 16, by, cx, by - 46, cx + 16, by]);
      g.beginPath(); g.moveTo(cx - 16, by); g.lineTo(cx, by - 46); g.lineTo(cx + 16, by); edge(g);
      onion(g, cx, by - 44, 14, 16, D[0].c);
    } else { drum(g, cx, by, 26, 34, wall, '#e0d9cc'); onion(g, cx, by - 34, 32, 38, D[0].c, D[0].c2 || (D[0].p === 'stars' ? GOLD : null), D[0].p); }
  }
  function kulsharif(g, o) {
    const X = o.x * T, W = 9 * T, base = (o.y + 4) * T, cx = X + W / 2, white = '#f3f0ea', teal = '#2f9ea6';
    shadow(g, cx + 6, base, W * .55, 10);
    const minaret = (mxp, h, back) => {
      const w = back ? 11 : 13, top = base - h;
      g.fillStyle = back ? '#e3dfd6' : white; g.fillRect(mxp - w / 2, top + 22, w, h - 22);
      g.beginPath(); g.rect(mxp - w / 2 + .5, top + 22.5, w - 1, h - 23); edge(g);
      g.fillStyle = teal; for (const k of [.32, .58]) g.fillRect(mxp - w / 2 - 2, top + h * k, w + 4, 3);
      poly(g, [mxp - w / 2 - 1, top + 22, mxp, top, mxp + w / 2 + 1, top + 22]);
      g.strokeStyle = GOLD; g.lineWidth = 1.5; g.beginPath(); g.arc(mxp, top - 5, 3, .6, Math.PI * 1.9); g.stroke();
    };
    minaret(X + 1.4 * T, 7.4 * T, true); minaret(X + W - 1.4 * T, 7.4 * T, true);
    const bh = 2.4 * T, bx = X + T, bw = W - 2 * T;
    g.fillStyle = white; g.fillRect(bx, base - bh, bw, bh); g.beginPath(); g.rect(bx + .5, base - bh + .5, bw - 1, bh - 1); edge(g);
    g.fillStyle = '#4f8fa6';
    for (let i = 0; i < 9; i++) { const ax = bx + 12 + i * (bw - 24) / 8; g.beginPath(); g.moveTo(ax - 4, base - 12); g.lineTo(ax - 4, base - bh + 22); g.arc(ax, base - bh + 22, 4, Math.PI, 0); g.lineTo(ax + 4, base - 12); g.fill(); }
    g.fillStyle = teal; g.fillRect(bx, base - bh, bw, 4);
    const dw = 3.2 * T, db = base - bh, top = db - 1.1 * T, apex = top - 2.7 * T;
    g.fillStyle = white; g.fillRect(cx - dw / 2 + 8, top, dw - 16, 1.1 * T); g.beginPath(); g.rect(cx - dw / 2 + 8.5, top + .5, dw - 17, 1.1 * T - 1); edge(g);
    const p = new Path2D(); p.moveTo(cx - dw / 2 + 4, top);
    p.bezierCurveTo(cx - dw / 2, top - 1.6 * T, cx - 10, top - 2.4 * T, cx, apex);
    p.bezierCurveTo(cx + 10, top - 2.4 * T, cx + dw / 2, top - 1.6 * T, cx + dw / 2 - 4, top); p.closePath();
    g.fillStyle = teal; g.fill(p); g.save(); g.clip(p); g.strokeStyle = '#9fd6d9'; g.lineWidth = 1.5;
    for (let i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(cx + i * dw / 11, top); g.quadraticCurveTo(cx + i * dw / 20, top - 1.6 * T, cx, apex); g.stroke(); }
    g.restore(); g.strokeStyle = LINE; g.lineWidth = 1; g.stroke(p);
    g.strokeStyle = GOLD; g.lineWidth = 2; ln(g, cx, apex, cx, apex - 10); g.beginPath(); g.arc(cx, apex - 14, 4, .6, Math.PI * 1.9); g.stroke();
    minaret(X + 2.4 * T, 6 * T, false); minaret(X + W - 2.4 * T, 6 * T, false);
  }
  function soyembike(g, o) {
    const X = o.x * T, base = (o.y + 2) * T, cx = X + T, red = '#9e4430', trim = '#efe9dd';
    shadow(g, cx + 5, base, T * 1.1, 6);
    g.save(); g.translate(cx, base); g.rotate(.035);    // the tower famously leans
    let y = 0, w = T * 1.8;
    for (let i = 0; i < 6; i++) {
      const h = T * (i < 3 ? .9 : .6);
      g.fillStyle = red; g.fillRect(-w / 2, y - h, w, h); g.beginPath(); g.rect(-w / 2 + .5, y - h + .5, w - 1, h - 1); edge(g);
      g.fillStyle = trim; g.fillRect(-w / 2, y - h, w, 2);
      g.fillStyle = '#3a2a24'; g.beginPath(); g.moveTo(-3, y - 4); g.lineTo(-3, y - h * .6); g.arc(0, y - h * .6, 3, Math.PI, 0); g.lineTo(3, y - 4); g.fill();
      y -= h; w *= .83;
    }
    g.fillStyle = '#3d6a4c'; poly(g, [-w / 2 - 2, y, 0, y - 34, w / 2 + 2, y]);
    g.strokeStyle = GOLD; g.lineWidth = 1.6; ln(g, 0, y - 34, 0, y - 42); g.beginPath(); g.arc(0, y - 46, 3, .6, Math.PI * 1.9); g.stroke();
    g.restore();
  }
  function rostral(g, o, env) {
    const X = o.x * T, base = (o.y + 2) * T, cx = X + T, H = 5.2 * T, col = '#8a3a2c';
    shadow(g, cx + 6, base, 30, 7);
    box(g, cx - 24, base - 30, 48, 30, 6, snowy('#b3ada4', env), '#9a948b');
    g.fillStyle = '#7d7468'; for (const sx of [-17, 17]) { ell(g, cx + sx, base - 32, 6, 4); circ(g, cx + sx, base - 40, 3.5); }
    g.fillStyle = col; g.fillRect(cx - 8, base - H, 16, H - 30); g.beginPath(); g.rect(cx - 7.5, base - H + .5, 15, H - 31); edge(g);
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(cx - 5, base - H, 3, H - 30);
    g.fillStyle = '#7d6a3a';
    for (let i = 0; i < 4; i++) { const yy = base - 44 - i * (H - 60) / 4; for (const sx of [-1, 1]) poly(g, [cx + sx * 8, yy, cx + sx * 20, yy - 4, cx + sx * 16, yy + 5, cx + sx * 8, yy + 8]); }
    g.fillStyle = '#5f5a52'; g.fillRect(cx - 12, base - H - 4, 24, 4); poly(g, [cx - 10, base - H - 4, cx - 6, base - H - 12, cx + 6, base - H - 12, cx + 10, base - H - 4]);
  }

  /* ---------- trees (season-aware, wind-swayed) ---------- */
  const LEAF = {
    birch: { spring: '#a9cd6c', summer: '#6f9c48', autumn: '#dcb43c' },
    oak:   { spring: '#9cc364', summer: '#567f3c', autumn: '#bf7031' },
    larch: { spring: '#b3d27a', summer: '#7da657', autumn: '#d9a833' },
    shrub: { spring: '#8db85d', summer: '#5f8a42', autumn: '#a7893c' }
  };
  function canopy(g, cx, cy, R, col, r, env) {
    const dk = sh(col, -.25), lt = sh(col, .15);
    g.fillStyle = dk; ell(g, cx, cy + R * .3, R * 1.05, R * .8);
    g.fillStyle = col; for (let i = 0; i < 6; i++) circ(g, cx + (r() - .5) * R * 1.2, cy + (r() - .55) * R * .9, R * (.42 + r() * .25));
    g.fillStyle = lt; for (let i = 0; i < 4; i++) circ(g, cx + (r() - .65) * R * .9, cy - R * .25 + (r() - .5) * R * .5, R * (.2 + r() * .14));
    if (env.snow > .4) { g.fillStyle = 'rgba(240,244,246,.85)'; for (let i = 0; i < 4; i++) ell(g, cx + (r() - .5) * R, cy - R * .5 + r() * 4, R * .3, R * .12); }
  }
  function twigs(g, x, y, h, s, r, env, col) {
    g.strokeStyle = col || '#5c4a3d'; g.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const yy = y - h * .4 - i * h * .075, dx = (i % 2 ? 1 : -1) * (7 + r() * 9) * s;
      ln(g, x, yy, x + dx, yy - 7 * s); ln(g, x + dx * .6, yy - 4 * s, x + dx * .8, yy - 11 * s);
    }
    if (env.snow > .3) { g.fillStyle = 'rgba(240,244,246,.85)'; for (let i = 0; i < 6; i++) ell(g, x + (r() - .5) * 26 * s, y - h * .45 - r() * h * .5, 4, 1.3); }
  }
  function tree(g, o, env, t) {
    const k = o.k || 'birch', s = o.s || 1, x = o.x * T + T / 2, y = o.y * T + T - 5;
    const r = rng(hash('t' + o.x + ':' + o.y)), sw = Math.sin(t / 1100 + o.x * 1.3 + o.y * .7) * (.6 + (env.wind || 0) * 3);
    const sea = env.season === 'winter' || !LEAF.birch[env.season] ? (env.season === 'winter' ? 'winter' : 'summer') : env.season, winter = sea === 'winter';
    shadow(g, x + 5, y, 13 * s, 5 * s); g.lineCap = 'round';
    if (k === 'birch' || k === 'ermans') {     // ermans = Kamchatka stone birch
      const h = (k === 'ermans' ? 36 : 52) * s;
      g.strokeStyle = '#e9e5da'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(x, y);
      if (k === 'ermans') g.bezierCurveTo(x - 9 * s, y - h * .4, x + 9 * s, y - h * .6, x + sw * .5, y - h); else g.lineTo(x + sw * .3, y - h);
      g.stroke();
      g.fillStyle = '#2e2b29'; for (let i = 0; i < 5; i++) g.fillRect(x - 2 * s + (k === 'ermans' ? Math.sin(i * 1.3) * 3 : 0), y - 6 - i * h / 6, 3 * s, 1.5);
      if (winter) twigs(g, x + sw * .3, y, h, s, r, env); else canopy(g, x + sw, y - h * .82, 15 * s, LEAF.birch[sea], r, env);
    } else if (k === 'spruce' || k === 'larch') {
      const h = 64 * s, col = k === 'spruce' ? '#2f4f3a' : (LEAF.larch[sea] || '#7da657');
      g.fillStyle = '#5a4030'; g.fillRect(x - 2.5 * s, y - 12 * s, 5 * s, 12 * s);
      if (k === 'larch' && winter) {          // larch drops its needles in winter
        g.strokeStyle = '#6a5040'; g.lineWidth = 3 * s; ln(g, x, y, x + sw * .3, y - h); twigs(g, x + sw * .3, y, h, s * .8, r, env, '#7a5e4a');
      } else for (let i = 0; i < 4; i++) {
        const wy = y - 8 * s - i * h * .2, hw = h * (.36 - i * .07), tip = wy - h * .34, tx2 = x + sw * (i + 1) * .35;
        g.fillStyle = i % 2 ? col : sh(col, -.14); poly(g, [x - hw, wy, tx2, tip, x + hw, wy]);
        if (env.snow > .25) { g.fillStyle = 'rgba(240,244,246,.9)'; poly(g, [x - hw * .5, wy - h * .12, tx2, tip, x + hw * .5, wy - h * .12]); }
      }
    } else if (k === 'pine') {                 // Scots pine: orange upper trunk, flat crown
      const h = 64 * s; g.strokeStyle = '#a5643a'; g.lineWidth = 4.5 * s;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 3 * s, y - h * .5, x + sw * .4, y - h * .78); g.stroke();
      for (let i = 0; i < 4; i++) {
        const cx = x + sw * .6 + (i - 1.5) * 9 * s, cy = y - h * .8 - (i % 2) * 7 * s;
        g.fillStyle = '#2f4a30'; ell(g, cx, cy + 3, 12 * s, 6 * s); g.fillStyle = '#3e5f3a'; ell(g, cx, cy, 11 * s, 5.5 * s);
        if (env.snow > .3) { g.fillStyle = 'rgba(240,244,246,.9)'; ell(g, cx, cy - 3 * s, 8 * s, 2.5 * s); }
      }
    } else if (k === 'cedar') {                // Siberian pine
      const h = 56 * s; g.fillStyle = '#5a4030'; g.fillRect(x - 3 * s, y - 14 * s, 6 * s, 14 * s);
      canopy(g, x + sw * .6, y - h * .45, 17 * s, '#2e4a33', r, env); canopy(g, x + sw, y - h * .8, 12 * s, '#35553b', r, env);
    } else if (k === 'oak') {
      const h = 46 * s; g.strokeStyle = '#5a4434'; g.lineWidth = 7 * s; ln(g, x, y, x + sw * .3, y - h * .55);
      if (winter) twigs(g, x + sw * .3, y, h * 1.1, s * 1.3, r, env); else canopy(g, x + sw, y - h * .8, 21 * s, LEAF.oak[sea], r, env);
    } else if (k === 'palm') {
      const h = 58 * s, tx2 = x + 8 * s + sw * .5, ty2 = y - h;
      g.strokeStyle = '#8a7052'; g.lineWidth = 6 * s; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 2 * s, y - h * .6, tx2, ty2); g.stroke();
      g.strokeStyle = '#6e5940'; g.lineWidth = 1; for (let i = 1; i < 7; i++) { const yy = y - i * h / 7; ln(g, x + i * 1.1 * s - 3, yy, x + i * 1.1 * s + 3, yy); }
      g.strokeStyle = '#4f7d3b'; g.lineWidth = 3.2 * s;
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i - 3.5) * .42 + Math.sin(t / 800 + i) * .05 * (1 + (env.wind || 0) * 3), L = 26 * s;
        g.beginPath(); g.moveTo(tx2, ty2); g.quadraticCurveTo(tx2 + Math.cos(a) * L * .6, ty2 + Math.sin(a) * L * .6 - 6, tx2 + Math.cos(a) * L, ty2 + Math.sin(a) * L * .5 + 10); g.stroke();
      }
    } else if (k === 'cypress') {
      g.fillStyle = '#5a4030'; g.fillRect(x - 2, y - 6, 4, 6);
      g.fillStyle = '#2f4b33'; ell(g, x + sw * .4, y - 30 * s, 8 * s, 27 * s); g.fillStyle = '#3c5d40'; ell(g, x + sw * .4 - 2, y - 34 * s, 4 * s, 20 * s);
    } else {                                   // shrub
      if (winter && env.snow > .3) { g.fillStyle = 'rgba(240,244,246,.95)'; ell(g, x, y - 6, 12 * s, 7 * s); twigs(g, x, y, 20 * s, s * .6, r, env); }
      else canopy(g, x + sw * .3, y - 9 * s, 10 * s, winter ? '#6b6a4c' : LEAF.shrub[sea], r, env);
    }
  }

  /* ---------- register this file's types ---------- */
  def('bld', 0, 0, 1, bld);
  def('kwall', 0, 2, 1, kwall);
  def('ktower', 3, 3, 1, ktower);
  def('belltower', 2, 2, 1, belltower);
  def('stbasil', 8, 4, 1, stbasil);
  def('church', 5, 3, 1, church);
  def('kulsharif', 9, 4, 1, kulsharif);
  def('soyembike', 2, 2, 1, soyembike);
  def('rostral', 2, 2, 1, rostral);
  def('tree', 1, 1, [.3, .45, .4, .45], tree);

  return {
    tile, water, backdrop, skyCols, stars, sunMoon, ridge, skyClouds, grassCol,
    def, foot, solid, base, isFlat, isOver, draw, bLayout, winShape, DEF,
    SOLID: ' ~rW', SWIM: 'w', WATERC: WATER,
    u: { LINE, SNOWC, GOLD, mx, sh, snowy, circ, ell, ln, poly, edge, box, noise1, mod, rgbOf, onion, drum, canopy, twigs, LEAF, clockFace, smoke }
  };
})();
