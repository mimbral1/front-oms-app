// features/catalogo/pages/plataforma-ecommerce/shared/feeds/base/FeedStatusCard.tsx
//
// Port del legacy pim-service/Plataforma_Marketplace/src/components/feedback/
// FeedStatusCard.tsx, adaptado al look OMS (Tailwind + lucide-react).
//
// Muestra el estado ASÍNCRONO de un feed Falabella Sellercenter: pollea hasta
// resolverse y despliega progreso + errores por-SKU + reintento. Reutilizable
// en Publicar (PublishConfirmModal) y Editar (tras un ProductUpdate).

"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  RotateCw,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  deriveStatusKey,
  isFeedResolved,
  parseFalabellaErrorCsv,
  relTime,
  FEED_TIMEOUT_WARN_SEC,
  type FalabellaFeed,
  type FeedStatusKey,
} from "./feed-status";
import { useFalabellaFeed } from "./useFalabellaFeed";

type Tone = "info" | "warn" | "ok" | "err";

interface StatusMeta {
  label: string;
  msg: string;
  tone: Tone;
  spin?: boolean;
}

const STATUS_META: Record<FeedStatusKey, StatusMeta> = {
  Queued:         { label: "En cola",     msg: "En cola — Falabella aún no empezó a procesar.",   tone: "info" },
  Processing:     { label: "Procesando",  msg: "Procesando — Falabella está validando el feed.",  tone: "warn", spin: true },
  SuccessClean:   { label: "Publicado",   msg: "Publicado — feed completado sin errores.",        tone: "ok" },
  SuccessPartial: { label: "Con errores", msg: "Completado con errores.",                          tone: "err" },
  Error:          { label: "Rechazado",   msg: "Falló — Falabella rechazó el feed completo.",      tone: "err" },
};

