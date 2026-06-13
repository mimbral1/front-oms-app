"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/table";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowDownTrayIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { exportToCsv } from "@/components/presets/export/export";

interface InvRow {
    id: string;
    warehouse: string;
    internalCode: string;
    inventoryName: string;
    slot: string | null;
}

type ApiWarehouse = {
    id: string;
    name?: string | null;
    referenceId?: string | null;
    schemas?: {
        slotting?: {
            id?: string | null;
            map?: Array<{
                level?: string | null;
            }>;
        } | null;
    } | null;
};

type ApiSchema = {
    name?: string | null;
};

const WAREHOUSE_URL = `${BASE_WAREHOUSES}/warehouse?sortBy=referenceId&sortDirection=asc`;
const SCHEMA_URL = `${BASE_WAREHOUSES}/schema`;

function getColumns(): Column<InvRow>[] {
    return [
        {
            header: "Warehouse",
            accessorKey: "warehouse",
            cell: (row) => (
                <div className="flex w-[360px] flex-col">
                    <span className="font-medium text-gray-900">{row.warehouse}</span>
                </div>
            ),
        },
        {
            header: "Codigo interno",
            accessorKey: "internalCode",
        },
        {
            header: "Inventario",
            accessorKey: "inventoryName",
            cell: (row) => <span className="text-gray-900">{row.inventoryName}</span>,
        },
        {
            header: "Slot",
            accessorKey: "slot",
            cell: (row) => (row.slot ? <span className="text-gray-900">{row.slot}</span> : <span>-</span>),
        },
    ];
}

export default function InventariosEsquemaAlmacenView() {
    const router = useRouter();
    const { id } = useParams();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<InvRow[]>([]);
    const [schemaName, setSchemaName] = useState("Esquema");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const schemaId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

    const fetchInventories = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const [schemaResponse, warehouseResponse] = await Promise.all([
                fetch(`${SCHEMA_URL}/${encodeURIComponent(schemaId)}`, {
                    method: "GET",
                    headers: withAuthPlatformHeaders(),
                    cache: "no-store",
                }),
                fetch(WAREHOUSE_URL, {
                    method: "GET",
                    headers: withAuthPlatformHeaders(),
                    cache: "no-store",
                }),
            ]);

            if (!schemaResponse.ok) {
                const errorText = await schemaResponse.text().catch(() => "");
                throw new Error(errorText || `HTTP ${schemaResponse.status}`);
            }

            if (!warehouseResponse.ok) {
                const errorText = await warehouseResponse.text().catch(() => "");
                throw new Error(errorText || `HTTP ${warehouseResponse.status}`);
            }

            const schema = (await schemaResponse.json()) as ApiSchema;
            setSchemaName(String(schema.name || "Esquema"));

            const data = (await warehouseResponse.json()) as ApiWarehouse[];
            const nextRows = (Array.isArray(data) ? data : [])
                .filter((warehouse) => warehouse.schemas?.slotting?.id === schemaId)
                .map((warehouse) => {
                    const slotMap = warehouse.schemas?.slotting?.map ?? [];
                    const slot = slotMap.length
                        ? slotMap
                            .map((level) => String(level.level ?? "").trim())
                            .filter(Boolean)
                            .join(" / ")
                        : warehouse.schemas?.slotting?.id ?? null;

                    const name = String(warehouse.name ?? warehouse.referenceId ?? warehouse.id);
                    const referenceId = String(warehouse.referenceId ?? warehouse.id);

                    return {
                        id: warehouse.id,
                        warehouse: name,
                        internalCode: referenceId,
                        inventoryName: name,
                        slot: slot || null,
                    };
                });

            setRows(nextRows);
        } catch (error) {
            console.error("Error cargando inventarios del esquema:", error);
            setRows([]);
            setErrorMessage("No se pudieron cargar los inventarios asociados al esquema.");
        } finally {
            setLoading(false);
        }
    }, [schemaId]);

    useEffect(() => {
        if (!schemaId) {
            setRows([]);
            setLoading(false);
            setErrorMessage("No se encontro el identificador del esquema.");
            return;
        }

        void fetchInventories();
    }, [fetchInventories, schemaId]);

    const handleExport = useCallback(() => {
        exportToCsv("esquema-almacen-inventarios.csv", [
            ["Warehouse", "Codigo interno", "Inventario", "Slot"],
            ...rows.map((row) => [
                row.warehouse,
                row.internalCode,
                row.inventoryName,
                row.slot ?? "-",
            ]),
        ]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: handleExport,
                disabled: loading || rows.length === 0,
            },
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => {},
                disabled: true,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-5 w-5" />,
                onClick: () => {},
                disabled: true,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: () => {},
                disabled: true,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/configuracion/esquema"),
            },
        ],
        [handleExport, loading, router, rows.length]
    );

    usePageHeader(
        () =>
            ({
                title: (
                    <div>
                        <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                            Esquema
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">
                            {schemaName}
                        </div>
                    </div>
                ),
                action: headerActions,
                status: {
                    text: `${rows.length} inventario${rows.length === 1 ? "" : "s"}`,
                    variant: "info",
                },
            } as PageHeaderProps),
        [headerActions, rows.length, schemaName]
    );

    return (
        <div className="flex-1">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-page-bg pt-5 shadow-sm">
                {loading ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                        <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                        Cargando...
                    </div>
                ) : errorMessage ? (
                    <div className="px-4 py-6 text-center text-red-600">
                        {errorMessage}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                        No hay inventarios asociados a este esquema.
                    </div>
                ) : (
                    <DataTable<InvRow>
                        data={rows}
                        columns={columns}
                        dataType="General2"
                        rowPaddingY={12}
                        showStatusBorder={false}
                        rowBgClass="bg-white"
                    />
                )}
            </div>
        </div>
    );
}
