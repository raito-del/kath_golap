(() => {
"use strict";
 
/* ================= SETTINGS ================= */
const W = 800, H = 800;
const GAP = 3;                 // space between words in petals
const SEED = 17;               // change for a different layout
const BG = "#060208";
 
const FLOWER_CX = 400, FLOWER_CY = 300;
const PETAL_LENGTH = 205;
const PETAL_WIDTH = 118;
 
// Animation timeline (milliseconds)
const START_DELAY = 300;       // blank pause before it begins
const APPEAR_SPREAD = 2200;    // words light up and start swirling over this time
const GATHER_START = 4000;     // swirl plays alone until here, then words start flying in
const GATHER_SPREAD = 6500;    // time over which all words fly into the flower
const FLIGHT = 1500;           // how long one word takes to fly in
const FLASH = 700;             // glow pop when a word lands
const SWIRL_CX = 400, SWIRL_CY = 400;
 
/* ====== YOUR WORDS: replace / add anything between the quotes ====== */
const WORDS = [
  "I LOVE YOU", "I love you", "Te amo", "Ti amo", "Je t'aime",
  "Ich liebe dich", "Eu te amo", "Seni seviyorum", "Я тебя люблю",
  "사랑해", "愛してる", "我爱你", "मैं तुमसे प्यार करता हूँ", "Σ' αγαπώ",
  "Ik hou van jou", "Jag älskar dig", "Kocham cię", "ฉันรักคุณ",
  "Anh yêu em", "Aku cinta kamu", "Mahal kita", "אני אוהבת אותך", "أحبك",
  "నేను నిన్ను ప్రేమిస్తున్నాను", "நான் உன்னை காதலிக்கிறேன்",
  "আমি তোমাকে ভালোবাসি", "Volim te", "Te iubesc", "Ljubim te",
  "Nakupenda", "Я тебе кохаю", "Miluji tě", "Szeretlek",
  "Rakastan sinua", "Jeg elsker dig",
  "LOVE", "AMOR", "AMOUR", "AMORE", "LIEBE", "TE QUIERO", "愛", "사랑",
  "ভালোবাসি", "ভালোবাসি"
];
/* ================================================ */
 
const HEAD_SIZES = [6, 7, 8, 9, 10, 11];
const HEAD_WEIGHTS = [3, 5, 5, 4, 2, 1];
const PX = 4 / 3; // point -> pixel
const FONT_STACK =
  '"Segoe UI","Nirmala UI","Noto Sans","Noto Sans Bengali","Noto Sans Devanagari",' +
  '"Noto Sans Tamil","Noto Sans Telugu","Noto Sans Thai","Noto Sans Arabic",' +
  '"Noto Sans Hebrew","Noto Sans CJK JP","Noto Sans CJK KR","Noto Sans CJK SC",' +
  '"Microsoft YaHei","Malgun Gothic","Yu Gothic UI",Arial,sans-serif';
 
const ROW_H = { head: 15, leaf: 13, stem: 12 };
 
/* ================= RANDOM (seeded) ================= */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const uniform = (a, b) => a + (b - a) * rand();
const choice = (arr) => arr[Math.floor(rand() * arr.length)];
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function weightedChoice(items, weights) {
  let x = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    x -= weights[i];
    if (x < 0) return items[i];
  }
  return items[items.length - 1];
}
 
/* ================= CANVAS ================= */
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = W * dpr;
canvas.height = H * dpr;
 
const staticCanvas = document.createElement("canvas");
staticCanvas.width = W * dpr;
staticCanvas.height = H * dpr;
const sctx = staticCanvas.getContext("2d");
 
for (const c of [ctx, sctx]) {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.textAlign = "center";
  c.textBaseline = "middle";
}
 
const fontStr = (size) => `bold ${(size * PX).toFixed(1)}px ${FONT_STACK}`;
function measure(text, size) {
  sctx.font = fontStr(size);
  return sctx.measureText(text).width;
}
 
/* ================= COLOR HELPERS ================= */
const clamp = (v) => Math.max(0, Math.min(1, v));
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const rgb = (h) => {
  h = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const css = (c) =>
  "rgb(" + Math.round(clamp(c[0]) * 255) + "," + Math.round(clamp(c[1]) * 255) + "," + Math.round(clamp(c[2]) * 255) + ")";
const scale = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const BRIGHT = [1.0, 0.93, 0.95];
 
/* ================= SHAPES ================= */
function ellipsePoly(cx, cy, rx, ry, rot = 0, points = 160) {
  const cr = Math.cos(rot), sr = Math.sin(rot), pts = [];
  for (let i = 0; i < points; i++) {
    const t = (2 * Math.PI * i) / points;
    const ex = rx * Math.cos(t), ey = ry * Math.sin(t);
    pts.push([cx + ex * cr - ey * sr, cy + ex * sr + ey * cr]);
  }
  return pts;
}
 
// Broad, rounded frangipani petal with a slight twist.
function petalPoly(cx, cy, angle, length, width, points = 48) {
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const hw = (s) =>
    (width / 2) * Math.sin(Math.PI * Math.pow(s, 0.8)) * (0.55 + 0.45 * s);
  const top = [], bottom = [];
  for (let i = 0; i <= points; i++) {
    const s = i / points, along = s * length, h = hw(s);
    top.push([along, -h * 1.1]);
    bottom.push([along, h * 0.9]);
  }
  return top.concat(bottom.reverse()).map(([a, v]) => [
    cx + a * ca - v * sa,
    cy + a * sa + v * ca,
  ]);
}
 
const PETAL_ANGLES = [-90, -18, 54, 126, 198].map((d) => (d * Math.PI) / 180);
const PETALS = PETAL_ANGLES.map((a) =>
  petalPoly(FLOWER_CX, FLOWER_CY, a, PETAL_LENGTH, PETAL_WIDTH)
);
const STEM = [[386, 410], [414, 410], [422, 752], [406, 772], [390, 760], [378, 620]];
const LEFT_LEAF = ellipsePoly(280, 655, 95, 27, 0.35);
const RIGHT_LEAF = ellipsePoly(520, 615, 95, 27, -0.35);
 
const bounds = (polys) => {
  const ys = polys.flat().map((p) => p[1]);
  return [Math.min(...ys), Math.max(...ys)];
};
 
function polygonSpans(poly, y) {
  const xs = [];
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
      if (y2 !== y1) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
  }
  xs.sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
  return out;
}
function mergeSpans(spans) {
  if (!spans.length) return [];
  spans = spans.slice().sort((a, b) => a[0] - b[0]);
  const merged = [spans[0].slice()];
  for (let i = 1; i < spans.length; i++) {
    const [lo, hi] = spans[i], last = merged[merged.length - 1];
    if (lo <= last[1] + 1) last[1] = Math.max(last[1], hi);
    else merged.push([lo, hi]);
  }
  return merged;
}
const shapeSpans = (polys, y) =>
  mergeSpans(polys.flatMap((p) => polygonSpans(p, y)));
function intersectSpans(A, B, minimum = 15) {
  const out = [];
  for (const a of A) for (const b of B) {
    const lo = Math.max(a[0], b[0]), hi = Math.min(a[1], b[1]);
    if (hi - lo >= minimum) out.push([lo, hi]);
  }
  return mergeSpans(out);
}
 
/* ================= COLORS: white -> light yellow -> pink core ================= */
function flowerColor(x, y, size) {
  const dx = x - FLOWER_CX, dy = y - FLOWER_CY;
  const d = Math.hypot(dx, dy) / PETAL_LENGTH;
  let lat = 999;
  for (const a of PETAL_ANGLES) {
    const along = dx * Math.cos(a) + dy * Math.sin(a);
    if (along > 0) {
      const l = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
      if (l < lat) lat = l;
    }
  }
  const score = clamp(1.15 - d * 1.45) - Math.min(lat, 80) / 170;
  let p;
  if (d < 0.10) p = ["#f7a1b5", "#f48fb1", "#ffb3c6", "#f9b4c4"];
  else if (score > 0.52) p = ["#ffd84d", "#ffe066", "#ffe680", "#ffdc5e"];
  else if (score > 0.30) p = ["#fff0a0", "#fff3b8", "#ffeb8f", "#fff6c4"];
  else if (score > 0.10) p = ["#fffbe0", "#fff8cc", "#ffffff", "#fff4d6"];
  else {
    p = ["#ffffff", "#ffffff", "#fffafa", "#f6f8ff", "#fff5f8"];
    if (d > 0.85) p.push("#ffe3ea");
  }
  if (d >= 0.10 && d < 0.22) p.push("#ffc2d1", "#ffd0dc");
  if (size >= 10) p.push("#ffffff");
  return rgb(choice(p));
}
function greenColor(x, y, size) {
  const p = ["#3e8034", "#559c3c", "#72b84b", "#91cf62", "#b1e184"];
  if (size >= 9) p.push("#a7d486", "#c0e19a");
  return rgb(choice(p));
}
const colorFor = (x, y, size, kind) =>
  kind === "head" ? flowerColor(x, y, size) : greenColor(x, y, size);
 
/* ================= WORD PICKING ================= */
const SHORT_WORDS = (() => {
  const s = WORDS.filter((w) => [...w].length <= 9);
  return s.length ? s : WORDS;
})();
const cycles = {};
function phraseFromPool(kind, size) {
  const big = size >= 10;
  const pool = big ? SHORT_WORDS : WORDS;
  const key = kind + (big ? ":big" : ":normal");
  if (!cycles[key] || !cycles[key].items.length) {
    cycles[key] = { items: shuffle(pool.slice()), index: 0 };
  }
  const st = cycles[key];
  const phrase = st.items[st.index++];
  if (st.index >= st.items.length) st.items = [];
  return phrase;
}
function sizeFor(kind) {
  if (kind === "head") return weightedChoice(HEAD_SIZES, HEAD_WEIGHTS);
  return choice(kind === "stem" ? [5, 6, 7] : [6, 7, 8, 9]);
}
 
/* ================= LAYOUT ================= */
function buildRegion(polygons, yStart, yEnd, rowH, kind) {
  const placed = [];
  const half = rowH / 2;
  const gap = kind === "head" ? GAP : 1;
  let y = yStart + half;
 
  while (y < yEnd - half) {
    const top = shapeSpans(polygons, y - half + 1);
    const bottom = shapeSpans(polygons, y + half - 1);
    const row = intersectSpans(top, bottom, kind === "head" ? 19 : 16);
 
    for (const [lo0, hi0] of row) {
      const margin = kind === "head" ? 3 : 1;
      const lo = lo0 + margin, hi = hi0 - margin;
      const available = hi - lo;
      if (available < 18) continue;
 
      const line = [];
      let cur = lo + uniform(0, Math.min(3, Math.max(1, available * 0.02)));
      while (cur < hi - 15) {
        const remaining = hi - cur;
        const cands = [];
        const target = Math.min(74, Math.max(19, remaining * 0.22));
        const tries = kind === "head" ? 45 : 55;
        for (let t = 0; t < tries; t++) {
          const size = sizeFor(kind);
          const text = phraseFromPool(kind, size);
          const width = measure(text, size);
          if (width <= remaining && width >= Math.min(18, remaining * 0.2)) {
            cands.push({ score: Math.abs(width - target) + uniform(0, 13), text, size, width });
          }
        }
        if (!cands.length) break;
        cands.sort((a, b) => a.score - b.score);
        const pick = choice(cands.slice(0, Math.min(4, cands.length)));
        line.push({ x: cur + pick.width / 2, y, text: pick.text, size: pick.size, width: pick.width, kind });
        cur += pick.width + gap;
      }
      if (!line.length) continue;
 
      const used = line.reduce((s, i) => s + i.width, 0) + Math.max(0, line.length - 1) * gap;
      const slack = Math.max(0, available - used);
      const extra = line.length > 1 ? slack / (line.length - 1) : 0;
      line.forEach((item, i) => {
        item.x += extra * i;
        item.color = colorFor(item.x, item.y, item.size, kind);
        placed.push(item);
      });
    }
    y += rowH;
  }
  return placed;
}
 
const placed = [
  ...buildRegion(PETALS, ...bounds(PETALS), ROW_H.head, "head"),
  ...buildRegion([LEFT_LEAF], ...bounds([LEFT_LEAF]), ROW_H.leaf, "leaf"),
  ...buildRegion([RIGHT_LEAF], ...bounds([RIGHT_LEAF]), ROW_H.leaf, "leaf"),
  ...buildRegion([STEM], ...bounds([STEM]), ROW_H.stem, "stem"),
];
const N = placed.length;
 
/* ================= GLOW SPRITES ================= */
function makeGlow(r, g, b) {
  const s = document.createElement("canvas");
  s.width = s.height = 64;
  const c = s.getContext("2d");
  const grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.38)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = grad;
  c.fillRect(0, 0, 64, 64);
  return s;
}
const GLOW = {
  white: makeGlow(255, 240, 225),
  yellow: makeGlow(255, 214, 90),
  pink: makeGlow(255, 150, 185),
  green: makeGlow(150, 230, 110),
};
function bucketOf(c) {
  const [r, g, b] = c;
  if (g > r && g > b) return "green";
  if (b < 0.55) return "yellow";
  if (g < 0.8) return "pink";
  return "white";
}
 
