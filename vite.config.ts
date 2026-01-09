import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-files',
      closeBundle() {
        // Copy icons
        mkdirSync('dist/icons', { recursive: true });
        copyFileSync('src/assets/icons/icon16.png', 'dist/icons/icon16.png');
        copyFileSync('src/assets/icons/icon32.png', 'dist/icons/icon32.png');
        copyFileSync('src/assets/icons/icon48.png', 'dist/icons/icon48.png');
        copyFileSync('src/assets/icons/icon128.png', 'dist/icons/icon128.png');

        // Copy background.js
        copyFileSync('public/background.js', 'dist/background.js');

        // Copy manifest.json
        copyFileSync('public/manifest.json', 'dist/manifest.json');
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
