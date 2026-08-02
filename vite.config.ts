/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          /**
           * Split vendors by library so an app-code change doesn't invalidate
           * the whole bundle, and so routes that never touch the map or the
           * markdown renderer don't pay to download them.
           */
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'vendor-firebase';
            if (id.includes('/leaflet')) return 'vendor-maps';
            if (
              id.includes('/react-markdown/') ||
              id.includes('/remark') ||
              id.includes('/micromark') ||
              id.includes('/mdast') ||
              id.includes('/hast') ||
              id.includes('/unist')
            ) {
              return 'vendor-markdown';
            }
            if (id.includes('/motion') || id.includes('/framer-motion')) return 'vendor-motion';
            if (id.includes('/react-router')) return 'vendor-router';
            if (id.includes('/lucide-react/')) return 'vendor-icons';
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            return 'vendor';
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
