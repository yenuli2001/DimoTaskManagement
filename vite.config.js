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
    hmr: {
      overlay: true
    },
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,      // Default Vite port (you can change this)
    strictPort: true, // Fail if port is already in use
  }
})

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
