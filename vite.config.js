import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    publicDir: 'archives',
    build: {
        assetsInlineLimit: 0,
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    }
})