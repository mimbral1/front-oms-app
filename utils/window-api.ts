// src/utils/window-api.ts
export type WindowAPI = {
  minimize(): void;
  maximize(): void;
  close(): void;
};

/* -----------------------------------------------------------
Augmentamos la interfaz Window SOLO para el proyecto.
Al haber ya un "export" arriba, este archivo es un módulo;
la declaración global no contamina el scope de otros módulos.
----------------------------------------------------------- */
declare global {
  interface Window {
    windowAPI: WindowAPI;
  }
}

/* atajo tipado para no castear en cada componente */
const windowAPI =
  typeof window !== "undefined" && window.windowAPI
    ? window.windowAPI
    : {
        minimize: () => {},
        maximize: () => {},
        close: () => {},
      };

export default windowAPI;
