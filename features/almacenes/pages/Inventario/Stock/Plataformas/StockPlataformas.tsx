// views\Almacen\Inventario\Stock\Plataformas\StockPlataformas.tsx
"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type {
    Action,
    PageHeaderProps,
} from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { useFetchWithAuth } from "@/lib/http/client";

import {
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

type PlatformKey = "vtex";

type PublishStatus = "Publicado" | "Error";

type PlataformaRow = {
    id: string;
    platform: string;
    skuChannel: string;
    isActive: "Activo" | "Inactivo";
    category: string;
    price: number;
    modifiedAt: string;
    userName: string;
    userEmail: string;
    status: "Activo" | "Pendiente" | "Publicado" | "Error" | "Borrador";
};

type CatalogProductResponse = {
    Name?: string | null;
};

const PER_PAGE = 20;

/* ---------------- MOCK DATA ---------------- */

const MOCK_ROWS: PlataformaRow[] = [
    {
        id: "1",
        platform: "Vtex",
        skuChannel: "001001016 - Cemento 25 kg Polpaico",
        isActive: "Activo",
        category: "Materiales de Construccion > Morteros y Aditivos > Cementos",
        price: 0,
        modifiedAt: "14/05/2024 11:33",
        userName: "Ariel Mikowski",
        userEmail: "ariel.mikowski@...",
        status: "Activo",
    },
    {
        id: "2",
        platform: "MercadoLibre",
        skuChannel: "MLC001001016 - Auriculares Inalambricos Aiwa AW-BT301 Negro",
        isActive: "Inactivo",
        category: "Materiales de Construccion > Materias de obra gruesa > Cemento",
        price: 0,
        modifiedAt: "14/05/2024 11:33",
        userName: "Ariel Mikowski",
        userEmail: "ariel.mikowski@...",
        status: "Pendiente",
    },
    {
        id: "3",
        platform: "Falabella",
        skuChannel: "001001016 - Auriculares Inalambricos Aiwa AW-BT301 Negro",
        isActive: "Inactivo",
        category: "Materiales de Construccion > Cemento, Morteros y Aditivos > Cementos",
        price: 0,
        modifiedAt: "14/05/2024 11:33",
        userName: "Ariel Mikowski",
        userEmail: "ariel.mikowski@...",
        status: "Publicado",
    },
    {
        id: "4",
        platform: "Retail Pro",
        skuChannel: "21198916 - Auriculares Inalambricos Aiwa AW-BT301 Negro",
        isActive: "Activo",
        category: "Materiales de Construccion > Morteros y Aditivos > Cementos",
        price: 0,
        modifiedAt: "14/05/2024 11:33",
        userName: "Ariel Mikowski",
        userEmail: "ariel.mikowski@...",
        status: "Error",
    },
    {
        id: "5",
        platform: "Vtex",
        skuChannel: "001001016 - Cemento 25 kg Polpaico",
        isActive: "Activo",
        category: "Materiales de Construccion > Morteros y Aditivos > Cementos",
        price: 0,
        modifiedAt: "14/05/2024 11:33",
        userName: "Ariel Mikowski",
        userEmail: "ariel.mikowski@...",
        status: "Borrador",
    },
];

/* ---------------- UI HELPERS ---------------- */

const getStatusClass = (status: PlataformaRow["status"]) => {
    switch (status) {
        case "Activo":
            return "bg-green-500";
        case "Pendiente":
            return "bg-yellow-400";
        case "Publicado":
            return "bg-lime-500";
        case "Borrador":
            return "bg-blue-500";
        case "Error":
            return "bg-red-500";
        default:
            return "bg-gray-500";
    }
};

const StatusPill = ({ status }: { status: PlataformaRow["status"] }) => (
    <span
        className={`self-start inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-white ${getStatusClass(
            status
        )}`}
    >
        {status}
    </span>
);

const getColumns = (): Column<PlataformaRow>[] => [
    {
        header: "Plataforma",
        accessorKey: "platform",
        cell: (r) => (
            <span className="text-sm text-gray-700">{r.platform}</span>
        ),
    },
    {
        header: "SKU Canal",
        accessorKey: "skuChannel",
        cell: (r) => (
            <span className="text-sm font-medium text-blue-500">
                {r.skuChannel}
            </span>
        ),
    },
    {
        header: "Activo",
        accessorKey: "isActive",
        cell: (r) => (
            <span className="text-sm text-gray-600">{r.isActive}</span>
        ),
    },
    {
        header: "Categoría",
        accessorKey: "category",
        cell: (r) => (
            <span className="text-sm font-medium text-blue-500">
                {r.category}
            </span>
        ),
    },
    {
        header: "Precio",
        accessorKey: "price",
        cell: (r) => (
            <span className="text-sm text-gray-600">{r.price}</span>
        ),
    },
    {
        header: "Modificado",
        accessorKey: "modifiedAt",
        cell: (r) => (
            <span className="text-sm text-gray-600">{r.modifiedAt}</span>
        ),
    },
    {
        header: "Usuario",
        accessorKey: "userName",
        cell: (r) => (
            <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                    AM
                </span>
                <div className="flex flex-col leading-tight">
                    <span className="text-sm text-gray-500">{r.userName}</span>
                    <span className="text-sm text-gray-400">{r.userEmail}</span>
                </div>
            </div>
        ),
    },
    {
        header: "Estado",
        accessorKey: "status",
        cell: (r) => (
            <StatusPill status={r.status} />
        ),
    },
];

/* ---------------- COMPONENTE PRINCIPAL ---------------- */

const StockPlataformas: React.FC = () => {
    const router = useRouter();
    const params = useParams<{ id?: string }>();
    const { fetchWithAuth } = useFetchWithAuth();
    const stockId = params?.id;

    const [saving, setSaving] = useState(false);
    const [headerName, setHeaderName] = useState("");

    // selector de plataforma 
    const [platform, setPlatform] = useState<PlatformKey>("vtex");

    const [rows] = useState<PlataformaRow[]>(MOCK_ROWS);
    const columns = useMemo(() => getColumns(), []);

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(n, max));

    const filteredRows = useMemo(() => {
        const selected = platform.toLowerCase();
        return rows.filter((r) => r.platform.toLowerCase() === selected);
    }, [rows, platform]);

    useEffect(() => {
        const total = filteredRows.length;
        const pages = Math.max(1, Math.ceil(total / PER_PAGE));
        setTotalRecords(total);
        setTotalPages(pages);
        setCurrentPage((p) => clamp(p, 1, pages));
    }, [filteredRows]);

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [filteredRows, currentPage]);

    useEffect(() => {
        if (!stockId || typeof stockId !== "string") {
            setHeaderName("");
            return;
        }

        let cancelled = false;

        const loadHeader = async () => {
            try {
                const product = await fetchWithAuth<CatalogProductResponse>(
                    `catalog/products/${encodeURIComponent(stockId)}`,
                    { method: "GET" }
                );

                if (!cancelled) {
                    setHeaderName((product?.Name || "").trim());
                }
            } catch {
                if (!cancelled) {
                    setHeaderName("");
                }
            }
        };

        loadHeader();

        return () => {
            cancelled = true;
        };
    }, [stockId, fetchWithAuth]);

    /* ----------- ACCIONES HEADER ----------- */

    const handleApply = useCallback(async () => {
        try {
            setSaving(true);
            await new Promise((resolve) => setTimeout(resolve, 600));
            // aquí iría PATCH de plataformas
        } finally {
            setSaving(false);
        }
    }, []);

    const handleSave = useCallback(async () => {
        try {
            setSaving(true);
            await new Promise((resolve) => setTimeout(resolve, 800));
            // aquí iría PUT de plataformas
        } finally {
            setSaving(false);
        }
    }, []);

    const handleSaveAndNew = useCallback(async () => {
        try {
            setSaving(true);
            await new Promise((resolve) => setTimeout(resolve, 800));
            router.push("/catalogo/skus/nuevo");
        } finally {
            setSaving(false);
        }
    }, [router]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                ),
                onClick: handleApply,
                // disabled: saving,
                disabled: true,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <SaveOutlined className="h-4 w-4" />
                ),
                onClick: handleSave,
                // disabled: saving,
                disabled: true,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <SaveOutlined className="h-4 w-4" />
                ),
                onClick: handleSaveAndNew,
                // disabled: saving,
                disabled: true,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/inventario/stock"),
                disabled: saving,
            },
        ],
        [handleApply, handleSave, handleSaveAndNew, router, saving]
    );

    const headerActive = true;

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Stock
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {headerName || (stockId ? String(stockId) : "Plataformas de stock")}
                    </div>
                </div>
            ),
            action: headerActions,
            status: {
                text: headerActive ? "Activo" : "Inactivo",
                variant: headerActive ? "success" : "warning",
            },
        } as PageHeaderProps),
        [headerActions, headerName, stockId, headerActive]
    );

    /* ----------- SELECTOR DE PLATAFORMA (PILL) ----------- */

    const platformDefs = useMemo<{ key: PlatformKey; label: string }[]>(() => {
        const unique = Array.from(
            new Set(rows.map((r) => r.platform.trim().toLowerCase()))
        );

        return unique.map((key) => ({
            key: key as PlatformKey,
            label: rows.find((r) => r.platform.trim().toLowerCase() === key)?.platform ?? key,
        }));
    }, [rows]);

    const handlePlatformKeyDown = (
        e: React.KeyboardEvent<HTMLDivElement>
    ) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            // con una sola opción simplemente ignoramos, pero dejamos
            // la estructura lista para más plataformas
            e.preventDefault();
        }
    };

    return (
        <div className="">
            <div className="p-6 shadow-sm">
                <div
                    role="tablist"
                    aria-label="Seleccionar plataforma"
                    onKeyDown={handlePlatformKeyDown}
                    className="mb-4 flex flex-wrap items-center gap-2"
                >
                    {platformDefs.map((p) => {
                        const active = platform === p.key;
                        return (
                            <button
                                key={p.key}
                                role="tab"
                                aria-selected={active}
                                className={[
                                    "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition-all",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60",
                                    active
                                        ? "border-blue-500 bg-white text-blue-700"
                                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                                ].join(" ")}
                                onClick={() => setPlatform(p.key)}
                                type="button"
                                disabled={saving}
                            >
                                <span
                                    className={[
                                        "inline-block h-2.5 w-2.5 rounded-full ring-2 transition-all",
                                        active
                                            ? "bg-blue-600 ring-blue-600"
                                            : "bg-white ring-gray-300 group-hover:ring-blue-400",
                                    ].join(" ")}
                                />
                                <span className="whitespace-nowrap">
                                    {p.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <DataTable
                    data={paginatedRows}
                    columns={columns}
                    dataType="General2"
                    rowPaddingY={16}
                    rowBgClass="bg-white"
                />

                {/* Paginación */}
                <Pagination
                    currentPage={currentPage}
                    totalRecords={totalRecords}
                    pageSize={PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

export default StockPlataformas;
