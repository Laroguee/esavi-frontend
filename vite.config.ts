import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // AÑADE ESTA LÍNEA (Reemplaza 'nombre-de-tu-repo' por el nombre real en GitHub)
  base: '/esavi-frontend/', 
})