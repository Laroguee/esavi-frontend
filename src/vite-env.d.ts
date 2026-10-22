/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APPS_SCRIPT_URL: string;
  readonly VITE_USE_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
