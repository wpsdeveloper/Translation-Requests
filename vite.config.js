import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: '../../dist',
    emptyOutDir: false, // Don't clear dist so we don't delete server files,
    sourcemap: true
  },
  root: 'src/client',
  server: {
    sourcemapIgnoreList: false
  },
  test: {
    environment: 'jsdom',
    include: ['../test/**/*.{test,spec}.{js,ts}'],
  }
});