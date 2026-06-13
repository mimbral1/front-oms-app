"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowPathIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    PencilSquareIcon,
    UserIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card";
import { Avatar } from "@/components/ui/user-avatar";
import { CopyableText } from "@/components/ui/copyable-text";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import {
    WAREHOUSE_SECURITY_STOCK_API,
    WAREHOUSE_STOCK_API,
} from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

const STOCK_DETAIL_URL = WAREHOUSE_STOCK_API;
const SECURITY_STOCK_URL = WAREHOUSE_SECURITY_STOCK_API;

type StockDetailResponse = {
    id: string;
    sku: string;
    warehouse: string;
    warehouseName: string;
    warehouseReferenceId: string;
    stock: number;
    availableStock: number;
    reservedStock: number;
    inTransit: number;
    reservedPhysicalStock: number;
    inOrder: number;
    infiniteStock: boolean;
    securityStock: number;
    securityStockId: string | null;
    infiniteStockId: string | null;
    measurementUnit: string;
    status: string;
    dateCreated: string;
    dateModified: string;
    userCreated: string | null;
    userModified: string | null;
};

type SecurityStockResponse = {
    id: string;
    name: string;
    value: number;
    isPercentage: boolean;
    status: string;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
};

const stockTone = (
    value: number,
    fallback: "green" | "yellow" | "blue" | "gray"
) => {
    if (value < 0) return "bg-red-100 text-red-700";

    const tones = {
        green: "bg-emerald-500 text-white",
        yellow: "bg-amber-400 text-white",
        blue: "bg-blue-100 text-blue-700",
        gray: "bg-slate-100 text-slate-700",
    };

    return tones[fallback];
};

const StockPill = ({
    value,
    tone,
}: {
    value: number | string;
    tone: "green" | "yellow" | "blue" | "gray";
}) => (
    <span
        className={`inline-flex min-w-[44px] items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold ${
            typeof value === "number" ? stockTone(value, tone) : stockTone(0, tone)
        }`}
    >
        {value}
    </span>
);

