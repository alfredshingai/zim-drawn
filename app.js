// Zimbabwe, Drawn by Hand v3 — pencil draws the EXACT photo (canvas tile reveal)
const W = 480, H = 360, COLS = 60, ROWS = 45, TW = W / COLS, TH = H / ROWS;
const speedInput = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
const playChronoBtn = document.getElementById('playChrono');
const tourBtn = document.getElementById('tourBtn');
const tourProgress = document.getElementById('tourProgress');
const tourLabel = document.getElementById('tourLabel');
const pencil = document.getElementById('pencil');

let speed = 1;
speedInput.addEventListener('input', e => {
  speed = parseFloat(e.target.value);
  speedVal.textContent = speed.toFixed(1) + '×';
});

document.querySelectorAll('[data-mode-btn]').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('[data-mode-btn]').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.body.dataset.mode = b.dataset.modeBtn;
  });
});
const finishMode = () => document.body.dataset.mode || 'trace'; // trace=sketch+colour, reveal=sketch only, sketch=photo only

// visible error trap: if anything throws, show it in the status line so it can be reported
window.addEventListener('error', e => {
  const el = document.getElementById('tourLabel');
  if (el) el.textContent = '⚠️ hiccup: ' + (e.message || 'unknown error') + ' — try hard refresh (Ctrl+Shift+R).';
});

function loadImg(img, timeoutMs = 15000) {
  if (img.naturalWidth) { img.dataset.ready = '1'; return Promise.resolve(img); }
  if (img.complete) return Promise.reject(new Error('photo would not load (' + (img.alt || 'image') + ')'));
  return new Promise((res, rej) => {
    const timer = setTimeout(() => rej(new Error('photo timed out (' + (img.alt || 'image') + ')')), timeoutMs);
    img.addEventListener('load', () => { clearTimeout(timer); img.dataset.ready = '1'; res(img); }, { once: true });
    img.addEventListener('error', () => { clearTimeout(timer); rej(new Error('photo would not load (' + (img.alt || 'image') + ')')); }, { once: true });
  });
}

// cover-crop image into W×H, return ImageData (color)
function coverData(img) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
  x.fillStyle = '#fffdf4'; x.fillRect(0, 0, W, H);
  x.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return { ctx: x, data: x.getImageData(0, 0, W, H) };
}

function boxBlur(g, w, h, r) {
  const tmp = new Float32Array(g.length), out = new Float32Array(g.length);
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x < w + r; x++) { acc += g[y * w + Math.min(w - 1, Math.max(0, x))]; if (x - r >= 0) acc -= g[y * w + Math.min(w - 1, Math.max(0, x - r))]; if (x >= 0 && x < w) tmp[y * w + x] = acc / (2 * r + 1); }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y < h + r; y++) { acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]; if (y - r >= 0) acc -= tmp[Math.min(h - 1, Math.max(0, y - r)) * w + x]; if (y >= 0 && y < h) out[y * w + x] = acc / (2 * r + 1); }
  }
  return out;
}

// exact-photo pencil sketch: dodge shading + sobel edges on paper
function toSketch(color) {
  const d = color.data, n = W * H;
  const gray = new Float32Array(n);
  for (let i = 0; i < n; i++) gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
  const soft = boxBlur(gray, W, H, 2);
  const out = new ImageData(W, H);
  const o = out.data;
  // sobel inline
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const xm0 = Math.max(0, x - 1), xp1 = Math.min(W - 1, x + 1);
      const ym0 = Math.max(0, y - 1) * W, yp1 = Math.min(H - 1, y + 1) * W;
      const gx = -gray[y * W + xm0] + gray[y * W + xp1] - 2 * gray[ym0 + x] + 2 * gray[yp1 + x] - gray[ym0 + xm0] + gray[ym0 + xp1] - gray[yp1 + xm0] + gray[yp1 + xp1];
      const gy = -gray[ym0 + xm0] - 2 * gray[ym0 + x] - gray[ym0 + xp1] + gray[yp1 + xm0] + 2 * gray[yp1 + x] + gray[yp1 + xp1];
      const edge = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 0.55);
      const denom = 255 - soft[i];
      const dodge = denom >= 254 ? 255 : Math.min(255, gray[i] * 255 / Math.max(1, denom));
      let v = 255 - Math.min(255, edge * 0.85 + (255 - dodge) * 0.42);
      v -= ((i * 2654435761) % 100) / 100 * 9; // paper grain
      v = Math.max(0, Math.min(255, v));
      o[i * 4] = v; o[i * 4 + 1] = v * 0.985; o[i * 4 + 2] = v * 0.945; o[i * 4 + 3] = 255;
    }
  }
  return out;
}

