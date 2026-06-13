"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuthSinToken } from "@/lib/http/client";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

// mismo helper que usamos en Login
function prettyApiMessage(raw: string): string {
  if (!raw) return "";
  const txt = raw.trim();

  // Si parece JSON, intenta parsear
  if ((txt.startsWith("{") && txt.endsWith("}")) || (txt.startsWith("[") && txt.endsWith("]"))) {
    try {
      const data = JSON.parse(txt);

      // Zod-like: { issues: [{ message }...] }
      if (data && Array.isArray(data.issues) && data.issues.length) {
        return data.issues.map((i: any) => i?.message).filter(Boolean).join("\n");
      }

      // Array simple: [{ message: '...' }, '...']
      if (Array.isArray(data) && data.length) {
        const msgs = data
          .map((it) => (it && typeof it === "object" ? it.message : String(it)))
          .filter(Boolean);
        if (msgs.length) return msgs.join("\n");
      }

      // Objeto con message/error/detail
      if (data && typeof data === "object") {
        const m = (data.message || data.error || data.detail);
        if (typeof m === "string" && m.trim()) return m.trim();
      }
    } catch { /* seguimos abajo */ }
  }

  // Mensajes tipo “HTTP error! status: 400” no son útiles al usuario
  if (/^HTTP\b/i.test(txt) || /\bstatus\s*:\s*\d{3}\b/i.test(txt)) return "";

  return txt;
}

const FRIENDLY_ERROR = "Se produjo un error inesperado.";

export default function RecoverStart() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (!email) return setError("Ingresa tu correo.");

    try {
      setLoading(true);
      await fetchWithAuthSinToken<{ message: string }>("idservice/auth/recuperar", {
        method: "POST",
        body: JSON.stringify({ correo: email }),
      });
      setOkMsg("Te enviamos un código de 6 dígitos a tu correo.");
      setTimeout(
        () => router.push(`/login/recuperar/otp?email=${encodeURIComponent(email)}`),
        2000
      );
    } catch (err: any) {
      const raw = typeof err?.message === "string" ? err.message.trim() : "";
      const pretty = prettyApiMessage(raw);
      setError(pretty || FRIENDLY_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Mimbral 360</h2>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-md bg-white p-6 shadow">
          <div>
            <p className="text-center block text-sm font-bold">Recuperar contraseña</p>
            <p className="text-center text-sm text-gray-600 mt-1">
              Introduce tu correo para enviar código de 6 dígitos
            </p>
            <br />
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="usuario@dominio.cl"
              required
            />
          </div>

          {/* === Alertas con el MISMO estilo que Login === */}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {okMsg && (
            <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-800">{okMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Enviando..." : "Continuar"}
          </button>

          <div className="text-center">
            <a href="/login" className="text-sm text-gray-500 hover:underline">
              ↍ Volver a iniciar sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
