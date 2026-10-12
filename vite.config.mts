import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { 'react-native': 'react-native-web' }, extensions: ['.web.tsx', '.tsx', '.ts', '.web.js', '.js', '.json'] },
  define: { __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'), 'process.env.EXPO_OS': JSON.stringify('web') },
  build: { outDir: 'dist' },
});