/* ================= ANIMATION DATA ================= */
let END_TIME = 0;
(function initAnim() {
  placed.forEach((p) => {
    const dx = p.x - FLOWER_CX, dy = p.y - FLOWER_CY;
    p.d = Math.hypot(dx, dy) / PETAL_LENGTH;
    p.ang = Math.atan2(dy, dx);
    // Flower blooms from the heart outward; stem and leaves finish last.
    p.key = p.kind === "head" ? p.d + rand() * 0.18 : 1.3 + p.y / 2000 + rand() * 0.05;
  });
  const sorted = placed.slice().sort((a, b) => a.key - b.key);
  sorted.forEach((p, i) => {
    p.r0 = 40 + 340 * Math.sqrt(rand());
    p.a0 = rand() * Math.PI * 2;
    p.ph = rand() * Math.PI * 2;
    p.tw = rand() * Math.PI * 2;
    p.appearAt = rand() * APPEAR_SPREAD;
    p.gatherAt = GATHER_START + (i / Math.max(1, N - 1)) * GATHER_SPREAD + rand() * 150;
    p.flight = FLIGHT * (0.85 + rand() * 0.35);
    p.landAt = p.gatherAt + p.flight;
    p.tilt = (rand() - 0.5) * 1.2;
    p.sc0 = 0.75 + rand() * 0.5;
    p.curve = (rand() < 0.5 ? -1 : 1) * (40 + rand() * 90);
    p.shadow = css(scale(p.color, 0.23));
    p.bucket = GLOW[bucketOf(p.color)];
    p.committed = false;
    END_TIME = Math.max(END_TIME, p.landAt + FLASH);
  });
})();
 
