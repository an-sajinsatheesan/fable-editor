import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/react/index.ts'),
      name: 'FableEditorReact',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
      formats: ['es', 'cjs']
    },
    outDir: 'dist/react',
    emptyOutDir: true,
    rollupOptions: {
      external: ['react', 'react-dom', '@wysiwyg-sa/fable-editor'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@wysiwyg-sa/fable-editor': 'FableEditorCore'
        }
      }
    }
  },
  plugins: [
    react(),
    dts({
      entryRoot: 'src/react',
      outDir: 'dist/react'
    })
  ]
});
