import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // This removes the [hash] from the filename
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
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