function tileOrder() {
  const tiles = [];
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++)
    tiles.push({ tx, ty, k: ty * 0.7 + tx * 0.45 + Math.random() * 170 });
  tiles.sort((a, b) => a.k - b.k);
  return tiles;
}

function pencilTo(canvas, px, py, glyph) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = canvas.getBoundingClientRect();
  const x = r.left + (px / W) * r.width, y = r.top + (py / H) * r.height;
  pencil.textContent = glyph;
  pencil.style.opacity = '1';
  pencil.style.transform = `translate(${x + 10}px, ${y - 10}px) rotate(-18deg)`;
}

class ExactSketch {
  constructor(wrap) {
    this.wrap = wrap;
    this.img = wrap.querySelector('img.photo');
    this.canvas = wrap.querySelector('canvas.draw');
    if (!this.canvas) throw new Error('canvas missing — hard refresh (Ctrl+Shift+R) to load the latest page.');
    this.canvas.width = W; this.canvas.height = H;
    this.vctx = this.canvas.getContext('2d');
    this.cache = null; this.playId = 0;
  }
  async prepare() {
    if (this.cache && this.cache.src === this.img.currentSrc) return this.cache;
    await loadImg(this.img);
    const { data: color } = coverData(this.img); // throws if tainted
    const sketch = toSketch(color);
    // offscreen holders
    const sc = document.createElement('canvas'); sc.width = W; sc.height = H;
    sc.getContext('2d').putImageData(sketch, 0, 0);
    const cc = document.createElement('canvas'); cc.width = W; cc.height = H;
    cc.getContext('2d').putImageData(color, 0, 0);
    this.cache = { src: this.img.currentSrc, sketch: sc, color: cc };
    return this.cache;
  }
  paper() {
    this.vctx.fillStyle = '#fffdf4'; this.vctx.fillRect(0, 0, W, H);
  }
  async play(pctEl, name) {
    const my = ++this.playId;
    const mode = finishMode();
    if (mode === 'sketch') { // photo only
      try {
        const { sketch, color } = await this.prepare();
        if (my !== this.playId) return;
        this.vctx.drawImage(color, 0, 0);
        this.wrap.classList.add('drawn');
        if (pctEl) pctEl.textContent = 'photo ✓';
        pencil.style.opacity = '0';
        return;
      } catch { return this.fallback(pctEl); }
    }
    let lib;
    try { lib = await this.prepare(); }
    catch { return this.fallback(pctEl); }
    if (my !== this.playId) return;
    this.wrap.classList.remove('drawn');
    this.paper();
    const order = tileOrder();
    const total = order.length;
    let done = 0;
    const colourPhase = mode === 'trace';
    if (pctEl) pctEl.textContent = '✏️ sketching… 0%';
    tourLabel.textContent = `✏️ pencil sketching ${name} — the exact photo…`;
    // Phase 1: pencil sketch tiles
    await new Promise(res => {
      const step = () => {
        if (my !== this.playId) return res();
        const n = Math.max(2, Math.round(7 * speed));
        for (let k = 0; k < n && done < total; k++, done++) {
          const t = order[done];
          this.vctx.drawImage(lib.sketch, t.tx * TW, t.ty * TH, TW + 0.5, TH + 0.5, t.tx * TW, t.ty * TH, TW + 0.5, TH + 0.5);
          if (k === n - 1) pencilTo(this.canvas, t.tx * TW + TW / 2, t.ty * TH + TH / 2, '✏️');
        }
        if (pctEl) pctEl.textContent = colourPhase
          ? `✏️ sketching… ${Math.round(done / total * 60)}%`
          : `✏️ sketching… ${Math.round(done / total * 100)}%`;
        if (done < total) requestAnimationFrame(step); else res();
      };
      step();
    });
    if (my !== this.playId) return;
    if (!colourPhase) {
      this.wrap.classList.add('drawn');
      if (pctEl) pctEl.textContent = 'pencil ✓';
      pencil.style.opacity = '0';
      tourLabel.textContent = `${name} — pencil sketch complete (exact photo, hand-shaded).`;
      return;
    }
    // Phase 2: colour it in, same pencil path order
    if (pctEl) pctEl.textContent = '🖌️ colouring… 60%';
    tourLabel.textContent = `🖌️ sketch done — now colouring ${name} in…`;
    let c = 0;
    await new Promise(res => {
      const step = () => {
        if (my !== this.playId) return res();
        const n = Math.max(4, Math.round(16 * speed));
        for (let k = 0; k < n && c < total; k++, c++) {
          const t = order[c];
          this.vctx.drawImage(lib.color, t.tx * TW, t.ty * TH, TW + 0.5, TH + 0.5, t.tx * TW, t.ty * TH, TW + 0.5, TH + 0.5);
          if (k === n - 1) pencilTo(this.canvas, t.tx * TW + TW / 2, t.ty * TH + TH / 2, '🖌️');
        }
        if (pctEl) pctEl.textContent = `🖌️ colouring… ${Math.round(60 + c / total * 40)}%`;
        if (c < total) requestAnimationFrame(step); else res();
      };
      step();
    });
    if (my !== this.playId) return;
    this.wrap.classList.add('drawn');
    if (pctEl) pctEl.textContent = 'done ✓';
    pencil.style.opacity = '0';
    tourLabel.textContent = `${name} — exact photo, drawn then coloured.`;
  }
  fallback(pctEl) { // canvas blocked: show photo directly
    this.wrap.classList.add('drawn', 'photo-fallback');
    if (pctEl) pctEl.textContent = 'photo ✓';
  }
  stop() { this.playId++; pencil.style.opacity = '0'; }
}

