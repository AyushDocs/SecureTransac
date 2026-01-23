import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Essential for IPFS/Relative path deployment
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
