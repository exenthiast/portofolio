import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { seoPlugin } from './scripts/seo-plugin.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Mirror the vercel.json rewrite locally: /admin/* → admin.html (dev + preview). */
function adminRewrite(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url && /^\/admin(\/|$|\?)/.test(req.url) && !req.url.startsWith('/admin.html')) req.url = '/admin.html'
    next()
  }
  return {
    name: 'admin-rewrite',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [adminRewrite(), react(), tailwindcss(), seoPlugin(__dirname)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      // Two independent apps: the static public portfolio and the admin dashboard.
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html'),
      },
    },
  },
})
