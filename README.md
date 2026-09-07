# Zimbabwe, Drawn by Hand ✏️

A sketchbook-style web app: 6 major Zimbabwe attractions where a **pencil draws the exact real photo** — tile by tile in your browser — then colours it in. Played **one at a time in chronological order**, oldest story first.

Sites (chronological): ① Matobo Hills (rock art) · ② Great Zimbabwe (1100s) · ③ Victoria Falls (1855) · ④ Hwange (1928) · ⑤ Chinhoyi Caves (1955) · ⑥ Mana Pools (1984 UNESCO).

## Run
No build. Photos are bundled in `images/`, so it works offline:
```
cd zim-drawn && python3 serve.py 8000
# → http://localhost:8000
```
(`serve.py` is a static server that sends no-cache headers so you always see the latest version. Plain `python3 -m http.server` works too.)

## How the exact-photo drawing works
- Each real photo is converted in-browser to a pencil sketch (dodge-blend shading + Sobel edges + paper grain on canvas).
- A ✏️ reveals the sketch tile by tile along an artist-like sweep, then switches to 🖌️ and colours the exact photo in.
- Chronological theater player: one photo at a time, auto-advancing, with Prev/Next and chapter dots.
- Finish modes: Sketch + colour / Sketch only / Photo only. Speed slider, replay buttons, scroll-triggered drawing.
- `P` plays chronologically, `Esc` closes the player. Reduced-motion respected. Votes stored in `localStorage`.

## Photos
Bundled from Wikimedia Commons (CC / CC BY-SA) — see per-sketch credits in the app:
Matobo sunrise · Great Enclosure wall · Victoria Falls (Anne Dirkse) · African bush elephant · Chinhoyi caves · Zambezi island at Mana Pools.