function orbit(p, t, out) {
  const r = p.r0 * (1 + 0.06 * Math.sin(t * 0.0009 + p.ph));
  const a = p.a0 + (0.14 / (p.r0 + 60)) * t;
  out[0] = SWIRL_CX + r * Math.cos(a);
  out[1] = SWIRL_CY + r * Math.sin(a) * 0.92;
}
const tmp = [0, 0];
 
// Returns 0 = hidden, 1 = visible (state in p.c*), 2 = finished landing
function compute(p, t) {
  if (t < p.appearAt) return 0;
  const tw = 0.5 + 0.5 * Math.sin(t * 0.004 + p.tw);
  if (t < p.gatherAt) {
    orbit(p, t, tmp);
    p.cx = tmp[0]; p.cy = tmp[1];
    p.cr = p.tilt; p.cs = p.sc0;
    p.ca = clamp((t - p.appearAt) / 600);
    p.cb = 0.3 + 0.35 * tw;
    p.cg = (0.25 + 0.4 * tw) * p.ca;
    return 1;
  }
  if (t < p.landAt) {
    const u = (t - p.gatherAt) / p.flight;
    const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    orbit(p, t, tmp);
    const dx = p.x - tmp[0], dy = p.y - tmp[1];
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.sin(Math.PI * u) * p.curve;
    p.cx = tmp[0] + dx * e + (-dy / len) * k;
    p.cy = tmp[1] + dy * e + (dx / len) * k;
    p.cr = p.tilt * (1 - e);
    p.cs = p.sc0 + (1 - p.sc0) * e;
    p.ca = 1;
    p.cb = (0.3 + 0.35 * tw) * (1 - e) + 0.45 * Math.sin(Math.PI * u);
    p.cg = (0.25 + 0.4 * tw) * (1 - e) + 0.55 * Math.sin(Math.PI * u);
    return 1;
  }
  const f = (t - p.landAt) / FLASH;
  if (f >= 1) return 2;
  const fl = (1 - f) * (1 - f);
  p.cx = p.x; p.cy = p.y; p.cr = 0; p.cs = 1 + 0.12 * fl; p.ca = 1;
  p.cb = fl * 0.85; p.cg = fl * 0.9;
  return 1;
}
 
