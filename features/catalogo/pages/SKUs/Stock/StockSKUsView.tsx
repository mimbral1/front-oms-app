"use client";

// Tab "Stock" del detalle de SKU (/catalogo/skus/[id]/stock).
//
// Muestra SOLO el stock REAL por bodega — desglose físico por bodega (inventory
// endpoint abierto). Incluye las bodegas FULL ("05 Envios FULL - Mercado Libre",
// "14 Envios FULL - Falabella") como cualquier otra bodega física.
//
// El stock publicado por canal (MercadoLibre / Falabella) vive en la pestaña
// Plataformas; aquí sería redundante y se omite a propósito.
//
// Read-only: no escribe a ningún API. El campo "Stock" nativo de la pantalla
// se muestra solo como lectura (no hay input editable aquí).

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, XCircleIcon } from "@heroicons/react/24/outline";

import { DataTable, Column } from "@/components/ui/table";
import { useSkuCore } from "@/features/catalogo/pages/SKUs/shared/sku-core";
import {
    fetchInventoryStock,
    type WarehouseStockRow,
} from "@/features/catalogo/pages/SKUs/shared/inventory-stock";

/* ===============================
   TIPOS
   =============================== */

interface StockRow {
    almacen: string; // "Control de Perdida"
    codigo: string; // "04"
    stockFisico: number | null;
    reservado: number | null;
    bloqueado: number | null;
    disponible: number | null;
    transito: number | null;
}

/* ===============================
   HELPERS
   =============================== */

function fmtNum(n: number | null): string {
    return n != null && Number.isFinite(n) ? n.toLocaleString("es-CL") : "—";
}

// Quita el prefijo de código del nombre de la bodega:
// "04  Control de Perdida" → "Control de Perdida". "Centro Comercial" se queda igual.
function cleanAlmacen(name?: string | null, code?: string | null): string {
    const n = (name ?? "").trim();
    const c = (code ?? "").trim();
    if (c && n.startsWith(c)) return n.slice(c.length).trim() || n;
    return n;
}

/* ===============================
   COLUMNAS
   =============================== */

const numCell = (key: keyof StockRow) => (r: StockRow) => (
    <span className="text-sm text-gray-700 tabular-nums">{fmtNum(r[key] as number | null)}</span>
);

const getColumns = (): Column<StockRow>[] => [
    {
        header: "Almacén",
        accessorKey: "almacen",
        cell: (r) => (
            <span className="text-sm font-medium text-gray-900">{r.almacen}</span>
        ),
    },
    {
        header: "Código",
        accessorKey: "codigo",
        cell: (r) => <span className="text-sm text-gray-600 tabular-nums">{r.codigo || "—"}</span>,
    },
    { header: "Stock físico", accessorKey: "stockFisico", cell: numCell("stockFisico") },
    { header: "Reservado", accessorKey: "reservado", cell: numCell("reservado") },
    { header: "Bloqueado", accessorKey: "bloqueado", cell: numCell("bloqueado") },
    { header: "Disponible", accessorKey: "disponible", cell: numCell("disponible") },
    { header: "En tránsito", accessorKey: "transito", cell: numCell("transito") },
];

/* ===============================
   COMPONENTE
   =============================== */

export default function StockSKUsView() {
    const router = useRouter();
    const params = useParams<{ id?: string }>();
    const sku = params?.id ?? "";

    const { core } = useSkuCore(sku);

    // Stock físico por bodega (endpoint abierto, array plano).
    const [bodega, setBodega] = useState<WarehouseStockRow[]>([]);
    const [loadingB, setLoadingB] = useState(true);
    const [errorB, setErrorB] = useState<string | null>(null);

    useEffect(() => {
        if (!sku) return;
        let alive = true;
        setLoadingB(true);
        fetchInventoryStock(sku)
            .then((r) => {
                if (alive) {
                    setBodega(r);
                    setErrorB(null);
                }
            })
            .catch((e) => {
                if (alive) setErrorB(e?.message || "Error de stock");
            })
            .finally(() => {
                if (alive) setLoadingB(false);
            });
        return () => {
            alive = false;
        };
    }, [sku]);

    const rows = useMemo<StockRow[]>(() => {
        return bodega.map((w) => ({
            almacen: cleanAlmacen(w.warehouseName, w.warehouseReferenceId) || w.warehouse,
            codigo: (w.warehouseReferenceId ?? "").trim(),
            stockFisico: w.stock,
            reservado: w.reservedStock,
            bloqueado: w.securityStock,
            disponible: w.availableStock,
            transito: w.inTransit,
        }));
    }, [bodega]);

    const loading = loadingB;
    const columns = useMemo(() => getColumns(), []);

    const nombre = core?.nombre || sku || "Stock";

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
                        <div className="text-2xl font-semibold text-gray-900">{nombre}</div>
                    </div>
                ),
                action: headerActions,
            } as PageHeaderProps),
        [nombre, headerActions],
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <div className="flex-1 p-6">
                {loading ? (
                    <div className="flex items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                        <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                        Cargando stock…
                    </div>
                ) : errorB && rows.length === 0 ? (
                    <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-10 text-center text-sm text-rose-700">
                        No se pudo cargar el stock por bodega.
                        <span className="mt-1 block text-xs text-rose-500">{errorB}</span>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-md border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">
                        Este SKU no tiene stock en bodegas.
                    </div>
                ) : (
                    <div className="space-y-6">
                        <DataTable
                            data={rows}
                            columns={columns}
                            dataType="General2"
                            rowPaddingY={12}
                            showStatusBorder={false}
                            rowBgClass="bg-white"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
