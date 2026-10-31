import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Override when the API is not on the default port (for example when a local
// server already owns 4000).
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
    root: '.',
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true,
            },
            '/share': {
                target: apiTarget,
                changeOrigin: true,
            },
        },
    },
});
