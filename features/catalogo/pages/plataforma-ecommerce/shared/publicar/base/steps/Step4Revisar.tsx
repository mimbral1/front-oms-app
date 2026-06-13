// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/steps/Step4Revisar.tsx
//
// Step 4 — Resumen final antes de publicar. Look OMS pleno.
//   - Banner de estado (coverage OK vs faltantes)
//   - Card resumen con foto + dl (título, categoría, precio, stock, marca, SKU, canal, etc.)
//   - Cierre con instrucción de publicar desde header
//
// El botón "Publicar a ML/Falabella" vive en el header de PublicarWizardView.

"use client";

import { CheckCircle, ImageIcon, Info } from "lucide-react";

import { ActionButton, Card } from "@/components/ui";
import { ProgressSidebar } from "../components/ProgressSidebar";
import { BitacoraTimeline } from "../../../bitacora";
import { toArray } from "../helpers/constants";
import type { UsePublicarWizardReturn } from "../hooks/usePublicarWizard";
import type {
    PublicarAttribute,
    PublicarStepId,
} from "../types/publicar-types";

export interface Step4RevisarProps {
    wizard: UsePublicarWizardReturn;
    onJumpToStep: (s: PublicarStepId) => void;
}

export function Step4Revisar({ wizard, onJumpToStep }: Step4RevisarProps) {
    const { state, coverage } = wizard;
    const channel = state.channel;
    const cat = channel === "ml" ? state.category : state.categoryFala;

    // Slots canonical según canal
    const title =
        channel === "ml" ? state.ml.title ?? "" : state.fala.Name ?? "";
    const price =
        channel === "ml"
            ? Number(state.ml.price || 0)
            : Number(state.fala.Price || 0);
    const stock =
        channel === "ml"
            ? Number(state.ml.available_quantity || 0)
            : Number(state.fala.Quantity || 0);

    // Primera imagen — prefiere secureUrl (CDN ML) > url > dataUrl (base64 local).
    const primaryImg =
        state.images[0]?.secureUrl ??
        state.images[0]?.url ??
        state.images[0]?.dataUrl ??
        null;

    // Atributos llenados (todos los slots)
    const channelAttrs =
        channel === "ml"
            ? toArray<PublicarAttribute>(state.mlAvailableAttrs)
            : [
                  ...toArray<PublicarAttribute>(state.falaRequiredAttrs),
                  ...toArray<PublicarAttribute>(state.falaOptionalAttrs),
              ];
    const slotAttrs =
        (channel === "ml" ? state.ml.attrs : state.fala.attrs) ?? {};
    const filledAttrs = channelAttrs.filter((a) => {
        const key = a.id || a.feedName || "";
        const v = (slotAttrs as Record<string, unknown>)[key];
        return v !== undefined && v !== null && v !== "";
    });

    // Fecha de publicación = ahora (formato es-CL legible)
    const fechaPublicacion = new Date().toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const coverageOk = coverage.missing.length === 0;

    return (
        <div className="px-6 pt-6 pb-10">
            <div className="grid grid-cols-[1fr_360px] gap-6">
                <div className="space-y-4 min-w-0">
                    {/* ── Banner de estado ─────────────────────────────── */}
                    <div
                        className={[
                            "rounded-md px-4 py-3 flex items-center gap-3 border",
                            coverageOk
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-amber-50 border-amber-200 text-amber-800",
                        ].join(" ")}
                    >
                        {coverageOk ? (
                            <CheckCircle className="w-5 h-5 shrink-0" />
                        ) : (
                            <Info className="w-5 h-5 shrink-0" />
                        )}
                        <div className="flex-1">
                            <div className="text-sm font-semibold">
                                {coverageOk
                                    ? "Todo listo para publicar"
                                    : `Faltan ${coverage.missing.length} campos obligatorios`}
                            </div>
                            {coverageOk ? (
                                <div className="text-xs opacity-75 mt-0.5">
                                    {coverage.required_filled} obligatorios ·{" "}
                                    {coverage.recommended_filled} recomendados
                                    llenados.
                                </div>
                            ) : (
                                <div className="text-xs opacity-75 mt-0.5">
                                    {coverage.missing.slice(0, 5).join(", ")}
                                    {coverage.missing.length > 5 &&
                                        ` +${coverage.missing.length - 5} más`}
                                </div>
                            )}
                        </div>
                        {!coverageOk && (
                            <ActionButton
                                variant="secondary"
                                size="sm"
                                onClick={() => onJumpToStep("obligatorios")}
                            >
                                Completar
                            </ActionButton>
                        )}
                    </div>

                    {/* ── Card resumen ──────────────────────────────────── */}
                    <Card title="Resumen de la publicación">
                        <div className="grid grid-cols-[140px_1fr] gap-6">
                            {/* Foto chica (portada) */}
                            <div>
                                <div className="aspect-square rounded-md border border-gray-200 bg-gray-50 overflow-hidden grid place-items-center">
                                    {primaryImg ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={primaryImg}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-gray-300 flex flex-col items-center gap-1">
                                            <ImageIcon className="w-7 h-7" />
                                            <span className="text-[10px]">Sin foto</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 text-center mt-1.5 tabular-nums">
                                    {state.images.length} imagen
                                    {state.images.length !== 1 ? "es" : ""}
                                </div>
                            </div>

                            {/* Datos en dl */}
                            <div className="min-w-0">
                                <dl className="grid grid-cols-[130px_1fr] gap-y-2.5 text-sm">
                                    <dt className="text-gray-500">Título</dt>
                                    <dd className="text-gray-900 font-semibold break-words">
                                        {title || "—"}
                                    </dd>

                                    <dt className="text-gray-500">Categoría</dt>
                                    <dd className="text-gray-700 break-words">
                                        {cat?.path || cat?.nombre || "—"}
                                    </dd>

                                    <dt className="text-gray-500">Precio</dt>
                                    <dd className="text-gray-900 font-semibold tabular-nums">
                                        ${price.toLocaleString("es-CL")} CLP
                                    </dd>

                                    <dt className="text-gray-500">Stock</dt>
                                    <dd className="text-gray-900 tabular-nums">
                                        {stock.toLocaleString("es-CL")} unidades
                                    </dd>

                                    <dt className="text-gray-500">Marca</dt>
                                    <dd className="text-gray-900">
                                        {state.sap?.marca ?? "—"}
                                    </dd>

                                    <dt className="text-gray-500">SKU interno</dt>
                                    <dd>
                                        <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs tabular-nums">
                                            {state.sku}
                                        </code>
                                    </dd>

                                    <dt className="text-gray-500">Canal</dt>
                                    <dd>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span
                                                className={`w-2 h-2 rounded-full ${
                                                    channel === "ml"
                                                        ? "bg-yellow-400"
                                                        : "bg-emerald-500"
                                                }`}
                                            />
                                            <span className="text-gray-900">
                                                {channel === "ml"
                                                    ? "MercadoLibre"
                                                    : "Falabella"}
                                            </span>
                                        </span>
                                    </dd>

                                    <dt className="text-gray-500">Fecha de publicación</dt>
                                    <dd className="text-gray-700">
                                        {fechaPublicacion}
                                    </dd>

                                    <dt className="text-gray-500">Atributos llenados</dt>
                                    <dd className="text-gray-700 tabular-nums">
                                        {filledAttrs.length} de {channelAttrs.length}
                                    </dd>

                                    <dt className="text-gray-500">Score de calidad</dt>
                                    <dd>
                                        <span
                                            className={[
                                                "tabular-nums font-semibold",
                                                coverage.pct >= 80
                                                    ? "text-emerald-700"
                                                    : coverage.pct >= 50
                                                      ? "text-amber-700"
                                                      : "text-rose-700",
                                            ].join(" ")}
                                        >
                                            {coverage.pct}/100
                                        </span>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </Card>

                    {/* ── Estado de publicación (solo ML) ───────────────── */}
                    {channel === "ml" && (
                        <Card title="Estado de publicación">
                            <div className="flex items-center gap-3">
                                <label
                                    htmlFor="ml-status"
                                    className="text-sm text-gray-600"
                                >
                                    Publicar como
                                </label>
                                <select
                                    id="ml-status"
                                    value={state.ml.status ?? "paused"}
                                    onChange={(e) =>
                                        wizard.updateField(
                                            "ml",
                                            "status",
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                                >
                                    <option value="paused">
                                        Pausado (revisar antes de activar)
                                    </option>
                                    <option value="active">
                                        Activo (visible al publicar)
                                    </option>
                                </select>
                            </div>
                            <p className="mt-2 text-xs text-gray-400">
                                Por defecto se publica pausado para que puedas
                                revisarlo en ML antes de activarlo.
                            </p>
                        </Card>
                    )}

                    {/* ── Bitácora de publicación (solo Falabella) ──────── */}
                    {channel === "fala" && state.sku && (
                        <Card title="Seguimiento de la publicación">
                            <BitacoraTimeline sku={state.sku} />
                        </Card>
                    )}

                    {/* ── Cierre — recordatorio acción ─────────────────── */}
                    <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
                        Cuando estés conforme, haz clic en{" "}
                        <strong className="text-blue-700">
                            Publicar a {channel === "ml" ? "ML" : "Falabella"}
                        </strong>{" "}
                        en la barra superior para abrir el modal de confirmación.
                    </div>
                </div>

                <ProgressSidebar
                    currentStep="revisar"
                    coverage={coverage}
                    channel={channel}
                    onJumpToStep={onJumpToStep}
                />
            </div>
        </div>
    );
}