const TONE_PILL: Record<Tone, string> = {
  info: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  warn: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  ok:   "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  err:  "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const TONE_BAR: Record<Tone, string> = {
  info: "bg-slate-400",
  warn: "bg-blue-500",
  ok:   "bg-emerald-500",
  err:  "bg-rose-500",
};

export interface FeedStatusCardProps {
  feedId: string | undefined | null;
  /** Callback al pulsar "Reintentar" (Error o éxito parcial). */
  onRetry?: (feedId: string) => void;
  /** Bypass del polling (previews / tests). */
  mock?: FalabellaFeed;
  /** Se dispara UNA vez cuando el feed llega a estado terminal (Success/Error). */
  onResolved?: (feed: FalabellaFeed) => void;
}

export function FeedStatusCard({ feedId, onRetry, mock, onResolved }: FeedStatusCardProps) {
  const { data, error } = useFalabellaFeed(feedId, mock);
  const [showErrors, setShowErrors] = useState(false);
  const [warnSlow, setWarnSlow] = useState(false);
  const [resolvedFired, setResolvedFired] = useState(false);

  // Resetea el guard si cambia el feed (otro cambio de precio).
  useEffect(() => { setResolvedFired(false); }, [feedId]);

  // Dispara onResolved exactamente una vez al llegar a estado terminal.
  useEffect(() => {
    if (!data || resolvedFired) return;
    if (isFeedResolved(data)) {
      setResolvedFired(true);
      onResolved?.(data);
    }
  }, [data, resolvedFired, onResolved]);

  // Aviso "está tardando" cuando supera 3 min sin resolver.
  useEffect(() => {
    if (!data || isFeedResolved(data)) {
      setWarnSlow(false);
      return;
    }
    const elapsed = (Date.now() - Date.parse(data.submitted_at || "")) / 1000;
    setWarnSlow(Number.isFinite(elapsed) && elapsed > FEED_TIMEOUT_WARN_SEC);
  }, [data]);

  if (error && !data) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>No se pudo consultar el feed: {error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>Consultando estado del feed…</span>
      </div>
    );
  }

  const key = deriveStatusKey(data);
  const meta = STATUS_META[key] || STATUS_META.Queued;
  const errors = parseFalabellaErrorCsv(data.error_detail);
  const resolved = isFeedResolved(data);
  const showProgress = data.total_records != null && data.total_records > 0;
  const progPct = resolved
    ? 100
    : data.progress_pct ??
      Math.round(((data.processed_records || 0) / Math.max(1, data.total_records || 1)) * 100);
  const hasErrors = (data.failed_records || 0) > 0;
  const showRetry = key === "Error" || key === "SuccessPartial";

  const mainMsg =
    key === "SuccessPartial"
      ? `Completado con errores — ${data.failed_records} de ${data.total_records} fallaron.`
      : meta.msg;

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-3 text-left">
      {/* Header: pill + feed id */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className={[
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide",
            TONE_PILL[meta.tone],
          ].join(" ")}
        >
          {meta.spin && <Loader2 className="w-3 h-3 animate-spin" />}
          {key === "SuccessClean" && <CheckCircle2 className="w-3 h-3" />}
          {meta.label}
        </span>
        <span className="text-xs text-gray-500">
          Feed <code className="font-semibold text-gray-700">{data.feed_id}</code>
          {data.action ? <> · {data.action}</> : null}
        </span>
      </div>

      {/* Mensaje principal */}
      <p className="mt-2 text-sm text-gray-700">{mainMsg}</p>

      {/* Barra de progreso */}
      {showProgress && (
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={["h-full rounded-full transition-all", TONE_BAR[meta.tone]].join(" ")}
              style={{ width: `${progPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            <b className="text-gray-700 tabular-nums">{data.processed_records ?? 0}</b> de{" "}
            <b className="text-gray-700 tabular-nums">{data.total_records}</b>{" "}
            {data.total_records === 1 ? "producto procesado" : "productos procesados"}
            {progPct != null && <> · {progPct}%</>}
          </p>
        </div>
      )}

      {/* Aviso de demora */}
      {warnSlow && (
        <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            El feed está tardando más de lo normal (&gt;3 min). Falabella sigue procesando — esta
            tarjeta se actualiza sola.
          </span>
        </div>
      )}

      {/* Resumen de errores por-SKU */}
      {hasErrors && (
        <div className="mt-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="text-xs text-rose-700 font-medium">
            {data.failed_records}{" "}
            {data.failed_records === 1 ? "producto con errores" : "productos con errores"}
          </span>
          {errors.length > 0 && (
            <button
              type="button"
              onClick={() => setShowErrors((s) => !s)}
              className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {showErrors ? "Ocultar detalle" : "Ver detalle"}
              <ChevronDown
                className={["w-3.5 h-3.5 transition-transform", showErrors ? "rotate-180" : ""].join(" ")}
              />
            </button>
          )}
        </div>
      )}

      {/* Tabla de errores por-SKU */}
      {hasErrors && showErrors && errors.length > 0 && (
        <div className="mt-2 max-h-56 overflow-auto rounded-md border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 sticky top-0">
              <tr>
                <th className="text-left font-semibold px-2 py-1.5 w-1/4">SKU</th>
                <th className="text-left font-semibold px-2 py-1.5">Mensaje</th>
                <th className="text-left font-semibold px-2 py-1.5 w-1/5">Código</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {errors.map((e, i) => (
                <tr key={`${e.sku}-${i}`}>
                  <td className="px-2 py-1.5 font-mono text-gray-700">{e.sku}</td>
                  <td className="px-2 py-1.5 text-gray-600">{e.desc}</td>
                  <td className="px-2 py-1.5 font-mono text-gray-500">{e.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer: tiempos + reintentar */}
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          Iniciado {relTime(data.submitted_at)}
          {data.resolved_at && <> · resuelto {relTime(data.resolved_at)}</>}
        </span>
        {showRetry && onRetry && data.feed_id && (
          <button
            type="button"
            onClick={() => onRetry(data.feed_id as string)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
