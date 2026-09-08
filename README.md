# Zimbabwe, Drawn by Hand ✏️

A sketchbook tour of Zimbabwe — **only pencil sketches are ever shown**. A real map and six real photos are used as sources in-browser, hidden (`opacity: 0`), and the pencil **draws the sketch tile by tile** (60×45 tiles, dodge + Sobel + grain on `canvas`). No photos, no colour fills — just the drawing. Played **one at a time, oldest first**.

Sites (chronological): ① Matobo Hills (rock art ~2,000 yrs) · ② Great Zimbabwe (1100s) · ③ Victoria Falls (1855) · ④ Hwange (1928) · ⑤ Chinhoyi Caves (1955) · ⑥ Mana Pools (1984 UNESCO).

Live: `https://zim-drawn.vercel.app` (Vercel). Analytics: Vercel Web Analytics at `/_vercel/insights/script.js` (enable in Vercel Dashboard → Analytics).

## Run

No build. Assets are bundled in `images/` and `images/zim-map.svg`, works offline:

```
cd zim-drawn && python3 serve.py 8000
# → http://localhost:8000
```

`serve.py` sends `no-store` headers so you always see the latest. `python3 -m http.server` also works. Favicon: `favicon.svg` (sketch pencil on #fdf6e3), `favicon.ico`/`favicon-32.png` (32×32), `apple-touch-icon.png` (180×180).

## How the sketch works

- Each source (photo or `zim-map.svg`) is converted in-browser to a pencil sketch (`app.js:61` dodge + Sobel + paper grain).
- A ✏️ reveals the sketch along a tiled sweep (`app.js:144` `COLS=60 ROWS=45`), then stops — **sketch is the final frame**. No `🖌️` colour pass, no photo reveal (`app.js:18` `finishMode() => 'reveal'`; `style.css:81` `.photo {opacity:0}`).
- Real map: `images/zim-map.svg` is a **37-vertex Natural Earth border** (`world.geo.json`, equirectangular `lon 25.5–33.0 → x 70–410`, `lat -15.5–-22.25 → y 45–310`) with Lake Kariba, cities and pins at true positions. Pins overlay (`index.html:49-55`) aligns with SVG pins.
- Theater: chronological player (one sketch at a time, auto-advances `2000/speed` ms), Prev/Next, chapter dots, progress bar. Speed slider `0.5–2.5×`, replay buttons, IntersectionObserver scroll-draw, `P` play, `Esc` close, `prefers-reduced-motion` respected. Votes in `localStorage`.

## Photos & map sources

Bundled, **never shown directly** — see per-sketch credits in `index.html`:

- **Matobo Hills** — Mother and Child Kopje, Matobo (Babakathy, Public Domain) — inspired by iStock Matopos Hills gallery
- **Great Zimbabwe** — Great Enclosure wall with euphorbia (Wikimedia Commons)
- **Victoria Falls** — Anne Dirkse, Wikimedia Commons CC BY-SA (rainbow in spray)
- **Hwange Park** — Masuma Dam elephants, Hwange (Babakathy, CC0) — inspired by TripAdvisor Hwange traveler photos
- **Chinhoyi Caves** — Wonder Hole / Sleeping Pool entrance (Wikimedia Commons, vivid arch + green canopy, 92 m cobalt pool below)
- **Mana Pools** — Zambezi island with Escarpment (Wikimedia Commons)
- **Map** — Zimbabwe 37-vertex border + neighbours from `world.geo.json` / Natural Earth (sketch source, not to survey scale)

All sketches are generated client-side; sources stay hidden (`canvas.draw` is the only visible layer).

## Deploy

- **Vercel only**: `vercel.json` (cleanUrls, immutable images). Connect GitHub repo `alfredshingai/zim-drawn` → auto-deploy on push to `main`. Enable Web Analytics: Dashboard → https://vercel.com/alfredo1805/zim-drawn/analytics → Enable → redeploy; verify Network tab shows `/_vercel/insights/view`.

## UX notes

- `images/hwange.jpg` is now landscape 1072×804 (herd at pan) not portrait — corrects 4:3 `coverData` crop.
- `images/matobo.jpg` is Mother and Child (765×514) for direct iStock-style balancing-rocks recognition.
- Descriptions in `index.html:87,104,121,138,155,172` match what is drawn (e.g. “Four elephants on Masuma Dam pan”, “Inside Enclosure walls with euphorbia”, “Wonder Hole arch”).
