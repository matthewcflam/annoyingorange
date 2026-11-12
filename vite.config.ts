import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { imagetools } from 'vite-imagetools'

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
      defaultDirectives: (url) => {
        for (const [name, directives] of Object.entries(PRESETS)) {
          if (url.searchParams.has(name)) return new URLSearchParams(directives)
        }
        return new URLSearchParams()
      },
    }),
  ],
})
