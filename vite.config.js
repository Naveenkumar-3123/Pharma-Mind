import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api/groq': {
                target: 'https://api.groq.com/openai/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/groq/, ''),
                secure: true,
            },
            '/api/openrouter': {
                target: 'https://openrouter.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/openrouter/, '/api/v1'),
                secure: true,
            },
        },
    },
});
