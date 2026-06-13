"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import JsBarcode from "jsbarcode";
import {
    ArrowPathIcon,
    CheckCircleIcon as CheckCircleOutlineIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    PrinterIcon,
    TruckIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/ui/button/action-button";
import { StatusBadge } from "@/components/ui/badge/status";
import { useFetchWithAuthQA } from "@/lib/http/client";
import { PRE_ORDER_ISSUE_SUMMARY_API } from "@/lib/http/endpoints";
import { getStatusVariant } from "@/features/pedidos/utils/pedido-status";
import Card from "@/features/pedidos/components/detalles-pedido/Card";

type PreOrderHeader = {
    preOrderID?: number;
    barCode?: string;
    preOrderCode?: string;
    preOrderTypeName?: string;
    statusCode?: string;
    sellerID?: number | string;
    salesChannelReferenceId?: string;
    currencyCode?: string;
    itemsCount?: number;
    subtotalAmount?: number;
    totalAmount?: number;
    vatAmount?: number;
    deliveryDate?: string;
    deliveryCompany?: string;
    comments?: string;
    createdAt?: string;
    updatedAt?: string;
    validFrom?: string;
    validUntil?: string;
};

type PreOrderFulfillment = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    documentType?: string;
    document?: string;
    cardCode?: string;
    receiverName?: string;
    addressTypeName?: string;
    city?: string;
    state?: string;
    country?: string;
    commune?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    referenceAddress?: string;
    postalCode?: string;
};

type PreOrderItem = {
    id?: number;
    itemIndex?: number;
    uniqueId?: string;
    itemCode?: string;
    dscription?: string;
    quantity?: number;
    priceBeforeVAT?: number;
    priceAfterVAT?: number;
    totalLineBeforeVAT?: number;
    totalLineAfterVAT?: number;
    whsCode?: string;
    discountPercent?: number;
};

type PreOrderHistory = {
    historyID?: number;
    statusCode?: string;
    statusDescription?: string | null;
    note?: string;
    changeDate?: string;
};

type PreOrderShipmentWarehouse = {
    warehouseCode?: string;
    assignedQty?: number;
};

type PreOrderShipmentItem = {
    sku?: string;
    quantity?: number;
    warehouses?: PreOrderShipmentWarehouse[];
};

type PreOrderShipment = {
    preOrderShipmentID?: number;
    code?: string;
    entrega?: string;
    deliveryCompanyName?: string;
    destino?: string;
    addressTypeName?: string;
    deliveryDate?: string;
    items?: PreOrderShipmentItem[];
};

type PreOrderDetail = {
    header?: PreOrderHeader;
    fulfillment?: PreOrderFulfillment;
    items?: PreOrderItem[];
    history?: PreOrderHistory[];
    shipments?: PreOrderShipment[];
};

type PreOrderDetailResponse = {
    success?: boolean;
    data?: PreOrderDetail;
};

type PreOrderIssueSummaryResponse = {
    fulfillment?: PreOrderFulfillment;
    resumen?: {
        cliente?: {
            nombre?: string;
            tipoDocumento?: string;
            documento?: string;
            telefono?: string;
            email?: string;
            fechaCreacion?: string;
        };
        totales?: {
            total?: number;
            subtotal?: number;
            currencyCode?: string;
        };
        itemsResumen?: {
            items?: number;
        };
    };
    datosPedido?: {
        preOrderID?: number;
        pedido?: string;
        preOrderCode?: string;
        salesChannelReferenceId?: string;
        seller?: string;
        createdAt?: string;
    };
    datosTipoPedido?: {
        tipo?: string;
        validFrom?: string;
        validUntil?: string;
    };
    datosEntrega?: Array<{
        tipoEntrega?: string;
        direccion?: string;
        fechaEntrega?: string;
        empresaDelivery?: string;
        envioCodigo?: string;
        preOrderShipmentID?: number;
    }>;
    items?: {
        originales?: {
            grupos?: Array<{
                items?: Array<{
                    producto?: string;
                    itemcode?: string;
                    cantidad?: number;
                    precioUnitario?: number;
                    totalItem?: number;
                    whsCode?: string;
                }>;
            }>;
        };
    };
    envios?: Array<{
        preOrderShipmentID?: number;
        envio?: string;
        entrega?: string;
        deliveryCompanyName?: string;
    }>;
    historial?: Array<{
        preOrderStatusId?: number;
        status?: string;
        description?: string | null;
        note?: string;
        fecha?: string;
    }>;
};

