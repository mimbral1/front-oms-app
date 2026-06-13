"use client";

// Tab "Plataformas" del detalle de SKU (/catalogo/skus/[id]/plataformas).
//
// Muestra UNA fila por canal donde el SKU está publicado: MercadoLibre y
// Falabella. Si el SKU no está en un canal, NO aparece fila (queda "vacío").
// Los datos salen de pim (BFF): GET /api/pim/productos/:sku/detalle?marketplace=ml|falabella
// vía el hook compartido useMarketplaceProductoDetailData (404 = no publicado ahí).
//
// Read-only: no escribe a ML/Falabella. (El componente de almacén StockPlataformas
// quedó intacto: lo comparte /almacen/inventario/stock.)

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ArrowPathIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useMarketplaceProductoDetailData } from "@/features/catalogo/pages/plataforma-ecommerce/shared/productos/base/hooks/useMarketplaceProductoDetailData";
import type { ProductDetail } from "@/features/catalogo/pages/plataforma-ecommerce/shared/productos/base/types/detail-types";

const PER_PAGE = 20;

type EstadoPill =
    | "Activo"
    | "Pausado"
    | "Cerrado"
    | "En revisión"
    | "Borrador"
    | "Error"
    | "—";

type PlataformaRow = {
    id: string;
    platform: string; // "Vtex" | "MercadoLibre" | "Falabella"
    channelSku: string; // SKU del canal (Mimbral)
    nombre: string; // nombre de producto
    isActive: "Activo" | "Inactivo";
    category: string;
    price: number | null;
    stock: number | null;
    modifiedAt: string;
    userName: string; // vacío para marketplaces (no traen "quién editó")
    status: EstadoPill;
};

/* ---------------- HELPERS ---------------- */

