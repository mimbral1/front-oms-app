"use client";

// Tab "Precio" del detalle de SKU (/catalogo/skus/[id]/precio).
// Consolida las listas SAP y los precios publicados por marketplace en una
// sola grilla de comparación. Es read-only: no escribe a ninguna API.

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { formatCurrency } from "@/lib/format/money";
import { useSkuCore } from "@/features/catalogo/pages/SKUs/shared/sku-core";
import { useMarketplaceProductoDetailData } from "@/features/catalogo/pages/plataforma-ecommerce/shared/productos/base/hooks/useMarketplaceProductoDetailData";
import type { ProductDetail } from "@/features/catalogo/pages/plataforma-ecommerce/shared/productos/base/types/detail-types";

interface ApiPriceData {
    ItemCode: string;
    PriceList: number;
    Price: number;
    PriceIVA: number;
    MinQuantity: number;
    DateFrom: string | null;
    DateTo: string | null;
    ItemName: string;
    DateModified: string | null;
}

type PriceStatus = "Activo" | "Pausado" | "Cerrado" | "En revisión" | "Inactivo" | "—";

type PriceRow = {
    id: string;
    canal: string;
    lista: string;
    precioLista: number | null;
    precioVenta: number | null;
    moneda: string;
    estado: PriceStatus;
    tieneOferta?: boolean;
};

