# Asset manifest

Source of truth for `assets-src/`. Mockups in `design/mockups-v2/` (current, 1767×1024) and `design/mockups-v1/` (the old design, still the reference for the project article) are reference only and are never imported. All filenames are lowercase-with-hyphens.

## SVG (`assets-src/svg/`)

None of these SVGs has element IDs. Reference paths by document order.

| File | Page | Role | Notes |
|---|---|---|---|
| `who-spray.svg` | home | **guide paths** for the "who?" spray engine; not displayed | 910×302, 5 stroked paths, `#FF7700`, 30px stroke. Draw order = document order: 0 `w`, 1 `h`, 2 `o`, 3 `?` hook, 4 `?` dot |
| `line1.svg`, `line2.svg`, `line3.svg` | About | hand-drawn list dashes, one per list item, static | 8×2 / 8×2 / 8×1, `#FF7700`, drawn 1:1 |
| `anything.svg` | About | the word "anything" inline in the Connect line, raised above the text, static | 59×16, `#FF7700`, drawn 1:1 |
| `extras.svg` | Experience | the hand-drawn word "extras" above the extra jobs, static | 126×34, `#FF7700`, drawn 1:1, right edge at x 419 |
| `portfolio-scribble.svg`, `new-portfolio.svg`, `new-oyster.svg`, `new-mango.svg` | (unused) | the old Map pill squiggle and project-list scribbles | **Unused** since the Projects redesign |
| `chat-cat.svg` | project pages (footer) | the orange cat beside "Let's chat!"; draws itself in (DrawSVG) | 335×459, 3 stroked paths, `#FF7700`, 5px stroke. Exported from the Figma file (Group 100) |
| `speech.svg` | station pages | the orange speech bubble from "Matthew Lam" | 173×137: a 162×80 rect (r 6) + tail. **Unused**: the speech bubble was removed (user request) |
| `mango.svg` | (unused) | the old draggable obstacle | **Unused**: the obstacle text was removed |

## Images (`assets-src/images/`)

| File | Page | Role | Notes |
|---|---|---|---|
| `project-hero-placeholder.png` | project pages | both tilted heroes of every project, until real art is supplied | 445×466, exported from the Figma file (image 109). `?hero` |
| `oyster-news.png`, `mango.png`, `portfolio-orange.png`, `texture.png` | (unused) | the old article heroes, the draggable orange, the key card's paper | **Unused** since the Projects redesign |
| `me-final.png` | About | the photo: thumbs up on the seawall | 2134×2222. Box (941, 278) 447×465 in `About (6).png` |
| `enersys1.png` | Experience (EnerSys) | hover photo: selfie by the EnerSys logo | 2305×1728. Box (1288, header cap −45) 235×176 in `Experience (2).png` |
| `enersys2.png` | Experience (EnerSys) | hover photo: meeting-room demo, on top | 2736×2060. Box (1432, +55) 229×173 |
| `sailbot1.png` | Experience (UBC Sailbot) | hover photo: the Sailbot logo | 1612×1612. Box (1547, −49) 128×128 |
| `sailbot2.png` | Experience (UBC Sailbot) | hover photo: the team, on top | 3044×2283. Box (1298, +42) 268×201 |
| `tqd.png` | Experience (Third Quadrant Design) | hover photo: the TQD logo | 2050×988. Box (1263, +11) 224×108 (`Experience (3).png`) |
| `tqd2.png` | Experience (Third Quadrant Design) | hover photo: the Poetry Night competition board, over the logo | 4680×3300. Box (1395, +103) 303×214 (`Experience (3).png`) |
| `me4.jpg` | About (unused since `About (6)`) | photo: alley by the dumpsters | 2048×1536. Box (1317, 191) 331×303 in `About (4).png` |
| `me3.jpg` | About (unused) | photo: hoodie against a brick wall | 2048×1536. Box (1022, 283) 225×299 in `About (4).png` |
| `me1.jpg` | About (unused) | photo: as a kid in a car | 2560×1920, EXIF-rotated to portrait (imagetools outputs it upright). Not in the mockup: box (1423, 564) 225×300 is my placement |
| `me2.jpg` | About (unused) | photo: on the bus | 4032×3024 (converted from HEIC: sharp can't decode HEIC). Not in the mockup: box (1022, 652) 331×248 is my placement |

## Sounds (`assets-src/sounds/`)

Empty for now. Files are discovered at build time (spec §9.5), so adding one needs no code change. Name each `<id>.m4a` (AAC), with variants as `<id>.<n>.m4a`, e.g. `gate.select.m4a`, `paint.stroke.1.m4a` … `paint.stroke.4.m4a`, `palimpsest.thud.1.m4a` … `.3`. IDs are in spec §9.6. Any ID without a file plays a synthesized placeholder. The user likes the synthesized sounds and wants to keep them, so no files are required. Add files only if the user supplies them.

## Missing (use labeled placeholders until supplied)

| Needed | Page | Seen in mockup |
|---|---|---|
| Helvetica Rounded Bold (`assets-src/fonts/helvetica-rounded-bold.woff2`) | project pages, Map box | the Figma file's typeface |
| Two heroes per project | project pages | Figma "image 109" / "image 110" (placeholders) |
| Video, Figma board, timeline media per project | project pages | the grey boxes in Figma |
