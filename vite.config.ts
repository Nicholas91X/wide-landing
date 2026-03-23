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
        chunkSizeWarningLimit: 600,
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // React core — smallest possible first-paint bundle
                    if (id.indexOf('node_modules/react/') !== -1 || id.indexOf('node_modules/react-dom/') !== -1) {
                        return 'vendor-react';
                    }
                    // GSAP — heavy animation library, loaded after React
                    if (id.indexOf('node_modules/gsap') !== -1) {
                        return 'vendor-gsap';
                    }
                    // Cal.com embed — loaded only when Contatti section mounts
                    if (id.indexOf('node_modules/@calcom') !== -1) {
                        return 'vendor-calcom';
                    }
                    // Vercel analytics — tiny, but isolate for cache efficiency
                    if (id.indexOf('node_modules/@vercel/analytics') !== -1) {
                        return 'vendor-analytics';
                    }
                },
            },
        },
    },
});
