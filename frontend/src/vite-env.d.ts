/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_API_SLOW_RESPONSE_THRESHOLD_MILLIS?: number
    readonly VITE_API_CACHE_IDENTICAL_REQUESTS_FOR_MILLIS?: number
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
