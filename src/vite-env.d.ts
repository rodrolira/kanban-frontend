/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_SOCKET_URL: string;
    // Añade más variables de entorno aquí si las tienes
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }