"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircleIcon,
    ChevronDownIcon,
    ClipboardDocumentListIcon,
    MapPinIcon,
    UserIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { Input } from "@mui/material";

import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import { ActiveStatusToggle } from "@/components/ui/togle/status-toggle";
import Select from "@/components/ui/select";
import DateTimePickerField from "@/components/ui/date-time-picker/DateTimePickerField";
import { useFetchWithAuthDelivery } from "@/lib/http/client";

type AddressPayload = {
    country: string;
    state: string;
    city: string;
    neighborhood: string;
    streetType: string;
    street: string;
    number: string;
    complement: string;
    reference: string;
    postalCode: string;
    lat: number | null;
    lng: number | null;
    geoVerified: boolean;
};

type SenderReceiverPayload = {
    companyName?: string;
    document?: string;
    documentType?: string;
    email?: string;
    phone?: string;
    referenceId?: string;
};

type StreetType = "street" | "avenue" | "highway" | "road" | "private";

type ShippingOrderPayload = {
    id: string;
    commerceId: string;
    commerceSequentialId?: string;
    currency?: string;
    isOnlinePaymentUponDelivery?: boolean;
    isPaymentUponDelivery?: boolean;
    itemsQuantity?: number;
    paymentMethod?: string;
    totalAmount?: number;
};

type ShippingCostsPayload = {
    customer: {
        amount: number;
        currency: string;
    };
    delivery: {
        amount: number;
        currency: string;
    };
};

type ShippingCreatePayload = {
    refId: string;
    origin?: string;
    carrierId?: string;
    timeSlotId?: string;
    sender?: SenderReceiverPayload;
    receiver?: SenderReceiverPayload;
    pickup: AddressPayload;
    dropoff: AddressPayload;
    readyForPickup: boolean;
    scheduledPending: boolean;
    dispatchDate?: string;
    integrationComplements?: { vtexId?: string };
    orders?: ShippingOrderPayload[];
    schedule?: { start: string; end: string };
    complements?: { vtexId?: string; invoiceNumber?: string };
    pickupAnnouncements?: {
        pickupCheckedIn: boolean;
        position: string | null;
        date: string;
        announcements: string;
    };
    externalLabels?: { format?: string; url?: string }[];
    costs?: ShippingCostsPayload;
    secondFactor?: { value: string };
    integrationErrorProcesses?: {
        shippingCreate?: string;
        preShippingCreate?: string;
    };
    isExternalCreationRetrying: boolean;
};

type CarrierOption = {
    id: string;
    name: string;
};

type CarrierApiItem = {
    id?: string | null;
    name?: string | null;
};

type CarrierApiResponse = {
    data?: CarrierApiItem[];
};

type SectionKey =
    | "general"
    | "order"
    | "senderOrigin"
    | "receiverDestination"
    | "scheduling"
    | "costs"
    | "advanced";

const SECTION_ORDER: SectionKey[] = [
    "general",
    "order",
    "senderOrigin",
    "receiverDestination",
    "scheduling",
    "costs",
    "advanced",
];

const SECTION_TITLE: Record<SectionKey, string> = {
    general: "Datos generales",
    order: "Orden asociada",
    senderOrigin: "Remitente / Origen",
    receiverDestination: "Destinatario / Destino",
    scheduling: "Programación",
    costs: "Costos",
    advanced: "Avanzado",
};

function buildSectionState(openKey: SectionKey): Record<SectionKey, boolean> {
    return {
        general: openKey === "general",
        order: openKey === "order",
        senderOrigin: openKey === "senderOrigin",
        receiverDestination: openKey === "receiverDestination",
        scheduling: openKey === "scheduling",
        costs: openKey === "costs",
        advanced: openKey === "advanced",
    };
}

const STREET_TYPE_OPTIONS: Array<{ value: StreetType; label: string }> = [
    { value: "street", label: "Calle" },
    { value: "avenue", label: "Avenida" },
    { value: "highway", label: "Autopista" },
    { value: "road", label: "Camino" },
    { value: "private", label: "Privada" },
];

const emptyAddress = (): AddressPayload => ({
    country: "",
    state: "",
    city: "",
    neighborhood: "",
    streetType: "street",
    street: "",
    number: "",
    complement: "",
    reference: "",
    postalCode: "",
    lat: null,
    lng: null,
    geoVerified: false,
});

const emptySenderReceiver = (): SenderReceiverPayload => ({
    companyName: "",
});

