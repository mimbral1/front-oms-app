// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/components/PublishConfirmModal.tsx
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// publicar/components/PublishConfirmModal.tsx`. Adaptaciones para OMS:
//   - SimpleModal del global + ActionButton
//   - lucide icons en lugar de JanisIcon
//   - Look pleno OMS: rounded-md inputs bordered, ActionButton variants
//
// Flow:
//   1. Modal abre → genera Idempotency-Key UUID v4 en `useRef`.
//   2. Field `createdBy` (number) — preset con user.id, editable.
//   3. Field `accountId` (number, opcional) — preset con localStorage.
//   4. Solo ML: radio Prueba | Real (default Prueba).
//   5. Click "Enviar":
//      - ML test → `publishMlTest(payload)`.
//      - ML real → `publicar('ml', sku, {createdBy, accountId?, payload}, {idempotencyKey})`.
//      - Fala → `publicar('fala', sku, {createdBy, accountId?, payload}, {idempotencyKey})`.
//   6. Success ML → muestra `item_id` o `permalink`. Cerrar.
//   7. Success Fala → muestra `feed_id` (FeedStatusCard polling — Fase 7 cablea).
//   8. Error → muestra `causes[]` + `error_code` + detalle técnico colapsable.
//      Botón "Volver" para reintentar (MISMA key — replay del backend si llegó).
//      "Reintentar" tras Fala feed fallido genera key NUEVA (intento user-conscious).
//
// SIN POST/PUT/DELETE automático — solo cuando el user clickea "Enviar". El
// usuario testea, el front no dispara nada por su cuenta.

"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Flag } from "lucide-react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { SimpleModal } from "@/components/ui/modal";
import { ActionButton } from "@/components/ui";
import { usePublicarApi } from "../api/publicar-api";
import { useCuentaCanal } from "../hooks/useCuentaCanal";
import { FeedStatusCard } from "../../../feeds/base/FeedStatusCard";
import type {
    CoverageSummary,
    PublicarChannel,
    PublicarResult,
    PublicarState,
} from "../types/publicar-types";

export interface PublishConfirmModalProps {
    open: boolean;
    onClose: () => void;
    channel: PublicarChannel;
    state: PublicarState;
    coverage: CoverageSummary;
    payload: Record<string, unknown>;
    onSubmitted?: (result: PublicarResult) => void;
}

type PublishMode = "test" | "real";

interface PublishResultState {
    ok: boolean;
    response?: PublicarResult;
    identity?: string | null;
    permalink?: string | null;
    mode: PublishMode;
    message?: string;
    details?: PublicarResult | null;
}

function getStringPath(source: unknown, path: string[]): string | null {
    let current: unknown = source;
    for (const key of path) {
        if (!current || typeof current !== "object") return null;
        current = (current as Record<string, unknown>)[key];
    }
    return typeof current === "string" && current.trim() ? current : null;
}

function pickString(source: unknown, paths: string[][]): string | null {
    for (const path of paths) {
        const value = getStringPath(source, path);
        if (value) return value;
    }
    return null;
}

/** Extrae identidad del response para mostrar al usuario (item_id ML, feed_id Fala). */
function extractResultIdentity(
    channel: PublicarChannel,
    result: PublicarResult | undefined,
): string | null {
    if (!result) return null;
    if (channel === "ml") {
        return pickString(result, [
            ["item_id"],
            ["ml_item_id"],
            ["id"],
            ["data", "item_id"],
            ["data", "ml_item_id"],
            ["data", "id"],
            ["data", "item", "id"],
            ["data", "response", "item_id"],
            ["data", "response", "ml_item_id"],
            ["data", "response", "id"],
            ["data", "result", "item_id"],
            ["data", "result", "ml_item_id"],
            ["data", "result", "id"],
        ]) || result?.message || null;
    }
    return pickString(result, [
        ["feed_id"],
        ["feedId"],
        ["requestId"],
        ["data", "feed_id"],
        ["data", "feedId"],
        ["data", "requestId"],
        ["data", "response", "feed_id"],
        ["data", "response", "feedId"],
        ["data", "response", "requestId"],
    ]) || result?.message || null;
}

function extractResultPermalink(result: PublicarResult | undefined): string | null {
    if (!result) return null;
    return pickString(result, [
        ["permalink"],
        ["data", "permalink"],
        ["data", "item", "permalink"],
        ["data", "response", "permalink"],
        ["data", "result", "permalink"],
    ]);
}