function commit(p) {
  sctx.font = fontStr(p.size);
  sctx.fillStyle = p.shadow;
  sctx.fillText(p.text, p.x + 1, p.y + 2);
  sctx.fillStyle = css(p.color);
  sctx.fillText(p.text, p.x, p.y);
}
 
function drawGlow(p, x, y, alpha) {
  const w = p.width * 0.75 + 12, h = p.size * PX * 1.1 + 10;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(p.bucket, x - w, y - h, w * 2, h * 2);
}
 
/* ================= DUST (floating sparkles) ================= */
const dust = Array.from({ length: 70 }, () => ({
  x: rand() * W, y: rand() * H, vy: 0.008 + rand() * 0.02,
  vx: (rand() - 0.5) * 0.01, r: 0.6 + rand() * 1.6, ph: rand() * 6.28,
}));
function drawDust(t, dt) {
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "#ffe9b8";
  for (const d of dust) {
    d.y -= d.vy * dt; d.x += d.vx * dt;
    if (d.y < -5) { d.y = H + 5; d.x = rand() * W; }
    if (d.x < -5) d.x = W + 5; else if (d.x > W + 5) d.x = -5;
    ctx.globalAlpha = 0.12 + 0.28 * (0.5 + 0.5 * Math.sin(t * 0.003 + d.ph));
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, 6.2832);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
 
/* ================= BLOOM (warm light behind the flower) ================= */
function drawBloom(t) {
  const progress = clamp((t - GATHER_START) / (GATHER_SPREAD + FLIGHT));
  const level = 0.15 + 0.85 * progress;
  const pulse = 0.85 + 0.15 * Math.sin(t * 0.0015);
  const a = 0.2 * level * pulse;
  const g = ctx.createRadialGradient(FLOWER_CX, FLOWER_CY, 0, FLOWER_CX, FLOWER_CY, 330);
  g.addColorStop(0, `rgba(255,225,140,${a})`);
  g.addColorStop(0.55, `rgba(255,150,190,${a * 0.45})`);
  g.addColorStop(1, "rgba(255,150,190,0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
}
 
/* ================= MAIN LOOP ================= */
let start = 0, lastNow = 0, committedCount = 0, bloomed = false;
let flares = [], nextFlare = 0;
const active = [];
 
function reset(now) {
  start = now + START_DELAY;
  bloomed = false;
  document.body.classList.remove("bloomed");
  clearPetals();
  committedCount = 0;
  flares = [];
  nextFlare = 0;
  sctx.clearRect(0, 0, W, H);
  for (const p of placed) p.committed = false;
}
 
function afterglow(t) {
  const sweep = t * 0.0006;
  const R = ((t % 6500) / 6500) * PETAL_LENGTH * 1.2;
  const lit = [];
  for (const p of placed) {
    let diff = p.ang - sweep;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    let i1 = Math.max(0, 1 - Math.abs(diff) / 0.5);
    i1 *= i1;
    const i2 = Math.exp(-Math.pow((p.d * PETAL_LENGTH - R) / 35, 2));
    const I = Math.max(i1 * 0.9, i2 * 0.8);
    if (I > 0.05) lit.push([p, I]);
  }
  // random twinkles
  if (t > nextFlare) {
    flares.push([choice(placed), t + 600]);
    nextFlare = t + 110;
  }
  flares = flares.filter((f) => f[1] > t);
  for (const [p, until] of flares) {
    const life = (until - t) / 600;
    lit.push([p, Math.sin(Math.PI * (1 - life)) * 0.95]);
  }
  ctx.globalCompositeOperation = "lighter";
  for (const [p, I] of lit) drawGlow(p, p.x, p.y, I * 0.55);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  for (const [p, I] of lit) {
    ctx.font = fontStr(p.size);
    ctx.fillStyle = css(mix(p.color, BRIGHT, Math.min(1, I) * 0.8));
    ctx.fillText(p.text, p.x, p.y);
  }
}
 
function frame(now) {
  if (!start) reset(now);
  const dt = Math.min(50, now - (lastNow || now));
  lastNow = now;
  const t = Math.max(0, now - start);
 
  ctx.clearRect(0, 0, W, H);
  drawBloom(t);
  ctx.drawImage(staticCanvas, 0, 0, W, H);
 
  active.length = 0;
  for (const p of placed) {
    if (p.committed) continue;
    const s = compute(p, t);
    if (s === 2) { commit(p); p.committed = true; committedCount++; }
    else if (s === 1) active.push(p);
  }
 
  // glow lights
  ctx.globalCompositeOperation = "lighter";
  for (const p of active) if (p.cg > 0.02) drawGlow(p, p.cx, p.cy, p.cg * 0.6);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
 
  // words
  for (const p of active) {
    ctx.save();
    ctx.translate(p.cx, p.cy);
    if (p.cr) ctx.rotate(p.cr);
    if (p.cs !== 1) ctx.scale(p.cs, p.cs);
    ctx.globalAlpha = p.ca;
    ctx.font = fontStr(p.size);
    ctx.fillStyle = css(mix(p.color, BRIGHT, p.cb));
    ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
 
  if (committedCount === N) {
    if (!bloomed) onBloom();
    afterglow(t);
  }
  drawDust(t, dt);
 
  requestAnimationFrame(frame);
}
 
const replay = () => reset(performance.now());
canvas.addEventListener("click", replay);
requestAnimationFrame(frame);
 
/* ================= PAGE EXTRAS (styled in style.css) ================= */
const stage = document.getElementById("stage");
const starsEl = document.getElementById("stars");
const petalsEl = document.getElementById("petals");
 
// twinkling background stars
(function makeStars() {
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("i");
    const size = 0.6 + Math.random() * 1.8;
    s.style.cssText =
      `left:${Math.random() * 100}%;top:${Math.random() * 100}%;` +
      `width:${size}px;height:${size}px;` +
      `--d:${2 + Math.random() * 4}s;--o:${Math.random() * 5}s`;
    starsEl.appendChild(s);
  }
})();
 
// falling petals after the flower blooms
function clearPetals() { petalsEl.innerHTML = ""; }
function spawnPetals() {
  clearPetals();
  const kinds = ["white", "cream", "pink"];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("span");
    const size = 10 + Math.random() * 16;
    p.className = "petal " + kinds[i % 3];
    p.style.cssText =
      `left:${Math.random() * 100}%;width:${size}px;height:${size * 1.5}px;` +
      `--fall:${9 + Math.random() * 9}s;--delay:${-Math.random() * 14}s;` +
      `--sway:${30 + Math.random() * 60}px;--spin:${180 + Math.random() * 360}deg`;
    petalsEl.appendChild(p);
  }
}
// credit line: split the name into letters so each one can fly in
const nameEl = document.querySelector("#credit .name");
(function splitName() {
  const text = nameEl.textContent;
  nameEl.setAttribute("aria-hidden", "true");
  nameEl.textContent = "";
  [...text].forEach((ch, i) => {
    const s = document.createElement("i");
    s.textContent = ch === " " ? "\u00A0" : ch;
    s.style.setProperty("--i", i);
    nameEl.appendChild(s);
  });
})();
// point every letter's starting position at the center of the flower
function aimLetters() {
  const cx = window.innerWidth / 2, cy = window.innerHeight * 0.4;
  const box = nameEl.getBoundingClientRect();
  nameEl.querySelectorAll("i").forEach((l) => {
    const lx = box.left + l.offsetLeft + l.offsetWidth / 2;
    const ly = box.top + l.offsetTop + l.offsetHeight / 2;
    l.style.setProperty("--dx", cx - lx + "px");
    l.style.setProperty("--dy", cy - ly + "px");
  });
}
 
function onBloom() {
  bloomed = true;
  aimLetters();
  document.body.classList.add("bloomed");
  spawnPetals();
}
 
// buttons
document.getElementById("replay").addEventListener("click", replay);
document.getElementById("save").addEventListener("click", () => {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const o = out.getContext("2d");
  const g = o.createRadialGradient(out.width / 2, out.height * 0.4, 0, out.width / 2, out.height * 0.4, out.width * 0.8);
  g.addColorStop(0, "#1c0a24");
  g.addColorStop(1, BG);
  o.fillStyle = g;
  o.fillRect(0, 0, out.width, out.height);
  o.drawImage(canvas, 0, 0);
  out.toBlob((b) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "kathgolap.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
});
window.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") replay();
});
 
// cursor light + gentle 3D tilt
window.addEventListener("pointermove", (e) => {
  document.body.style.setProperty("--mx", e.clientX + "px");
  document.body.style.setProperty("--my", e.clientY + "px");
  if (window.matchMedia("(pointer: fine)").matches) {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    stage.style.transform = `perspective(1200px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  }
});
})();
 