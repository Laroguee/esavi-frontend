import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Sistema de Notificación ESAVI - El Salvador',
        short_name: 'ESAVI',
        description: 'Herramienta de Notificación e Investigación de Eventos Atribuibles a Vacunación o Inmunización',
        theme_color: '#1976d2',
        background_color: '#f5f5f5',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024 // 6 MB para soportar bundle completo
      }
    })
  ],
  base: '/esavi-frontend/', 
})