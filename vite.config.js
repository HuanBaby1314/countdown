import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import copy from 'rollup-plugin-copy'
const outputDir = 'countdown'
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    copy({
      targets: [
        { src: 'manifest.json', dest: outputDir },
        { src: 'src/images/*', dest: `${outputDir}/images` },
        { src: 'src/fonts/*', dest: `${outputDir}/fonts` },
        { src: 'src/js/background.js', dest: `${outputDir}/js` }
      ],
      hook: 'writeBundle'
    })
  ],
  build: {
    outDir: outputDir,
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 9000
  }
})
