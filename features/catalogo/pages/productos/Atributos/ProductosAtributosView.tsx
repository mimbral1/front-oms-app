"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowDownIcon,
    CheckCircleIcon,
    PlusIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { ActionButton } from "@/components/ui/button/action-button";

type AttributeStatus = "Activo" | "Inactivo";

const TypedFaPlus = FaPlus as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

const SaveWithPlusIcon = () => (
    <div className="relative flex h-5 w-5 items-center justify-center">
        <SaveOutlined className="h-4 w-4 text-current" />
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
            <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
        </div>
    </div>
);

const PLATFORM_OPTIONS = ["Vtex", "MercadoLibre", "Falabella", "Retail Pro"] as const;

type ProductAttribute = {
    id: string;
    name: string;
    refId: string;
    group: string;
    category: string;
    mandatory: boolean;
    appliesToSkus: boolean;
    type: "text" | "select" | "number";
    modified: string;
    userName: string;
    userEmail: string;
    status: AttributeStatus;
};

type AttributeFilters = {
    name: string;
    refId: string;
    group: string;
    category: string;
    mandatory: string;
    appliesToSkus: string;
};

const PER_PAGE = 60;

const initialFilters: AttributeFilters = {
    name: "",
    refId: "",
    group: "",
    category: "",
    mandatory: "",
    appliesToSkus: "",
};

const filterConfig: FilterConfig<AttributeFilters, ProductAttribute>[] = [
    {
        id: "name",
        label: "Name",
        type: "text",
        rowValue: (row) => row.name,
    },
    {
        id: "refId",
        label: "Ref ID",
        type: "text",
        rowValue: (row) => row.refId,
    },
    {
        id: "group",
        label: "Group",
        type: "text",
        rowValue: (row) => row.group,
    },
    {
        id: "category",
        label: "Category",
        type: "text",
        rowValue: (row) => row.category,
    },
    {
        id: "mandatory",
        label: "Mandatory",
        type: "select",
        options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => String(row.mandatory),
    },
    {
        id: "appliesToSkus",
        label: "Applies to SKUs",
        type: "select",
        options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => String(row.appliesToSkus),
    },
];

