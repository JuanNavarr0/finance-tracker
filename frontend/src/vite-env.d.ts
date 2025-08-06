cat > src/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_DEFAULT_CURRENCY: string
  readonly VITE_CURRENCY_SYMBOL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
EOF