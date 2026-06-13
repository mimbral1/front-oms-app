// views\Delivery\EnviosView\Bultos\EnviosBultosView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/table";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";

import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowDownTrayIcon,
    CloudArrowDownIcon,
} from "@heroicons/react/24/outline";

import { exportToCsv } from "@/components/presets/export/export";

interface BultoRow {
    tipoPaquete: string;
    codigoBarra: string;
    refId: string;
    inventario: string;
    slot: string | null;
}

type ApiPackageItem = {
    refId?: string | null;
    ean?: string | null;
    type?: string | null;
    name?: string | null;
    inventoryId?: string | null;
    inventoryName?: string | null;
    slotId?: string | null;
    slot?: string | null;
};

type ApiPackageResponse = {
    data?: ApiPackageItem[];
};

const PACKAGE_ENDPOINT = `${BASE_DELIVERY_SERVICE}/package`;

/* Link estilo inventario */
const LinkCell = ({ text }: { text: string }) => (
    <a
        href="#"
        className="text-blue-600 hover:underline"
        onClick={(e) => e.preventDefault()}
    >
        {text}
    </a>
);

function getColumns(): Column<BultoRow>[] {
    return [
        {
            header: "Tipo de paquete",
            accessorKey: "tipoPaquete",
            cell: (r) => (
                <div className="flex flex-col w-[360px]">
                    <span className="font-medium text-gray-900">{r.tipoPaquete}</span>
                </div>
            ),
        },
        { header: "Código de barras", accessorKey: "codigoBarra" },
        { header: "Ref ID", accessorKey: "refId" },
        {
            header: "Inventario",
            accessorKey: "inventario",
            cell: (r) => <LinkCell text={r.inventario} />,
        },
        {
            header: "Slot",
            accessorKey: "slot",
            cell: (r) =>
                r.slot ? <LinkCell text={r.slot} /> : <span>-</span>,
        },
    ];
}

/* Paginación visual */
const PER_PAGE = 60;
const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));
const pageWindow = (total: number, current: number) => {
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(current - 1, total - 2));
    return [start, start + 1, start + 2];
};

export default function EnviosBultosView() {
    const params = useParams<{ id?: string }>();
    const shippingId = params?.id ?? "";
    const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();

    const columns = useMemo(() => getColumns(), []);
    const [loading, setLoading] = useState(false);

    const [rows, setRows] = useState<BultoRow[]>([]);

    useEffect(() => {
        if (!token || !shippingId) return;
        let mounted = true;

        const loadBultos = async () => {
            if (mounted) setLoading(true);
            try {
                if (!BASE_DELIVERY_SERVICE) {
                    throw new Error("Falta NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE en variables de entorno");
                }

                const res = await fetchWithAuthDelivery<ApiPackageResponse>(
                    `${PACKAGE_ENDPOINT}?shippingId=${encodeURIComponent(shippingId)}`,
                    { method: "GET" }
                );

                const source = Array.isArray(res)
                    ? res
                    : Array.isArray(res?.data)
                        ? res.data
                        : [];

                const mapped: BultoRow[] = source.map((item) => ({
                    tipoPaquete: String(item.type ?? item.name ?? "-"),
                    codigoBarra: String(item.ean ?? "-"),
                    refId: String(item.refId ?? "-"),
                    inventario: String(item.inventoryName ?? item.inventoryId ?? "-"),
                    slot: item.slot ? String(item.slot) : item.slotId ? String(item.slotId) : null,
                }));

                if (mounted) setRows(mapped);
            } catch (error) {
                console.error("Error listando bultos por shippingId:", error);
                if (mounted) setRows([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadBultos();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuthDelivery, token, shippingId]);

    /* ───────────────────────────────
       HEADER 
       ─────────────────────────────── */
    const handleExport = () => {
        const headers = [
            "Tipo paquete",
            "Código de barras",
            "Ref ID",
            "Inventario",
            "Slot",
        ];

        const data = rows.map((r) => [
            r.tipoPaquete,
            r.codigoBarra,
            r.refId,
            r.inventario,
            r.slot ?? "-",
        ]);

        exportToCsv("bultos-envio.csv", [headers, ...data]);
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Exportar",
                variant: "primary" as const,
                onClick: handleExport,
                disabled: loading || rows.length === 0,
                icon: <CloudArrowDownIcon className="h-5 w-5" />,
            },
            {
                label: "Aplicar",
                variant: "secondary",
                disabled: true,
                icon: <CheckCircleIcon className="h-5 w-5" />,
            },
            {
                label: "Guardar",
                variant: "gray",
                disabled: true,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => history.back(),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [rows]
    );

    /* ───────────────────────────────
       HEADER DEL TAB 
       ─────────────────────────────── */
    usePageHeader(
        () =>
        ({
            title: `Entrega ${shippingId}`,
            action: headerActions,
            status: { text: "Activo", variant: "success" }, // igual al Tab Etiquetas
        } as PageHeaderProps),
        [shippingId, headerActions]
    );

    /* ───────────────────────────────
       PAGINACIÓN
       ─────────────────────────────── */
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const safePage = clamp(page, 1, totalPages);

    const startIdx = (safePage - 1) * PER_PAGE;
    const endIdx = Math.min(startIdx + PER_PAGE, rows.length);
    const shown = rows.slice(startIdx, endIdx);

    return (
        <div className="flex-1">
            {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                    Cargando bultos...
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                    Este envio no tiene bultos asociados.
                </div>
            ) : (
                <div className="rounded-xl shadow-sm overflow-hidden">
                    <DataTable<BultoRow>
                        data={shown}
                        columns={columns}
                        dataType="General2"
                        rowPaddingY={12}
                        showStatusBorder={false}
                        rowBgClass="bg-white"
                    />
                </div>
            )}

        </div>
    );
}
