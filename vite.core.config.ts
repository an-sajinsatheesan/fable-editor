import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/core/index.ts'),
      name: 'FableEditorCore',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
      formats: ['es', 'cjs']
    },
    outDir: 'dist/core',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'editor.css';
          return assetInfo.name || 'assets/[name][extname]';
        }
      }
    }
  },
  plugins: [
    dts({
      entryRoot: 'src/core',
      outDir: 'dist/core'
    })
  ]
});
