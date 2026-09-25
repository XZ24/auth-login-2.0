import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const defaultProxyTarget = 'http://localhost:3000'
  const edpProxyTarget = env.VITE_EDP_PROXY_TARGET || defaultProxyTarget
  // Use the included mock auth service locally; override for a real auth backend.
  const authProxyTarget = env.VITE_AUTH_PROXY_TARGET || defaultProxyTarget
  const useMockClaims = command === 'serve' && (
    env.VITE_USE_MOCK_CLAIMS === 'true' || (
      env.VITE_USE_MOCK_CLAIMS !== 'false' && !env.VITE_API_URL &&
      !existsSync('sources_2/claims_list.json')
    )
  )

  return {
    base: env.VITE_BASE_PATH || '/email-portal-feature/',
    plugins: [react()],
    define: { 'import.meta.env.VITE_USE_MOCK_CLAIMS': JSON.stringify(useMockClaims) },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react'],
    },
    server: {
      port: 4173,
      proxy: {
        '/claims': defaultProxyTarget,
        '/auth': authProxyTarget,
        '/edp-claims': edpProxyTarget,
        '/edp-claims-meta': edpProxyTarget,
        '/edp-pics': edpProxyTarget,
        '/edp-kpi': edpProxyTarget,
        '/claim-info-requests': edpProxyTarget,
        '/emails': edpProxyTarget,
      },
    },
  }
})
