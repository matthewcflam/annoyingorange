import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { imagetools } from 'vite-imagetools'
import { paperTransform } from './scripts/paperBake.ts'

/** Image presets (spec §10.3). `?hero` on an image import generates AVIF +
 *  WebP at 1× and 2× the rendered width and returns a `Picture` (see
 *  src/imagetools.d.ts). Hero boxes are 600 mockup px wide; 700 leaves room
 *  for `object-fit: cover` cropping. */
const PRESETS: Record<string, Record<string, string>> = {
  hero: { w: '700;1400', format: 'avif;webp', as: 'picture' },
  // About photos' frosted glass, blurred here instead of with CSS filters.
  // `frost` (heavy) is tiny and inlined as a data URI, so it shows before
  // any image loads; `frostlight` (the mid blur) is a small file.
  frost: { w: '32', blur: '1.6', format: 'webp', quality: '70', inline: '' },
  frostlight: { w: '160', blur: '3', format: 'webp', quality: '70' },
  // A <video> poster: one URL (the attribute takes no srcset), wide enough
  // for the expanded lightbox.
  poster: { w: '1280', format: 'webp', quality: '75' },
  // Home's paper (pages/paper/sheets.ts). The texture is baked in at build
  // time (scripts/paperBake.ts), so the page ships plain images.
  // The taped prints: shown ~325 CSS px wide at the reference size, up to
  // ~460 on a big screen, so 400/800/1200 covers 1x–2.6x.
  print: { w: '400;800;1200', format: 'avif;webp', as: 'picture' },
  // The faded posters: the source is the 445 px box itself; halftone + fibre.
  homeposter: { w: '445', format: 'avif;webp', as: 'picture', paperHalftone: '445', paperFibre: '445' },
  // Tape: alpha WebP, warmed by --tape-tint, with fibre. Pass `w` (2x its box)
  // and `paperFibre` (its box width, mockup px) on the import.
  tape: { format: 'webp', quality: '90', paperTint: '--tape-tint' },
  // The skyline's blank sheet (763×221): a stub filled with --paper-sheet.
  sheet: { w: '1526', h: '442', fit: 'fill', allowUpscale: 'true', format: 'webp', quality: '80', paperFill: '--paper-sheet', paperFibre: '763' },
}

/** Preloads the fonts the gate waits for (src/lib/fonts.ts), so they download
 *  alongside the JS instead of after it has run and injected the CSS. Build
 *  only: the files are hashed, so they're found in the bundle. */
const PRELOAD_FONTS = [/\/inter-latin-wght-normal-[\w-]+\.woff2$/, /\/nunito-latin-500-normal-[\w-]+\.woff2$/]

function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (_html, ctx) =>
        Object.keys(ctx.bundle ?? {})
          .filter((file) => PRELOAD_FONTS.some((re) => re.test(file)))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', href: `/${file}`, as: 'font', type: 'font/woff2', crossorigin: '' },
            injectTo: 'head' as const,
          })),
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    preloadFonts(),
    imagetools({
      extendTransforms: (builtins) => [...builtins, paperTransform],
      defaultDirectives: (url) => {
        for (const [name, directives] of Object.entries(PRESETS)) {
          if (url.searchParams.has(name)) return new URLSearchParams(directives)
        }
        return new URLSearchParams()
      },
    }),
  ],
})