function toNumber(v: unknown): number | null {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function mapEstado(raw: unknown): PriceStatus {
    const estado = String(raw ?? "").toLowerCase().trim();
    if (["active", "activo", "published", "publicado"].includes(estado)) return "Activo";
    if (["paused", "pausado"].includes(estado)) return "Pausado";
    if (["closed", "cerrado"].includes(estado)) return "Cerrado";
    if (["under_review", "en revisión", "en revision", "revision"].includes(estado)) {
        return "En revisión";
    }
    if (["inactive", "inactivo"].includes(estado)) return "Inactivo";
    return "—";
}

function statusClass(status: PriceStatus): string {
    switch (status) {
        case "Activo":
            return "bg-[#58c957] text-white";
        case "Pausado":
            return "bg-amber-400 text-white";
        case "En revisión":
            return "bg-orange-500 text-white";
        case "Cerrado":
        case "Inactivo":
            return "bg-gray-500 text-white";
        default:
            return "bg-gray-100 text-gray-500";
    }
}

function StatusPill({ status }: { status: PriceStatus }) {
    return (
        <span
            className={`inline-flex min-w-24 items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold ${statusClass(
                status,
            )}`}
        >
            {status}
        </span>
    );
}

function PriceCell({ value, muted = false }: { value: number | null; muted?: boolean }) {
    return (
        <span className={`text-sm tabular-nums ${muted ? "text-gray-500" : "font-medium text-gray-800"}`}>
            {value == null ? "—" : formatCurrency(value)}
        </span>
    );
}

function marketplaceRow(
    id: string,
    canal: string,
    product: ProductDetail | null,
): PriceRow | null {
    if (!product) return null;
    const campos = product.campos_basicos || {};
    const precioLista = toNumber(campos.precio?.valor);
    const ofertaCampo = toNumber(
        (campos as Record<string, { valor?: unknown }>).oferta?.valor,
    );
    const ofertaMeta = product.meta?.tiene_oferta
        ? toNumber(product.meta.oferta_precio)
        : null;
    const precioVenta = ofertaMeta ?? ofertaCampo ?? precioLista;

    return {
        id,
        canal,
        lista: "Marketplace",
        precioLista,
        precioVenta,
        moneda: "CLP",
        estado: mapEstado(campos.estado?.valor),
        tieneOferta: precioVenta != null && precioLista != null && precioVenta !== precioLista,
    };
}

export default function PrecioSKUsView() {
    const router = useRouter();
    const params = useParams<{ id?: string }>();
    const sku = params?.id;
    const { core } = useSkuCore(sku);

    const { fetchWithAuth, token } = useFetchWithAuth();
    const [sapRows, setSapRows] = useState<PriceRow[]>([]);
    const [sapLoading, setSapLoading] = useState(true);
    const [sapError, setSapError] = useState<string | null>(null);

    useEffect(() => {
        if (!sku) {
            setSapLoading(false);
            return;
        }
        if (!token) return;

        let cancelled = false;
        const load = async () => {
            setSapLoading(true);
            setSapError(null);
            try {
                const res = await fetchWithAuth<{ data: ApiPriceData[] }>(
                    `catalog/listprices?itemCode=${sku}`,
                );
                if (cancelled) return;
                const rows = (res?.data ?? [])
                    .map<PriceRow>((price, index) => ({
                        id: `sap:${price.PriceList}:${index}`,
                        canal: "SAP",
                        lista: `Lista ${price.PriceList}`,
                        precioLista: toNumber(price.Price),
                        precioVenta: toNumber(price.PriceIVA),
                        moneda: "CLP",
                        estado: core?.status ?? "—",
                    }))
                    .sort((a, b) => Number(a.lista.replace(/\D/g, "")) - Number(b.lista.replace(/\D/g, "")));
                setSapRows(rows);
            } catch (err: any) {
                if (cancelled) return;
                setSapError(err?.message || "No se pudieron cargar los precios SAP.");
                setSapRows([]);
            } finally {
                if (!cancelled) setSapLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [sku, token, fetchWithAuth, core?.status]);

    const ml = useMarketplaceProductoDetailData(sku, "ml");
    const fala = useMarketplaceProductoDetailData(sku, "falabella");

    const rows = useMemo<PriceRow[]>(() => {
        const marketplaceRows = [
            marketplaceRow("ml", "Mercado Libre", ml.product),
            marketplaceRow("falabella", "Falabella", fala.product),
        ].filter((row): row is PriceRow => row != null);

        return [...sapRows, ...marketplaceRows];
    }, [sapRows, ml.product, fala.product]);

    const titulo = useMemo(() => {
        if (core?.nombre) return core.nombre;
        const title =
            ml.product?.campos_basicos?.titulo?.valor ??
            fala.product?.campos_basicos?.titulo?.valor;
        return (title ? String(title) : sku ?? "") || "Precio";
    }, [core?.nombre, ml.product, fala.product, sku]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/skus"),
            },
        ],
        [router],
    );

    usePageHeader(
        () =>
            ({
                title: (
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            SKU
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-semibold text-gray-900">{titulo}</div>
                            {core?.status && <StatusPill status={core.status} />}
                        </div>
                    </div>
                ),
                action: headerActions,
            } as PageHeaderProps),
        [titulo, core?.status, headerActions],
    );

    const loading = sapLoading || ml.loading || fala.loading;

    return (
        <div className="min-h-full bg-[#e8eaf5] p-6">
            {sapError && (
                <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    No se pudieron cargar los precios SAP.
                    <span className="ml-1 text-rose-500">{sapError}</span>
                </div>
            )}

            <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-white">
                                {["Canal", "Lista", "Precio lista", "Precio venta", "Moneda", "Estado"].map(
                                    (header) => (
                                        <th
                                            key={header}
                                            className="px-5 py-4 text-left text-xs font-semibold text-gray-500"
                                        >
                                            {header}
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-gray-500">
                                        <span className="inline-flex items-center">
                                            <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                                            Cargando precios…
                                        </span>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-gray-500">
                                        Sin precios disponibles para este SKU.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-gray-200 bg-white transition-colors last:border-b-0 hover:bg-blue-50/40"
                                    >
                                        <td className="px-5 py-5 text-sm font-medium text-gray-800">{row.canal}</td>
                                        <td className="px-5 py-5 text-sm text-gray-600">{row.lista}</td>
                                        <td className="px-5 py-5">
                                            <PriceCell value={row.precioLista} muted={row.tieneOferta} />
                                        </td>
                                        <td className="px-5 py-5">
                                            <div className="flex items-center gap-2">
                                                <PriceCell value={row.precioVenta} />
                                                {row.tieneOferta && (
                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                                                        Oferta
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 text-sm text-gray-600">{row.moneda}</td>
                                        <td className="px-5 py-5">
                                            <StatusPill status={row.estado} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
