import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Wstawia do public/sw.js identyfikator builda oraz listę plików JS/CSS z assets/,
 * aby powłoka aplikacji działała offline także dla stron ładowanych leniwie.
 */
function serviceWorkerBuild(): Plugin {
  const assets: string[] = [];
  return {
    name: 'service-worker-build',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (/^assets\/.+\.(js|css)$/.test(fileName)) assets.push(fileName);
      }
    },
    closeBundle() {
      const file = path.resolve(__dirname, 'dist/sw.js');
      if (!fs.existsSync(file)) return;
      const source = fs
        .readFileSync(file, 'utf8')
        .replace('__BUILD_ID__', Date.now().toString(36))
        .replace('/*__PRECACHE__*/[]', JSON.stringify(assets));
      fs.writeFileSync(file, source);
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorkerBuild()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    rollupOptions: {
      output: {
        // Ciężkie biblioteki w osobnych paczkach, żeby nie obciążać pierwszego ładowania.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query', '@supabase/supabase-js'],
          charts: ['recharts'],
        },
      },
    },
  },
});
