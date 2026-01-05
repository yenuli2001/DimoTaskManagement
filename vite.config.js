import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom')
    }
  },
  server: {
    host: '0.0.0.0',  // Add this to allow network access
    port: 5173,        // Add this to specify port
    hmr: {
      overlay: true
    }
  }
})
