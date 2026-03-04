/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt', // Alertar UX para versão offline / update
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'CondoVote',
          short_name: 'CondoVote',
          description: 'Plataforma Inteligente para Assembleias e Decisões de Condomínios',
          theme_color: '#0f172a', /* slate-900 */
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: '/pwa-192x192.png',   // ← PNG: aceito como maskable pelo Chrome/Android
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'  // ← habilita ícone adaptativo no Android
            }
          ]
        },
        workbox: {
          navigateFallbackDenylist: [/^\/admin/, /^\/super/],
        }
      }),
      // Sentry: upload de source maps apenas quando SENTRY_AUTH_TOKEN está definido (CI/CD)
      ...(env.SENTRY_AUTH_TOKEN ? [sentryVitePlugin({
        org: 'versix-solutions',
        project: 'condovote',
        authToken: env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.js.map'],
        },
      })] : []),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      exclude: ['node_modules', 'e2e/**'],

      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        thresholds: {
          lines: 30,
          functions: 30,
          branches: 25,
        },
        exclude: [
          'src/vite-env.d.ts',
          '**/*.config.*',
          '**/index.ts',
          'src/setupTests.ts',
        ],
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: true,        // Necessário para Sentry mapear erros ao código original
      chunkSizeWarningLimit: 1200,
      minify: 'terser',           // habilita terser para drop_console
      terserOptions: {
        compress: {
          drop_console: true,     // remove todos os console.* em produção
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'chart-vendor': ['recharts'],
            'ui-vendor': ['lucide-react', 'motion']
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
