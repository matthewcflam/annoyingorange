import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { imagetools } from 'vite-imagetools'
import { paperTransform } from './scripts/paperBake.ts'
import { CUSTOM_MEDIA } from './src/config/media.ts'

/** Image presets (spec §10.3): `?<name>` on an image import applies its
 *  directives. `as: 'picture'` presets return a `Picture` (AVIF + WebP
 *  srcsets; src/imagetools.d.ts). */
const PRESETS: Record<string, Record<string, string>> = {
  // The project collages' photos (content/projects.ts): ~250–420 CSS px in
  // the page (asked for at 1.5x, since they're rotated; collageSizes()), up
  // to 60% of the window in the lightbox. Quality is above sharp's AVIF
  // default (50), which looked soft at these sizes.
  collage: { w: '600;1000;1600;2400', format: 'avif;webp', quality: '72', as: 'picture' },
  // Experience's index logos: ~14–26 CSS px boxes (the TQD sprite shows a
  // third of its width), so one 160px WebP covers 3x screens.
  logo: { w: '160', format: 'webp', quality: '85' },
  // A <video> poster: one URL (the attribute takes no srcset), wide enough
  // for the expanded lightbox.
  poster: { w: '1280', format: 'webp', quality: '75' },
  // Paper prints (home, About, Experience; pages/paper/): shown ~325 CSS px wide at the reference size, up to
  // ~460 on a big screen, so 400/800/1200 covers 1x–2.6x.
  print: { w: '400;800;1200', format: 'avif;webp', as: 'picture' },
  // The paper texture below is baked in at build time (scripts/paperBake.ts),
  // so the page ships plain images.
  // Tape: alpha WebP, warmed by --tape-tint, with fibre. Pass `w` (2x its box)
  // and `paperFibre` (its box width, mockup px) on the import.
  tape: { format: 'webp', quality: '90', paperTint: '--tape-tint' },
  // The skyline's blank sheet (763×221): a stub filled with --paper-sheet.
  sheet: { w: '1526', h: '442', fit: 'fill', allowUpscale: 'true', format: 'webp', quality: '80', paperFill: '--paper-sheet', paperFibre: '763' },
}

/** Preloads the fonts the first render waits for (src/lib/fonts.ts
 *  waitForFonts), so they download alongside the JS instead of after it has
 *  run and injected the CSS: Helvetica Rounded once the user supplies it,
 *  else Inter, its fallback (with the file there, Inter never shows). Nunito (station body text) isn't preloaded: home never uses
 *  it, and a station landing loads it with the page. Build only: the files
 *  are hashed, so they're found in the bundle. */
const ROUNDED_FONT = /\/helvetica-rounded-bold-[\w-]+\.woff2$/
const INTER_FONT = /\/inter-latin-wght-normal-[\w-]+\.woff2$/

function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (_html, ctx) => {
        const files = Object.keys(ctx.bundle ?? {})
        const rounded = files.filter((file) => ROUNDED_FONT.test(file))
        return (rounded.length ? rounded : files.filter((file) => INTER_FONT.test(file))).map((file) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `/${file}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head' as const,
        }))
      },
    },
  }
}

/** `@media (--compact)` and the other names in src/config/media.ts become
 *  their queries in every stylesheet, so CSS and TS share one definition
 *  (CSS has no cross-file custom media). Runs before Vite's CSS pipeline. */
function customMedia(): Plugin {
  const re = new RegExp(`@media \\((${Object.keys(CUSTOM_MEDIA).join('|')})\\)`, 'g')
  return {
    name: 'custom-media',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.css(\?|$)/.test(id)) return
      return { code: code.replace(re, (_m, name: string) => `@media ${CUSTOM_MEDIA[name]}`), map: null }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    customMedia(),
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