const sketches = new Map();
const getSketch = wrap => {
  if (!sketches.has(wrap)) sketches.set(wrap, new ExactSketch(wrap));
  return sketches.get(wrap);
};

const cards = [...document.querySelectorAll('.card')];
const chrono = [...cards].sort((a, b) => (+a.dataset.chapter) - (+b.dataset.chapter));

function drawCard(card, { scroll = false } = {}) {
  if (scroll) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const wrap = card.querySelector('.sketch-wrap');
  const pctEl = card.querySelector('.pct span');
  const name = card.querySelector('h2')?.textContent || 'photo';
  if (pctEl) pctEl.textContent = 'loading photo…';
  // small delay after scroll so the pencil starts on-screen
  return new Promise(res => setTimeout(res, scroll ? 450 : 0))
    .then(() => getSketch(wrap).play(pctEl, name))
    .catch(err => {
      if (pctEl) pctEl.textContent = 'photo unavailable';
      tourLabel.textContent = '⚠️ ' + err.message;
    });
}

document.querySelectorAll('[data-replay]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    closeTheater();
    drawCard(document.getElementById(btn.dataset.replay));
  });
});
document.querySelectorAll('.card .sketch-wrap').forEach(w => {
  w.addEventListener('click', e => { if (e.target.closest('.replay')) return; drawCard(w.closest('.card')); });
});

let browsing = false;
tourBtn.addEventListener('click', async () => {
  closeTheater();
  for (const [idx, c] of chrono.entries()) {
    tourProgress.style.width = `${(idx / chrono.length) * 100}%`;
    await drawCard(c, { scroll: true });
    await new Promise(r => setTimeout(r, 500));
  }
  tourProgress.style.width = '100%';
  setTimeout(() => tourProgress.style.width = '0%', 1600);
});

// ---- Theater: one exact photo at a time ----
const theater = document.getElementById('theater');
const thChapter = document.getElementById('thChapter');
const thEra = document.getElementById('thEra');
const thTitle = document.getElementById('thTitle');
const thSub = document.getElementById('thSub');
const thDesc = document.getElementById('thDesc');
const thPhoto = document.getElementById('thPhoto');
const thWrap = document.getElementById('thWrap');
const thPct = document.getElementById('thPct');
const thDots = document.getElementById('thDots');
const thPlay = document.getElementById('thPlay');
const thSketch = getSketch(thWrap);