function parseNullableNumber(value: string): number | null {
    if (!value.trim()) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function hasAddressData(addr: AddressPayload): boolean {
    return !!(
        addr.country.trim() ||
        addr.state.trim() ||
        addr.city.trim() ||
        addr.street.trim() ||
        addr.number.trim() ||
        addr.postalCode.trim() ||
        addr.lat != null ||
        addr.lng != null
    );
}

function sanitizeAddress(addr: AddressPayload): AddressPayload {
    return {
        ...addr,
        country: addr.country.trim(),
        state: addr.state.trim(),
        city: addr.city.trim(),
        neighborhood: addr.neighborhood.trim(),
        streetType: addr.streetType.trim(),
        street: addr.street.trim(),
        number: addr.number.trim(),
        complement: addr.complement.trim(),
        reference: addr.reference.trim(),
        postalCode: addr.postalCode.trim(),
        lat: addr.lat,
        lng: addr.lng,
    };
}

function sanitizePerson(data: SenderReceiverPayload): SenderReceiverPayload | undefined {
    const sanitized: SenderReceiverPayload = {
        companyName: data.companyName?.trim() || undefined,
        document: data.document?.trim() || undefined,
        documentType: data.documentType?.trim() || undefined,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        referenceId: data.referenceId?.trim() || undefined,
    };

    const hasAny = Object.values(sanitized).some((value) => !!value);
    return hasAny ? sanitized : undefined;
}

export default function EnviosNuevoView() {
    const router = useRouter();
    const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();

    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [refId, setRefId] = useState("");
    const [origin, setOrigin] = useState("manual");
    const [carrierId, setCarrierId] = useState("");
    const [timeSlotId, setTimeSlotId] = useState("");
    const [dispatchDate, setDispatchDate] = useState("");
    const [scheduleStart, setScheduleStart] = useState("");
    const [scheduleEnd, setScheduleEnd] = useState("");
    const [readyForPickup, setReadyForPickup] = useState(false);
    const [scheduledPending, setScheduledPending] = useState(false);
    const [isExternalCreationRetrying, setIsExternalCreationRetrying] = useState(false);
    const [pickupCheckedIn, setPickupCheckedIn] = useState(false);
    const [pickupAnnouncementDate, setPickupAnnouncementDate] = useState("");
    const [pickupPosition, setPickupPosition] = useState("");
    const [pickupAnnouncementsText, setPickupAnnouncementsText] = useState("");
    const [secondFactorValue, setSecondFactorValue] = useState("");

    const [sender, setSender] = useState<SenderReceiverPayload>(emptySenderReceiver());
    const [receiver, setReceiver] = useState<SenderReceiverPayload>(emptySenderReceiver());
    const [pickup, setPickup] = useState<AddressPayload>(emptyAddress());
    const [dropoff, setDropoff] = useState<AddressPayload>(emptyAddress());

    const [orderId, setOrderId] = useState("");
    const [orderCommerceId, setOrderCommerceId] = useState("");
    const [orderCommerceSequentialId, setOrderCommerceSequentialId] = useState("");
    const [orderCurrency, setOrderCurrency] = useState("");
    const [orderPaymentMethod, setOrderPaymentMethod] = useState("");
    const [orderTotalAmount, setOrderTotalAmount] = useState("");
    const [orderItemsQuantity, setOrderItemsQuantity] = useState("");
    const [orderIsPod, setOrderIsPod] = useState(false);
    const [orderIsOnlinePod, setOrderIsOnlinePod] = useState(false);

    const [customerCostAmount, setCustomerCostAmount] = useState("");
    const [customerCostCurrency, setCustomerCostCurrency] = useState("");
    const [deliveryCostAmount, setDeliveryCostAmount] = useState("");
    const [deliveryCostCurrency, setDeliveryCostCurrency] = useState("");

    const [integrationVtexId, setIntegrationVtexId] = useState("");
    const [complementVtexId, setComplementVtexId] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [integrationErrorShippingCreate, setIntegrationErrorShippingCreate] = useState("");
    const [integrationErrorPreShippingCreate, setIntegrationErrorPreShippingCreate] = useState("");
    const [externalLabelFormat, setExternalLabelFormat] = useState("");
    const [externalLabelUrl, setExternalLabelUrl] = useState("");
    const [carrierOptions, setCarrierOptions] = useState<CarrierOption[]>([]);
    const [carriersLoading, setCarriersLoading] = useState(false);
    const [carriersError, setCarriersError] = useState("");
    const [sectionOpen, setSectionOpen] = useState<Record<SectionKey, boolean>>(() => buildSectionState("general"));

    const toggleSection = useCallback((key: SectionKey) => {
        setSectionOpen(buildSectionState(key));
    }, []);

    const goToNextSection = useCallback((current: SectionKey) => {
        const currentIndex = SECTION_ORDER.indexOf(current);
        if (currentIndex < 0 || currentIndex >= SECTION_ORDER.length - 1) return;
        const nextKey = SECTION_ORDER[currentIndex + 1];
        setSectionOpen(buildSectionState(nextKey));
    }, []);

    const selectedCarrierName = useMemo(
        () => carrierOptions.find((carrier) => carrier.id === carrierId)?.name || "-",
        [carrierId, carrierOptions]
    );

    useEffect(() => {
        let cancelled = false;

        const loadCarriers = async () => {
            if (!token) return;

            setCarriersLoading(true);
            setCarriersError("");

            try {
                const response = await fetchWithAuthDelivery<CarrierApiResponse | CarrierApiItem[]>("carrier");
                const items = Array.isArray(response) ? response : response?.data || [];

                const mapped = items
                    .map((item) => ({
                        id: String(item?.id || "").trim(),
                        name: String(item?.name || "").trim(),
                    }))
                    .filter((item) => item.id && item.name);

                if (!cancelled) {
                    setCarrierOptions(mapped);
                }
            } catch (error: any) {
                if (!cancelled) {
                    setCarriersError(error?.message || "No fue posible cargar transportistas.");
                    setCarrierOptions([]);
                }
            } finally {
                if (!cancelled) {
                    setCarriersLoading(false);
                }
            }
        };

        loadCarriers();

        return () => {
            cancelled = true;
        };
    }, [fetchWithAuthDelivery, token]);

    const isFormValid = useMemo(() => {
        if (!hasAddressData(pickup) || !hasAddressData(dropoff)) return false;
        if (scheduleStart.trim() && !scheduleEnd.trim()) return false;
        if (scheduleEnd.trim() && !scheduleStart.trim()) return false;
        if ((orderId.trim() && !orderCommerceId.trim()) || (!orderId.trim() && orderCommerceId.trim())) return false;
        if (customerCostAmount.trim() && !Number.isFinite(Number(customerCostAmount))) return false;
        if (deliveryCostAmount.trim() && !Number.isFinite(Number(deliveryCostAmount))) return false;
        if (customerCostAmount.trim() && !customerCostCurrency.trim()) return false;
        if (deliveryCostAmount.trim() && !deliveryCostCurrency.trim()) return false;
        return true;
    }, [
        customerCostAmount,
        customerCostCurrency,
        deliveryCostAmount,
        deliveryCostCurrency,
        dropoff,
        orderCommerceId,
        orderId,
        pickup,
        scheduleEnd,
        scheduleStart,
    ]);

    const buildPayload = useCallback((): ShippingCreatePayload => {
        const senderPayload = sanitizePerson(sender);
        const receiverPayload = sanitizePerson(receiver);
        const orderPayload: ShippingOrderPayload | undefined =
            orderId.trim() && orderCommerceId.trim()
                ? {
                    id: orderId.trim(),
                    commerceId: orderCommerceId.trim(),
                    commerceSequentialId: orderCommerceSequentialId.trim() || undefined,
                    currency: orderCurrency.trim() || undefined,
                    paymentMethod: orderPaymentMethod.trim() || undefined,
                    totalAmount: Number.isFinite(Number(orderTotalAmount)) ? Number(orderTotalAmount) : undefined,
                    itemsQuantity: Number.isFinite(Number(orderItemsQuantity)) ? Number(orderItemsQuantity) : undefined,
                    isPaymentUponDelivery: orderIsPod,
                    isOnlinePaymentUponDelivery: orderIsOnlinePod,
                }
                : undefined;

        const payload: ShippingCreatePayload = {
            refId: refId.trim(),
            pickup: sanitizeAddress(pickup),
            dropoff: sanitizeAddress(dropoff),
            readyForPickup,
            scheduledPending,
            isExternalCreationRetrying,
        };

        if (origin.trim()) payload.origin = origin.trim();
        if (carrierId.trim()) payload.carrierId = carrierId.trim();
        if (timeSlotId.trim()) payload.timeSlotId = timeSlotId.trim();
        if (senderPayload) payload.sender = senderPayload;
        if (receiverPayload) payload.receiver = receiverPayload;

        if (integrationVtexId.trim()) {
            payload.integrationComplements = {
                vtexId: integrationVtexId.trim(),
            };
        }

        if (orderPayload) {
            payload.orders = [orderPayload];
        }

        if (scheduleStart.trim() && scheduleEnd.trim()) {
            payload.schedule = {
                start: scheduleStart,
                end: scheduleEnd,
            };
        }

        if (complementVtexId.trim() || invoiceNumber.trim()) {
            payload.complements = {
                vtexId: complementVtexId.trim() || undefined,
                invoiceNumber: invoiceNumber.trim() || undefined,
            };
        }

        if (pickupCheckedIn || pickupAnnouncementDate.trim() || pickupPosition.trim() || pickupAnnouncementsText.trim()) {
            payload.pickupAnnouncements = {
                pickupCheckedIn,
                position: pickupPosition.trim() || null,
                date: pickupAnnouncementDate,
                announcements: pickupAnnouncementsText,
            };
        }

        if (
            customerCostAmount.trim() &&
            customerCostCurrency.trim() &&
            deliveryCostAmount.trim() &&
            deliveryCostCurrency.trim()
        ) {
            payload.costs = {
                customer: {
                    amount: Number(customerCostAmount),
                    currency: customerCostCurrency.trim(),
                },
                delivery: {
                    amount: Number(deliveryCostAmount),
                    currency: deliveryCostCurrency.trim(),
                },
            };
        }

        if (secondFactorValue.trim()) {
            payload.secondFactor = {
                value: secondFactorValue.trim(),
            };
        }

        if (integrationErrorShippingCreate.trim() || integrationErrorPreShippingCreate.trim()) {
            payload.integrationErrorProcesses = {
                shippingCreate: integrationErrorShippingCreate.trim() || undefined,
                preShippingCreate: integrationErrorPreShippingCreate.trim() || undefined,
            };
        }

        if (externalLabelFormat.trim() || externalLabelUrl.trim()) {
            payload.externalLabels = [
                {
                    format: externalLabelFormat.trim() || undefined,
                    url: externalLabelUrl.trim() || undefined,
                },
            ];
        }

        if (dispatchDate.trim()) payload.dispatchDate = dispatchDate;

        return payload;
    }, [
        carrierId,
        complementVtexId,
        customerCostAmount,
        customerCostCurrency,
        deliveryCostAmount,
        deliveryCostCurrency,
        dispatchDate,
        dropoff,
        externalLabelFormat,
        externalLabelUrl,
        integrationVtexId,
        integrationErrorPreShippingCreate,
        integrationErrorShippingCreate,
        invoiceNumber,
        isExternalCreationRetrying,
        origin,
        orderCommerceId,
        orderCommerceSequentialId,
        orderCurrency,
        orderId,
        orderIsOnlinePod,
        orderIsPod,
        orderItemsQuantity,
        orderPaymentMethod,
        orderTotalAmount,
        pickupAnnouncementDate,
        pickupAnnouncementsText,
        pickupCheckedIn,
        pickupPosition,
        pickup,
        readyForPickup,
        receiver,
        refId,
        scheduleEnd,
        scheduleStart,
        secondFactorValue,
        scheduledPending,
        sender,
        timeSlotId,
    ]);

    const handleSave = useCallback(async () => {
        if (!token) {
            setErrorMsg("No hay token disponible para crear envios.");
            return;
        }
        if (!isFormValid) {
            setErrorMsg("Completa los campos obligatorios para crear el envio.");
            return;
        }

        setSaving(true);
        setErrorMsg("");

        try {
            const payload = buildPayload();
            await fetchWithAuthDelivery("shipping", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            router.push("/delivery/envios");
        } catch (error: any) {
            setErrorMsg(error?.message || "No fue posible crear el envio.");
        } finally {
            setSaving(false);
        }
    }, [buildPayload, fetchWithAuthDelivery, isFormValid, router, token]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
                disabled: saving || !isFormValid,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/envios"),
                disabled: saving,
            },
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving || !isFormValid,
            },
        ],
        [handleSave, isFormValid, router, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Envios</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo envio</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 space-y-6">
            {!!errorMsg && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-6">
                    <Card
                        title="1. DATOS GENERALES"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        onHeaderClick={() => toggleSection("general")}
                        headerExpanded={sectionOpen.general}
                        headerAction={
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSection("general");
                                }}
                                aria-label={sectionOpen.general ? "Ocultar sección" : "Mostrar sección"}
                                className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${sectionOpen.general ? "rotate-180" : ""}`} />
                            </button>
                        }
                    >
                        {sectionOpen.general && <div className="space-y-4">
                            <FieldRows label="Referencia">
                                <Input value={refId} onChange={(e) => setRefId(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Origen">
                                <Input value={origin} onChange={(e) => setOrigin(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Tipo de envío">
                                <Select
                                    value="delivery"
                                    options={[{ value: "delivery", label: "Delivery" }]}
                                    disabled
                                    className="w-full"
                                />
                            </FieldRows>
                            <FieldRows label="Carrier">
                                <div className="w-full">
                                    <Select
                                        value={carrierId}
                                        onValueChange={setCarrierId}
                                        options={carrierOptions.map((carrier) => ({ value: carrier.id, label: carrier.name }))}
                                        placeholder={carriersLoading ? "Cargando carriers..." : "Seleccionar carrier"}
                                        disabled={carriersLoading}
                                        className="w-full"
                                    />
                                    {!!carriersError && <div className="mt-1 text-xs text-red-600">{carriersError}</div>}
                                </div>
                            </FieldRows>
                            <FieldRows label=" ">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Listo para retiro</span>
                                        <ActiveStatusToggle active={readyForPickup} onActiveChange={setReadyForPickup} showStateLabel={false} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Pendiente programación</span>
                                        <ActiveStatusToggle active={scheduledPending} onActiveChange={setScheduledPending} showStateLabel={false} />
                                    </div>
                                </div>
                            </FieldRows>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => goToNextSection("general")}
                                    className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>}
                    </Card>

                    <Card
                        title="2. ORDEN ASOCIADA"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        onHeaderClick={() => toggleSection("order")}
                        headerExpanded={sectionOpen.order}
                        headerAction={
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSection("order");
                                }}
                                aria-label={sectionOpen.order ? "Ocultar sección" : "Mostrar sección"}
                                className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${sectionOpen.order ? "rotate-180" : ""}`} />
                            </button>
                        }
                    >
                        {sectionOpen.order && <div className="space-y-4">
                            <FieldRows label="ID orden">
                                <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Commerce ID">
                                <Input value={orderCommerceId} onChange={(e) => setOrderCommerceId(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Cantidad">
                                <Input value={orderItemsQuantity} onChange={(e) => setOrderItemsQuantity(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Monto">
                                <Input value={orderTotalAmount} onChange={(e) => setOrderTotalAmount(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Moneda">
                                <Input value={orderCurrency} onChange={(e) => setOrderCurrency(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Método de pago">
                                <Input value={orderPaymentMethod} onChange={(e) => setOrderPaymentMethod(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Pago contra entrega">
                                <ActiveStatusToggle active={orderIsPod} onActiveChange={setOrderIsPod} showStateLabel={false} />
                            </FieldRows>
                            <FieldRows label="Validar pago online en entrega">
                                <ActiveStatusToggle active={orderIsOnlinePod} onActiveChange={setOrderIsOnlinePod} showStateLabel={false} />
                            </FieldRows>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => goToNextSection("order")}
                                    className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>}
                    </Card>

                    <Card
                        title="3. REMITENTE / ORIGEN"
                        icon={UserIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        onHeaderClick={() => toggleSection("senderOrigin")}
                        headerExpanded={sectionOpen.senderOrigin}
                        headerAction={
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSection("senderOrigin");
                                }}
                                aria-label={sectionOpen.senderOrigin ? "Ocultar sección" : "Mostrar sección"}
                                className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${sectionOpen.senderOrigin ? "rotate-180" : ""}`} />
                            </button>
                        }
                    >
                        {sectionOpen.senderOrigin && <div className="space-y-4">
                            <FieldRows label="Seleccionar bodega existente">
                                <Input value={sender.referenceId || ""} onChange={(e) => setSender((s) => ({ ...s, referenceId: e.target.value }))} fullWidth />
                            </FieldRows>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">O ingresar datos manuales</div>
                            <FieldRows label="Remitente empresa">
                                <Input value={sender.companyName} onChange={(e) => setSender((s) => ({ ...s, companyName: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Remitente documento">
                                <Input value={sender.document || ""} onChange={(e) => setSender((s) => ({ ...s, document: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Remitente tipo de documento">
                                <Input value={sender.documentType || ""} onChange={(e) => setSender((s) => ({ ...s, documentType: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Remitente email">
                                <Input value={sender.email} onChange={(e) => setSender((s) => ({ ...s, email: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Remitente telefono">
                                <Input value={sender.phone} onChange={(e) => setSender((s) => ({ ...s, phone: e.target.value }))} fullWidth />
                            </FieldRows>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dirección pickup</div>
                            <FieldRows label="País">
                                <Input value={pickup.country} onChange={(e) => setPickup((p) => ({ ...p, country: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Estado">
                                <Input value={pickup.state} onChange={(e) => setPickup((p) => ({ ...p, state: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Ciudad">
                                <Input value={pickup.city} onChange={(e) => setPickup((p) => ({ ...p, city: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Tipo de calle">
                                <Select value={pickup.streetType} options={STREET_TYPE_OPTIONS} onValueChange={(value) => setPickup((p) => ({ ...p, streetType: (value as StreetType) || "street" }))} className="w-full" />
                            </FieldRows>
                            <FieldRows label="Calle">
                                <Input value={pickup.street} onChange={(e) => setPickup((p) => ({ ...p, street: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Número">
                                <Input value={pickup.number} onChange={(e) => setPickup((p) => ({ ...p, number: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Código postal">
                                <Input value={pickup.postalCode} onChange={(e) => setPickup((p) => ({ ...p, postalCode: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Geo validada">
                                <ActiveStatusToggle active={pickup.geoVerified} onActiveChange={(active) => setPickup((p) => ({ ...p, geoVerified: active }))} showStateLabel={false} />
                            </FieldRows>
                            <FieldRows label="Latitud">
                                <Input value={pickup.lat == null ? "" : String(pickup.lat)} onChange={(e) => setPickup((p) => ({ ...p, lat: parseNullableNumber(e.target.value) }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Longitud">
                                <Input value={pickup.lng == null ? "" : String(pickup.lng)} onChange={(e) => setPickup((p) => ({ ...p, lng: parseNullableNumber(e.target.value) }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Mapa pickup">
                                <div className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                    Vista de mapa pendiente de integración. Coordenadas actuales: {pickup.lat ?? "-"}, {pickup.lng ?? "-"}
                                </div>
                            </FieldRows>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => goToNextSection("senderOrigin")}
                                    className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>}
                    </Card>

                    <Card
                        title="4. DESTINATARIO / DESTINO"
                        icon={MapPinIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        onHeaderClick={() => toggleSection("receiverDestination")}
                        headerExpanded={sectionOpen.receiverDestination}
                        headerAction={
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSection("receiverDestination");
                                }}
                                aria-label={sectionOpen.receiverDestination ? "Ocultar sección" : "Mostrar sección"}
                                className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${sectionOpen.receiverDestination ? "rotate-180" : ""}`} />
                            </button>
                        }
                    >
                        {sectionOpen.receiverDestination && <div className="space-y-4">
                            <FieldRows label="Seleccionar destinatario existente">
                                <Input value={receiver.referenceId || ""} onChange={(e) => setReceiver((s) => ({ ...s, referenceId: e.target.value }))} fullWidth />
                            </FieldRows>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">O ingresar datos manuales</div>
                            <FieldRows label="Destinatario empresa">
                                <Input value={receiver.companyName} onChange={(e) => setReceiver((s) => ({ ...s, companyName: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Destinatario documento">
                                <Input value={receiver.document || ""} onChange={(e) => setReceiver((s) => ({ ...s, document: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Destinatario tipo de documento">
                                <Input value={receiver.documentType || ""} onChange={(e) => setReceiver((s) => ({ ...s, documentType: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Destinatario email">
                                <Input value={receiver.email} onChange={(e) => setReceiver((s) => ({ ...s, email: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Destinatario telefono">
                                <Input value={receiver.phone} onChange={(e) => setReceiver((s) => ({ ...s, phone: e.target.value }))} fullWidth />
                            </FieldRows>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dirección dropoff</div>
                            <FieldRows label="País">
                                <Input value={dropoff.country} onChange={(e) => setDropoff((d) => ({ ...d, country: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Estado">
                                <Input value={dropoff.state} onChange={(e) => setDropoff((d) => ({ ...d, state: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Ciudad">
                                <Input value={dropoff.city} onChange={(e) => setDropoff((d) => ({ ...d, city: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Tipo de calle">
                                <Select value={dropoff.streetType} options={STREET_TYPE_OPTIONS} onValueChange={(value) => setDropoff((d) => ({ ...d, streetType: (value as StreetType) || "street" }))} className="w-full" />
                            </FieldRows>
                            <FieldRows label="Calle">
                                <Input value={dropoff.street} onChange={(e) => setDropoff((d) => ({ ...d, street: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Número">
                                <Input value={dropoff.number} onChange={(e) => setDropoff((d) => ({ ...d, number: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Código postal">
                                <Input value={dropoff.postalCode} onChange={(e) => setDropoff((d) => ({ ...d, postalCode: e.target.value }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Geo validada">
                                <ActiveStatusToggle active={dropoff.geoVerified} onActiveChange={(active) => setDropoff((d) => ({ ...d, geoVerified: active }))} showStateLabel={false} />
                            </FieldRows>
                            <FieldRows label="Latitud">
                                <Input value={dropoff.lat == null ? "" : String(dropoff.lat)} onChange={(e) => setDropoff((d) => ({ ...d, lat: parseNullableNumber(e.target.value) }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Longitud">
                                <Input value={dropoff.lng == null ? "" : String(dropoff.lng)} onChange={(e) => setDropoff((d) => ({ ...d, lng: parseNullableNumber(e.target.value) }))} fullWidth />
                            </FieldRows>
                            <FieldRows label="Mapa dropoff">
                                <div className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                    Vista de mapa pendiente de integración. Coordenadas actuales: {dropoff.lat ?? "-"}, {dropoff.lng ?? "-"}
                                </div>
                            </FieldRows>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => goToNextSection("receiverDestination")}
                                    className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>}
                    </Card>

                    <Card
                        title="5. PROGRAMACIÓN"
                        icon={CheckCircleIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        onHeaderClick={() => toggleSection("scheduling")}
                        headerExpanded={sectionOpen.scheduling}
                        headerAction={
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSection("scheduling");
                                }}
                                aria-label={sectionOpen.scheduling ? "Ocultar sección" : "Mostrar sección"}
                                className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${sectionOpen.scheduling ? "rotate-180" : ""}`} />
                            </button>
                        }
                    >
                        {sectionOpen.scheduling && <div className="space-y-4">
                            <FieldRows label="Fecha inicio">
                                <DateTimePickerField value={scheduleStart} onChange={setScheduleStart} />
                            </FieldRows>
                            <FieldRows label="Fecha fin">
                                <DateTimePickerField value={scheduleEnd} onChange={setScheduleEnd} />
                            </FieldRows>
                            <FieldRows label="Dispatch date (opcional)">
                                <DateTimePickerField value={dispatchDate} onChange={setDispatchDate} />
                            </FieldRows>
                            <FieldRows label="Ventana horaria (timeSlotId)">
                                <Input value={timeSlotId} onChange={(e) => setTimeSlotId(e.target.value)} fullWidth />
                            </FieldRows>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => goToNextSection("scheduling")}
                                    className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>}
                    </Card>

                    <Card
                        title="6. COSTOS"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        onHeaderClick={() => toggleSection("costs")}
                        headerExpanded={sectionOpen.costs}
                        headerAction={
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSection("costs");
                                }}
                                aria-label={sectionOpen.costs ? "Ocultar sección" : "Mostrar sección"}
                                className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${sectionOpen.costs ? "rotate-180" : ""}`} />
                            </button>
                        }
                    >
                        {sectionOpen.costs && <div className="space-y-4">
                            <FieldRows label="Costo cliente monto">
                                <Input value={customerCostAmount} onChange={(e) => setCustomerCostAmount(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Costo cliente moneda">
                                <Input value={customerCostCurrency} onChange={(e) => setCustomerCostCurrency(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Costo delivery monto">
                                <Input value={deliveryCostAmount} onChange={(e) => setDeliveryCostAmount(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Costo delivery moneda">
                                <Input value={deliveryCostCurrency} onChange={(e) => setDeliveryCostCurrency(e.target.value)} fullWidth />
                            </FieldRows>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => goToNextSection("costs")}
                                    className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>}
                    </Card>

                    <Card
                        title="7. AVANZADO"
                        icon={MapPinIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        onHeaderClick={() => toggleSection("advanced")}
                        headerExpanded={sectionOpen.advanced}
                        headerAction={
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSection("advanced");
                                }}
                                aria-label={sectionOpen.advanced ? "Ocultar sección" : "Mostrar sección"}
                                className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${sectionOpen.advanced ? "rotate-180" : ""}`} />
                            </button>
                        }
                    >
                        {sectionOpen.advanced && <div className="space-y-4">
                            <FieldRows label="integrationComplements.vtexId">
                                <Input value={integrationVtexId} onChange={(e) => setIntegrationVtexId(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="complements.vtexId">
                                <Input value={complementVtexId} onChange={(e) => setComplementVtexId(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="complements.invoiceNumber">
                                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="secondFactor.value">
                                <Input value={secondFactorValue} onChange={(e) => setSecondFactorValue(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="externalLabels.format">
                                <Input value={externalLabelFormat} onChange={(e) => setExternalLabelFormat(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="externalLabels.url">
                                <Input value={externalLabelUrl} onChange={(e) => setExternalLabelUrl(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Reintento de creación externa">
                                <ActiveStatusToggle active={isExternalCreationRetrying} onActiveChange={setIsExternalCreationRetrying} showStateLabel={false} />
                            </FieldRows>
                            <FieldRows label="Anuncio retiro confirmado">
                                <ActiveStatusToggle active={pickupCheckedIn} onActiveChange={setPickupCheckedIn} showStateLabel={false} />
                            </FieldRows>
                            <FieldRows label="Fecha y hora de anuncio">
                                <DateTimePickerField value={pickupAnnouncementDate} onChange={setPickupAnnouncementDate} />
                            </FieldRows>
                            <FieldRows label="Posición de anuncio">
                                <Input value={pickupPosition} onChange={(e) => setPickupPosition(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="Detalle de anuncio">
                                <Input value={pickupAnnouncementsText} onChange={(e) => setPickupAnnouncementsText(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="integrationErrorProcesses.shippingCreate">
                                <Input value={integrationErrorShippingCreate} onChange={(e) => setIntegrationErrorShippingCreate(e.target.value)} fullWidth />
                            </FieldRows>
                            <FieldRows label="integrationErrorProcesses.preShippingCreate">
                                <Input value={integrationErrorPreShippingCreate} onChange={(e) => setIntegrationErrorPreShippingCreate(e.target.value)} fullWidth />
                            </FieldRows>
                        </div>}
                    </Card>
                </div>

                <div className="xl:sticky xl:top-24">
                    <Card
                        title="Resumen"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Datos generales</div>
                                <div className="text-gray-800">Referencia: {refId || "-"}</div>
                                <div className="text-gray-800">Origen: {origin || "-"}</div>
                                <div className="text-gray-800">Carrier: {selectedCarrierName}</div>
                                <div className="text-gray-800">Listo para retiro: {readyForPickup ? "Sí" : "No"}</div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Orden</div>
                                <div className="text-gray-800">ID: {orderId || "-"}</div>
                                <div className="text-gray-800">Commerce ID: {orderCommerceId || "-"}</div>
                                <div className="text-gray-800">Monto: {orderTotalAmount || "-"} {orderCurrency || ""}</div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pickup</div>
                                <div className="text-gray-800">{pickup.street || "-"} {pickup.number || ""}</div>
                                <div className="text-gray-800">{pickup.city || "-"}, {pickup.state || "-"}</div>
                                <div className="text-gray-800">Coords: {pickup.lat ?? "-"}, {pickup.lng ?? "-"}</div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dropoff</div>
                                <div className="text-gray-800">{dropoff.street || "-"} {dropoff.number || ""}</div>
                                <div className="text-gray-800">{dropoff.city || "-"}, {dropoff.state || "-"}</div>
                                <div className="text-gray-800">Coords: {dropoff.lat ?? "-"}, {dropoff.lng ?? "-"}</div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Programación y costos</div>
                                <div className="text-gray-800">Inicio: {scheduleStart || "-"}</div>
                                <div className="text-gray-800">Fin: {scheduleEnd || "-"}</div>
                                <div className="text-gray-800">Dispatch: {dispatchDate || "-"}</div>
                                <div className="text-gray-800">Cliente: {customerCostAmount || "-"} {customerCostCurrency || ""}</div>
                                <div className="text-gray-800">Delivery: {deliveryCostAmount || "-"} {deliveryCostCurrency || ""}</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
