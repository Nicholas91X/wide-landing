import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '127.0.0.1',
        port: 3000,
        open: true,
    },
    build: {
        // Split vendor libraries into separate cached chunks
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-gsap': ['gsap', 'gsap/ScrollTrigger'],
                },
            },
        },
    },
});
