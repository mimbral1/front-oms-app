// app/(dev)/pim-smoke/page.tsx
// Smoke test del puente OMS ↔ pim-service. Verifica:
//   1. URL_PIM_SERVICE está configurado.
//   2. CORS pasa (call cross-origin desde localhost:3000 → localhost:5050).
//   3. Headers Authorization + x-plataforma-id se mandan.
//   4. Si hay JWT, decodeUser lo lee y `req.user` se popula en el back.
//
// Solo en dev. Eliminar antes de PROD.

"use client";

import { useEffect, useState } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import { URL_PIM_SERVICE } from "@/lib/http/endpoints";

type HealthResponse = {
    status: string;
    uptime?: number;
};

type ApiState =
    | { kind: "idle" }
    | { kind: "loading"; endpoint: string }
    | { kind: "ok"; endpoint: string; data: unknown }
    | { kind: "error"; endpoint: string; message: string };

export default function PimSmokePage() {
    const { fetchWithAuthPim, token } = useFetchWithAuthPim();
    const [livez, setLivez] = useState<ApiState>({ kind: "idle" });
    const [healthz, setHealthz] = useState<ApiState>({ kind: "idle" });

    // /livez NO está bajo /api — hay que hacer fetch absoluto.
    useEffect(() => {
        const base = URL_PIM_SERVICE || "";
        if (!base) {
            setLivez({
                kind: "error",
                endpoint: "/livez",
                message: "NEXT_PUBLIC_URL_PIM_SERVICE no está seteado en .env",
            });
            return;
        }
        setLivez({ kind: "loading", endpoint: "/livez" });
        fetch(`${base.replace(/\/+$/, "")}/livez`, {
            headers: {
                "x-plataforma-id": "1",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data: HealthResponse) => setLivez({ kind: "ok", endpoint: "/livez", data }))
            .catch((e: Error) =>
                setLivez({ kind: "error", endpoint: "/livez", message: e.message }),
            );
    }, [token]);

    // /healthz también está fuera de /api. Mismo patrón.
    useEffect(() => {
        const base = URL_PIM_SERVICE || "";
        if (!base) return;
        setHealthz({ kind: "loading", endpoint: "/healthz" });
        fetch(`${base.replace(/\/+$/, "")}/healthz`, {
            headers: {
                "x-plataforma-id": "1",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data: HealthResponse) =>
                setHealthz({ kind: "ok", endpoint: "/healthz", data }),
            )
            .catch((e: Error) =>
                setHealthz({ kind: "error", endpoint: "/healthz", message: e.message }),
            );
    }, [token]);

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-8 font-mono text-sm">
            <header className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-blue-700">
                    DEV · Plataforma de ecommerce · Bridge smoke
                </p>
                <h1 className="text-2xl font-semibold text-slate-900">
                    Pim-service connectivity
                </h1>
                <p className="text-slate-500">
                    Verifica que el frontend del OMS puede hablar con{" "}
                    <code className="rounded bg-slate-100 px-1">pim-service</code> sin CORS
                    issues y con el JWT del id-service decodificable.
                </p>
            </header>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-2 text-base font-semibold text-slate-700">Configuración</h2>
                <dl className="grid grid-cols-[200px_1fr] gap-1 text-xs">
                    <dt className="text-slate-500">URL_PIM_SERVICE</dt>
                    <dd className="text-slate-900">
                        {URL_PIM_SERVICE || (
                            <span className="text-red-600">⚠ vacío — revisar .env</span>
                        )}
                    </dd>
                    <dt className="text-slate-500">token (JWT id-service)</dt>
                    <dd className="text-slate-900">
                        {token ? (
                            <code className="text-emerald-700">{token.slice(0, 24)}…</code>
                        ) : (
                            <span className="text-amber-600">
                                ⚠ no hay token — pim-service va a recibir req.user=undefined
                            </span>
                        )}
                    </dd>
                </dl>
            </section>

            <ProbeCard label="GET /livez" state={livez} />
            <ProbeCard label="GET /healthz" state={healthz} />

            <ManualProbe fetchWithAuthPim={fetchWithAuthPim} />

            <footer className="pt-4 text-xs text-slate-400">
                Fase 0 del{" "}
                <code className="rounded bg-slate-100 px-1">docs/MIGRATION_PLAN.md</code>.
                Esta página vive bajo el route group <code>(dev)</code> y NO debe llegar a
                PROD.
            </footer>
        </div>
    );
}

function ProbeCard({ label, state }: { label: string; state: ApiState }) {
    let badge: { color: string; text: string };
    let body: React.ReactNode;

    if (state.kind === "idle") {
        badge = { color: "bg-slate-100 text-slate-600", text: "idle" };
        body = <span className="text-slate-400">esperando ejecución</span>;
    } else if (state.kind === "loading") {
        badge = { color: "bg-blue-50 text-blue-700", text: "loading" };
        body = <span className="text-slate-400">…</span>;
    } else if (state.kind === "ok") {
        badge = { color: "bg-emerald-50 text-emerald-700", text: "200 OK" };
        body = (
            <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
                {JSON.stringify(state.data, null, 2)}
            </pre>
        );
    } else {
        badge = { color: "bg-red-50 text-red-700", text: "error" };
        body = <pre className="text-xs text-red-700">{state.message}</pre>;
    }

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
            <header className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-700">{label}</h2>
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}
                >
                    {badge.text}
                </span>
            </header>
            {body}
        </section>
    );
}

/**
 * Probe manual que SI pasa por `/api/*` para validar que `apiKeyAuth` y
 * `decodeUser` no rompen el flujo cuando hay token. Probamos un endpoint
 * lectura barato — `/api/pim/health` no existe en pim-service, así que
 * pegamos un GET cualquiera y mostramos status.
 */
function ManualProbe({
    fetchWithAuthPim,
}: {
    fetchWithAuthPim: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
}) {
    const [state, setState] = useState<ApiState>({ kind: "idle" });

    async function run() {
        setState({ kind: "loading", endpoint: "/api/pim/productos?limit=1" });
        try {
            const data = await fetchWithAuthPim("/api/pim/productos?limit=1");
            setState({
                kind: "ok",
                endpoint: "/api/pim/productos?limit=1",
                data,
            });
        } catch (e) {
            const err = e as Error & { status?: number; payload?: unknown };
            setState({
                kind: "error",
                endpoint: "/api/pim/productos?limit=1",
                message:
                    err?.status === 404
                        ? "404 — endpoint quizá no expuesto. Es OK para Fase 0; "
                          + "el objetivo es validar CORS + auth headers."
                        : err.message || "desconocido",
            });
        }
    }

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
            <header className="mb-2 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-slate-700">
                        Probe vía <code>useFetchWithAuthPim</code>
                    </h2>
                    <p className="text-xs text-slate-500">
                        GET <code>/api/pim/productos?limit=1</code> — valida el cliente HTTP
                        completo (Authorization + x-plataforma-id + JSON).
                    </p>
                </div>
                <button
                    onClick={run}
                    className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
                >
                    Ejecutar
                </button>
            </header>
            <ProbeCard label="resultado" state={state} />
        </section>
    );
}
