"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Column } from "@/features/pedidos/pages/Control-Pedidos/ControlView";
import { DataTable } from "@/components/ui/table";
import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";

import { RepackingRecord, RepackingItem } from "@/features/picking/components/picking/repacking/RepackingFields";

import {
    CheckCircleIcon,
    XCircleIcon,
    CloudArrowDownIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface Props {
    record?: RepackingRecord;
}

/* Mock */
const mockItems: RepackingItem[] = [
    { sku: "TALADRO-18V", descripcion: "Taladro Inalámbrico 18V", cantidad: 2, pesoKg: 1.8 },
    { sku: "BROCA-SET10", descripcion: "Set 10 Brocas Madera", cantidad: 3, pesoKg: 0.6 },
    { sku: "DISCO-115", descripcion: "Disco Corte 115mm", cantidad: 5, pesoKg: 0.9 },
    { sku: "GUANTES-PRO", descripcion: "Guantes Protección Pro", cantidad: 2, pesoKg: 0.4 },
];

/* ----------------------------------------------------------
   GET COLUMNS 
---------------------------------------------------------- */
function getColumns(): Column<RepackingItem>[] {
    return [
        {
            header: "SKU",
            accessorKey: "sku",
            cell: (r) => (
                <div className="flex flex-col w-[260px]">
                    <span className="font-medium text-gray-900">
                        {r.sku}
                    </span>
                </div>
            ),
        },
        {
            header: "Descripción",
            accessorKey: "descripcion",
            cell: (r) => (
                <span className="text-gray-900">{r.descripcion}</span>
            ),
        },
        {
            header: "Cantidad",
            accessorKey: "cantidad",
            cell: (r) => <span>{r.cantidad}</span>,
        },
        {
            header: "Peso (KG)",
            accessorKey: "pesoKg",
            cell: (r) => <span>{r.pesoKg}</span>,
        },
    ];
}

export default function ItemsRepackingView({ record }: Props) {
    const router = useRouter();
    const items = record?.items || mockItems;

    /* Columns con useMemo  */
    const columns = useMemo(() => getColumns(), []);

    /* Acciones */
    const headerActions: Action[] = useMemo(
        () => [
            { label: "Exportar", variant: "primary" as const, onClick: () => console.log("Exportar"), icon: <CloudArrowDownIcon className="h-5 w-5" /> },
            {
                label: "Aplicar",
                variant: "secondary",
                disabled: true,
                icon: <CheckCircleIcon className="h-5 w-5" />,
            },
            {
                label: "Guardar",
                variant: "gray",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                disabled: true,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/packing/repacking"),
            },
        ],
        [router]
    );

    usePageHeader(
        () => ({
            title: "Items de Repacking",
            action: headerActions,
            status: { text: "En revisión", variant: "info" },
        }),
        [headerActions]
    );

    return (
        <div className="flex-1">
            <div className="rounded-xl shadow-sm overflow-hidden">
                <DataTable<RepackingItem>
                    data={items}
                    columns={columns}
                    rowPaddingY={12}
                    rowBgClass="bg-white"
                    dataType="pedido"
                    statusKey={undefined}
                />
            </div>
        </div>
    );
}
