import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

/** Image imports (`?print`, `?collage`…) become a stub Picture / URL, so tests
 *  never run the imagetools pipeline (sharp, the paper bake). */
function stubImages(): Plugin {
  const IMAGE = /\.(png|jpe?g|webp|avif|gif)(\?.*)?$/
  return {
    name: 'stub-images',
    enforce: 'pre',
    resolveId: (id) => (IMAGE.test(id) ? `\0stub-image:${id}` : null),
    load: (id) =>
      id.startsWith('\0stub-image:')
        ? `export default { sources: { avif: '', webp: '' }, img: { src: 'stub.png', w: 100, h: 100 }, src: 'stub.png', toString() { return 'stub.png' } }`
        : null,
  }
}

// Pure modules run in node; a test that needs the DOM opts in with
// `// @vitest-environment happy-dom` on its first line.
export default defineConfig({
  plugins: [react(), stubImages()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    css: false,
    restoreMocks: true,
  },
})