let thIndex = 0, thPlaying = false, thToken = 0;
chrono.forEach((c, i) => {
  const d = document.createElement('button');
  d.setAttribute('aria-label', 'Go to chapter ' + (i + 1));
  d.addEventListener('click', () => { thIndex = i; playChapter(); });
  thDots.appendChild(d);
});
function openTheater() { theater.classList.add('open'); theater.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
function closeTheater() {
  thToken++; thPlaying = false;
  thSketch.stop();
  theater.classList.remove('open'); theater.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  thPlay.textContent = '▶ Play';
  playChronoBtn.textContent = '▶ Play chronologically';
}
async function playChapter() {
  const my = ++thToken;
  const card = chrono[thIndex];
  openTheater();
  thPlaying = true; thPlay.textContent = '⏸ Pause';
  thChapter.textContent = `Ch.${card.dataset.chapter} / 6`;
  thEra.textContent = card.dataset.era;
  thTitle.textContent = card.querySelector('h2').textContent;
  thSub.textContent = card.querySelector('.local').textContent;
  thDesc.textContent = card.querySelector('.desc').textContent;
  const src = card.querySelector('img.photo').src;
  const alt = card.querySelector('img.photo').alt;
  if (thPhoto.getAttribute('src') !== src) { thPhoto.setAttribute('src', src); thPhoto.alt = alt; thSketch.cache = null; }
  [...thDots.children].forEach((d, i) => d.classList.toggle('active', i === thIndex));
  tourProgress.style.width = `${(thIndex / chrono.length) * 100}%`;
  await thSketch.play(thPct, thTitle.textContent);
  if (my !== thToken) return;
  tourProgress.style.width = `${((thIndex + 1) / chrono.length) * 100}%`;
  await new Promise(r => setTimeout(r, 2000 / speed));
  if (my !== thToken || !thPlaying) return;
  if (thIndex < chrono.length - 1) { thIndex++; playChapter(); }
  else {
    thPlaying = false; thPlay.textContent = '↻ Replay story';
    tourLabel.textContent = 'Chronological story complete — every exact photo, drawn. Vote below 👇';
    setTimeout(() => tourProgress.style.width = '0%', 1800);
  }
}
playChronoBtn.addEventListener('click', () => {
  if (theater.classList.contains('open') && thPlaying) { closeTheater(); return; }
  thIndex = 0; playChapter();
  playChronoBtn.textContent = '⏸ Stop';
});
document.getElementById('thClose').addEventListener('click', closeTheater);
document.getElementById('thNext').addEventListener('click', () => { thIndex = Math.min(chrono.length - 1, thIndex + 1); playChapter(); });
document.getElementById('thPrev').addEventListener('click', () => { thIndex = Math.max(0, thIndex - 1); playChapter(); });
thPlay.addEventListener('click', () => {
  if (thPlaying) { thToken++; thPlaying = false; thSketch.stop(); thPlay.textContent = '▶ Resume'; }
  else playChapter();
});

// gentle auto-draw on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting && !en.target.dataset.drawn && !theater.classList.contains('open')) {
      en.target.dataset.drawn = '1';
      drawCard(en.target);
    }
  });
}, { threshold: 0.3 });
cards.forEach(c => io.observe(c));

// votes
const voteRow = document.getElementById('voteRow');
const voteMsg = document.getElementById('voteMsg');
const KEY = 'zim-drawn-vote';
function renderVote() {
  const v = localStorage.getItem(KEY);
  voteRow.querySelectorAll('button').forEach(b => b.classList.toggle('voted', b.dataset.vote === v));
  if (v) voteMsg.textContent = `You picked ${voteRow.querySelector(`[data-vote="${v}"]`)?.textContent} ✏️ — great taste. Stored locally.`;
}
voteRow.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  localStorage.setItem(KEY, b.dataset.vote); renderVote();
});
renderVote();

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeTheater();
  if ((e.key === 'p' || e.key === 'P') && !theater.classList.contains('open')) playChronoBtn.click();
  if (e.key === 'ArrowRight' && theater.classList.contains('open')) document.getElementById('thNext').click();
  if (e.key === 'ArrowLeft' && theater.classList.contains('open')) document.getElementById('thPrev').click();
});
