import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/', // Project root
  publicDir: '../public/', // Directory for static files
  base: './',
  server: {
    port: 3000, // Development server port
    proxy: {
      '/api': 'http://localhost:3000', // Proxy requests to your backend
    },
  },
  build: {
    outDir: 'dist', // Output directory for production build
  },
});
