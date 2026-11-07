import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Guarda o app no aparelho: abre mesmo sem internet depois do primeiro acesso.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg', 'logo-hc.png'],
      manifest: {
        name: 'Inventário Hora da Criança',
        short_name: 'Inventário HC',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0a0a0a',
        icons: [{ src: 'icone.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // Fontes: só os subconjuntos latinos (português), para funcionar offline.
        globPatterns: ['**/*.{js,css,html,svg,png}', '**/*latin*.woff2'],
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