type IssueSummaryHistoryEntry = {
    preOrderStatusId?: number;
    status?: string;
    description?: string | null;
    note?: string;
    fecha?: string;
};

const CLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

const parseApiDate = (value?: string | null): Date | null => {
    if (!value) return null;

    const custom = String(value).match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (custom) {
        const day = Number(custom[1]);
        const month = Number(custom[2]);
        const year = Number(custom[3]);
        const hour = Number(custom[4]);
        const minute = Number(custom[5]);
        const second = Number(custom[6]);
        const d = new Date(year, month - 1, day, hour, minute, second);
        if (!Number.isNaN(d.getTime())) return d;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const toDisplayDate = (value?: string | null): string => {
    if (!value) return "-";
    const d = parseApiDate(value);
    if (!d) return String(value);

    return d.toLocaleString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const toDisplayDateOnly = (value?: string | null): string => {
    if (!value) return "-";
    const d = parseApiDate(value);
    if (!d) return String(value);

    return d.toLocaleDateString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

const formatCurrency = (value?: number | null): string => {
    const num = Number(value ?? 0);
    return CLP.format(Number.isFinite(num) ? num : 0);
};

const escapeHtml = (value: unknown): string =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

const toFiniteNumber = (value: unknown): number | null => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
};

const resolvePreOrderBarcode = (header?: PreOrderHeader, fallbackId?: string | number): string => {
    const raw =
        header?.barCode ??
        header?.preOrderCode ??
        header?.preOrderID ??
        fallbackId ??
        "";
    return String(raw).trim();
};

const formatRut = (value?: string | null): string => {
    if (!value) return "-";

    const cleaned = String(value).replace(/[^0-9kK]/g, "").toUpperCase();
    if (cleaned.length < 2) return String(value);

    const verifier = cleaned.slice(-1);
    const body = cleaned.slice(0, -1);
    if (!/^\d+$/.test(body) || !/^\d|K$/.test(verifier)) return String(value);

    const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots}-${verifier}`;
};

const resolveBillingDocumentType = (header?: PreOrderHeader, fulfillment?: PreOrderFulfillment): string => {
    const candidates = [header?.preOrderTypeName, fulfillment?.documentType].filter(Boolean).join(" ").toLowerCase();

    if (candidates.includes("factura")) return "Factura";
    if (candidates.includes("boleta")) return "Boleta";

    return "-";
};

const normalizeIssueSummaryPayload = (payload: PreOrderIssueSummaryResponse): PreOrderDetail | null => {
    if (!payload || typeof payload !== "object") return null;

    const latestHistory = (payload.historial ?? []).reduce<IssueSummaryHistoryEntry | null>((acc, current) => {
        if (!current) return acc;
        if (!acc) return current;
        const accDate = parseApiDate(acc.fecha)?.getTime() ?? 0;
        const curDate = parseApiDate(current.fecha)?.getTime() ?? 0;
        return curDate >= accDate ? current : acc;
    }, null);

    const firstDelivery = payload.datosEntrega?.[0];

    const groups = payload.items?.originales?.grupos ?? [];
    const normalizedItems: PreOrderItem[] = groups.flatMap((group, groupIndex) =>
        (group.items ?? []).map((item, itemIndex) => ({
            id: groupIndex * 1000 + itemIndex,
            itemIndex,
            itemCode: item.itemcode,
            dscription: item.producto,
            quantity: item.cantidad,
            priceAfterVAT: item.precioUnitario,
            totalLineAfterVAT: item.totalItem,
            whsCode: item.whsCode,
        }))
    );

    const deliveryByShipmentId = new Map<number, NonNullable<PreOrderIssueSummaryResponse["datosEntrega"]>[number]>();
    const deliveryByCode = new Map<string, NonNullable<PreOrderIssueSummaryResponse["datosEntrega"]>[number]>();

    (payload.datosEntrega ?? []).forEach((entry) => {
        if (typeof entry.preOrderShipmentID === "number") {
            deliveryByShipmentId.set(entry.preOrderShipmentID, entry);
        }
        if (entry.envioCodigo) {
            deliveryByCode.set(entry.envioCodigo, entry);
        }
    });

    const normalizedShipmentsFromEnvios: PreOrderShipment[] = (payload.envios ?? []).map((shipment) => {
        const deliveryRef =
            (typeof shipment.preOrderShipmentID === "number" && deliveryByShipmentId.get(shipment.preOrderShipmentID)) ||
            (shipment.envio ? deliveryByCode.get(shipment.envio) : undefined);

        return {
            preOrderShipmentID: shipment.preOrderShipmentID,
            code: shipment.envio,
            entrega: deliveryRef?.tipoEntrega,
            deliveryCompanyName: shipment.deliveryCompanyName ?? deliveryRef?.empresaDelivery ?? firstDelivery?.empresaDelivery,
            destino: deliveryRef?.direccion,
            addressTypeName: deliveryRef?.tipoEntrega,
            deliveryDate: deliveryRef?.fechaEntrega ?? shipment.entrega,
            items: [],
        };
    });

    const normalizedShipmentsFromDatosEntrega: PreOrderShipment[] =
        (payload.envios ?? []).length === 0
            ? (payload.datosEntrega ?? []).map((entry, index) => ({
                preOrderShipmentID: entry.preOrderShipmentID,
                code: entry.envioCodigo || `Despacho ${index + 1}`,
                entrega: entry.tipoEntrega,
                deliveryCompanyName: entry.empresaDelivery,
                destino: entry.direccion,
                addressTypeName: entry.tipoEntrega,
                deliveryDate: entry.fechaEntrega,
                items: [],
            }))
            : [];

    const normalizedShipments: PreOrderShipment[] = [...normalizedShipmentsFromEnvios, ...normalizedShipmentsFromDatosEntrega];

    const normalizedHistory: PreOrderHistory[] = (payload.historial ?? []).map((h, index) => ({
        historyID: h.preOrderStatusId ?? index + 1,
        statusCode: h.status,
        statusDescription: h.description,
        note: h.note,
        changeDate: h.fecha,
    }));

    const sourceFulfillment = payload.fulfillment ?? {};
    const [firstName, ...restLastName] = String(payload.resumen?.cliente?.nombre ?? "").trim().split(" ");
    const fullNameFromFulfillment = [sourceFulfillment.firstName, sourceFulfillment.lastName].filter(Boolean).join(" ").trim();
    const resolvedReceiverName = sourceFulfillment.receiverName || fullNameFromFulfillment || payload.resumen?.cliente?.nombre;

    const payloadSubtotal = toFiniteNumber(payload.resumen?.totales?.subtotal);
    const payloadTotal = toFiniteNumber(payload.resumen?.totales?.total);

    return {
        header: {
            preOrderID: payload.datosPedido?.preOrderID,
            barCode: String(
                payload.datosPedido?.pedido ??
                payload.datosPedido?.preOrderCode ??
                payload.datosPedido?.preOrderID ??
                ""
            ).trim(),
            preOrderCode: payload.datosPedido?.preOrderCode,
            preOrderTypeName: payload.datosTipoPedido?.tipo,
            statusCode: latestHistory?.status,
            sellerID: payload.datosPedido?.seller,
            salesChannelReferenceId: payload.datosPedido?.salesChannelReferenceId,
            currencyCode: payload.resumen?.totales?.currencyCode,
            itemsCount: payload.resumen?.itemsResumen?.items,
            subtotalAmount: payloadSubtotal ?? undefined,
            totalAmount: payload.resumen?.totales?.total,
            vatAmount: payloadSubtotal !== null && payloadTotal !== null ? payloadTotal - payloadSubtotal : undefined,
            deliveryDate: firstDelivery?.fechaEntrega,
            deliveryCompany: firstDelivery?.empresaDelivery,
            createdAt: payload.datosPedido?.createdAt ?? payload.resumen?.cliente?.fechaCreacion,
            updatedAt: latestHistory?.fecha,
            validFrom: payload.datosTipoPedido?.validFrom,
            validUntil: payload.datosTipoPedido?.validUntil,
        },
        fulfillment: {
            firstName: sourceFulfillment.firstName ?? firstName ?? payload.resumen?.cliente?.nombre,
            lastName: sourceFulfillment.lastName ?? restLastName.join(" "),
            email: sourceFulfillment.email ?? payload.resumen?.cliente?.email,
            phone: sourceFulfillment.phone ?? payload.resumen?.cliente?.telefono,
            documentType: sourceFulfillment.documentType ?? payload.resumen?.cliente?.tipoDocumento,
            document: sourceFulfillment.document ?? payload.resumen?.cliente?.documento,
            cardCode: sourceFulfillment.cardCode,
            receiverName: resolvedReceiverName,
            addressTypeName: sourceFulfillment.addressTypeName ?? firstDelivery?.tipoEntrega,
            city: sourceFulfillment.city,
            state: sourceFulfillment.state,
            country: sourceFulfillment.country,
            commune: sourceFulfillment.commune,
            street: sourceFulfillment.street ?? firstDelivery?.direccion,
            number: sourceFulfillment.number,
            neighborhood: sourceFulfillment.neighborhood,
            referenceAddress: sourceFulfillment.referenceAddress ?? firstDelivery?.direccion,
            postalCode: sourceFulfillment.postalCode,
        },
        items: normalizedItems,
        history: normalizedHistory,
        shipments: normalizedShipments,
    };
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
            <span className="w-full flex-shrink-0 text-sm font-medium text-gray-900 sm:w-1/3">{label}:</span>
            <span className="w-full flex-1 break-words text-sm font-medium text-gray-600 sm:w-2/3">{value ?? "-"}</span>
        </div>
    );
}

export function PreVentaResumenView({ preOrderID }: { preOrderID: string }) {
    const router = useRouter();
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detail, setDetail] = useState<PreOrderDetail | null>(null);

    const loadDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const payload = await fetchWithAuthQA<PreOrderDetailResponse | PreOrderIssueSummaryResponse>(
                `${PRE_ORDER_ISSUE_SUMMARY_API}/${encodeURIComponent(preOrderID)}`,
                { method: "GET" }
            );

            const oldShape = (payload as PreOrderDetailResponse)?.data;
            const isOldShape = Boolean(
                oldShape?.header ||
                oldShape?.fulfillment ||
                Array.isArray(oldShape?.items) ||
                Array.isArray(oldShape?.history) ||
                Array.isArray(oldShape?.shipments)
            );

            if (isOldShape) {
                setDetail(oldShape ?? null);
                return;
            }

            setDetail(normalizeIssueSummaryPayload(payload as PreOrderIssueSummaryResponse));
        } catch (error: unknown) {
            setDetail(null);
            setError(getErrorMessage(error, "No se pudo cargar el resumen de la pre-venta."));
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuthQA, preOrderID]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    const header = detail?.header;
    const fulfillment = detail?.fulfillment;
    const items = detail?.items ?? [];
    const history = detail?.history ?? [];
    const shipments = detail?.shipments ?? [];

    const computedTotals = useMemo(() => {
        const itemsSubtotal = items.reduce((acc, item) => acc + Number(item.totalLineBeforeVAT ?? 0), 0);
        const itemsTotal = items.reduce((acc, item) => acc + Number(item.totalLineAfterVAT ?? 0), 0);

        const headerSubtotal = toFiniteNumber(header?.subtotalAmount);
        const headerTotal = toFiniteNumber(header?.totalAmount);
        const headerVat = toFiniteNumber(header?.vatAmount);

        const subtotal = headerSubtotal ?? itemsSubtotal;
        const total = headerTotal ?? itemsTotal;
        const vat = headerVat ?? (total - subtotal);

        return { subtotal, total, vat };
    }, [items, header?.subtotalAmount, header?.totalAmount, header?.vatAmount]);

    const historyItems = useMemo(() => {
        const sorted = [...history]
            .map((item) => {
                const when = new Date(item.changeDate ?? "");
                return {
                    status: item.statusCode || "Sin estado",
                    note: item.note || "",
                    dateLabel: toDisplayDate(item.changeDate),
                    when: Number.isNaN(when.getTime()) ? new Date(0) : when,
                };
            })
            .sort((a, b) => a.when.getTime() - b.when.getTime());

        if (!sorted.length) return [];

        const last = sorted[sorted.length - 1];

        return sorted.map((item, index) => ({
            ...item,
            isCurrent:
                (item.when.getTime() === last.when.getTime() && item.status === last.status) ||
                index === sorted.length - 1,
            isCompleted: index < sorted.length - 1,
        }));
    }, [history]);

    const customerName = `${fulfillment?.firstName || ""} ${fulfillment?.lastName || ""}`.trim() || "-";
    const addressLine = [fulfillment?.street, fulfillment?.number, fulfillment?.neighborhood].filter(Boolean).join(" ") || "-";
    const billingDocumentType = resolveBillingDocumentType(header, fulfillment);
    const preOrderBarcode = resolvePreOrderBarcode(header, preOrderID);

    const totalAmount = computedTotals.total;

    const handleReprintTicket = useCallback(async () => {
        if (typeof window === "undefined" || !detail) return;

        const safeHeader = detail.header;
        const safeFulfillment = detail.fulfillment;
        const safeItems = detail.items ?? [];

        const customer = `${safeFulfillment?.firstName || ""} ${safeFulfillment?.lastName || ""}`.trim() || "-";
        const createdAt = toDisplayDate(safeHeader?.createdAt);
        const status = safeHeader?.statusCode || "Sin estado";
        const preOrderCode = resolvePreOrderBarcode(safeHeader, preOrderID);

        const barcodeSvg = (() => {
            try {
                const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                JsBarcode(svgNode, preOrderCode, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 14,
                    height: 48,
                    width: 1.8,
                    margin: 0,
                    background: "#ffffff",
                });
                return svgNode.outerHTML;
            } catch {
                return "";
            }
        })();

        const rows = safeItems
            .map((item) => {
                const qty = Number(item.quantity ?? 0);
                const lineTotal = Number(item.totalLineAfterVAT ?? (Number(item.priceAfterVAT ?? 0) * qty));
                return `
                    <tr>
                        <td>${escapeHtml(item.dscription || "Sin descripción")}</td>
                        <td>${escapeHtml(item.itemCode || "-")}</td>
                        <td style="text-align:right;">${escapeHtml(qty)}</td>
                        <td style="text-align:right;">${escapeHtml(formatCurrency(lineTotal))}</td>
                    </tr>`;
            })
            .join("");

        const ticketMarkup = `
            <div class="preventa-ticket">
                <h1>Reimpresión Ticket de Preventa</h1>
                <div class="meta">
                    <div><strong>Preventa:</strong> ${escapeHtml(preOrderCode)}</div>
                    <div><strong>Estado:</strong> ${escapeHtml(status)}</div>
                    <div><strong>Fecha:</strong> ${escapeHtml(createdAt)}</div>
                    <div><strong>Cliente:</strong> ${escapeHtml(customer)}</div>
                </div>
                <div class="barcode-wrap">${barcodeSvg || ""}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>SKU</th>
                            <th>Cant.</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="total">TOTAL: ${escapeHtml(formatCurrency(totalAmount))}</div>
            </div>
        `;

        const ticketStyles = `
            .preventa-ticket {
                font-family: Arial, sans-serif;
                margin: 16px;
                color: #111827;
            }
            .preventa-ticket h1 {
                font-size: 18px;
                margin: 0 0 8px;
            }
            .preventa-ticket .meta {
                font-size: 12px;
                margin-bottom: 10px;
            }
            .preventa-ticket .meta div {
                margin: 2px 0;
            }
            .preventa-ticket .barcode-wrap {
                margin: 8px 0 12px;
                text-align: center;
            }
            .preventa-ticket table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            .preventa-ticket th,
            .preventa-ticket td {
                border-bottom: 1px solid #e5e7eb;
                padding: 6px 4px;
            }
            .preventa-ticket th {
                text-align: left;
                background: #f8fafc;
            }
            .preventa-ticket .total {
                margin-top: 10px;
                text-align: right;
                font-size: 14px;
                font-weight: 700;
            }
        `;

        const silentPrintableHtml = `
            <!doctype html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Reimpresión Ticket Preventa</title>
                <style>
                    @page { margin: 10mm; }
                    body { margin: 0; background: #fff; }
                    ${ticketStyles}
                </style>
            </head>
            <body>
                ${ticketMarkup}
            </body>
            </html>
        `;

        const electronAPI = (window as Window & {
            electronAPI?: {
                printPreOrderTicketSilently?: (html: string) => Promise<{ success?: boolean; error?: string }>;
            };
        }).electronAPI;

        if (electronAPI?.printPreOrderTicketSilently) {
            try {
                const result = await electronAPI.printPreOrderTicketSilently(silentPrintableHtml);
                if (result?.success) return;
                console.warn("No se pudo imprimir silenciosamente, se usará fallback web.", result?.error || "");
            } catch (error) {
                console.warn("Error de impresión silenciosa en Electron, se usará fallback web.", error);
            }
        }

        const PRINT_ROOT_ID = "__preventa_ticket_print_root";
        const PRINT_STYLE_ID = "__preventa_ticket_print_style";

        const oldRoot = document.getElementById(PRINT_ROOT_ID);
        if (oldRoot?.parentNode) oldRoot.parentNode.removeChild(oldRoot);

        const oldStyle = document.getElementById(PRINT_STYLE_ID);
        if (oldStyle?.parentNode) oldStyle.parentNode.removeChild(oldStyle);

        const printRoot = document.createElement("div");
        printRoot.id = PRINT_ROOT_ID;
        printRoot.innerHTML = ticketMarkup;
        printRoot.style.display = "none";
        document.body.appendChild(printRoot);

        const printStyle = document.createElement("style");
        printStyle.id = PRINT_STYLE_ID;
        printStyle.textContent = `
            @media print {
                body * { visibility: hidden !important; }
                #${PRINT_ROOT_ID}, #${PRINT_ROOT_ID} * { visibility: visible !important; }
                #${PRINT_ROOT_ID} {
                    display: block !important;
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white;
                    z-index: 999999;
                }
                #${PRINT_ROOT_ID} ${ticketStyles}
            }
        `;
        document.head.appendChild(printStyle);

        const cleanup = () => {
            const root = document.getElementById(PRINT_ROOT_ID);
            if (root?.parentNode) root.parentNode.removeChild(root);
            const style = document.getElementById(PRINT_STYLE_ID);
            if (style?.parentNode) style.parentNode.removeChild(style);
            window.removeEventListener("afterprint", cleanup);
        };

        window.addEventListener("afterprint", cleanup);

        // Se ejecuta en el mismo gesto de usuario para evitar que el navegador bloquee el print.
        window.print();

        // Fallback cleanup por si afterprint no dispara en algunos contextos.
        setTimeout(cleanup, 1500);
    }, [detail, preOrderID, totalAmount]);

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={1}
                title={`Resumen Pre-venta #${header?.preOrderID ?? preOrderID}`}
                status={{
                    text: header?.statusCode || "Sin estado",
                    variant: getStatusVariant((header?.statusCode || "Pendiente") as any),
                }}
                description={
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>Codigo: {preOrderBarcode || "-"}</span>
                        <span className="text-slate-300">|</span>
                        <span>Actualizada: {toDisplayDate(header?.updatedAt)}</span>
                    </div>
                }
                action={
                    <div className="flex items-center gap-2">
                        <ActionButton variant="primary" onClick={handleReprintTicket} disabled={loading || !detail}>
                            <PrinterIcon className="h-5 w-5" />
                            Reimprimir ticket
                        </ActionButton>
                        <ActionButton variant="secondary" onClick={loadDetail} disabled={loading}>
                            <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
                            Recargar
                        </ActionButton>
                        <ActionButton variant="secondary" onClick={() => router.push("/pedidos/pre-venta")}>
                            Volver al listado
                        </ActionButton>
                    </div>
                }
                className="flex-wrap"
            />

            <div className="flex-1 p-3 px-6 pb-8">
                {error ? (
                    <div className="mb-4 rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-sm text-red-700">{error}</div>
                ) : null}

                {loading ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                        Cargando resumen de pre-venta...
                    </div>
                ) : detail ? (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                        <Card
                            title="CLIENTE"
                            icon={UserIcon}
                            hasOptions
                            hasTitleDivider
                            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col xl:col-span-4"
                        >
                            <div className="space-y-3 text-gray-700">
                                <Field label="Nombre" value={customerName} />
                                <Field label="Email" value={fulfillment?.email} />
                                <Field label="Teléfono" value={fulfillment?.phone} />
                                <Field label="Documento" value={formatRut(fulfillment?.document)} />
                                <Field label="Receptor" value={fulfillment?.receiverName} />
                                <Field label="Tipo de dirección" value={fulfillment?.addressTypeName} />
                                <Field label="Dirección" value={addressLine} />
                            </div>
                        </Card>

                        <div className="space-y-6 xl:col-span-4">
                            <Card
                                title="PRE-VENTA"
                                icon={DocumentTextIcon}
                                hasOptions
                                hasTitleDivider
                                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col"
                            >
                                <div className="space-y-3 text-gray-700">
                                    <Field label="ID" value={header?.preOrderID ?? preOrderID} />
                                    <Field label="Código" value={header?.barCode} />
                                    <Field label="Documento" value={billingDocumentType} />
                                    <Field label="Canal" value={header?.salesChannelReferenceId} />
                                    <Field label="Vendedor" value={header?.sellerID} />
                                    <div className="flex items-start gap-x-2 gap-y-1">
                                        <span className="w-1/3 flex-shrink-0 text-sm font-medium text-gray-900">Estado:</span>
                                        <div className="w-2/3">
                                            <StatusBadge
                                                status={header?.statusCode || "Sin estado"}
                                                variant={getStatusVariant((header?.statusCode || "Pendiente") as any)}
                                                fixed
                                            />
                                        </div>
                                    </div>
                                    <Field label="Creada" value={toDisplayDate(header?.createdAt)} />
                                    <Field label="Válida hasta" value={toDisplayDate(header?.validUntil)} />
                                </div>
                            </Card>

                            <Card
                                title="ENTREGA"
                                icon={TruckIcon}
                                hasOptions
                                hasTitleDivider
                                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col"
                            >

                                <div className="space-y-2">
                                    {shipments.length === 0 ? (
                                        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                                            No hay despachos asociados.
                                        </div>
                                    ) : (
                                        shipments.map((shipment, index) => (
                                            <div
                                                key={shipment.preOrderShipmentID ?? shipment.code ?? index}
                                                className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                                            >
                                                <div className="mb-2 flex items-center justify-between gap-2">
                                                    <div className="font-semibold text-slate-900">{shipment.code || `Despacho ${index + 1}`}</div>

                                                </div>

                                                <div className="space-y-1.5 text-xs text-slate-700">
                                                    <div>
                                                        <span className="font-semibold text-slate-900">entrega:</span> {shipment.entrega || "-"}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-900">empresa de reparto:</span> {shipment.deliveryCompanyName || "-"}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-900">destino:</span> {shipment.destino || "-"}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-900">fecha de entrega:</span> {toDisplayDateOnly(shipment.deliveryDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6 xl:col-span-4">
                            <Card
                                title="TOTALES"
                                icon={CurrencyDollarIcon}
                                hasOptions
                                hasTitleDivider
                                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col"
                            >
                                <div className="divide-y divide-slate-200">
                                    {items.length === 0 ? (
                                        <p className="text-sm text-slate-600">No hay items para esta pre-venta.</p>
                                    ) : (
                                        items.map((item) => (
                                            <div key={item.id ?? `${item.itemCode}-${item.itemIndex}`} className="py-2.5 text-sm">
                                                <div className="font-medium text-slate-800">{item.itemCode || "-"} - {item.dscription || "Sin descripción"}</div>
                                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                                                    <span>Cant: {Number(item.quantity ?? 0)}</span>
                                                    <span>Bodega: {item.whsCode || "-"}</span>
                                                    <span>Total: {formatCurrency(item.totalLineAfterVAT)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold text-slate-900">
                                    <span>Total</span>
                                    <span>{formatCurrency(totalAmount)}</span>
                                </div>

                            </Card>

                            <Card
                                title="HISTORIAL"
                                icon={ClipboardDocumentListIcon}
                                hasOptions
                                hasTitleDivider
                                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col"
                            >
                                {historyItems.length === 0 ? (
                                    <div className="text-sm text-gray-500">Sin eventos de historial.</div>
                                ) : (
                                    <div className="relative space-y-8">
                                        {historyItems.map((item, index) => {
                                            const isLast = index === historyItems.length - 1;

                                            const nodeClasses = item.isCurrent
                                                ? "bg-blue-100 text-blue-600"
                                                : item.isCompleted
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-gray-100 text-gray-400";

                                            const LineIcon = item.isCurrent
                                                ? ClockIcon
                                                : item.isCompleted
                                                    ? CheckCircleOutlineIcon
                                                    : ClipboardDocumentCheckIcon;

                                            return (
                                                <div key={`${item.status}-${index}`} className="relative grid grid-cols-[minmax(260px,320px)_1fr] gap-x-8">
                                                    <div className="col-span-1 flex items-start gap-4">
                                                        <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full ${nodeClasses}`}>
                                                            <LineIcon className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-gray-900">{item.status}</div>
                                                            <div className="text-sm text-gray-500">{item.dateLabel}</div>
                                                        </div>
                                                    </div>

                                                    {!isLast && (
                                                        <div
                                                            className={`absolute left-4 top-8 -bottom-6 w-0.5 ${item.isCompleted
                                                                ? "bg-green-600"
                                                                : item.isCurrent
                                                                    ? "bg-blue-300"
                                                                    : "bg-gray-200"
                                                                }`}
                                                        />
                                                    )}

                                                    <div className="col-span-1" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                        No se encontró información para la pre-venta solicitada.
                    </div>
                )}
            </div>
        </div>
    );
}
