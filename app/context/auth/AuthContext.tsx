// app\context\auth\AuthContext.tsx

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { fetchWithAuthToken } from "@/lib/http/client";

const PLATFORM_ID = 1;

// Preview de solo lectura (GitHub Pages sin backend): permite entrar sin login.
// NO se activa en el build de iOS/Capacitor (la env queda sin definir).
const PREVIEW_BYPASS_AUTH = process.env.NEXT_PUBLIC_PREVIEW_BYPASS_AUTH === "1";
const PREVIEW_DEMO_TOKEN =
  "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZW1vIiwiZW1haWwiOiJkZW1vQG1pbWJyYWwuY2wiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.";

export type Role = "admin" | "manager" | "user";

// --- Helpers JWT/tiempo (compatibles con lo de SessionTimeoutModal) ---
const decodeExpFromJWT = (token: string): number => {
  try {
    const part = token.split(".")[1];
    if (!part) return 0;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    return Number(payload?.exp) || 0; // exp en segundos UNIX
  } catch {
    return 0;
  }
};

const toEpochSeconds = (value?: number | null): number => {
  if (value == null || isNaN(Number(value))) return 0;
  const v = Number(value);
  if (v > 1e12) return Math.floor(v / 1000);     // epoch ms -> seg
  if (v > 1e9) return Math.floor(v);            // epoch seg
  return Math.floor(Date.now() / 1000) + Math.floor(v); // duración -> now + v
};

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  avatarUrl?: string | null;
  role: Role;
}

