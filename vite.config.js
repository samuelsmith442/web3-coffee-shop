import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: false, // Don't empty the output directory to preserve Tailwind CSS
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
});
