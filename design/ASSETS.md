# Asset manifest

Source of truth for `assets-src/`. Mockups in `design/mockups-v2/` (current, 1767×1024) and `design/mockups-v1/` (the old design, still the reference for the project article) are reference only and are never imported. All filenames are lowercase-with-hyphens.

## SVG (`assets-src/svg/`)

None of these SVGs has element IDs. Reference paths by document order.

| File | Page | Role | Notes |
|---|---|---|---|
| `who-spray.svg` | home | **guide paths** for the "who?" spray engine; not displayed | 221×99, 5 stroked paths, `#FF7700`, 10px stroke, from Figma "Home Page Final" (node 450:4922; the w's `Z` removed, the ?-hook moved before the dot). Draw order = document order: 0 `w`, 1 `h`, 2 `o`, 3 `?` hook, 4 `?` dot |
| `home-skyline.svg` | home | the orange Vancouver skyline line drawing; its lines draw themselves from the peak down during the intro | 664×143, 507 stroked paths (1px, `#FF7700`; stroke set on the root) in two groups: `[data-part=mountain]` (73 ridge lines, Figma Group 116) and `[data-part=city]` (434, Group 117). Exported from Figma "Home Page Final" (Group 118), background rects removed, coordinates rounded to 2 decimals. Fetched and inlined at runtime (not `?raw`, to keep it out of the JS bundle) |
| `line1.svg`, `line2.svg`, `line3.svg` | About | hand-drawn list dashes, one per list item, static | 8×2 / 8×2 / 8×1, `#FF7700`, drawn 1:1 |
| `anything.svg` | About | the word "anything" inline in the Connect line, raised above the text, static | 59×16, `#FF7700`, drawn 1:1 |
| `extras.svg` | (unused) | the old hand-drawn "extras" (replaced by `extras-final.svg`) | 126×34, `#FF7700` |
| `extras-final.svg` | (unused) | the hand-drawn "Extras" (dropped from the updated Figma "Experience Final") (Figma "Experience Final", its 10 strokes combined, positions kept) | 219.4×56.45, `#FF7700`, 10px strokes |
| `portfolio-scribble.svg`, `new-portfolio.svg`, `new-oyster.svg`, `new-mango.svg` | (unused) | the old Map pill squiggle and project-list scribbles | **Unused** since the Projects redesign |
| `project-smiley.svg` | Projects (ReMind) | the orange hand-drawn smiley beside ReMind's photos, static | 64×72, 3 stroked paths, `#FF7700`, 10px stroke, combined from Figma "Project Final" Vectors 839–841 |
| `project-heart.svg` | Projects (This Portfolio) | the orange heart scribble over the portfolio pieces, static | 145×122, 1 stroked path, `#FF7700`, 2px stroke, Figma "Project Final" Vector 300 |
| `chat-cat.svg` | station pages (footer), home | the orange cat beside "Let's chat!"; draws itself in (DrawSVG) | 335×459, 3 stroked paths, `#FF7700`, 5px stroke. Exported from the Figma file (Group 100) |
| `speech.svg` | station pages | the orange speech bubble from "Matthew Lam" | 173×137: a 162×80 rect (r 6) + tail. **Unused**: the speech bubble was removed (user request) |
| `mango.svg` | (unused) | the old draggable obstacle | **Unused**: the obstacle text was removed |

## Images (`assets-src/images/`)

| File | Page | Role | Notes |
|---|---|---|---|
| `project-hero-placeholder.png` | home | home's two faded corner posters (the project heroes are gone since "Project Final") | 445×466, exported from the Figma file (image 109). `?homeposter` |
| `remind-1.jpg`, `remind-2.png`, `remind-3.jpg` | Projects (ReMind collage) | the team with the robot arm; a selfie on the train; the demo table | 3072×4096, 2316×3088, 1280×960, from Figma "Project Final" (image 142, image 143, "1792474850278 1"). `?collage` (AVIF/WebP 400/800/1600) |
| `mango-1.png`, `mango-2.png`, `mango-3.png` | Projects (Mango collage) | the team with prizes; the pose tracking; the team selfie | 1280×853, 1054×607, 1215×911 (image 145, Mango 1, image 144). `?collage` |
| `oyster-news-paper.png` | unused (was the Oyster News collage, removed at the user's request) | a newspaper page | 876×1151 (image 115). `?collage` |
| `oyster-news-map.png` | Projects (Oyster News collage) | screenshot of oysternews.xyz: the world map with headline bubbles | 3824×1896 (1912×948 at 2x), taken 2026-11-25. `?collage` |
| `portfolio-1.png` | Projects (This Portfolio collage) | the Figma board | 1395×899 (image 146). `?collage` |
| `home-photo.png` | home | the three taped prints (one photo, cropped alike): thumbs up by the water | 2048×1536, from Figma "Home Page Final" (image 122). `?print` (AVIF/WebP 400/800/1200) |
| `tape-long.png`, `tape-short.png` | home (`tape-short` also holds the Experience photos) | the two strips of masking tape over the prints | 540×123 and 304×120, cut from Figma's tape sheet (the bottom strip and the middle-left one) at the crops Figma uses. Fibre and `--tape-tint` are baked in at build time (`&tape` preset) |
| `tape-skyline.png` | home | the strip holding the skyline's sheet (Figma "tape1", 452:4941) | 320 wide, cut from the same tape sheet at Figma's crop. Baked like the other tape |
| `paper-sheet.png` | home | a stub (8×8 white) for the skyline's blank sheet: the `?sheet` preset fills it with `--paper-sheet` and bakes the fibre in (scripts/paperBake.ts) | not art; don't replace |
| `texture.png` | home | faint paper grain over the taped prints | |
| `oyster-news.png`, `mango.png`, `portfolio-orange.png` | (unused) | the old article heroes, the draggable orange | **Unused** since the Projects redesign |
| `me-final.png` | About | the photo: thumbs up on the seawall | 2134×2222. Box (941, 278) 447×465 in `About (6).png` |
| `enersys1.png` | Experience | taped photo beside EnerSys (Figma "Experience Final" 235×176; was a hover photo): selfie by the EnerSys logo | 2305×1728. Box (1288, header cap −45) 235×176 in `Experience (2).png` |
| `enersys2.png` | Experience | taped photo beside EnerSys, over the selfie (229×173, turned 5.34°): meeting-room demo | 2736×2060. Box (1432, +55) 229×173 |
| `sailbot1.png` | (unused) | hover photo: the Sailbot logo | 1612×1612. Box (1547, −49) 128×128 |
| `sailbot2.png` | Experience | taped photo left of Sailbot (215×162, turned −3.14°): the team | 3044×2283. Box (1298, +42) 268×201 |
| `tqd.png` | (unused) | hover photo: the TQD logo | 2050×988. Box (1263, +11) 224×108 (`Experience (3).png`) |
| `tqd2.png` | (unused) | hover photo: the Poetry Night competition board, over the logo | 4680×3300. Box (1395, +103) 303×214 (`Experience (3).png`) |
| `tqd-team.jpg` | Experience | taped photo beside TQD (349×183, turned 1.54°): the team at a table | 3841×2011, downloaded from Figma (IMG_7757), EXIF/GPS stripped |
| `enersys-logo.png` | Experience | index logo, EnerSys | 447×447, shown in a 39×39 box at x −9 (Figma px at a 16px body) |
| `sailbot-logo.png` | Experience | index logo, UBC Sailbot | 200×200, 21×21 |
| `tqd-logo.png` | Experience | index logo, Third Quadrant Design: a sprite of the full logo; Figma crops it to the green mark | 2048×2048, 21×27 box, crop 314.93%×245.35% at −8.96%/−66.28% |
| `aquatic-logo.png` | (unused) | index logo, UBC Aquatic Centre (Extras, removed) | 1280×1172, 21×19 |
| `geering-up-logo.png` | (unused) | index logo, UBC Geering Up (Extras, removed) | 447×447, 19×19 at x 1 |
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
| The Oyster News screencast | Projects | the grey "future screencast of oyster news" box in "Project Final" |
| Three references for This Portfolio | Projects | the grey boxes ("future references") in "Project Final" |
