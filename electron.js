/* const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const isDev = require("electron-is-dev");

console.log("isDev:", isDev);
console.log("CWD  :", process.cwd());

/* ─────────────  bloqueo de instancia única  ───────────── 
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let nextProcess = null;
const PORT = process.env.PORT || 3000;

/* ───────────────────  Ventana  ─────────────────── 
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = `http://localhost:${PORT}`;
  mainWindow.loadURL(url);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/* ───────────  Arranque del servidor Next  ─────────── 
function startNextServer() {
  return new Promise((resolve, reject) => {
    let nextJs;
    try {
      nextJs = require.resolve("next/dist/bin/next");
      if (nextJs.includes("app.asar"))
        nextJs = nextJs.replace("app.asar", "app.asar.unpacked");
    } catch {
      return reject(new Error("No se encontró next/dist/bin/next"));
    }

    /*  ⚠ï¸‍  Usamos 'node' en lugar de process.execPath  
    console.log("Ejecutando: node", nextJs, "start");
    nextProcess = spawn("node", [nextJs, "start"], {
      cwd: process.cwd(),
      env: process.env,
      shell: true, // para que Windows resuelva 'node'
      stdio: "pipe",
    });

    let ready = false;

    nextProcess.stdout.on("data", (d) => {
      const out = d.toString();
      if (
        !ready &&
        (out.toLowerCase().includes("ready on http://") ||
          out.toLowerCase().includes("started server on"))
      ) {
        ready = true;
        resolve();
      }
    });

    nextProcess.stderr.on("data", (d) =>
      console.error("Next stderr:", d.toString().trim())
    );

    nextProcess.on("error", reject);

    nextProcess.on("exit", (code) => {
      if (!ready) reject(new Error("Next salió con código " + code));
    });

    /* fallback opcional de 30 s 
    setTimeout(() => !ready && resolve(), 30_000);
  });
}

/* ────────────  Ciclo de vida  ──────────── 
app.on("ready", () => {
  if (isDev) {
    createWindow();
  } else {
    startNextServer()
      .then(() => createWindow())
      .catch((err) => {
        console.error("No se pudo iniciar Next:", err.message);
        app.quit();
      });
  }
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextProcess) nextProcess.kill();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
 */

// electron.js

const { app, BrowserWindow } = require("electron");
const { startServer } = require("next/dist/server/lib/start-server");
const net = require("net");
const path = require("path");
const isDev = require("electron-is-dev");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  let url;

  if (isDev) {
    url = "http://localhost:3000";
  } else {
    const dir = app.getAppPath();
    const port = await getFreePort();
    console.log("Puerto asignado:", port);

    await startServer({
      dir,
      port,
      hostname: "localhost",
      dev: false,
      minimalMode: false,
      allowRetry: false,
    });

    url = `http://localhost:${port}`;
  }

  await win.loadURL(url);
  win.show();

  win.webContents.on("did-fail-load", (_e, ec, ed) =>
    console.error("Fallo de carga:", ec, ed)
  );
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
process.on("unhandledRejection", (r) => console.error(r));

/* 
const { app, BrowserWindow } = require("electron");
const { startServer } = require("next/dist/server/lib/start-server");
const net = require("net");
const path = require("path");
const isDev = require("electron-is-dev");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const { port } = srv.address();
      console.log("[getFreePort] servidor escuchando en puerto:", port);
      srv.close(() => resolve(port));
    });
    srv.on("error", (err) => {
      console.error("[getFreePort] error al buscar puerto libre:", err);
      reject(err);
    });
  });
}

async function createWindow() {
  console.log("[createWindow] creando ventana principal...");
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  let url;

  try {
    if (isDev) {
      url = "http://localhost:3000";
      console.log("[createWindow] Modo desarrollo, URL:", url);
    } else {
      console.log(
        "[createWindow] Modo producción, preparando Next.js embebido..."
      );
      const dir = app.getAppPath();
      console.log("[createWindow] ruta de la app:", dir);

      const port = await getFreePort();
      console.log("[createWindow] puerto dinámico asignado:", port);

      console.log("[createWindow] arrancando servidor Next.js...");
      await startServer({
        dir,
        port,
        hostname: "localhost",
        dev: false,
        minimalMode: false,
        allowRetry: false,
      });
      console.log("[createWindow] servidor Next.js iniciado correctamente.");

      url = `http://localhost:${port}`;
    }

    console.log("[createWindow] cargando URL en ventana:", url);
    await win.loadURL(url);
    win.show();
    console.log("[createWindow] ventana mostrada con éxito.");
  } catch (err) {
    console.error(
      "[createWindow] ERROR en la inicialización de la ventana:",
      err
    );
  }

  win.webContents.on(
    "did-fail-load",
    (_e, errorCode, errorDescription, validatedURL) => {
      console.error(
        "[did-fail-load] No se pudo cargar la URL:",
        validatedURL,
        "Code:",
        errorCode,
        "Descripción:",
        errorDescription
      );
    }
  );

  win.webContents.on("crashed", () => {
    console.error("[webContents] ¡La ventana se ha bloqueado!");
  });

  win.on("unresponsive", () => {
    console.warn("[BrowserWindow] la ventana está sin responder.");
  });
}

app
  .whenReady()
  .then(() => {
    console.log("[app] Electron listo, llamando a createWindow()");
    return createWindow();
  })
  .catch((err) => {
    console.error("[app] falló app.whenReady():", err);
  });

app.on("window-all-closed", () => {
  console.log("[app] todas las ventanas cerradas.");
  if (process.platform !== "darwin") {
    console.log("[app] cerrando la app (no macOS).");
    app.quit();
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "[unhandledRejection] Promesa rechazada:",
    promise,
    "Razón:",
    reason
  );
});

// electron.js

/* 
const { app, BrowserWindow } = require("electron");
const next = require("next");
const http = require("http");
const net = require("net");
const path = require("path");
const isDev = require("electron-is-dev");

// 1) Consigue un puerto libre
async function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

// 2) Prepara y levanta Next en tu build .next
async function startNextServer(dir) {
  const port = await getFreePort();
  const nextApp = next({ dev: false, dir });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();
  http.createServer((req, res) => handle(req, res)).listen(port, "localhost");

  console.log(`[Next] Server listening on http://localhost:${port}`);
  return port;
}

// 3) Crea la ventana y carga la URL correspondiente
async function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  let url;
  if (isDev) {
    // En desarrollo usamos next dev
    url = "http://localhost:3000";
    console.log("[createWindow] DEV mode →", url);
  } else {
    // En producción arrancamos el servidor Next desde .next
    const buildDir = path.join(app.getAppPath(), ".next");
    console.log("[createWindow] Production buildDir →", buildDir);
    const port = await startNextServer(buildDir);
    url = `http://localhost:${port}`;
  }

  await win.loadURL(url);
  win.show();

  win.webContents.on("did-fail-load", (_e, code, desc, u) =>
    console.error(`[did-fail-load] ${u} → ${code}: ${desc}`)
  );
  win.webContents.on("crashed", () =>
    console.error("[webContents] The window has crashed")
  );
  win.on("unresponsive", () =>
    console.warn("[BrowserWindow] The window is unresponsive")
  );
}

app
  .whenReady()
  .then(createWindow)
  .catch((err) => console.error("[app] Error on ready():", err));

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

process.on("unhandledRejection", (reason, promise) =>
  console.error("[unhandledRejection]", promise, "Reason:", reason)
);
 */
