import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // Use the DOM implementation; Vite's dev optimizer otherwise follows the native SVG entry.
  resolve: { alias: { 'react-native-svg': fileURLToPath(new URL('./node_modules/react-native-svg/lib/module/elements.web.js', import.meta.url)), 'react-native': 'react-native-web' }, extensions: ['.web.tsx', '.tsx', '.ts', '.web.js', '.js', '.json'] },
  define: { __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'), 'process.env.EXPO_OS': JSON.stringify('web') },
  build: { outDir: 'dist' },
});
