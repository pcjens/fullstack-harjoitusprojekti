/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_API_SLOW_RESPONSE_THRESHOLD_MILLIS?: number
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
