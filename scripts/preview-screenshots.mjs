// Preview de pantallas en viewport de iPhone (Playwright + Chromium).
//
// Genera capturas en ./screenshots para revisar cómo se ve la app en móvil sin
// necesidad de macOS/Xcode. Levanta el dev server aparte (`npm run dev`) y luego:
//
//   node scripts/preview-screenshots.mjs
//
// Variables opcionales:
//   BASE_URL     (default http://localhost:3000)
//   CHROME_PATH  ruta a un Chromium específico; si no, usa el de Playwright
//                (instálalo con `npx playwright install chromium`).
//
// Nota: usa una sesión SIMULADA (cookie + localStorage) solo para previsualizar
// las pantallas internas; no reemplaza un login real ni trae datos de API.

import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const TOKEN = `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u({
  sub: "demo",
  email: "demo@mimbral.cl",
  exp: 9999999999,
})}.sig`;
const authState = {
  isAuthenticated: true,
  user: { id: "1", email: "demo@mimbral.cl", nombre: "Demo Mimbral", role: "admin" },
  token: TOKEN,
  expiraEn: 9999999999,
};

const iPhone = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

// [nombreArchivo, ruta]
const publicRoutes = [["01-login", "/login"]];
const authRoutes = [
  ["02-mimbral360", "/mimbral360"],
  ["03-pedidos-listado", "/pedidos/listado-pedidos"],
  ["04-pedidos-auditorias", "/pedidos/auditorias"],
  ["05-picking-rondas", "/picking/rondas"],
  ["06-delivery-transportistas", "/delivery/transportistas/listado-transportistas"],
  ["07-almacen-almacenes", "/almacen/almacenes"],
  ["08-catalogo-productos", "/catalogo/productos"],
];

const launchOpts = { args: ["--no-sandbox"] };
if (process.env.CHROME_PATH) launchOpts.executablePath = process.env.CHROME_PATH;

const browser = await chromium.launch(launchOpts);

async function shoot(ctx, name, path, waitMs = 6000) {
  const page = await ctx.newPage();
  page.on("pageerror", () => {});
  try {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(waitMs);
    // oculta el modal de aviso de sesión para capturas limpias
    await page
      .addStyleTag({ content: '[aria-modal][role="dialog"]{display:none!important}' })
      .catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshots/${name}.png` });
    console.log("OK   ", name, "->", path);
  } catch (e) {
    console.log("FAIL ", name, e.message.split("\n")[0]);
  } finally {
    await page.close();
  }
}

const guest = await browser.newContext(iPhone);
for (const [name, path] of publicRoutes) await shoot(guest, name, path, 4000);
await guest.close();

const ctx = await browser.newContext(iPhone);
await ctx.addCookies([{ name: "authToken", value: TOKEN, domain: "localhost", path: "/" }]);
await ctx.addInitScript((st) => {
  localStorage.setItem("authState", JSON.stringify(st));
}, authState);
for (const [name, path] of authRoutes) await shoot(ctx, name, path);
await ctx.close();

await browser.close();
console.log("DONE -> ./screenshots");