const normalizeAvatarUrl = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const findAvatarFromUsersPayload = (payload: any, email: string): string | null => {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const targetEmail = String(email || "").trim().toLowerCase();

  const exact = rows.find((row: any) => String(row?.EMAIL || "").trim().toLowerCase() === targetEmail);
  if (exact) return normalizeAvatarUrl(exact?.IMAGEN);

  return normalizeAvatarUrl(rows[0]?.IMAGEN);
};

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  // expiraEn: Epoch (segundos)
  expiraEn: number | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string, force?: boolean) => Promise<void>;
  logout: () => void;
  // Renovación con contraseña (sigue disponible si la usas en otra parte)
  renewSession: (password: string) => Promise<void>;
  // aplicar token/expiraEn renovados (lo usará el modal)
  applyRenewedSession: (newToken: string, newExpiraEn: number) => void;

  isAdmin: boolean;
  hasRole: (roles: Role[]) => boolean;
  showSessionModal: boolean;
  setShowSessionModal: (show: boolean) => void;
  forceReLoginWithPassword: (password: string) => Promise<void>;
  secondsLeft: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const fetchAvatarFromUsersEndpoint = useCallback(async (token: string, email: string) => {
    if (!token || !email) return null;

    try {
      const q = new URLSearchParams();
      q.set("page", "1");
      q.set("pageSize", "20");
      q.set("email", email);

      const resp = await fetchWithAuthToken<any>(
        token,
        `idservice/usuarios?${q.toString()}`,
        { method: "GET" }
      );

      return findAvatarFromUsersPayload(resp, email);
    } catch {
      return null;
    }
  }, []);

  // helper: convierte duración (ej. 3600) a epoch; si ya viene epoch "grande", lo respeta
  const normalizeExpira = (value: number) =>
    value > 10_000_000_000 ? value : Math.floor(Date.now() / 1000) + Number(value || 0);

  // helper: decodifica exp (segundos UNIX) del JWT si está disponible
  const decodeExp = (t: string): number => {
    try {
      const b64 = t.split(".")[1];
      const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      const payload = JSON.parse(atob(padded));
      return Number(payload?.exp) || 0;
    } catch {
      return 0;
    }
  };

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    expiraEn: null,
  });

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // --- TIMER del aviso de sesión (modal) ---
  const warnTimerRef = useRef<number | null>(null);
  // minutos antes del vencimiento para mostrar el modal de renovación
  const SESSION_WARNING_MINUTES = 10; // <--- si quieres 30, sólo cambia este número
  const SESSION_WARNING_SECONDS = SESSION_WARNING_MINUTES * 60;

  // Programa la apertura del modal según los segundos restantes (s0)
  const scheduleSessionWarning = useCallback((s0: number) => {
    // limpia cualquier timer previo
    if (warnTimerRef.current) {
      window.clearTimeout(warnTimerRef.current);
      warnTimerRef.current = null;
    }

    if (s0 <= 0) {
      setShowSessionModal(true);
      return;
    }
    if (s0 <= SESSION_WARNING_SECONDS) {
      setShowSessionModal(true);
      return;
    }

    // programa el aviso para cuando falten SESSION_WARNING_MINUTES (usa ms)
    const fireInMs = Math.max(0, (s0 - SESSION_WARNING_SECONDS) * 1000);
    warnTimerRef.current = window.setTimeout(() => {
      setShowSessionModal(true);
    }, fireInMs);
  }, [setShowSessionModal]);

  // clave de LS heredada a eliminar
  const LEGACY_LS_TOKEN_KEY = "token";

  // fuente única de token (authState -> LS.authState -> cookie)
  const getCurrentToken = (): string => {
    const fromState = authState?.token || "";
    if (fromState) return fromState;
    try {
      const ls = JSON.parse(localStorage.getItem("authState") || "{}");
      if (ls?.token) return String(ls.token);
    } catch { }
    const fromCookie = document.cookie.split("; ").find(c => c.startsWith("authToken="))?.split("=")[1] ?? "";
    return fromCookie || "";
  };

  // Inicializa desde cookie primero (servidor/cliente)
  useEffect(() => {
    // Modo preview (GitHub Pages sin backend): auto-autentica una sesión demo
    // para poder navegar la app sin login. Se activa solo con la env de preview;
    // el build real de iOS/Capacitor no la define.
    if (PREVIEW_BYPASS_AUTH) {
      setAuthState((s) =>
        s.isAuthenticated
          ? s
          : {
              isAuthenticated: true,
              user: {
                id: "demo",
                email: "demo@mimbral.cl",
                nombre: "Demo Mimbral",
                avatarUrl: null,
                role: "admin",
              },
              token: PREVIEW_DEMO_TOKEN,
              expiraEn: 9999999999,
            }
      );
      return;
    }

    // purga del key legado si existiera
    try { localStorage.removeItem(LEGACY_LS_TOKEN_KEY); } catch { }

    const tokenFromCookie = Cookies.get("authToken");
    if (tokenFromCookie) {
      const saved = typeof window !== 'undefined' ? localStorage.getItem("authState") : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isAuthenticated) {
            setAuthState(parsed);
          }
        } catch { }
      }
    }

    // si hay cookie pero no había authState en LS, hidratar mínimamente
    if (!localStorage.getItem("authState")) {
      const t = Cookies.get("authToken");
      if (t) {
        setAuthState(s => ({
          ...s,
          isAuthenticated: true,
          token: t,
          expiraEn: decodeExpFromJWT(t) || s.expiraEn,
        }));
      }
    }
  }, []);

  // Sincroniza con storage y cookie
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      localStorage.setItem("authState", JSON.stringify(authState));
      Cookies.set("authToken", authState.token, {
        path: "/",
        sameSite: "strict",
      });
      try { localStorage.removeItem(LEGACY_LS_TOKEN_KEY); } catch { }
    } else {
      localStorage.removeItem("authState");
      Cookies.remove("authToken", { path: "/" });
      try { localStorage.removeItem(LEGACY_LS_TOKEN_KEY); } catch { }
    }
  }, [authState]);

  // Modal de renovación (10 minutos antes) + apertura instantánea al expirar
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    // Decodifica exp (segundos UNIX) desde un JWT
    const decodeExpLocal = (t: string): number => {
      try {
        const b64 = t.split(".")[1];
        const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const payload = JSON.parse(atob(padded));
        return Number(payload?.exp) || 0;
      } catch {
        return 0;
      }
    };

    // Segundos restantes: usa expiraEn si existe; si no, decodifica el token.
    const getSecondsLeft = (): number => {
      const now = Math.floor(Date.now() / 1000);
      if (authState?.expiraEn) return Math.max(0, authState.expiraEn - now);

      // usar la fuente única de token y no el key legado
      const token = getCurrentToken();
      if (!token) return 0;
      const exp = decodeExpLocal(token);
      return Math.max(0, exp - now);
    };

    let warnTimeout: ReturnType<typeof setTimeout> | null = null;
    let expireInterval: ReturnType<typeof setInterval> | null = null;

    const s0 = getSecondsLeft();

    // Abre/Programa el modal usando el helper centralizado
    scheduleSessionWarning(s0);

    // Apertura instantánea cuando llega a 0 (sin depender de un 401)
    expireInterval = setInterval(() => {
      const s = getSecondsLeft();

      if (s <= 0) {
        if (expireInterval) {
          clearInterval(expireInterval);
        }

        // Cerramos sesión automáticamente cuando se acaba el tiempo,
        // equivalente a pulsar el botón "Cerrar sesión"
        logout();

        // opcional: si quieres asegurarte de que el modal no quede abierto
        setShowSessionModal(false);
      }
    }, 1000);

    return () => {
      if (warnTimerRef.current) {
        window.clearTimeout(warnTimerRef.current);
        warnTimerRef.current = null;
      }
      if (expireInterval) clearInterval(expireInterval);
    };

    // importante: depender también de token para que el efecto se reprograme tras login/renovación
  }, [authState.isAuthenticated, authState.expiraEn, authState.token]);

  // DEBUG: muestra en consola cuánto queda de sesión (cada segundo)
  useEffect(() => {
    const getSecondsLeft = (): number => {
      try {
        // console.log("authState?.expiraEn: ", authState?.expiraEn)
        if (authState?.expiraEn) {
          return Math.max(0, Math.floor((authState.expiraEn * 1000 - Date.now()) / 1000));
        }
        // usar única fuente de token (sin key legado)
        const token = getCurrentToken();
        if (!token) return 0;

        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const payload = JSON.parse(atob(padded));
        const exp = Number(payload?.exp) || 0; // exp en segundos
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, exp - now);
      } catch {
        return 0;
      }
    };

    const log = () => {
      const s = getSecondsLeft();
      setSecondsLeft((prev) => (prev === s ? prev : s));
      const hh = String(Math.floor(s / 3600)).padStart(2, "0");
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
       
      // console.log(`[Sesión] Restante: ${hh}:${mm}:${ss} (${s}s) | isAuth=${authState?.isAuthenticated ? "sí" : "no"}`);
    };

    log();
    const id = setInterval(log, 1000);
    return () => clearInterval(id);
  }, [authState?.isAuthenticated, authState?.expiraEn, authState?.token]);

  // Escuchar expiración real (401) desde el fetch centralizado
  useEffect(() => {
    const onExpired = () => setShowSessionModal(true);
    window.addEventListener("auth:expired", onExpired as EventListener);
    return () => window.removeEventListener("auth:expired", onExpired as EventListener);
  }, []);

  // DEBUG: muestra en consola cuánto falta para que expire la sesión (mm:ss) en tiempo real
  // useEffect(() => {
  //   // si no hay sesión autenticada, no hacemos nada
  //   if (!authState.isAuthenticated) return;

  //   const getSecondsLeft = (): number => {
  //     try {
  //       const now = Math.floor(Date.now() / 1000);

  //       // 1) Si tenemos expiraEn en el estado, usamos eso
  //       if (authState?.expiraEn) {
  //         return Math.max(0, authState.expiraEn - now);
  //       }

  //       // 2) Si no, intentamos leer el token actual
  //       const token = getCurrentToken();
  //       if (!token) return 0;

  //       const base64Url = token.split(".")[1];
  //       const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  //       const padded = base64.padEnd(
  //         base64.length + ((4 - (base64.length % 4)) % 4),
  //         "="
  //       );
  //       const payload = JSON.parse(atob(padded));
  //       const exp = Number(payload?.exp) || 0; // exp en segundos (epoch)

  //       return Math.max(0, exp - now);
  //     } catch {
  //       return 0;
  //     }
  //   };

  //   const logRemaining = () => {
  //     const totalSeconds = getSecondsLeft();

  //     const minutes = Math.floor(totalSeconds / 60);
  //     const seconds = totalSeconds % 60;

  //     const mm = String(minutes).padStart(2, "0");
  //     const ss = String(seconds).padStart(2, "0");

  //     console.log(
  //       `[Sesión] Restante: ${mm}:${ss} (${totalSeconds}s) | isAuth=${authState.isAuthenticated ? "sí" : "no"
  //       }`
  //     );
  //   };

  //   // loguea al tiro
  //   logRemaining();

  //   // y luego cada segundo
  //   const id = setInterval(logRemaining, 1000);

  //   return () => clearInterval(id);
  // }, [authState.isAuthenticated, authState.expiraEn, authState.token]);

  const isAdmin = authState.user?.role === "admin";
  const hasRole = (roles: Role[]) => {
    const r = authState.user?.role;
    return r ? roles.includes(r) : false;
  };

  const login = async (email: string, password: string, force = false) => {
    try {
      // Usa SIEMPRE fetch-with-auth (versión Token), incluso sin token
      const data = await fetchWithAuthToken<any>(
        null,
        "idservice/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            correo: email,
            password: password,
            plataformaId: PLATFORM_ID, // mantenemos si tu backend lo requiere en body
            forzarSesion: force, // cambiar a true para forzar
          }),
        }
      );

      const { token, usuarioId, correo, expiraEn } = data;

      // decodificar nombre
      const decodeNombreFromJWT = (token: string): string => {
        try {
          const part = token.split(".")[1];
          if (!part) return "";
          const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
          const payload = JSON.parse(atob(padded));
          return String(payload?.nombre || "");
        } catch {
          return "";
        }
      };

      // Guardar token inmediatamente para permitir refresco sin perder sesión
      Cookies.set("authToken", token, {
        path: "/",
        sameSite: "strict",
      });

      // console.log("token: ", token)
      const avatarFromLogin =
        normalizeAvatarUrl(data?.urlImagenPerfil) ||
        normalizeAvatarUrl(data?.usuario?.urlImagenPerfil) ||
        normalizeAvatarUrl(data?.profile?.urlImagenPerfil) ||
        normalizeAvatarUrl(data?.avatar) ||
        normalizeAvatarUrl(data?.avatarUrl);

      const avatarFromUsers = await fetchAvatarFromUsersEndpoint(token, correo);
      const avatarUrl = avatarFromUsers || avatarFromLogin;

      const userProfile: UserProfile = {
        id: String(usuarioId),
        email: correo,
        nombre: decodeNombreFromJWT(token),
        avatarUrl,
        role: "admin",
      };

      // Después de recibir { token, expiraEn, ... } del backend
      // const expFromJwt = token ? decodeExpFromJWT(token) : 0;

      /////////////////////////////////// ESTO SE USA SOLAMENTE CON MOTIVO DE DESAROLLO, ES PARA PROBAR EL MODAL EN DETEMRINADO TIEMPO
      const DEV_FORCE_SHORT_SESSION = false; // <= SOLO mientras pruebas

      let finalExp: number;

      if (DEV_FORCE_SHORT_SESSION) {
        const now = Math.floor(Date.now() / 1000);
        finalExp = now + 2 * 60; // sesión "falsa" de 2 minutos
      } else {
        const expFromJwt = token ? decodeExpFromJWT(token) : 0;
        finalExp = expFromJwt || toEpochSeconds(expiraEn);
      }
      ////////////////////////////////////

      setAuthState({
        isAuthenticated: true,
        user: userProfile,         // lo que tú ya tenías
        token,
        // Si el JWT trae exp, úsalo; si no, normaliza lo que venga en expiraEn (duración)
        // expiraEn: expFromJwt || toEpochSeconds(expiraEn),
        expiraEn: finalExp,
      });

      setShowSessionModal(false);
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    const hydrateAvatar = async () => {
      const token = authState.token;
      const email = authState.user?.email;
      const hasAvatar = !!normalizeAvatarUrl(authState.user?.avatarUrl);

      if (!authState.isAuthenticated || !token || !email || hasAvatar) return;

      const avatarUrl = normalizeAvatarUrl(await fetchAvatarFromUsersEndpoint(token, email));
      if (!mounted || !avatarUrl) return;

      setAuthState((prev) => {
        if (!prev.user) return prev;
        const currentAvatar = normalizeAvatarUrl(prev.user.avatarUrl);
        if (currentAvatar === avatarUrl) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            avatarUrl,
          },
        };
      });
    };

    hydrateAvatar();

    return () => {
      mounted = false;
    };
  }, [
    authState.isAuthenticated,
    authState.token,
    authState.user?.email,
    authState.user?.avatarUrl,
    fetchAvatarFromUsersEndpoint,
  ]);

  const logout = async () => {
    // helper local: decide si vale la pena llamar al backend o el token ya está muerto
    const isTokenProbablyExpired = (): boolean => {
      try {
        const now = Math.floor(Date.now() / 1000);

        // Si tenemos expiraEn en el estado, usamos eso
        if (authState?.expiraEn) {
          return authState.expiraEn <= now;
        }

        // Si no, intentamos leer el token actual
        const token = authState.token || getCurrentToken();
        if (!token) return true;

        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
          base64.length + ((4 - (base64.length % 4)) % 4),
          "="
        );
        const payload = JSON.parse(atob(padded));
        const exp = Number(payload?.exp) || 0; // exp en segundos (epoch)

        return exp <= now;
      } catch {
        // si algo sale mal decodificando, asumimos que ya no es usable
        return true;
      }
    };

    try {
      const hasToken = !!authState.token && !!authState.user?.id;
      const expired = isTokenProbablyExpired();

      // Solo llamamos a /logout si:
      // - hay token y usuario
      // - y el token AÚN no está expirado según nuestros cálculos
      if (hasToken && !expired) {
        await fetchWithAuthToken(authState.token!, "idservice/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarioId: Number(authState.user!.id),
            plataformaId: PLATFORM_ID,
          }),
        });
      }
    } catch (error: any) {
      const status =
        typeof error?.status === "number" ? error.status : 0;
      const msg = String(error?.message || "").toLowerCase();

      const tokenYaInvalido =
        status === 401 &&
        (msg.includes("expirado") ||
          msg.includes("no registrado") ||
          msg.includes("revocado") ||
          msg.includes("unauthorized"));

      // Solo logueamos errores "reales" (red, 500, etc.)
      if (!tokenYaInvalido) {
        console.error("Error en logout:", error);
      }
    } finally {
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        expiraEn: null,
      });
      setShowSessionModal(false);
      router.push("/login");
    }
  };

  // Renovación CON contraseña (mantengo por compatibilidad; el modal también llama su propia ruta)
  const renewSession = async (password: string) => {
    try {
      if (!authState.token) throw new Error("No hay token para renovar");
      // Llamada usando SIEMPRE tu fetch-with-auth centralizado (versión token)
      const { token: newToken, expiraEn: newExpiraEn } =
        await fetchWithAuthToken<{ token: string; expiraEn?: number }>(
          authState.token!,
          "idservice/auth/renovar",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // SOLO password en el body (nada más)
            body: JSON.stringify({ password }),
          }
        );

      // Priorizar exp del JWT; fallback a duración del backend
      const expFromJwt = newToken ? decodeExpFromJWT(newToken) : 0;

      setAuthState((prev) => ({
        ...prev,
        token: newToken,
        expiraEn: expFromJwt || toEpochSeconds(newExpiraEn),
      }));

      setShowSessionModal(false);

    } catch (error) {
      console.error("Error en renovación:", error);
      throw error;
    }
  };

  // aplicar token renovado (lo usa el modal)
  const applyRenewedSession = (newToken: string, newExpiraEn: number) => {
    const expFromJwt = newToken ? decodeExpFromJWT(newToken) : 0;
    setAuthState(prev => ({
      ...prev,
      token: newToken,
      expiraEn: expFromJwt || toEpochSeconds(newExpiraEn),
      isAuthenticated: true,
    }));
    setShowSessionModal(false);
  };

  //  DENTRO de AuthProvider, junto a tus otras funciones 

  // helpers (si no los tienes ya)
  const decodeExpFromJWT = (token: string): number => {
    try {
      const part = token.split(".")[1];
      if (!part) return 0;
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      const payload = JSON.parse(atob(padded));
      return Number(payload?.exp) || 0; // segundos UNIX
    } catch { return 0; }
  };
  const toEpochSeconds = (value?: number | null): number => {
    if (value == null || isNaN(Number(value))) return 0;
    const v = Number(value);
    if (v > 1e12) return Math.floor(v / 1000);  // epoch ms -> seg
    if (v > 1e9) return Math.floor(v);         // epoch seg
    return Math.floor(Date.now() / 1000) + Math.floor(v); // duración -> now + v
  };

  // fallback de re-login (mismo correo, pass del modal)
  const forceReLoginWithPassword = async (password: string) => {
    const email = authState?.user?.email || "";
    if (!email) throw new Error("No hay email en sesión para re-login.");

    // usamos la misma ruta de login que ya tienes en la app
    const resp = await fetchWithAuthToken<any>(
      null, // Authorization vacío (está bien para login)
      "idservice/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: email,
          password: password,
          plataformaId: 1,
          forzarSesion: true, // si tu backend lo soporta
        }),
      }
    );

    const { token: newToken, expiraEn } = resp || {};
    if (!newToken) throw new Error("Re-login: respuesta sin token");

    const finalExp = decodeExpFromJWT(newToken) || toEpochSeconds(expiraEn);
    setAuthState((prev) => ({
      ...prev,
      token: newToken,
      expiraEn: finalExp,
      isAuthenticated: true,
    }));
    setShowSessionModal(false);
  };

  const value: AuthContextType = {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    token: authState.token,
    expiraEn: authState.expiraEn,
    login,
    logout,
    renewSession,
    applyRenewedSession,
    isAdmin,
    hasRole,
    showSessionModal,
    setShowSessionModal,
    forceReLoginWithPassword,
    secondsLeft,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
