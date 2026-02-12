import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Production build optimizations
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : []
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mapbox: ['mapbox-gl'],
            charts: ['recharts'],
            utils: ['axios', 'localforage'],
            ui: ['lucide-react']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false
    },


    // Development server configuration
    server: {
      port: 5173,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none'
      },
      // Proxy /api requests to serverless function handlers in development
      proxy: {
        '/api': {
          target: 'http://localhost:5173',
          changeOrigin: true,
          configure: (proxy, options) => {
            // Custom middleware to handle API routes locally
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // This will be intercepted by the middleware below
            });
          }
        }
      }
    },

    // Custom middleware to handle /api routes in development
    // Simulates Vercel serverless behavior locally
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          try {
            // Extract API path
            const apiPath = req.url.replace(/\?.*$/, ''); // Remove query params
            const handlerPath = path.join(__dirname, apiPath + '.js');

            // Import the serverless handler dynamically
            const handler = await import(handlerPath + '?t=' + Date.now());

            // Call the handler
            await handler.default(req, res);
          } catch (err) {
            console.error('API handler error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: 'API handler failed',
              details: err.message
            }));
          }
        } else {
          next();
        }
      });
    },

    // Resolve aliases for cleaner imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@hooks': path.resolve(__dirname, './src/hooks')
      }
    },

    // Define global constants
    define: {
      __APP_ENV__: JSON.stringify(env.NODE_ENV || 'development')
    },

    // Performance optimizations
    optimizeDeps: {
      include: ['react', 'react-dom', 'mapbox-gl'],
      exclude: ['@vitejs/plugin-react']
    },

    // Plugins - simplified for Vercel compatibility
    plugins: [
      react(),
      mode === 'analyze' && visualizer({
        filename: 'bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      }),
      mode === 'production' && viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        deleteOriginFile: false
      })
    ].filter(Boolean)
  }
})