/** Generador UUID v4 client-side para `Idempotency-Key`. */
function genIdempotencyKey(): string {
    try {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
    } catch {
        /* fall through */
    }
    return `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const INPUT_CLASSES = [
    "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2",
    "text-sm tabular-nums shadow-sm",
    "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
].join(" ");

export function PublishConfirmModal({
    open,
    onClose,
    channel,
    state,
    coverage,
    payload,
    onSubmitted,
}: PublishConfirmModalProps) {
    const api = usePublicarApi();
    const { user } = useAuth();
    const { cuenta } = useCuentaCanal(channel);

    const [mode, setMode] = useState<PublishMode>(channel === "ml" ? "test" : "real");
    const [createdBy, setCreatedBy] = useState<string>("");
    const [accountId, setAccountId] = useState<string>("");
    const [publishing, setPublishing] = useState(false);
    const [result, setResult] = useState<PublishResultState | null>(null);

    /**
     * Idempotency key per "intento de publicación". Estable mientras el modal
     * está abierto — un doble click o retry del browser usa la MISMA key →
     * backend replay-tea sin volver a publicar. Se regenera cada apertura.
     */
    const idempotencyKeyRef = useRef<string | null>(null);

    useEffect(() => {
        setMode(channel === "ml" ? "test" : "real");
        try {
            setAccountId(localStorage.getItem(`publicar.account.${channel}`) || "");
        } catch {
            /* empty */
        }
    }, [channel]);

    // Auto-rellena accountId con la cuenta real resuelta de commerce-service
    // (Falabella → 4, ML → 3) si el seller no fijó una manualmente. No pisa un
    // valor existente (localStorage o input del usuario).
    useEffect(() => {
        if (!accountId && cuenta?.id != null) {
            setAccountId(String(cuenta.id));
        }
    }, [cuenta, accountId]);

    useEffect(() => {
        if (!open) return;
        setResult(null);
        setPublishing(false);
        idempotencyKeyRef.current = genIdempotencyKey();
        try {
            const stored = localStorage.getItem("publicar.createdBy");
            if (stored) {
                setCreatedBy(stored);
            } else if (user?.id) {
                setCreatedBy(String(user.id));
            }
        } catch {
            if (user?.id) setCreatedBy(String(user.id));
        }
    }, [open, user?.id]);

    const categoryName =
        channel === "ml" ? state.category?.nombre : state.categoryFala?.nombre;
    const name = channel === "ml" ? state.ml.title : state.fala.Name;
    const price = channel === "ml" ? state.ml.price : state.fala.Price;
    const actorId = Number(createdBy) || Number(user?.id) || 0;
    const showInternalFields = channel === "ml";

    const confirm = async () => {
        if (!actorId) return;

        try {
            localStorage.setItem("publicar.createdBy", String(actorId));
            if (accountId) {
                localStorage.setItem(`publicar.account.${channel}`, accountId);
            } else {
                localStorage.removeItem(`publicar.account.${channel}`);
            }
        } catch {
            /* empty */
        }

        setPublishing(true);
        setResult(null);

        try {
            let response: PublicarResult;
            const idemKey = idempotencyKeyRef.current ?? genIdempotencyKey();

            if (channel === "ml" && mode === "test") {
                response = await api.publishMlTest(payload);
            } else {
                response = await api.publicar(
                    channel,
                    String(
                        channel === "fala"
                            ? (payload as Record<string, unknown>).SellerSku ?? state.sku
                            : state.sku,
                    ),
                    {
                        createdBy: actorId,
                        ...(accountId ? { accountId: Number(accountId) } : {}),
                        payload,
                    },
                    { idempotencyKey: idemKey },
                );
            }

            setResult({
                ok: true,
                response,
                identity: extractResultIdentity(channel, response),
                permalink: channel === "ml" ? extractResultPermalink(response) : null,
                mode,
            });
            onSubmitted?.(response);
        } catch (err) {
            const e = err as { message?: string; data?: PublicarResult };
            setResult({
                ok: false,
                mode,
                message: e?.message ?? "La publicación falló",
                details: e?.data ?? null,
            });
        } finally {
            setPublishing(false);
        }
    };

    const retryFalaFeed = async () => {
        const retryKey = genIdempotencyKey();
        setPublishing(true);
        try {
            const response = await api.publicar(
                "fala",
                String(
                    (payload as Record<string, unknown>).SellerSku ?? state.sku,
                ),
                {
                    createdBy: actorId,
                    ...(accountId ? { accountId: Number(accountId) } : {}),
                    payload,
                },
                { idempotencyKey: retryKey },
            );
            const newId = extractResultIdentity("fala", response);
            if (newId) {
                setResult({ ok: true, response, identity: newId, permalink: null, mode });
            }
        } catch (err) {
            const e = err as { message?: string };
            alert(`No se pudo reintentar: ${e?.message ?? "(sin detalle)"}`);
        } finally {
            setPublishing(false);
        }
    };

    const headerTitle = result
        ? result.ok
            ? channel === "ml" && result.mode === "test"
                ? "✓ Prueba enviada"
                : `✓ Producto publicado en ${channel === "ml" ? "MercadoLibre" : "Falabella"}`
            : "Error al publicar"
        : `Publicar en ${channel === "ml" ? "MercadoLibre" : "Falabella"}`;

    return (
        <SimpleModal
            open={open}
            onClose={onClose}
            title={headerTitle}
            maxWidth="sm:max-w-lg"
        >
            <div className="space-y-4">
                {!result && (
                    <p className="text-sm text-gray-500">
                        {channel === "ml"
                            ? "Confirma los datos de la cuenta y el tipo de envío al backend."
                            : "Confirma la publicación. Los datos internos de cuenta se enviarán automáticamente."}
                    </p>
                )}

                {!result && (
                    <>
                        {/* Producto preview */}
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-3">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                Producto
                            </p>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                                {String(name || "(sin nombre)")}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {categoryName && `${categoryName} · `}
                                {price
                                    ? `$${Number(price).toLocaleString("es-CL")}`
                                    : "—"}{" "}
                                · SKU{" "}
                                <code className="text-blue-700 font-semibold tabular-nums">
                                    {state.sku}
                                </code>
                            </p>
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                <span
                                    className={[
                                        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide",
                                        coverage.missing.length === 0
                                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                                            : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
                                    ].join(" ")}
                                >
                                    {coverage.missing.length === 0
                                        ? `${coverage.pct}% completo`
                                        : `${coverage.missing.length} faltantes`}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-700">
                                    {state.images?.length || 0} imágenes
                                </span>
                            </div>
                        </div>

                        {/* Content score Falabella — 3 tramos oficiales (GetContentScore). */}
                        {channel === "fala" && state.falaScoreActual != null && (
                            <FalaScoreGate score={state.falaScoreActual} />
                        )}

                        {/* Modo (solo ML) */}
                        {channel === "ml" && (
                            <div>
                                <p className="text-sm font-semibold text-gray-900 mb-2">
                                    Modo de publicación
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(
                                        [
                                            {
                                                id: "test" as PublishMode,
                                                label: "Prueba",
                                                hint: "Usa el endpoint de prueba del backend.",
                                                activeRing: "ring-indigo-500 bg-indigo-50",
                                            },
                                            {
                                                id: "real" as PublishMode,
                                                label: "Real",
                                                hint: "Encola la publicación real del SKU.",
                                                activeRing: "ring-rose-500 bg-rose-50",
                                            },
                                        ] as const
                                    ).map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setMode(item.id)}
                                            className={[
                                                "text-left rounded-md p-3 border transition-colors",
                                                mode === item.id
                                                    ? `ring-2 ${item.activeRing} border-transparent`
                                                    : "border-gray-200 bg-white hover:bg-gray-50",
                                            ].join(" ")}
                                        >
                                            <div className="text-sm font-semibold text-gray-900">
                                                {item.label}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                                                {item.hint}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showInternalFields && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        createdBy *
                                    </label>
                                    <input
                                        className={INPUT_CLASSES}
                                        type="number"
                                        value={createdBy}
                                        onChange={(e) => setCreatedBy(e.target.value)}
                                        placeholder="Ej: 1024"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Usuario que dispara la publicación.
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        accountId
                                    </label>
                                    <input
                                        className={INPUT_CLASSES}
                                        type="number"
                                        value={accountId}
                                        onChange={(e) => setAccountId(e.target.value)}
                                        placeholder="Opcional"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {cuenta
                                            ? `Cuenta: ${cuenta.name}${cuenta.referenceId ? ` (${cuenta.referenceId})` : ""}`
                                            : "Solo si el SKU aún no existe en el canal."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* SUCCESS */}
                {result?.ok && (
                    <div className="py-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center mx-auto mb-3">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="text-base font-semibold text-gray-900">
                            {channel === "ml" && result.mode === "test"
                                ? "Prueba enviada al backend; no se creó una publicación real."
                                : `Producto publicado en ${channel === "ml" ? "MercadoLibre" : "Falabella"}`}
                        </div>
                        {result.identity && (
                            <div className="text-sm text-gray-500 mt-2">
                                {channel === "ml" ? "Item publicado:" : "Resultado:"}{" "}
                                <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                                    {String(result.identity)}
                                </code>
                            </div>
                        )}
                        {channel === "ml" && result.permalink && (
                            <a
                                href={result.permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex mt-3 text-sm font-medium text-blue-700 hover:text-blue-800 underline"
                            >
                                Ver publicación en MercadoLibre
                            </a>
                        )}
                        {channel === "fala" && result.identity && (
                            <div className="mt-4 text-left">
                                <FeedStatusCard
                                    feedId={String(result.identity)}
                                    onRetry={() => retryFalaFeed()}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ERROR */}
                {result && !result.ok && (
                    <ErrorPanel result={result} onBack={() => setResult(null)} />
                )}

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                    {!result && (
                        <>
                            <ActionButton
                                variant="secondary"
                                size="sm"
                                onClick={onClose}
                                disabled={publishing}
                            >
                                Cancelar
                            </ActionButton>
                            <ActionButton
                                variant={
                                    coverage.missing.length > 0 ? "danger" : "success"
                                }
                                size="sm"
                                onClick={confirm}
                                disabled={
                                    publishing || !actorId
                                }
                            >
                                <Flag className="w-4 h-4" />
                                {publishing
                                    ? "Publicando…"
                                    : coverage.missing.length > 0
                                      ? "Publicar de todas formas"
                                      : "Enviar"}
                            </ActionButton>
                        </>
                    )}
                    {result && (
                        <ActionButton variant="secondary" size="sm" onClick={onClose}>
                            Cerrar
                        </ActionButton>
                    )}
                </div>
            </div>
        </SimpleModal>
    );
}

/**
 * Indicador de content score Falabella con los 3 tramos oficiales
 * (doc `GetContentScore`): ≥71 aprobación automática, 30–70 revisión manual
 * (hasta 2 días hábiles), <30 rechazo automático. No bloquea — informa la
 * consecuencia antes de publicar.
 */
function FalaScoreGate({ score }: { score: number }) {
    const s = Math.max(0, Math.min(100, Math.round(score)));
    const tier =
        s >= 71
            ? {
                  tone: "ok" as const,
                  label: "Aprobación automática",
                  msg: "Falabella lo aprobará automáticamente.",
              }
            : s >= 30
              ? {
                    tone: "warn" as const,
                    label: "Revisión manual",
                    msg: "Irá a revisión manual de Falabella (hasta 2 días hábiles).",
                }
              : {
                    tone: "err" as const,
                    label: "Rechazo automático",
                    msg: "Falabella lo rechazará automáticamente (mínimo 30 puntos).",
                };
    const box = {
        ok: "bg-emerald-50 border-emerald-200 text-emerald-800",
        warn: "bg-amber-50 border-amber-200 text-amber-800",
        err: "bg-rose-50 border-rose-200 text-rose-800",
    }[tier.tone];
    const bar = { ok: "bg-emerald-500", warn: "bg-amber-500", err: "bg-rose-500" }[tier.tone];
    return (
        <div className={["rounded-md border px-3 py-2.5", box].join(" ")}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                    Content score: <span className="tabular-nums">{s}</span>/100
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide">{tier.label}</span>
            </div>
            <p className="text-xs mt-1">{tier.msg}</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
                <div
                    className={["h-full rounded-full", bar].join(" ")}
                    style={{ width: `${s}%` }}
                />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-500 tabular-nums">
                <span>0</span>
                <span>30 · rechazo</span>
                <span>71 · auto</span>
                <span>100</span>
            </div>
        </div>
    );
}

function ErrorPanel({
    result,
    onBack,
}: {
    result: PublishResultState;
    onBack: () => void;
}) {
    const causes =
        ((result.details as { data?: { causes?: Array<{ code?: string; message?: string }> } } | null)
            ?.data?.causes) ||
        [];
    const errCode =
        ((result.details as { data?: { error_code?: string } } | null)?.data?.error_code) || null;
    return (
        <div>
            <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-800">
                <div className="font-semibold mb-1">
                    {result.message || "La publicación falló"}
                    {errCode && (
                        <span className="ml-2 text-xs text-amber-700 font-medium">
                            [{errCode}]
                        </span>
                    )}
                </div>
                {causes.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                        {causes.map((c, i) => (
                            <li key={i}>
                                {c.message || c.code || "Error sin descripción"}
                                {c.code && c.message && (
                                    <span className="ml-2 text-xs text-amber-700 font-mono">
                                        {c.code}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-500">
                    Ver detalle técnico
                </summary>
                <pre className="mt-2 p-3 rounded-md bg-gray-900 text-rose-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(result.details, null, 2)}
                </pre>
            </details>
            <div className="flex justify-end mt-3">
                <ActionButton variant="secondary" size="sm" onClick={onBack}>
                    Volver
                </ActionButton>
            </div>
        </div>
    );
}
