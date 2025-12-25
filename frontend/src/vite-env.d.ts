/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_WS_RECONNECT_DELAY: string;
  readonly VITE_WS_MAX_RECONNECT_DELAY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
