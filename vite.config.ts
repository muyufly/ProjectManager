import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://project.foofish.work',
        changeOrigin: true,

      },
      '/oss-proxy': {
        target: 'https://projectmgr.sgp1.digitaloceanspaces.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/oss-proxy/, '')
      },
      '/oss-cdn-proxy': {
        target: 'https://projectmgr.sgp1.cdn.digitaloceanspaces.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/oss-cdn-proxy/, '')
      }
    }
  }
});