import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(), 
    nodePolyfills(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SecureTransac - Blockchain Trust Network',
        short_name: 'SecureTransac',
        description: 'Decentralized trust scoring and reputation system for Ethereum',
        theme_color: '#0891b2',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: false,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.ipfs\..*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ipfs-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module'
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Shared crypto primitives — bn.js, elliptic, brorand, hash.js all depend on each other
          if (id.includes('node_modules/bn.js') || id.includes('node_modules/bnjs') ||
              id.includes('node_modules/elliptic') || id.includes('node_modules/brorand') ||
              id.includes('node_modules/hash.js')) {
            return 'crypto-shared';
          }
          // web3.js standalone — huge but only needed for on-chain tx pages
          if (id.includes('node_modules/web3') || id.includes('node_modules/@ethereumjs')) {
            return 'web3-lib';
          }
          // wagmi + walletconnect + web3modal — wallet connection stack
          if (id.includes('node_modules/@wagmi') || id.includes('node_modules/wagmi') ||
              id.includes('node_modules/@web3modal') || id.includes('node_modules/@walletconnect') ||
              id.includes('node_modules/@reown')) {
            return 'wallet-sdk';
          }
          // ZK proof libs — only snarkjs + eth-crypto (elliptic handled by crypto-shared)
          if (id.includes('node_modules/snarkjs') || id.includes('node_modules/eth-crypto')) {
            return 'zk-crypto';
          }
          // PDF generation — only for reports
          if (id.includes('node_modules/jspdf')) {
            return 'pdf-libs';
          }
          // React core
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-core';
          }
          // React router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'react-router';
          }
          // tanstack react-query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          // socket.io
          if (id.includes('node_modules/socket.io') || id.includes('node_modules/engine.io')) {
            return 'socket-io';
          }
          // viem (tree-shakeable but still large)
          if (id.includes('node_modules/viem')) {
            return 'viem-lib';
          }
        }
      }
    }
  },
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      '@': '/src',
    },
  },
  base: './', // Essential for IPFS/Relative path deployment
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
})

