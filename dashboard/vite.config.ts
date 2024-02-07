import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './src/main.tsx',
        HomePage: './src/pages/HomePage.tsx', 
        SystemPage: './src/pages/SystemPage.tsx',
        ProcessPage: './src/pages/ProcessPage.tsx',
      }
    }
  }
});