export default function StockResumenView() {
    const router = useRouter();
    const { id } = useParams<{ id: string | string[] }>();
    const stockId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<StockDetailResponse | null>(null);
    const [securityStock, setSecurityStock] =
        useState<SecurityStockResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const load = useCallback(async (targetId: string) => {
        setLoading(true);
        setErrorMessage(null);
        setSecurityStock(null);

        try {
            const response = await fetch(
                `${STOCK_DETAIL_URL}/${encodeURIComponent(targetId)}`,
                {
                    method: "GET",
                    headers: withAuthPlatformHeaders({
                        "Content-Type": "application/json",
                    }),
                    cache: "no-store",
                }
            );

            if (!response.ok) {
                const body = await response.text().catch(() => "");
                throw new Error(
                    `HTTP ${response.status} ${response.statusText}${
                        body ? ` - ${body}` : ""
                    }`
                );
            }

            const payload = (await response.json()) as StockDetailResponse;
            setRecord(payload);

            if (payload.securityStockId) {
                const securityResponse = await fetch(
                    `${SECURITY_STOCK_URL}/${encodeURIComponent(
                        payload.securityStockId
                    )}`,
                    {
                        method: "GET",
                        headers: withAuthPlatformHeaders({
                            "Content-Type": "application/json",
                        }),
                        cache: "no-store",
                    }
                );

                if (securityResponse.ok) {
                    const securityPayload =
                        (await securityResponse.json()) as SecurityStockResponse;
                    setSecurityStock(securityPayload);
                }
            }
        } catch (error: unknown) {
            setRecord(null);
            setSecurityStock(null);
            setErrorMessage(
                getErrorMessage(error, "Error al cargar el stock. Intenta nuevamente.")
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (stockId) void load(String(stockId));
    }, [stockId, load]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/inventario/stock"),
            },
        ],
        [router]
    );

    usePageHeader(
        (): PageHeaderProps => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Stock
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {record?.sku || "Detalle stock"}
                    </div>
                </div>
            ),
            action: headerActions,
            status: record
                ? {
                      text: record.status === "active" ? "Activo" : "Inactivo",
                      variant:
                          record.status === "active" ? "success" : "warning",
                  }
                : undefined,
        }),
        [headerActions, record?.sku, record?.status]
    );

    return (
        <div className="min-h-screen bg-[#e8eaf5] p-6">
            {errorMessage ? (
                <ErrorState
                    message={errorMessage}
                    onRetry={() => {
                        if (stockId) void load(String(stockId));
                    }}
                />
            ) : loading ? (
                <div className="flex items-center justify-center bg-white px-4 py-6 text-center text-sm text-gray-500">
                    <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                    Cargando...
                </div>
            ) : record ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                    <div className="lg:col-span-5">
                        <Card
                            title="DETALLE"
                            icon={ClipboardDocumentListIcon}
                            hasTitleDivider
                            borderClass="border-slate-200"
                            className="h-full bg-white"
                        >
                            <div className="space-y-7">
                                <DetailRow label="SKU">
                                    <span className="font-semibold text-blue-600">
                                        <CopyableText text={record.sku}>
                                            {record.sku || "--"}
                                        </CopyableText>
                                    </span>
                                </DetailRow>

                                <DetailRow label="Inventario">
                                    <span className="font-semibold text-blue-600">
                                        {record.warehouseReferenceId ||
                                            record.warehouseName ||
                                            "--"}
                                        {record.warehouseName
                                            ? ` - ${record.warehouseName}`
                                            : ""}
                                    </span>
                                </DetailRow>

                                <DetailRow label="Stock" withDivider>
                                    <span className="font-medium text-slate-900">
                                        {record.stock ?? 0}
                                    </span>
                                </DetailRow>

                                <DetailRow label="Stock disponible">
                                    <StockPill
                                        value={record.availableStock ?? 0}
                                        tone="green"
                                    />
                                </DetailRow>

                                <DetailRow label="Stock reservado">
                                    <StockPill
                                        value={record.reservedStock ?? 0}
                                        tone="yellow"
                                    />
                                </DetailRow>

                                <DetailRow label="Stock de seguridad">
                                    <span className="font-semibold text-blue-600">
                                        {securityStock?.name ||
                                            record.securityStockId ||
                                            "--"}
                                    </span>
                                </DetailRow>

                                <DetailRow label="Stock infinito">
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600">
                                            {record.infiniteStock ? "Sí" : "No"}
                                        </span>
                                    </div>
                                </DetailRow>
                            </div>
                        </Card>
                    </div>

                    <aside className="space-y-6 lg:col-span-2">
                        <UserCard
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            name={record.userCreated || "Sistema"}
                            subtitle={formatDateTime(record.dateCreated) || "Sin fecha"}
                        />
                        <UserCard
                            title="ÚLTIMA MODIFICACIÓN"
                            icon={PencilSquareIcon}
                            name={record.userModified || "Sistema"}
                            subtitle={formatDateTime(record.dateModified) || "Sin fecha"}
                        />
                    </aside>
                </div>
            ) : null}
        </div>
    );
}

function DetailRow({
    label,
    children,
    withDivider = false,
}: {
    label: string;
    children: React.ReactNode;
    withDivider?: boolean;
}) {
    return (
        <div className="grid grid-cols-[180px_1fr] items-center gap-6">
            <span className="text-sm font-bold text-gray-700">{label}</span>
            <div className={withDivider ? "border-b border-slate-300 pb-2" : ""}>
                {children}
            </div>
        </div>
    );
}

function UserCard({
    title,
    icon: Icon,
    name,
    subtitle,
}: {
    title: string;
    icon: React.ElementType;
    name: string;
    subtitle: string;
}) {
    return (
        <Card
            title={title}
            icon={Icon}
            hasTitleDivider
            borderClass="border-slate-200"
            className="bg-white"
        >
            <div className="rounded-full border border-slate-200 bg-white px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={name} alt={name} className="h-9 w-9" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                            {name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            {subtitle}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function ErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <div
            className="rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-700 shadow-sm"
            role="alert"
        >
            <div className="flex">
                <ExclamationTriangleIcon
                    className="h-5 w-5 flex-shrink-0 text-red-400"
                    aria-hidden="true"
                />
                <div className="ml-3">
                    <h3 className="text-sm font-medium">
                        Error al cargar datos de stock
                    </h3>
                    <p className="mt-2 text-sm">{message}</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-4 rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        </div>
    );
}
