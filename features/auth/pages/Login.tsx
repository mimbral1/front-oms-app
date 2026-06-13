"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { loginSchema, type LoginFormData } from "../types/auth";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const GoogleIcon = FcGoogle as React.FC<React.SVGProps<SVGSVGElement>>;

// MODO MANTENIMIENTO
const MAINTENANCE_MODE = false;

// para credenciales invalidas
function prettyApiMessage(raw: string): string {
  if (!raw) return "";
  const txt = raw.trim();

  // Intenta parsear JSON si parece objeto/array
  if ((txt.startsWith("{") && txt.endsWith("}")) || (txt.startsWith("[") && txt.endsWith("]"))) {
    try {
      const data = JSON.parse(txt);

      // Caso Zod "issues": { issues: [{ message, path, code }...] }
      if (data && Array.isArray(data.issues) && data.issues.length) {
        return data.issues.map((i: any) => i?.message).filter(Boolean).join("\n");
      }

      // Caso array simple de errores: [{ message: '...' }, ...]
      if (Array.isArray(data) && data.length) {
        const msgs = data
          .map((it) => (it && typeof it === "object" ? it.message : String(it)))
          .filter(Boolean);
        if (msgs.length) return msgs.join("\n");
      }

      // Caso objeto con message/error/detail
      if (data && typeof data === "object") {
        const m = (data.message || data.error || data.detail);
        if (typeof m === "string" && m.trim()) return m.trim();
      }
    } catch {
      // si no se puede parsear, seguimos abajo
    }
  }

  // Si viene con prefijo tipo "HTTP 400", no sirve para usuario
  if (/^HTTP\b/i.test(txt) || /\bstatus\s*:\s*\d{3}\b/i.test(txt)) return "";

  return txt;
}


export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [showForceLogin, setShowForceLogin] = useState(false);

  // ojo para visibilizar contrasena
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !MAINTENANCE_MODE) {
      router.push("/mimbral360");
    }
  }, [isAuthenticated, router]);

  // Normaliza status y mensaje desde distintos tipos de error
  const parseError = (err: any) => {
    const rawMsg = typeof err?.message === "string" ? err.message.trim() : "";
    let status: number | undefined =
      (err as any)?.status ?? (err as any)?.response?.status;

    if (!status && rawMsg) {
      const m = rawMsg.match(/\b(\d{3})\b/);
      if (m) status = Number(m[1]);
    }
    return { status, msg: rawMsg };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bloqueo por mantenimiento
    if (MAINTENANCE_MODE) return;

    setError("");
    setShowForceLogin(false);

    try {
      const validatedData = loginSchema.parse(formData);
      await login(validatedData.email, validatedData.password);
    } catch (err: any) {
      setShowForceLogin(false);

      const raw = (typeof err?.message === "string" ? err.message : "").trim();

      // 1) PRIORIDAD: status real adjuntado por el helper
      let status: number | undefined = typeof err?.status === "number" ? err.status : undefined;

      // 2) Fallback: intenta extraer un 3-digit del string (p.ej. "HTTP error! status: 409")
      if (!status) {
        const m = raw.match(/\b(\d{3})\b/);
        status = m ? Number(m[1]) : undefined;
      }

      const pretty = prettyApiMessage(raw);

      // 3) Detección robusta de "sesión activa" aunque no venga el 409
      const normalized = (pretty || raw)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      const looksActiveSession =
        normalized.includes("sesion activa") ||
        normalized.includes("session activa") ||
        normalized.includes("ya existe una sesion");

      if (status === 409 || looksActiveSession || (err as any)?.forceLogin) {
        setError(pretty || "Ya existe una sesión activa. ¿Deseas cerrarla e iniciar una nueva?");
        setShowForceLogin(true);
        return;
      }

      if (pretty) {
        setError(pretty);                   // Mensaje claro del backend (email inválido, etc.)
      } else if (status === 401) {
        setError("Credenciales inválidas.");
      } else {
        setError("Se produjo un error inesperado.");
      }
    }


  };

  const handleForceLogin = async () => {
    setError("");
    setShowForceLogin(false);
    try {
      await login(formData.email, formData.password, true);
    } catch (err: any) {
      const raw = typeof err?.message === "string" ? err.message.trim() : "";
      setError(raw || "Error al iniciar sesión de nuevo. Inténtelo más tarde.");
      setShowForceLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Mimbral 360
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicie sesión en su cuenta
          </p>
        </div>

        {/* MENSAJE DE MANTENIMIENTO */}
        {MAINTENANCE_MODE && (
          <div className="mb-6 rounded-xl bg-white p-6 text-center shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Mimbral 360
            </div>

            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              Sitio en mantenimiento
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              La plataforma se encuentra actualmente en mantenimiento.
              <br />
              <span className="font-medium">
                Pronto volverá a estar disponible.
              </span>
            </p>
          </div>
        )}

        <div className="relative">
          {/* 🔒 Overlay de bloqueo */}
          {MAINTENANCE_MODE && (
            <div className="absolute inset-0 z-10 rounded-lg bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
              <div className="text-sm text-gray-600">
                Acceso temporalmente deshabilitado
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 rounded-md">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="nombre@ejemplo.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                  <IconButton
                    onClick={() => setShowPwd(!showPwd)}
                    edge="end"
                    size="small"
                    sx={{ position: "absolute", right: "10px", top: "2px" }}
                  >
                    {showPwd ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </div>
              </div>
            </div>

            {(error || showForceLogin) && (
              <div
                role="alert"
                className={`rounded-lg border p-4 ${showForceLogin ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}
              >
                <div className="flex items-start gap-3">
                  {/* tu ícono aquí */}
                  <div className="flex-1">
                    <p className={`text-sm ${showForceLogin ? "text-amber-900" : "text-red-800"}`}>
                      {error}
                    </p>
                  </div>

                  {showForceLogin && (
                    <button
                      type="button"
                      onClick={handleForceLogin}
                      className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      Cerrar sesión e iniciar nueva
                    </button>
                  )}

                </div>
              </div>
            )}

            <div>
              <button type="submit" className="group relative flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
                Iniciar sesión
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-page-bg px-2 text-gray-500">o</span></div>
            </div>

            <button type="button" className="group relative flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <GoogleIcon className="mr-2 h-5 w-5" />
              Continuar con Google
            </button>

            <div className="flex justify-center">
              <a href="/login/recuperar" className="text-sm text-blue-600 hover:underline">
                ¿Has olvidado la contraseña?
              </a>
            </div>
          </form>

        </div>

      </div>
    </div >
  );
}
