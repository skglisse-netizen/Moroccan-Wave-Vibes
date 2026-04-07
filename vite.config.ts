import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React — always needed, cached separately
            'vendor-react': ['react', 'react-dom'],
            // Animations — large library, rarely changes
            'vendor-motion': ['motion/react'],
            // Charts — heavy, only used in dashboard
            'vendor-charts': ['recharts'],
            // Maps — very heavy, only used in spots/admin
            'vendor-maps': ['leaflet', 'react-leaflet'],
            // Date utilities
            'vendor-dates': ['date-fns'],
            // Icons
            'vendor-icons': ['lucide-react'],
          },
        },
      },
      // Raise the warning limit since we are now splitting properly
      chunkSizeWarningLimit: 600,
    },
  };
});
