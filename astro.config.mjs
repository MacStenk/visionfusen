// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import { fileURLToPath } from 'url';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  site: 'https://visionfusen.org',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'de',
        locales: {
          de: 'de-DE',
        },
      },
    }),
  ],
  
  vite: {
    ssr: {
      noExternal: [
        '@scure/bip39',
        '@scure/base',
        'nostr-tools'
      ]
    },
    optimizeDeps: {
      include: ['@scure/bip39']
    },
    build: {
      target: 'esnext'
    }
  }
});