const ATTRIBUTES: ProductAttribute[] = [
    {
        id: "1",
        name: "Color",
        refId: "color123",
        group: "-",
        category: "Limpieza y Cuidado del Hogar - Ferreteria - Iluminacion y Electricidad",
        mandatory: false,
        appliesToSkus: true,
        type: "text",
        modified: "25/01/2022 10:16",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
    {
        id: "2",
        name: "Tamano",
        refId: "size001",
        group: "Ficha tecnica",
        category: "Bebidas - Energizantes",
        mandatory: true,
        appliesToSkus: true,
        type: "select",
        modified: "25/01/2022 10:22",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
    {
        id: "3",
        name: "Tipo de envase",
        refId: "packageType",
        group: "Logistica",
        category: "Bebidas - Energizantes",
        mandatory: true,
        appliesToSkus: true,
        type: "select",
        modified: "24/01/2022 18:04",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
    {
        id: "4",
        name: "Material",
        refId: "material01",
        group: "Ficha tecnica",
        category: "Bebidas - Botellas y Latas",
        mandatory: false,
        appliesToSkus: true,
        type: "text",
        modified: "24/01/2022 17:51",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
    {
        id: "5",
        name: "Volumen neto",
        refId: "netVolume",
        group: "Contenido",
        category: "Bebidas - Energizantes",
        mandatory: true,
        appliesToSkus: true,
        type: "number",
        modified: "21/01/2022 12:36",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
    {
        id: "6",
        name: "Pais de origen",
        refId: "originCountry",
        group: "Origen",
        category: "Bebidas - Importados",
        mandatory: false,
        appliesToSkus: false,
        type: "select",
        modified: "20/01/2022 09:48",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
    {
        id: "7",
        name: "Contenido alcoholico",
        refId: "alcoholLevel",
        group: "Regulatorio",
        category: "Bebidas - Alcoholes y No alcoholicas",
        mandatory: true,
        appliesToSkus: true,
        type: "number",
        modified: "19/01/2022 16:11",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
    {
        id: "8",
        name: "Azucar por porcion",
        refId: "sugarServing",
        group: "Nutricional",
        category: "Bebidas - Informacion nutricional",
        mandatory: false,
        appliesToSkus: true,
        type: "number",
        modified: "18/01/2022 15:40",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
    {
        id: "9",
        name: "Temperatura",
        refId: "servingTemp",
        group: "Uso",
        category: "Bebidas - Conservacion",
        mandatory: false,
        appliesToSkus: false,
        type: "text",
        modified: "17/01/2022 14:05",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
    {
        id: "10",
        name: "Peso bruto",
        refId: "grossWeight",
        group: "Logistica",
        category: "Bebidas - Transporte",
        mandatory: true,
        appliesToSkus: true,
        type: "number",
        modified: "16/01/2022 11:20",
        userName: "Bruno Bellini",
        userEmail: "bruno.bellini@fizz...",
        status: "Activo",
    },
];

const BooleanPill = ({ value }: { value: boolean }) => (
    <span className="inline-flex min-w-[42px] items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
        {value ? "Yes" : "No"}
    </span>
);

const StatusPill = ({ status }: { status: AttributeStatus }) => (
    <span className={`inline-flex min-w-[104px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white ${status === "Activo" ? "bg-green-500" : "bg-slate-400"}`}>
        {status === "Activo" ? "Active" : "Inactive"}
    </span>
);

const UserCell = ({ name, email }: { name: string; email: string }) => (
    <div className="inline-flex max-w-[180px] items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-800">
            BB
        </span>
        <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-slate-900">{name}</div>
            <div className="truncate text-xs font-medium text-slate-500">{email}</div>
        </div>
    </div>
);

const getColumns = (): Column<ProductAttribute>[] => [
    {
        header: (
            <span className="inline-flex items-center gap-1">
                Name
                <ArrowDownIcon className="h-4 w-4 text-blue-500" />
            </span>
        ),
        accessorKey: "name",
        cell: (row) => <span className="text-sm font-medium text-slate-700">{row.name}</span>,
    },
    {
        header: "Ref ID",
        accessorKey: "refId",
        cell: (row) => <span className="text-sm font-semibold text-slate-900">{row.refId}</span>,
    },
    {
        header: "Group",
        accessorKey: "group",
        cell: (row) => <span className="text-sm font-medium text-slate-700">{row.group}</span>,
    },
    {
        header: "Category",
        accessorKey: "category",
        cell: (row) => <span className="block max-w-[300px] whitespace-normal text-sm font-medium text-slate-700">{row.category}</span>,
    },
    {
        header: "Mandatory",
        accessorKey: "mandatory",
        cell: (row) => <BooleanPill value={row.mandatory} />,
    },
    {
        header: "Applies to SKUs",
        accessorKey: "appliesToSkus",
        cell: (row) => <BooleanPill value={row.appliesToSkus} />,
    },
    {
        header: "Type",
        accessorKey: "type",
        cell: (row) => <span className="text-sm font-medium text-slate-700">{row.type}</span>,
    },
    {
        header: "Modified",
        accessorKey: "modified",
        cell: (row) => <span className="text-sm font-medium text-slate-700">{row.modified}</span>,
    },
    {
        header: "User",
        accessorKey: "userName",
        cell: (row) => <UserCell name={row.userName} email={row.userEmail} />,
    },
    {
        header: "Status",
        accessorKey: "status",
        cell: (row) => <StatusPill status={row.status} />,
    },
];

export function ProductosAtributosView() {
    const { id } = useParams();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPlatform, setSelectedPlatform] =
        useState<(typeof PLATFORM_OPTIONS)[number]>("Vtex");
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<AttributeFilters, ProductAttribute>({
            initialFilters,
            configs: filterConfig,
        });

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "primary",
                onClick: () => console.log("Aplicar atributos"),
                icon: <CheckCircleIcon className="h-5 w-5" />,
            },
            {
                label: "Guardar",
                variant: "success",
                onClick: () => console.log("Guardar atributos"),
                icon: <SaveOutlined className="h-4 w-4" />,
            },
            {
                label: "Guardar y crear",
                variant: "primary",
                onClick: () => console.log("Guardar y crear atributo"),
                icon: <SaveWithPlusIcon />,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => router.push("/catalogo/productos"),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [router]
    );

    usePageHeader(
        () => ({
            title: "Atributos del producto",
            action: headerActions,
            filters: headerFilters,
            onFilterChange: (filterId, value) => {
                setCurrentPage(1);
                handleFilterChange(filterId, value);
            },
            filterTitle: true,
        }),
        [headerActions, headerFilters, handleFilterChange, id]
    );

    const columns = useMemo(() => getColumns(), []);
    const filteredAttributes = useMemo(() => applyFilters(ATTRIBUTES), [applyFilters]);
    const totalRecords = filteredAttributes.length;
    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredAttributes.slice(start, start + PER_PAGE);
    }, [currentPage, filteredAttributes]);

    return (
        <div className="min-h-screen bg-[#e8eaf5] pt-20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {PLATFORM_OPTIONS.map((platform) => {
                        const isActive = platform === selectedPlatform;

                        return (
                            <button
                                key={platform}
                                type="button"
                                onClick={() => setSelectedPlatform(platform)}
                                className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${isActive
                                    ? "border-blue-500 bg-white text-blue-600"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                    }`}
                            >
                                <span
                                    className={`h-3 w-3 rounded-full border ${isActive
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-slate-300 bg-white"
                                        }`}
                                />
                                {platform}
                            </button>
                        );
                    })}
                </div>

                <ActionButton
                    variant="success"
                    size="sm"
                    onClick={() => console.log("Añadir atributo")}
                >
                    <PlusIcon className="h-4 w-4" />
                    Añadir atributo
                </ActionButton>
            </div>

            <DataTable
                data={pagedRows}
                columns={columns}
                dataType="General2"
                statusKey="status"
                rowPaddingY={20}
                rowBgClass="bg-white"
                showStatusBorder
            />

            <div className="mt-4">
                <Pagination
                    currentPage={currentPage}
                    totalRecords={totalRecords}
                    pageSize={PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>

            <div className="mt-2 text-xs text-slate-700">
                <span className="font-semibold">{totalRecords} Results</span>
                <span className="ml-3">{PER_PAGE} por pagina</span>
            </div>
        </div>
    );
}
