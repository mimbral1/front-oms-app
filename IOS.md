# front-oms-app — Build para App Store (iOS)

Esta app es la versión **iOS / App Store** de `FrontOmsMimbral`. Reutiliza el
mismo código Next.js (TypeScript + Tailwind + MUI + Zustand) pero se empaqueta
como app nativa con **Capacitor** a partir de un **static export** de Next.

```
Next.js (output: "export")  ->  ./out (HTML/JS estáticos)  ->  Capacitor  ->  Xcode  ->  App Store
```

## Requisitos

- **macOS** con **Xcode** (15+) y línea de comandos (`xcode-select --install`).
- **CocoaPods** (`sudo gem install cocoapods`).
- Node 18+ y npm.
- Cuenta de **Apple Developer** (para firmar y subir a App Store Connect).

> El proyecto nativo `ios/` se genera en macOS con `npx cap add ios`. No se
> versiona desde Linux/CI porque requiere las herramientas de Apple.

## Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Generar el export estático (crea ./out)
npm run build:app

# 3. Crear el proyecto nativo iOS (solo la primera vez, en macOS)
npx cap add ios

# 4. Copiar el build y sincronizar plugins nativos
npx cap sync ios

# 5. Abrir en Xcode para firmar y archivar
npx cap open ios
```

Atajo (pasos 2, 4 y 5): `npm run ios`.

En Xcode: seleccionar el *Team* de firma, ajustar *Bundle Identifier*
(`cl.mimbral.oms`, configurable en `capacitor.config.ts`), luego
**Product ▸ Archive ▸ Distribute App ▸ App Store Connect**.

## Configuración

- **App ID / nombre**: `capacitor.config.ts` (`appId`, `appName`).
- **Carpeta web**: `webDir: "out"` (salida de `next build`).
- **Variables de entorno**: ver `.env.example`. Como es export estático, las
  `NEXT_PUBLIC_*` se **incrustan en build time**; hay que rebuildear (`npm run
  build:app && npx cap sync ios`) cada vez que cambien.

## Notas de arquitectura (diferencias vs. la versión de escritorio)

Estas adaptaciones fueron necesarias para que la app funcione sin servidor Node
dentro del WebView nativo:

1. **`output: "export"`** en `next.config.js` (+ `images.unoptimized`,
   `trailingSlash`). El `rewrites()` no se soporta en export y se removió.

2. **Sin middleware**. `middleware.ts` (guard de auth por cookie) se eliminó; la
   protección de rutas ahora vive en cliente, en
   `components/layout/authenticated-layout.tsx` (sin sesión → `/login`; con
   sesión en `/login` o `/` → `/mimbral360`).

3. **Rutas API proxy migradas**. Los route handlers `app/api/delivery/*` (que
   proxeaban al backend) no existen en export. Las llamadas ahora van directo al
   backend vía `lib/delivery-api.ts` (`DELIVERY_API_BASE`, `PACKAGE_TYPES_URL`,
   `WAREHOUSE_API_BASE`), leyendo las bases desde el entorno.

4. **Rutas dinámicas `[id]` como SPA**. Las 119 rutas dinámicas exportan
   `generateStaticParams()` devolviendo `[]`: no se pre-generan páginas por id;
   el detalle se resuelve en cliente al navegar (las vistas ya leen el id con
   `useParams`). Una carga *en frío* de una URL `/pedidos/123` no tiene HTML
   propio — dentro de la app siempre se navega desde una pantalla raíz.

5. **ATS (App Transport Security)**. La App Store exige **HTTPS**. Si algún
   backend apunta a `http://` o a una IP de LAN (p. ej. el endpoint de
   warehouse), iOS bloqueará la petición salvo que se agregue una excepción ATS
   en `ios/App/App/Info.plist`. Lo recomendado es exponer todos los backends por
   HTTPS antes de publicar.

## Limitaciones conocidas / TODO

- Generar `ios/` y validar el archivado/firma en macOS (no se puede desde
  Linux/CI).
- Confirmar que todas las bases de API estén en HTTPS (ATS).
- Iconos y splash: agregar assets en Xcode o con `@capacitor/assets`.
