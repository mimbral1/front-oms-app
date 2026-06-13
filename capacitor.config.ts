import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cl.mimbral.oms",
  appName: "Mimbral 360",
  // Carpeta generada por `next build` (output: "export").
  webDir: "out",
  ios: {
    // Permite el WebView a pantalla completa respetando safe-area (notch).
    contentInset: "always",
  },
  server: {
    // Esquema del WebView local. Las llamadas a APIs externas (https) deben
    // estar permitidas vía ATS en Info.plist (ver IOS.md).
    iosScheme: "capacitor",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#2F2F2F",
      showSpinner: false,
    },
  },
};

export default config;
