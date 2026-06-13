"use client";

import { useState } from "react";
import {
    ArrowPathIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { BASE_ANALYSIS_SERVICE_CATALOGO } from "@/lib/http/endpoints";

// Endpoint: backend analysis-competitors (POST /links/externos)
// Body: { url_mimbral, urls[] } -> proxy a back-pricing /scrape/multiple +
// escritura local best-effort + trigger sync de fondo.
const ADD_PRODUCT_URL = `${BASE_ANALYSIS_SERVICE_CATALOGO}/links/externos`;

interface AgregarProductoModalProps {
    open: boolean;
    onClose: () => void;
    /** Se llama tras agregar OK con el SKU del nuevo producto Mimbral; útil para
     *  prepend al listado. */
    onSuccess?: (sku: string) => void;
}

export default function AgregarProductoModal({
    open,
    onClose,
    onSuccess,
}: AgregarProductoModalProps) {
    const [urlMimbral, setUrlMimbral] = useState("");
    const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [feedbackType, setFeedbackType] = useState<"success" | "error" | null>(null);

    if (!open) return null;

    const reset = () => {
        setUrlMimbral("");
        setCompetitorUrls([""]);
        setFeedback(null);
        setFeedbackType(null);
    };

    const closeAndReset = () => {
        if (submitting) return;
        onClose();
        setTimeout(reset, 200);
    };

    const updateCompetitor = (index: number, value: string) => {
        setCompetitorUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
    };

    const addCompetitorRow = () => setCompetitorUrls((prev) => [...prev, ""]);

    const removeCompetitorRow = (index: number) => {
        setCompetitorUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        const mimbral = urlMimbral.trim();
        const urls = competitorUrls.map((u) => u.trim()).filter(Boolean);

        if (!mimbral) {
            setFeedbackType("error");
            setFeedback("Ingresá la URL del producto en mimbral.cl.");
            return;
        }
        if (urls.length === 0) {
            setFeedbackType("error");
            setFeedback("Ingresá al menos una URL de competidor.");
            return;
        }

        setSubmitting(true);
        setFeedback(null);
        setFeedbackType(null);

        try {
            const response = await fetch(ADD_PRODUCT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ url_mimbral: mimbral, urls }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.exito) {
                throw new Error(
                    payload?.error || `No se pudo agregar el producto (${response.status}).`
                );
            }

            setFeedbackType("success");
            const v = payload?.visibilidad;
            const newSku: string =
                payload?.datos?.producto_mimbral?.producto?.sku || "";
            setFeedback(
                v?.localApplied
                    ? `Producto agregado (sku ${newSku || v.idMimbral}, ${v.competidoresEscritos} competidores). Visible al instante.`
                    : "Producto enviado. Va a aparecer cuando termine el sync de fondo."
            );
            if (onSuccess && newSku) onSuccess(newSku);
            setTimeout(() => {
                onClose();
                reset();
            }, 1500);
        } catch (e: any) {
            setFeedbackType("error");
            setFeedback(e?.message || "Error al agregar el producto.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={closeAndReset}
            />
            <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Agregar producto nuevo
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                            Scrapea la URL de mimbral.cl + URLs de competidores. Se ve al instante
                            en la lista.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={closeAndReset}
                        disabled={submitting}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                        aria-label="Cerrar"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            URL del producto en mimbral.cl
                        </label>
                        <input
                            type="url"
                            value={urlMimbral}
                            onChange={(e) => setUrlMimbral(e.target.value)}
                            disabled={submitting}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="https://www.mimbral.cl/producto/p"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            URLs de competidores (al menos 1)
                        </label>
                        <div className="space-y-2">
                            {competitorUrls.map((u, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="url"
                                        value={u}
                                        onChange={(e) => updateCompetitor(i, e.target.value)}
                                        disabled={submitting}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="https://www.competidor.cl/producto"
                                    />
                                    {competitorUrls.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCompetitorRow(i)}
                                            disabled={submitting}
                                            className="rounded p-1 text-red-600 hover:bg-red-50"
                                            title="Quitar URL"
                                            aria-label="Quitar URL"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addCompetitorRow}
                            disabled={submitting}
                            className="mt-2 inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Añadir competidor
                        </button>
                    </div>

                    {submitting && (
                        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                            <ArrowPathIcon className="mr-1 inline h-4 w-4 animate-spin" />
                            Scrapeando producto y competidores... puede tardar hasta 1 minuto.
                        </div>
                    )}

                    {feedback && (
                        <p
                            className={`text-xs ${
                                feedbackType === "success" ? "text-green-700" : "text-red-600"
                            }`}
                        >
                            {feedback}
                        </p>
                    )}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={closeAndReset}
                        disabled={submitting}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {submitting ? "Agregando..." : "Agregar producto"}
                    </button>
                </div>
            </div>
        </div>
    );
}
