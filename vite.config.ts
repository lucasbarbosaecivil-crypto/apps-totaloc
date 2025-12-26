import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || ''),
        'import.meta.env.VITE_ALLOWED_EMAILS': JSON.stringify(env.VITE_ALLOWED_EMAILS || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Permitir importar JSON
      assetsInclude: ['**/*.json'],
      // Excluir bibliotecas Node.js do bundle do browser
      optimizeDeps: {
        exclude: ['google-auth-library', 'googleapis'],
      },
      build: {
        rollupOptions: {
          external: ['google-auth-library', 'googleapis'],
        },
      },
    };
});
