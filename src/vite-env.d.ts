/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APPS_SCRIPT_URL: string;
  readonly VITE_USE_API: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_ROUTER_MODE?: 'hash' | 'browser';
  readonly VITE_DATA_PROVIDER?: 'firebase' | 'srs_api';
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  readonly VITE_LOGIN_BG_URL?: string;
  readonly VITE_PLANTILLA_ANEXO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
