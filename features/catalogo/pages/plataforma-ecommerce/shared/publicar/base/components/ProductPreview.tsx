// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/components/ProductPreview.tsx
//
// Preview de cómo se verá la publicación en el marketplace. Lee del shape
// canonical `state.ml`/`state.fala` (no del state plano viejo).
//
// Look OMS: Card con title + lucide ImageIcon.

"use client";

import { ImageIcon } from "lucide-react";
import { Card } from "@/components/ui";
import type { PublicarChannel, PublicarState } from "../types/publicar-types";

export interface ProductPreviewProps {
    state: PublicarState;
    channel: PublicarChannel;
}

export function ProductPreview({ state, channel }: ProductPreviewProps) {
    const primaryImg =
        state.images[0]?.secureUrl ??
        state.images[0]?.url ??
        state.images[0]?.dataUrl ??
        null;
    const cat = channel === "ml" ? state.category : state.categoryFala;

    // Slot canonical según canal.
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
    const condition = channel === "ml" ? state.ml.condition : null;
    const falaStatus = channel === "fala" ? state.fala.Status : null;

    return (
        <Card
            title={`Vista previa · ${channel === "ml" ? "MercadoLibre" : "Falabella"}`}
        >
            <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                <div className="aspect-[4/3] bg-gray-100 grid place-items-center overflow-hidden">
                    {primaryImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={primaryImg}
                            alt={title}
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="text-center text-gray-400">
                            <ImageIcon className="w-10 h-10 mx-auto" />
                            <p className="text-xs mt-1">Sin imagen</p>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    {cat?.path && (
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                            {cat.path}
                        </div>
                    )}
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2 min-h-[2.6em]">
                        {title || "Sin título"}
                    </h3>

                    <div className="mt-3">
                        <div className="text-2xl font-semibold tabular-nums text-gray-900">
                            ${price.toLocaleString("es-CL")}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-xs">
                        {channel === "ml" && condition === "new" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 text-[10.5px] font-semibold uppercase tracking-wide">
                                Nuevo
                            </span>
                        )}
                        {channel === "ml" && condition === "used" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 text-[10.5px] font-semibold uppercase tracking-wide">
                                Usado
                            </span>
                        )}
                        {channel === "ml" && condition === "refurbished" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200 text-[10.5px] font-semibold uppercase tracking-wide">
                                Reacondicionado
                            </span>
                        )}
                        {channel === "fala" && falaStatus === "active" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 text-[10.5px] font-semibold uppercase tracking-wide">
                                Activo
                            </span>
                        )}
                        {channel === "fala" && falaStatus === "inactive" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200 text-[10.5px] font-semibold uppercase tracking-wide">
                                Inactivo
                            </span>
                        )}
                        <span className="text-gray-500">
                            Stock disp.{" "}
                            <span className="tabular-nums text-gray-900 font-medium">
                                {stock}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            <p className="mt-2 text-xs text-gray-400">
                Vista aproximada — el render real depende del template del marketplace.
            </p>
        </Card>
    );
}
