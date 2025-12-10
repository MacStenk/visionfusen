// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

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
        '@noble/hashes',
        '@noble/curves',
        '@scure/bip39',
        '@scure/base',
        'nostr-tools'
      ]
    },
    resolve: {
      alias: {
        // Map subpath imports to actual ESM files
        '@noble/hashes/sha256': '@noble/hashes/esm/sha256.js',
        '@noble/hashes/utils': '@noble/hashes/esm/utils.js',
        '@noble/hashes/hmac': '@noble/hashes/esm/hmac.js',
        '@noble/hashes/pbkdf2': '@noble/hashes/esm/pbkdf2.js',
        '@noble/curves/secp256k1': '@noble/curves/esm/secp256k1.js',
        '@scure/bip39/wordlists/english': '@scure/bip39/esm/wordlists/english.js',
      }
    },
    build: {
      target: 'esnext'
    }
  }
});