function fmtFecha(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function mapEstado(raw: unknown): EstadoPill {
    const s = String(raw ?? "").toLowerCase().trim();
    if (["active", "activo", "published", "publicado"].includes(s)) return "Activo";
    if (["paused", "pausado"].includes(s)) return "Pausado";
    if (["closed", "cerrado", "inactive", "inactivo"].includes(s)) return "Cerrado";
    if (["under_review", "en revisión", "en revision", "revision"].includes(s)) return "En revisión";
    if (["draft", "borrador"].includes(s)) return "Borrador";
    if (s.includes("error")) return "Error";
    return raw ? (String(raw) as EstadoPill) : "—";
}

function pillClass(status: EstadoPill): string {
    switch (status) {
        case "Activo":
            return "bg-green-500";
        case "Pausado":
            return "bg-yellow-400";
        case "En revisión":
            return "bg-amber-500";
        case "Borrador":
            return "bg-blue-500";
        case "Cerrado":
            return "bg-gray-500";
        case "Error":
            return "bg-red-500";
        default:
            return "bg-gray-400";
    }
}

const StatusPill = ({ status }: { status: EstadoPill }) => (
    <span
        className={`self-start inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-white ${pillClass(
            status,
        )}`}
    >
        {status}
    </span>
);

/** Convierte el detalle pim de un canal en una fila de la tabla (null = no publicado). */
function detalleToRow(platform: string, d: ProductDetail | null): PlataformaRow | null {
    if (!d) return null;
    const cb = d.campos_basicos || {};
    const titulo = cb.titulo?.valor != null ? String(cb.titulo.valor) : "";
    const precioRaw = cb.precio?.valor;
    const price =
        precioRaw != null && Number.isFinite(Number(precioRaw)) ? Number(precioRaw) : null;
    const stockRaw = cb.stock?.valor;
    const stock =
        stockRaw != null && Number.isFinite(Number(stockRaw)) ? Number(stockRaw) : null;
    const estado = mapEstado(cb.estado?.valor);
    // SKU del canal = SKU Mimbral (seller_sku), no el id de la publicación (MLC…/feed id).
    const sku = d.seller_sku || d.seller_custom_field || d.sku || "";
    // Categoría en palabras. ML resuelve el nombre en meta.categoria_nombre (árbol
    // de categorías); si no lo tiene, cae al id. Falabella ya trae el nombre.
    const anyD = d as unknown as {
        categoria_marketplace?: { nombre?: string; name?: string } | null;
        meta?: { categoria_nombre?: string | null };
    };
    const category =
        anyD.categoria_marketplace?.nombre ??
        anyD.categoria_marketplace?.name ??
        anyD.meta?.categoria_nombre ??
        d.meta?.category_id ??
        "—";
    return {
        id: `${platform}:${sku || d.item_id || d.sku}`,
        platform,
        channelSku: sku || "—",
        nombre: titulo || "—",
        isActive: estado === "Activo" ? "Activo" : "Inactivo",
        category: String(category || "—"),
        price,
        stock,
        modifiedAt: fmtFecha(d.meta?.last_updated),
        userName: "",
        status: estado,
    };
}

/* ---------------- COLUMNAS ---------------- */

const getColumns = (): Column<PlataformaRow>[] => [
    {
        header: "Plataforma",
        accessorKey: "platform",
        cell: (r) => <span className="text-sm text-gray-700">{r.platform}</span>,
    },
    {
        header: "SKU Canal",
        accessorKey: "channelSku",
        cell: (r) => (
            <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-blue-600 tabular-nums">{r.channelSku}</span>
                <span className="text-xs text-gray-500">{r.nombre}</span>
            </div>
        ),
    },
    {
        header: "Activo",
        accessorKey: "isActive",
        cell: (r) => <span className="text-sm text-gray-600">{r.isActive}</span>,
    },
    {
        header: "Categoría",
        accessorKey: "category",
        cell: (r) => <span className="text-sm font-medium text-blue-500">{r.category}</span>,
    },
    {
        header: "Precio",
        accessorKey: "price",
        cell: (r) => (
            <span className="text-sm text-gray-600 tabular-nums">
                {r.price != null ? `$${Math.round(r.price).toLocaleString("es-CL")}` : "—"}
            </span>
        ),
    },
    {
        header: "Stock",
        accessorKey: "stock",
        cell: (r) => (
            <span className="text-sm text-gray-600 tabular-nums">
                {r.stock != null ? r.stock.toLocaleString("es-CL") : "—"}
            </span>
        ),
    },
    {
        header: "Modificado",
        accessorKey: "modifiedAt",
        cell: (r) => <span className="text-sm text-gray-600">{r.modifiedAt}</span>,
    },
    {
        header: "Usuario",
        accessorKey: "userName",
        cell: (r) => <span className="text-sm text-gray-400">{r.userName || "—"}</span>,
    },
    {
        header: "Estado",
        accessorKey: "status",
        cell: (r) => <StatusPill status={r.status} />,
    },
];

/* ---------------- COMPONENTE ---------------- */

export default function PlataformasSKUsView() {
    const router = useRouter();
    const params = useParams<{ id?: string }>();
    const sku = params?.id; // ruta [id] → un solo segmento (string)

    // Detalle por canal (read-only). 404 → product null → no se arma fila.
    // Vtex: hoy pim devuelve null (no habilitado) → no aparece fila; cuando se
    // habilite, el chip y la fila aparecen solos sin tocar este componente.
    const ml = useMarketplaceProductoDetailData(sku, "ml");
    const fala = useMarketplaceProductoDetailData(sku, "falabella");
    const vtex = useMarketplaceProductoDetailData(sku, "vtex");

    const loading = ml.loading || fala.loading || vtex.loading;

    const rows = useMemo<PlataformaRow[]>(
        () =>
            [
                detalleToRow("Vtex", vtex.product),
                detalleToRow("MercadoLibre", ml.product),
                detalleToRow("Falabella", fala.product),
            ].filter((r): r is PlataformaRow => r !== null),
        [vtex.product, ml.product, fala.product],
    );

    // Distingue "no publicado" (404, esperado) de un fallo real (pim caído / 500),
    // para no mostrar "sin publicaciones" cuando en realidad no se pudo cargar.
    const loadError = useMemo(() => {
        const errs = [ml.error, fala.error, vtex.error].filter((e): e is string => !!e);
        const reales = errs.filter((e) => !/\b404\b/.test(e));
        return reales.length > 0 ? reales[0] : null;
    }, [ml.error, fala.error, vtex.error]);

    // Filtro por canal (chips dinámicos): se arman desde los canales presentes
    // en las filas, así Vtex aparece solo cuando hay publicación.
    const [canal, setCanal] = useState<string>("todos");
    const canales = useMemo(
        () => Array.from(new Set(rows.map((r) => r.platform))),
        [rows],
    );
    const filteredRows = useMemo(
        () => (canal === "todos" ? rows : rows.filter((r) => r.platform === canal)),
        [rows, canal],
    );

    const columns = useMemo(() => getColumns(), []);

    // Paginación (local — pocas filas, pero mantenemos el patrón). Opera sobre
    // las filas filtradas por canal.
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [canal]);
    const totalRecords = filteredRows.length;
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [filteredRows, currentPage]);

    // Header del SKU (toma el título de cualquier canal que haya respondido).
    const nombre = useMemo(() => {
        const t =
            ml.product?.campos_basicos?.titulo?.valor ??
            fala.product?.campos_basicos?.titulo?.valor ??
            vtex.product?.campos_basicos?.titulo?.valor;
        return (t ? String(t) : sku ?? "") || "Plataformas";
    }, [ml.product, fala.product, vtex.product, sku]);

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
        <div className="p-6">
            {loading ? (
                <div className="flex items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                    <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                    Cargando plataformas…
                </div>
            ) : rows.length === 0 && loadError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-10 text-center text-sm text-rose-700">
                    No se pudieron cargar las publicaciones (¿está arriba pim?).
                    <span className="mt-1 block text-xs text-rose-500">{loadError}</span>
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-md border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">
                    Este SKU no tiene publicaciones en MercadoLibre ni Falabella.
                </div>
            ) : (
                <>
                    {/* Chips de canal (dinámicos): "Todos" + un chip por canal presente. */}
                    <div
                        role="tablist"
                        aria-label="Filtrar por canal"
                        className="mb-4 flex flex-wrap items-center gap-2"
                    >
                        {["todos", ...canales].map((c) => {
                            const active = canal === c;
                            const label = c === "todos" ? "Todos" : c;
                            return (
                                <button
                                    key={c}
                                    role="tab"
                                    aria-selected={active}
                                    type="button"
                                    onClick={() => setCanal(c)}
                                    className={[
                                        "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition-all",
                                        "focus:outline-none focus:ring-2 focus:ring-blue-200",
                                        active
                                            ? "border-blue-500 bg-white text-blue-700"
                                            : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                                    ].join(" ")}
                                >
                                    <span
                                        className={[
                                            "inline-block h-2.5 w-2.5 rounded-full ring-2 transition-all",
                                            active
                                                ? "bg-blue-600 ring-blue-600"
                                                : "bg-white ring-gray-300 group-hover:ring-blue-400",
                                        ].join(" ")}
                                    />
                                    <span className="whitespace-nowrap">{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {filteredRows.length === 0 && canal !== "todos" ? (
                        <div className="rounded-md border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">
                            Sin publicación en {canal}.
                        </div>
                    ) : (
                        <>
                            <DataTable
                                data={paginatedRows}
                                columns={columns}
                                dataType="General2"
                                rowPaddingY={16}
                                rowBgClass="bg-white"
                            />
                            <Pagination
                                currentPage={currentPage}
                                totalRecords={totalRecords}
                                pageSize={PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
