import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Guarda o app no aparelho: abre mesmo sem internet depois do primeiro acesso.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg'],
      manifest: {
        name: 'Inventário Hora da Criança',
        short_name: 'Inventário HC',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f7f9',
        theme_color: '#1d4ed8',
        icons: [{ src: 'icone.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1200, // Firebase e ExcelJS são grandes; a exportação só carrega quando usada
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
});
