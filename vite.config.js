import react from '@vitejs/plugin-react'
import { defineConfig,loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'VITE_')
  return {plugins:[react()],server:{port:5173,strictPort:true,proxy:{'/api':{target:env.VITE_BACKEND_PROXY_TARGET||'https://dev-api.loanrun.shop',changeOrigin:true}}}}
})
