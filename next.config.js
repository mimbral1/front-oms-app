/** @type {import('next').NextConfig} */

// Para GitHub Pages la app se sirve bajo un subpath (p.ej. /front-oms-app).
// Se activa solo cuando PAGES_BASE_PATH está seteado (en el workflow de Pages);
// para el build de iOS/Capacitor queda vacío y la app se sirve en la raíz.
const pagesBasePath = process.env.PAGES_BASE_PATH || "";

const nextConfig = {
  // App empaquetada para iOS (App Store) vía Capacitor.
  // Static export: genera HTML/JS estáticos en ./out que Capacitor sirve dentro
  // del WebView nativo (capacitor://localhost). No hay servidor Node en runtime.
  output: "export",

  ...(pagesBasePath
    ? { basePath: pagesBasePath, assetPrefix: pagesBasePath }
    : {}),

  // El optimizador de imágenes de Next requiere servidor; en export se desactiva.
  images: { unoptimized: true },

  // Cada ruta se emite como carpeta/index.html -> compatible con el file server del WebView.
  trailingSlash: true,

  // Transpila three.js para el visor 3D de carga (ESM con submódulos jsm).
  transpilePackages: ["three"],

  // El build de la app no debe fallar por lint/types; eso se valida en CI aparte.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  webpack(config) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules[\\/]handlebars[\\/]lib[\\/]index\.js/,
        message: /require\.extensions is not supported by webpack/,
      },
    ];

    return config;
  },
  // NOTA: `rewrites()` no se soporta con output: "export". El alias
  // /almacen/gestion/ordenes-compra -> /almacen/gestion/movimientos-mercaderia
  // debe resolverse en el cliente (navegación) si se necesita.
};

module.exports = nextConfig;
