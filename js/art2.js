/* =========================================================================
   RUSSIA: LIFE & BEYOND — js/art2.js
   Module: people, pets, wildlife, furniture, vehicles, weather and journeys.
   Original Canvas 2D artwork. No images, fonts, APIs or paid assets required.

   Load after js/art.js. This file extends ART's object registry and exposes
   ART2 helpers for moving actors, screen weather and the journey window.

   Scene objects use ART's normal tile coordinates:
     { t: 'person'|'npc'|'dog'|'cat'|..., x: tileX, y: tileY, ... }
   Moving actors may also be drawn at pixel coordinates with:
     ART2.person(ctx, pixelX, pixelY, options, env, elapsedMs)
     ART2.pet(ctx, pixelX, pixelY, options, env, elapsedMs)
   Weather overlay:
     ART2.weather(ctx, x, y, width, height, env, elapsedMs)
   Journey window:
     ART2.journey(ctx, {x,y,w,h,biome,season,day,hour,weather,vehicle,
                        progress,speed,paused}, elapsedMs)
   ========================================================================= */
'use strict';

const ART2 = (() => {
  const T = 32;
  const TAU = Math.PI * 2;
  const INK = 'rgba(29,34,48,.62)';
  const PAPER = '#eee6d3';
  const MUTED = '#545b69';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fract = v => v - Math.floor(v);
  const hash = s => {
    let h = 2166136261;
    const v = String(s);
    for (let i = 0; i < v.length; i++) {
      h ^= v.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const rand = (seed, n) => fract(Math.sin((seed + 1) * 127.1 + n * 311.7) * 43758.5453);
  const fillEllipse = (g, x, y, rx, ry) => {
    g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); g.fill();
  };
  const strokeEllipse = (g, x, y, rx, ry) => {
    g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); g.stroke();
  };
  const line = (g, x1, y1, x2, y2) => {
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  };
  const path = (g, pts) => {
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.fill();
  };
  const roundRect = (g, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + rr, y); g.arcTo(x + w, y, x + w, y + h, rr);
    g.arcTo(x + w, y + h, x, y + h, rr); g.arcTo(x, y + h, x, y, rr);
    g.arcTo(x, y, x + w, y, rr); g.closePath();
  };
  const outline = g => { g.strokeStyle = INK; g.lineWidth = 1.35; g.stroke(); };
  const tileX = o => (Number(o.x) || 0) * T + T / 2;
  const tileY = o => (Number(o.y) || 0) * T + T * .82;
  const seasonSnow = env => env && (env.season === 'winter' || (env.snow || 0) > .35);
  const palette = {
    skin: '#e2b48f', hair: '#40302b', coat: '#34546c', trousers: '#30394a',
    shoe: '#302a28', dog: '#b07a43', cat: '#8d8a86', wood: '#8b6547'
  };

  /* ---------- character drawing ---------- */
  function person(g, x, y, options, env, elapsed) {
    const o = options || {};
    const t = elapsed || 0;
    const anim = o.anim || (o.walking || o.moving ? 'walk' : 'idle');
    const walking = anim === 'walk' || anim === 'run' || !!o.walking;
    const phase = t * (anim === 'run' ? .022 : .012) + (o.phase || 0);
    const stride = walking ? Math.sin(phase) * (anim === 'run' ? 4.2 : 2.8) : Math.sin(t / 850) * .35;
    const dir = o.dir || o.direction || 'down';
    const look = o.look || {};
    const coat = look.top || o.color || palette.coat;
    const legs = look.legs || o.legsColor || palette.trousers;
    const skin = o.skin || palette.skin;
    const hair = o.hair || palette.hair;

    g.save();
    g.translate(x, y);
    if (dir === 'left') g.scale(-1, 1);
    if (anim === 'sleep') g.rotate(-Math.PI / 2);
    if (anim === 'sit') g.translate(0, 2);
    const scale = o.scale || 1;
    g.scale(scale, scale);

    /* shadow and feet */
    g.fillStyle = 'rgba(24,28,32,.20)';
    fillEllipse(g, 1, 9, 10, 4.2);
    g.lineCap = 'round';
    g.strokeStyle = palette.shoe;
    g.lineWidth = 4.2;
    line(g, -4 + stride, 4, -4 + stride * .65, 10);
    line(g, 4 - stride, 4, 4 - stride * .65, 10);
    g.fillStyle = palette.shoe;
    fillEllipse(g, -4 + stride, 10, 3.6, 2);
    fillEllipse(g, 4 - stride, 10, 3.6, 2);

    /* arms, torso and winter details */
    g.strokeStyle = skin; g.lineWidth = 4.1;
    line(g, -6, -5, -8 - stride * .35, 1);
    line(g, 6, -5, 8 + stride * .35, 1);
    g.fillStyle = coat;
    g.beginPath(); g.moveTo(-7, -10); g.quadraticCurveTo(-9, -5, -6, 2);
    g.quadraticCurveTo(0, 5, 6, 2); g.quadraticCurveTo(9, -5, 7, -10);
    g.quadraticCurveTo(0, -14, -7, -10); g.fill(); outline(g);
    if (look.coat || o.coat) {
      g.strokeStyle = '#e4d9c4'; g.lineWidth = 1.5; line(g, 0, -10, 0, 2);
      g.fillStyle = '#a8822c'; fillEllipse(g, 0, -5, 1.1, 1.1);
      fillEllipse(g, 0, 0, 1.1, 1.1);
    }
    if (look.stripe) {
      g.strokeStyle = look.stripe; g.lineWidth = 1.4; line(g, -5, -4, 5, -4);
    }
    if (look.pack || o.backpack) {
      g.fillStyle = '#6d6047'; roundRect(g, -8, -9, 4, 9, 2); g.fill(); outline(g);
    }
    if (o.scarf || look.scarf) {
      g.fillStyle = o.scarf || '#a83f31'; roundRect(g, -5, -11, 10, 3, 1); g.fill();
      g.fillRect(3, -9, 2.4, 7);
    }

    /* head and face */
    g.fillStyle = skin; fillEllipse(g, 0, -15, 6.4, 7); outline(g);
    g.fillStyle = hair;
    if (dir === 'up') {
      fillEllipse(g, 0, -18, 6.7, 5.2);
    } else {
      g.beginPath(); g.moveTo(-6, -16); g.quadraticCurveTo(-7, -24, 0, -23);
      g.quadraticCurveTo(7, -23, 6, -16); g.quadraticCurveTo(2, -20, -1, -18);
      g.closePath(); g.fill();
    }
    if (dir !== 'up') {
      g.fillStyle = '#302b2a';
      fillEllipse(g, 2.2, -15, 0.8, 1.05);
      if (dir === 'down') fillEllipse(g, -2.2, -15, 0.8, 1.05);
      g.strokeStyle = '#9b6658'; g.lineWidth = .8; line(g, -1, -11.4, 1.4, -11.4);
    }
    const hat = look.hat || o.hat;
    if (hat) {
      g.fillStyle = hat === 'ushanka' ? '#5d4035' : (look.beanie || '#526b63');
      if (hat === 'ushanka') {
        roundRect(g, -7, -22, 14, 6, 2); g.fill();
        fillEllipse(g, -6, -16, 2, 3); fillEllipse(g, 6, -16, 2, 3);
      } else {
        g.beginPath(); g.arc(0, -19, 6.8, Math.PI, 0); g.lineTo(6.8, -18); g.lineTo(-6.8, -18); g.closePath(); g.fill();
      }
    }
    if (anim === 'sleep') {
      g.strokeStyle = '#3e3a36'; g.lineWidth = 1; line(g, -3, -15, -1, -15);
      line(g, 1, -15, 3, -15);
    }
    if (o.bubble) {
      g.restore(); g.save(); g.font = '11px "PT Sans", sans-serif';
      const txt = String(o.bubble), width = Math.min(130, g.measureText(txt).width + 12);
      g.fillStyle = PAPER; g.fillRect(x - width / 2, y - 38, width, 18);
      g.strokeStyle = INK; g.strokeRect(x - width / 2 + .5, y - 37.5, width - 1, 17);
      g.fillStyle = '#1d2230'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(txt, x, y - 29, width - 8);
    }
    g.restore();
  }

  function actorObject(g, o, env, t) {
    person(g, tileX(o), tileY(o), o, env, t);
  }

  /* ---------- pets and small wildlife ---------- */
  function pet(g, x, y, options, env, elapsed) {
    const o = options || {}, t = elapsed || 0, kind = o.kind || o.species || o.petType || 'dog';
    const moving = !!(o.moving || o.walking || o.anim === 'walk');
    const wag = Math.sin(t / 120 + (o.phase || 0));
    const coat = o.color || (kind === 'cat' ? palette.cat : palette.dog);
    g.save(); g.translate(x, y); if (o.dir === 'left') g.scale(-1, 1);
    const bob = moving ? Math.abs(Math.sin(t / 115)) * 1.5 : Math.sin(t / 480) * .35;
    g.translate(0, bob);
    g.fillStyle = 'rgba(20,24,30,.18)'; fillEllipse(g, 0, 5, 10, 3);
    g.strokeStyle = INK; g.lineWidth = 1.2;
    if (kind === 'cat') {
      g.strokeStyle = coat; g.lineWidth = 3;
      g.beginPath(); g.moveTo(7, 1); g.quadraticCurveTo(15, -5 + wag * 2, 11, -11); g.stroke();
      g.fillStyle = coat; fillEllipse(g, 0, 0, 7.8, 4.5); outline(g);
      g.beginPath(); g.moveTo(-4, -3); g.lineTo(-7, -10); g.lineTo(-1, -6);
      g.moveTo(3, -4); g.lineTo(7, -10); g.lineTo(7, -3); g.fill(); outline(g);
      g.fillStyle = coat; fillEllipse(g, 0, -6, 5.1, 4.7); outline(g);
      g.fillStyle = '#d8b58f'; fillEllipse(g, 0, -4, 2.1, 1.4);
      g.fillStyle = '#26342c'; fillEllipse(g, -2, -7, .7, .9); fillEllipse(g, 2, -7, .7, .9);
    } else {
      g.strokeStyle = coat; g.lineWidth = 3.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(7, -1); g.quadraticCurveTo(13, -8 + wag * 3, 11, -12 + wag * 2); g.stroke();
      g.fillStyle = coat; fillEllipse(g, 0, 0, 8.5, 5); outline(g);
      g.fillStyle = coat; fillEllipse(g, -5, -5, 5.4, 5); outline(g);
      fillEllipse(g, -8, -8, 2.2, 3); fillEllipse(g, -2, -8, 2.2, 3);
      g.fillStyle = '#2d2926'; fillEllipse(g, -8, -4, 1.3, 1);
      g.strokeStyle = coat; g.lineWidth = 2.2;
      line(g, -4, 3, -5, 6); line(g, 3, 3, 4, 6);
    }
    g.restore();
  }
  function petObject(kind) {
    return (g, o, env, t) => pet(g, tileX(o), tileY(o), Object.assign({}, o, { kind }), env, t);
  }

  function squirrel(g, x, y, t) {
    g.save(); g.translate(x, y); g.fillStyle = 'rgba(20,24,30,.15)'; fillEllipse(g, 0, 4, 7, 2.5);
    g.fillStyle = '#a96d3e'; g.beginPath(); g.moveTo(4, 0);
    g.quadraticCurveTo(17, -5, 12, -17); g.quadraticCurveTo(9, -23, 6, -17);
    g.quadraticCurveTo(12, -11, 5, -7); g.closePath(); g.fill(); outline(g);
    fillEllipse(g, 0, -1, 5.5, 6); fillEllipse(g, -2, -8, 4, 4);
    g.fillStyle = '#2b2824'; fillEllipse(g, -3, -9, .7, .8); g.restore();
  }
  function bird(g, x, y, t, gull) {
    g.save(); g.translate(x, y + Math.sin(t / 180 + x) * 1.2);
    g.fillStyle = gull ? '#e5e0d6' : '#34383a'; fillEllipse(g, 0, 0, gull ? 6 : 5, 3.4); outline(g);
    g.strokeStyle = gull ? '#7d8587' : '#252a2b'; g.lineWidth = 1.7;
    g.beginPath(); g.moveTo(-1, 0); g.quadraticCurveTo(-9, -8, -11, -4);
    g.moveTo(1, 0); g.quadraticCurveTo(9, -8, 11, -4); g.stroke();
    g.strokeStyle = '#bd8c45'; line(g, 3, 0, 7, 1); g.restore();
  }
  function deer(g, x, y, t) {
    g.save(); g.translate(x, y); const step = Math.sin(t / 130) * 1.5;
    g.fillStyle = 'rgba(20,24,30,.17)'; fillEllipse(g, 0, 5, 12, 3);
    g.fillStyle = '#a7784b'; fillEllipse(g, 0, -1, 9, 5); outline(g);
    fillEllipse(g, 8, -5, 4, 3); fillEllipse(g, 10, -7, 2.5, 2.5);
    g.strokeStyle = '#6f5139'; g.lineWidth = 1.2;
    for (const dx of [-5, 4]) line(g, dx, 2, dx + step * (dx < 0 ? -1 : 1), 9);
    g.strokeStyle = '#77583c'; g.lineWidth = 1.6;
    line(g, 10, -8, 12, -14); line(g, 12, -14, 9, -17); line(g, 12, -14, 15, -17);
    line(g, 8, -8, 6, -13); line(g, 6, -13, 3, -16); line(g, 6, -13, 8, -17);
    g.restore();
  }
  function seal(g, x, y, t) {
    g.save(); g.translate(x, y + Math.sin(t / 370) * 1.2);
    g.fillStyle = 'rgba(20,24,30,.16)'; fillEllipse(g, 0, 4, 11, 3);
    g.fillStyle = '#9aa9ad'; g.beginPath(); g.moveTo(-10, 1);
    g.quadraticCurveTo(-5, -8, 5, -5); g.quadraticCurveTo(13, -3, 10, 3);
    g.quadraticCurveTo(3, 7, -7, 4); g.closePath(); g.fill(); outline(g);
    g.fillStyle = '#dedbd1'; fillEllipse(g, 7, -3, 4, 3);
    g.fillStyle = '#303a3c'; fillEllipse(g, 8, -4, .8, .8); g.restore();
  }
  function bear(g, x, y, t) {
    g.save(); g.translate(x, y + Math.sin(t / 260) * .5);
    g.fillStyle = 'rgba(20,24,30,.18)'; fillEllipse(g, 0, 5, 13, 3);
    g.fillStyle = '#654833'; fillEllipse(g, 0, -1, 10, 7); outline(g);
    fillEllipse(g, 8, -4, 5, 4); fillEllipse(g, 7, -8, 2, 2);
    g.fillStyle = '#292522'; fillEllipse(g, 11, -4, 1.3, 1);
    g.strokeStyle = '#513a2b'; g.lineWidth = 3;
    line(g, -6, 2, -7, 7); line(g, 5, 2, 6, 7); g.restore();
  }
  function mountainGoat(g, x, y, t) {
    g.save(); g.translate(x, y); g.fillStyle = '#746f65'; fillEllipse(g, 0, 0, 8, 5); outline(g);
    fillEllipse(g, 8, -4, 3.5, 3); g.strokeStyle = '#d8c5a1'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(7, -6); g.quadraticCurveTo(2, -17, 7, -17);
    g.moveTo(9, -6); g.quadraticCurveTo(15, -16, 13, -16); g.stroke();
    g.strokeStyle = '#49453e'; g.lineWidth = 1.5; line(g, -4, 3, -5, 8); line(g, 4, 3, 5, 8);
    g.restore();
  }
  function dolphin(g, x, y, t) {
    g.save(); g.translate(x, y + Math.sin(t / 260) * 2);
    g.fillStyle = '#628b98'; g.beginPath(); g.moveTo(-12, 1);
    g.quadraticCurveTo(-2, -7, 8, -3); g.lineTo(14, -6); g.lineTo(10, 0);
    g.quadraticCurveTo(1, 8, -12, 1); g.fill(); outline(g);
    path(g, [-1, -4, 1, -10, 5, -5]); path(g, [0, 2, 5, 7, 8, 2]);
    g.fillStyle = '#26363a'; fillEllipse(g, 7, -3, .8, .8); g.restore();
  }
  function wildlife(g, o, env, t) {
    const x = tileX(o), y = tileY(o) - 3, s = o.species || o.kind || 'squirrel';
    if (s.indexOf('gull') >= 0 || s === 'crow' || s === 'nutcracker') bird(g, x, y, t || 0, s.indexOf('gull') >= 0);
    else if (s === 'roe' || s === 'deer') deer(g, x, y, t || 0);
    else if (s === 'nerpa' || s === 'seal') seal(g, x, y, t || 0);
    else if (s === 'bear') bear(g, x, y, t || 0);
    else if (s === 'tur') mountainGoat(g, x, y, t || 0);
    else if (s === 'dolphin') dolphin(g, x, y, t || 0);
    else squirrel(g, x, y, t || 0);
  }
  function wildlifeKind(kind) {
    return (g, o, env, t) => wildlife(g, Object.assign({}, o, { species: kind }), env, t);
  }

  /* ---------- household furniture and place props ---------- */
  function bed(g, o) {
    const x = o.x * T, y = o.y * T, w = (o.w || 2) * T, h = (o.h || 1) * T;
    g.fillStyle = 'rgba(20,24,30,.17)'; g.fillRect(x + 3, y + h - 1, w, 5);
    g.fillStyle = '#79583e'; g.fillRect(x, y, w, h); outline(g);
    g.fillStyle = '#eee7d7'; roundRect(g, x + 4, y + 4, w - 8, h - 8, 4); g.fill(); outline(g);
    g.fillStyle = '#8b9eaa'; roundRect(g, x + 7, y + 7, w - 14, h - 15, 4); g.fill();
    g.fillStyle = '#f1eadc'; roundRect(g, x + 8, y + 7, Math.max(12, w * .3), h * .27, 3); g.fill();
    g.strokeStyle = 'rgba(60,65,70,.25)'; line(g, x + w * .55, y + 8, x + w * .55, y + h - 7);
  }
  function sofa(g, o) {
    const x = o.x * T, y = o.y * T, w = (o.w || 2) * T;
    g.fillStyle = '#76665c'; roundRect(g, x + 1, y + 3, w - 2, 26, 4); g.fill(); outline(g);
    g.fillStyle = '#9b7767'; roundRect(g, x + 4, y + 4, w - 8, 16, 3); g.fill(); outline(g);
    g.fillStyle = '#c7b39a'; g.fillRect(x + 7, y + 6, 2, 12); g.fillRect(x + w - 9, y + 6, 2, 12);
  }
  function table(g, o) {
    const x = o.x * T, y = o.y * T, w = (o.w || 1.5) * T, h = (o.h || 1) * T;
    g.fillStyle = '#6a4b35'; g.fillRect(x + 4, y + 5, 4, h - 4); g.fillRect(x + w - 8, y + 5, 4, h - 4);
    g.fillStyle = '#a77b50'; roundRect(g, x, y, w, 10, 2); g.fill(); outline(g);
    g.strokeStyle = '#d4ad79'; g.lineWidth = 1; line(g, x + 4, y + 3, x + w - 4, y + 3);
  }
  function chair(g, o) {
    const x = o.x * T, y = o.y * T;
    g.fillStyle = '#704e38'; g.fillRect(x + 5, y + 8, 22, 4); g.fillRect(x + 6, y, 20, 9);
    g.fillRect(x + 7, y + 10, 3, 20); g.fillRect(x + 22, y + 10, 3, 20);
    g.fillStyle = '#b18457'; g.fillRect(x + 6, y + 8, 20, 3); outline(g);
  }
  function bench(g, o) {
    const x = o.x * T, y = o.y * T;
    g.fillStyle = '#59483b'; g.fillRect(x + 5, y + 15, 3, 14); g.fillRect(x + 24, y + 15, 3, 14);
    g.fillStyle = '#966c49'; g.fillRect(x + 2, y + 7, 28, 5); g.fillRect(x + 2, y + 1, 28, 4);
    g.fillStyle = '#d1ae7b'; g.fillRect(x + 3, y + 8, 26, 1); outline(g);
  }
  function fridge(g, o) {
    const x = o.x * T, y = o.y * T;
    g.fillStyle = '#b8c3c3'; roundRect(g, x + 3, y, 26, 31, 2); g.fill(); outline(g);
    g.fillStyle = '#e3e5df'; g.fillRect(x + 5, y + 2, 22, 12);
    g.fillStyle = '#8c9a9b'; g.fillRect(x + 5, y + 15, 22, 14);
    g.fillStyle = '#59666a'; g.fillRect(x + 23, y + 5, 1.5, 6); g.fillRect(x + 23, y + 19, 1.5, 7);
    g.strokeStyle = '#899594'; line(g, x + 5, y + 14, x + 27, y + 14);
  }
  function stove(g, o) {
    const x = o.x * T, y = o.y * T;
    g.fillStyle = '#d8d5cb'; roundRect(g, x + 2, y + 4, 28, 26, 2); g.fill(); outline(g);
    g.fillStyle = '#34383b';
    for (const p of [[10, 12], [22, 12], [10, 22], [22, 22]]) {
      g.beginPath(); g.arc(x + p[0], y + p[1], 4.2, 0, TAU); g.fill();
      g.strokeStyle = '#777b7b'; g.lineWidth = 1; strokeEllipse(g, x + p[0], y + p[1], 2.3, 2.3);
    }
    g.fillStyle = '#6d7677'; g.fillRect(x + 7, y + 27, 18, 2);
  }
  function shower(g, o) {
    const x = o.x * T, y = o.y * T;
    g.fillStyle = '#d6e0dc'; g.fillRect(x + 3, y + 4, 26, 25); outline(g);
    g.strokeStyle = '#607b83'; g.lineWidth = 2; line(g, x + 7, y + 4, x + 7, y - 1);
    line(g, x + 7, y - 1, x + 17, y - 1);
    g.fillStyle = '#5e8792'; fillEllipse(g, x + 18, y + 1, 4, 1.8);
    g.strokeStyle = '#85aeb4'; g.lineWidth = 1;
    for (let i = 0; i < 5; i++) line(g, x + 15 + i * 2, y + 4, x + 13 + i * 2, y + 12);
    g.fillStyle = '#9ba8a6'; g.fillRect(x + 4, y + 26, 24, 3);
  }
  function toilet(g, o) {
    const x = o.x * T, y = o.y * T;
    g.fillStyle = '#e9e6dc'; roundRect(g, x + 7, y, 18, 9, 2); g.fill(); outline(g);
    g.fillStyle = '#f7f4ec'; g.beginPath(); g.ellipse(x + 16, y + 19, 9, 11, 0, 0, TAU); g.fill(); outline(g);
    g.fillStyle = '#c8d1ce'; fillEllipse(g, x + 16, y + 18, 5.8, 7);
  }
  function wardrobe(g, o) {
    const x = o.x * T, y = o.y * T, w = (o.w || 1) * T;
    g.fillStyle = '#8a6242'; g.fillRect(x + 2, y, w - 4, 31); outline(g);
    g.fillStyle = '#b58b61'; g.fillRect(x + 4, y + 2, w - 8, 27);
    g.strokeStyle = '#765437'; line(g, x + w / 2, y + 2, x + w / 2, y + 29);
    g.fillStyle = '#d2b27c'; fillEllipse(g, x + w / 2 - 3, y + 15, 1, 1.5);
    fillEllipse(g, x + w / 2 + 3, y + 15, 1, 1.5);
  }
  function lamp(g, o, env, t) {
    const x = o.x * T + 16, y = o.y * T + 24, night = env && env.day < .45;
    g.fillStyle = '#5c5144'; g.fillRect(x - 2, y - 14, 4, 14);
    g.fillStyle = '#a8822c'; path(g, [x - 9, y - 14, x - 6, y - 25, x + 6, y - 25, x + 9, y - 14]);
    g.fillStyle = night ? 'rgba(246,218,145,.25)' : 'rgba(246,218,145,.08)';
    fillEllipse(g, x, y - 12, 12, 8);
    g.fillStyle = '#f4d58d'; fillEllipse(g, x, y - 19, 4, 3);
  }
  function plant(g, o, env, t) {
    const x = o.x * T + 16, y = o.y * T + 26;
    g.fillStyle = '#a35d3c'; g.fillRect(x - 6, y - 8, 12, 8); outline(g);
    g.strokeStyle = '#3f6b45'; g.lineWidth = 2.2;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * .65, sway = Math.sin((t || 0) / 900 + i) * .8;
      line(g, x, y - 7, x + Math.cos(a) * (8 + sway), y - 15 + Math.sin(a) * 3);
    }
    g.fillStyle = '#5f8a50';
    for (let i = 0; i < 5; i++) fillEllipse(g, x + (i - 2) * 3, y - 15 - (i % 2) * 3, 4, 2.3);
  }
  function tent(g, o) {
    const x = o.x * T, y = o.y * T, w = (o.w || 2) * T, h = (o.h || 2) * T;
    g.fillStyle = 'rgba(20,24,30,.18)'; fillEllipse(g, x + w / 2, y + h - 2, w * .47, 5);
    g.fillStyle = '#647b52'; path(g, [x + 2, y + h - 3, x + w / 2, y + 3, x + w - 2, y + h - 3]);
    g.fillStyle = '#d0b77b'; path(g, [x + w / 2, y + 4, x + w * .68, y + h - 4, x + w / 2, y + h - 4]);
    g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath();
    g.moveTo(x + 2, y + h - 3); g.lineTo(x + w / 2, y + 3); g.lineTo(x + w - 2, y + h - 3); g.stroke();
  }
  function campfire(g, o, env, t) {
    const x = o.x * T + 16, y = o.y * T + 20;
    g.fillStyle = '#76543b'; g.lineWidth = 4; g.strokeStyle = '#76543b';
    line(g, x - 8, y + 5, x + 8, y - 3); line(g, x - 8, y - 3, x + 8, y + 5);
    g.fillStyle = '#d27632'; g.beginPath(); g.moveTo(x - 7, y + 4);
    g.quadraticCurveTo(x - 9, y - 6, x, y - 14); g.quadraticCurveTo(x + 9, y - 6, x + 7, y + 4); g.fill();
    g.fillStyle = '#edc45d'; g.beginPath(); g.moveTo(x - 3, y + 3);
    g.quadraticCurveTo(x - 3, y - 4, x + Math.sin((t || 0) / 100) * 2, y - 9);
    g.quadraticCurveTo(x + 5, y - 3, x + 3, y + 3); g.fill();
  }

  /* ---------- vehicles ---------- */
  function vehicle(g, o, env, t, type) {
    const x = o.x * T, y = o.y * T, w = (o.w || (type === 'tram' ? 4 : 2)) * T;
    const h = (o.h || 1) * T, cy = y + h / 2, body = type === 'tram' ? '#b7b8a7' : type === 'bus' ? '#d7c28a' : '#526d7b';
    g.save();
    g.fillStyle = 'rgba(20,24,30,.2)'; fillEllipse(g, x + w / 2, y + h + 2, w * .46, 3.5);
    g.fillStyle = body; roundRect(g, x + 2, y + 4, w - 4, h - 8, type === 'car' ? 7 : 4); g.fill(); outline(g);
    g.fillStyle = '#a9c1c7';
    const count = Math.max(2, Math.floor(w / 23));
    for (let i = 0; i < count; i++) {
      const wx = x + 7 + i * (w - 14) / count;
      roundRect(g, wx, y + 7, Math.max(5, (w - 18) / count - 3), h * .36, 2); g.fill();
    }
    g.fillStyle = '#343a3d';
    for (const wx of [x + 10, x + w - 13]) {
      roundRect(g, wx - 3, cy + 4, 6, 4, 1); g.fill();
    }
    g.fillStyle = '#f2dfab'; fillEllipse(g, x + w - 5, cy - 2, 2, 2);
    g.fillStyle = '#a84d3d'; fillEllipse(g, x + 5, cy - 2, 2, 2);
    if (type === 'tram') {
      g.strokeStyle = '#494b4b'; g.lineWidth = 1.5;
      line(g, x + w * .55, y + 5, x + w * .68, y - 8);
      line(g, x + w * .68, y - 8, x + w * .82, y - 8);
    }
    if (type === 'boat') {
      g.fillStyle = '#8a4f39'; path(g, [x, cy, x + 10, y + h, x + w - 9, y + h, x + w, cy]);
      g.fillStyle = '#e9e2d4'; g.fillRect(x + w * .35, y + 5, w * .32, 8);
    }
    g.restore();
  }

  /* ---------- weather and ambient lighting ---------- */
  function weather(g, x, y, w, h, env, elapsed) {
    const e = env || {}, t = elapsed || 0, kind = String(e.kind || e.weather || 'clear').toLowerCase();
    const amount = clamp(e.intensity === undefined ? .55 : e.intensity, 0, 1);
    const seed = hash(kind + ':' + Math.floor(t / 80));
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();

    /* drifting cloud shadow */
    if (e.cloud > .05 || kind.indexOf('cloud') >= 0) {
      g.fillStyle = 'rgba(36,47,58,' + (.035 + (e.cloud || .25) * .055) + ')';
      for (let i = 0; i < 5; i++) {
        const xx = x + ((i * 173 + t * (.004 + (e.wind || 0) * .012)) % (w + 160)) - 80;
        fillEllipse(g, xx, y + 40 + (i * 71) % Math.max(60, h), 80, 17);
      }
    }
    if (kind.indexOf('rain') >= 0 || kind.indexOf('storm') >= 0) {
      g.strokeStyle = 'rgba(190,211,220,' + (.35 + amount * .35) + ')'; g.lineWidth = 1;
      const n = Math.floor(w * h / 2100 * amount) + 16;
      for (let i = 0; i < n; i++) {
        const xx = x + rand(seed, i) * w;
        const yy = y + ((rand(seed + 2, i) * h + t * (.22 + amount * .42)) % h);
        line(g, xx, yy, xx - 4 - (e.wind || 0) * 7, yy + 10 + amount * 7);
      }
    }
    if (kind.indexOf('snow') >= 0 || e.snowing) {
      g.fillStyle = 'rgba(250,252,252,' + (.45 + amount * .4) + ')';
      const n = Math.floor(w * h / 2600 * amount) + 24;
      for (let i = 0; i < n; i++) {
        const xx = x + ((rand(seed + 7, i) * w + Math.sin(t / 700 + i) * 8) % w);
        const yy = y + ((rand(seed + 9, i) * h + t * (.025 + amount * .045)) % h);
        fillEllipse(g, xx, yy, 1 + rand(seed, i + 80) * 1.7, 1 + rand(seed, i + 80) * 1.7);
      }
    }
    if (kind.indexOf('fog') >= 0 || kind.indexOf('mist') >= 0) {
      g.fillStyle = 'rgba(224,230,229,' + (.13 + amount * .22) + ')';
      for (let i = 0; i < 5; i++) {
        const xx = x + ((i * 137 + t * (.012 + (e.wind || 0) * .02)) % (w + 220)) - 110;
        fillEllipse(g, xx, y + h * (.18 + i * .16), 100 + i * 18, 13 + i * 3);
      }
    }
    if ((e.wind || 0) > .35 && kind.indexOf('rain') < 0) {
      g.strokeStyle = 'rgba(219,213,189,.38)'; g.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const xx = x + ((i * 89 + t * .12) % Math.max(1, w));
        const yy = y + (i * 53) % Math.max(1, h);
        line(g, xx, yy, xx + 9 + (e.wind || 0) * 9, yy - 1);
      }
    }
    if (kind.indexOf('storm') >= 0 && Math.sin(t / 83) > .992) {
      g.fillStyle = 'rgba(240,242,238,.22)'; g.fillRect(x, y, w, h);
    }
    g.restore();
  }

  function lighting(g, x, y, w, h, env, elapsed) {
    const e = env || {}, day = clamp(e.day === undefined ? .65 : e.day, 0, 1);
    const darkness = clamp((.62 - day) * .72, 0, .46);
    if (darkness > 0) {
      g.save(); g.fillStyle = 'rgba(20,28,48,' + darkness + ')'; g.fillRect(x, y, w, h); g.restore();
    }
    if (e.dusk > .1) {
      g.save(); g.fillStyle = 'rgba(196,111,71,' + clamp(e.dusk * .10, 0, .12) + ')';
      g.fillRect(x, y, w, h); g.restore();
    }
  }

  function chimneySmoke(g, x, y, elapsed, env, strength) {
    const t = elapsed || 0, wind = (env && env.wind) || 0, s = strength || 1;
    g.save();
    for (let i = 0; i < 6; i++) {
      const k = ((t / 2600 + i / 6) % 1);
      g.fillStyle = 'rgba(216,220,218,' + (.30 * (1 - k) * s) + ')';
      fillEllipse(g, x + k * (14 + wind * 16) + Math.sin(k * 7 + i) * 2, y - k * 30,
        2.2 + k * 4, 2.2 + k * 4);
    }
    g.restore();
  }

  /* ---------- scrolling journey window ---------- */
  const biomeColors = {
    birch: ['#9bb9c3', '#d6d2b8', '#66835b'],
    taiga: ['#91aeb8', '#a7b1a0', '#405d49'],
    ural: ['#a9bdc6', '#8c998b', '#657765'],
    baikal: ['#91b8cb', '#8caeaa', '#597b68'],
    steppe: ['#a8c6d1', '#d1bd83', '#9a995b'],
    caucasus: ['#91b8cc', '#9ba5a2', '#667a70'],
    coast: ['#9fc4d1', '#4b8291', '#597c5f'],
    volcanic: ['#a1b7bd', '#655f59', '#5d665b'],
    tundra: ['#a4bcc2', '#a6a99c', '#858e82']
  };
  function journey(g, view, elapsed) {
    const v = view || {}, x = v.x || 0, y = v.y || 0, w = v.w || 640, h = v.h || 260;
    const t = elapsed || 0, biome = biomeColors[v.biome] ? v.biome : 'taiga';
    const cols = biomeColors[biome], season = v.season || 'autumn';
    const day = clamp(v.day === undefined ? .65 : v.day, 0, 1);
    const hour = v.hour === undefined ? 12 : v.hour;
    const speed = v.paused ? 0 : (v.speed || 1);
    const shift = t * .018 * speed;
    const snow = season === 'winter';
    const skyTop = day < .25 ? '#202b42' : (day < .48 ? '#c17c68' : cols[0]);
    const skyBottom = day < .25 ? '#45516a' : (day < .48 ? '#e0b18b' : '#dce0d1');
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();

    const grad = g.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, skyTop); grad.addColorStop(1, skyBottom);
    g.fillStyle = grad; g.fillRect(x, y, w, h);
    if (day < .35) {
      g.fillStyle = 'rgba(255,255,235,.75)';
      for (let i = 0; i < 28; i++) fillEllipse(g, x + rand(21, i) * w, y + rand(23, i) * h * .56, 1, 1);
    } else {
      g.fillStyle = '#f4d69a'; fillEllipse(g, x + w * (.76 - hour / 100), y + h * .18, 13, 13);
    }

    /* distant ridges */
    const base = y + h * .65;
    for (let layer = 0; layer < 3; layer++) {
      const off = (shift * (.10 + layer * .12)) % 180;
      g.fillStyle = layer === 0 ? cols[1] : (layer === 1 ? cols[2] : '#526b59');
      g.globalAlpha = .45 + layer * .19;
      g.beginPath(); g.moveTo(x, base + layer * 15);
      for (let px = -100; px <= w + 120; px += 70) {
        const px2 = x + px - off, peak = base - 30 - rand(hash(biome + layer), Math.floor(px / 70)) * (35 + layer * 7);
        g.lineTo(px2, peak + layer * 9); g.lineTo(px2 + 70, base + layer * 14);
      }
      g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;

    if (biome === 'caucasus' || biome === 'baikal' || biome === 'ural') {
      g.fillStyle = snow ? '#f1f2ef' : '#d9ddd7';
      path(g, [x + w * .18, base + 7, x + w * .34, y + h * .18, x + w * .42, y + h * .34,
        x + w * .50, y + h * .08, x + w * .62, base + 7]);
      g.fillStyle = '#9ea9a5';
      path(g, [x + w * .30, y + h * .34, x + w * .34, y + h * .18, x + w * .39, y + h * .35]);
    }

    /* middle-distance forest or shoreline */
    const treeCol = snow ? '#53655e' : (season === 'autumn' ? '#9b874d' : '#416247');
    if (biome === 'coast') {
      g.fillStyle = '#39778a'; g.fillRect(x, base + 25, w, h - (base - y) - 25);
      g.strokeStyle = 'rgba(230,238,229,.6)'; g.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const xx = x + ((i * 119 - shift * .7) % (w + 40));
        line(g, xx, base + 32 + i * 5, xx + 45, base + 32 + i * 5);
      }
    } else {
      for (let i = 0; i < 22; i++) {
        const xx = x + ((i * 43 - shift * (.7 + i % 3 * .12)) % (w + 60));
        const th = 18 + rand(87, i) * (biome === 'taiga' ? 42 : 27);
        g.fillStyle = treeCol; path(g, [xx - 11, base + 28, xx, base - th, xx + 12, base + 28]);
        g.fillStyle = '#6c513a'; g.fillRect(xx - 1.5, base + 18, 3, 12);
      }
    }

    /* close foreground drifts past faster */
    g.fillStyle = snow ? '#dce3e5' : (season === 'summer' ? '#82965b' : '#82795a');
    g.fillRect(x, base + 35, w, h - (base - y) - 35);
    if (biome === 'steppe') {
      g.strokeStyle = '#b4a26c'; g.lineWidth = 1;
      for (let i = 0; i < 45; i++) {
        const xx = x + ((i * 31 - shift * 1.5) % (w + 35)), yy = base + 42 + (i * 17) % Math.max(1, h - (base - y) - 43);
        line(g, xx, yy, xx + 3, yy - 6);
      }
    } else {
      for (let i = 0; i < 18; i++) {
        const xx = x + ((i * 61 - shift * 1.6) % (w + 70));
        if (biome === 'coast') {
          g.fillStyle = '#33674d'; g.fillRect(xx, base - 3, 5, 42);
          g.strokeStyle = '#356e4d'; g.lineWidth = 2;
          for (let k = 0; k < 5; k++) {
            const a = -Math.PI / 2 + k * .55; line(g, xx + 2, base + 2, xx + 2 + Math.cos(a) * 18, base - 16 + Math.sin(a) * 10);
          }
        } else {
          g.fillStyle = treeCol; path(g, [xx - 10, base + 38, xx, base + 4, xx + 11, base + 38]);
        }
      }
    }

    /* interior frame makes the landscape read as a moving window */
    g.fillStyle = '#604b3e'; g.fillRect(x, y, w, 8); g.fillRect(x, y + h - 13, w, 13);
    g.fillRect(x, y, 8, h); g.fillRect(x + w - 8, y, 8, h);
    g.strokeStyle = '#d0ad7d'; g.lineWidth = 2; g.strokeRect(x + 8, y + 8, w - 16, h - 21);
    g.fillStyle = 'rgba(243,235,215,.16)'; g.fillRect(x + 12, y + 12, 5, h - 34);
    if (v.vehicle === 'car') {
      g.fillStyle = '#34383a'; g.fillRect(x, y + h - 19, w, 6);
      g.fillStyle = '#9b7651'; g.fillRect(x, y + h - 13, w, 13);
    } else if (v.vehicle === 'plane') {
      g.fillStyle = '#b9c3c5'; g.fillRect(x + 9, y + h - 18, w - 18, 18);
      g.fillStyle = '#788b91'; g.fillRect(x + w * .4, y + h - 22, w * .2, 4);
    } else if (v.vehicle === 'ship') {
      g.fillStyle = '#355b6b'; g.fillRect(x + 9, y + h - 20, w - 18, 20);
    } else {
      g.fillStyle = '#8c6748'; g.fillRect(x + 9, y + h - 18, w - 18, 18);
      g.fillStyle = '#d4b98e'; g.fillRect(x + 9, y + h - 18, w - 18, 2);
    }
    if (v.weather) weather(g, x + 8, y + 8, w - 16, h - 22, { kind: v.weather, intensity: .35, wind: .25 }, t);
    if (v.paused) {
      g.fillStyle = 'rgba(22,28,36,.34)'; g.fillRect(x + 8, y + 8, w - 16, h - 22);
      g.fillStyle = '#fff7e7'; g.font = 'bold 14px "PT Sans", sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PAUSED', x + w / 2, y + h / 2);
    }
    g.restore();
  }

  /* ---------- registry additions ---------- */
  ART.def('person', 1, 1, [.27, .48, .46, .48], actorObject);
  ART.def('npc', 1, 1, [.27, .48, .46, .48], actorObject);
  ART.def('dog', 1, 1, [.15, .55, .7, .32], petObject('dog'));
  ART.def('cat', 1, 1, [.15, .55, .7, .32], petObject('cat'));
  ART.def('squirrel', 1, 1, null, wildlifeKind('squirrel'));
  ART.def('crow', 1, 1, null, wildlifeKind('crow'));
  ART.def('gull', 1, 1, null, wildlifeKind('gull'));
  ART.def('deer', 1, 1, null, wildlifeKind('deer'));
  ART.def('seal', 1, 1, null, wildlifeKind('nerpa'));
  ART.def('bear', 1, 1, null, wildlifeKind('bear'));
  ART.def('tur', 1, 1, null, wildlifeKind('tur'));
  ART.def('dolphin', 1, 1, null, wildlifeKind('dolphin'));
  ART.def('wildlife', 1, 1, null, wildlife);

  ART.def('bed', 2, 1, [.08, .08, 1.84, .82], bed, 'flat');
  ART.def('sofa', 2, 1, [.05, .18, 1.9, .7], sofa);
  ART.def('table', 2, 1, [.05, .05, 1.9, .8], table);
  ART.def('chair', 1, 1, [.16, .2, .68, .7], chair);
  ART.def('bench', 1, 1, [.08, .25, .84, .65], bench);
  ART.def('fridge', 1, 1, 1, fridge);
  ART.def('stove', 1, 1, 1, stove);
  ART.def('shower', 1, 1, 1, shower);
  ART.def('toilet', 1, 1, [.18, .05, .64, .9], toilet);
  ART.def('wardrobe', 1, 1, 1, wardrobe);
  ART.def('lamp', 1, 1, null, lamp, 'over');
  ART.def('plant', 1, 1, [.2, .6, .6, .35], plant, 'over');
  ART.def('tent', 2, 2, [.08, .32, 1.84, 1.55], tent);
  ART.def('campfire', 1, 1, [.2, .65, .6, .28], campfire, 'over');

  ART.def('car', 2, 1, [.05, .16, 1.9, .68], (g, o, env, t) => vehicle(g, o, env, t, 'car'));
  ART.def('bus', 3, 1, [.04, .12, 2.92, .76], (g, o, env, t) => vehicle(g, o, env, t, 'bus'));
  ART.def('tram', 4, 1, [.03, .12, 3.94, .76], (g, o, env, t) => vehicle(g, o, env, t, 'tram'));
  ART.def('boat', 2, 1, [.05, .25, 1.9, .6], (g, o, env, t) => vehicle(g, o, env, t, 'boat'));

  const api = {
    person, pet, wildlife, weather, lighting, chimneySmoke, journey,
    drawJourney: journey,
    drawActorObject: actorObject,
    drawPetObject: petObject,
    T,
    version: '1.0.0'
  };
  if (typeof window !== 'undefined') window.ART2 = api;
  return api;
})();
