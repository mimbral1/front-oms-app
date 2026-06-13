// components/SeccionPagos.tsx
import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import { Input, Divider } from "@mui/material";
import { PlusIcon } from "@heroicons/react/24/outline";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import { ActionButton } from "@/components/ui/button/action-button";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { PAYMENT_TYPES_API } from "@/lib/http/endpoints";

type PaymentTypeMeta = {
    id: string;
    groupNum: number | null;
    name: string;
    days: number | null;
    wildcard: boolean;
    cosecha: boolean;
    genericCredit: boolean;
};

type CustomerCondition = {
    days: number | null;
    wildcard: boolean;
    matched: boolean;
    cosecha: boolean;
};

type NormalizedPaymentType = Omit<PaymentTypeMeta, "id" | "groupNum">;
type PaymentTypeApiRow = {
    GroupNum?: number | string | null;
    groupNum?: number | string | null;
    extraDays?: number | string | null;
    ExtraDays?: number | string | null;
    referenceId?: string | number | null;
    ReferenceId?: string | number | null;
    Id?: string | number | null;
    id?: string | number | null;
    Code?: string | number | null;
    code?: string | number | null;
    name?: string | null;
};
type PaymentTypeApiResponse = {
    data?: PaymentTypeApiRow[];
};

const normalizeText = (value: string) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();

function normalizePaymentType(name: string): NormalizedPaymentType {
    const rawName = String(name || "").trim();
    const upper = normalizeText(rawName);

    if (upper === "*") {
        return {
            name: rawName,
            days: null,
            wildcard: true,
            cosecha: false,
            genericCredit: false,
        };
    }

    if (upper.includes("COSECHA")) {
        return {
            name: rawName,
            days: 365,
            wildcard: false,
            cosecha: true,
            genericCredit: false,
        };
    }

    const cuotasMatch = upper.match(/CUOTAS\s*(\d+)/i);
    if (cuotasMatch) {
        const n = Number(cuotasMatch[1]);
        return {
            name: rawName,
            days: Number.isFinite(n) && n > 0 ? n * 30 : null,
            wildcard: false,
            cosecha: false,
            genericCredit: false,
        };
    }

    if (
        upper === "CONTADO" ||
        upper === "CHEQUE AL DIA" ||
        upper === "COMPRA ANTICIPADA"
    ) {
        return {
            name: rawName,
            days: 0,
            wildcard: false,
            cosecha: false,
            genericCredit: false,
        };
    }

    const numbers = (upper.match(/\d+/g) || []).map((n) => Number(n)).filter((n) => Number.isFinite(n));
    if (numbers.length > 0) {
        return {
            name: rawName,
            days: Math.max(...numbers),
            wildcard: false,
            cosecha: false,
            genericCredit: false,
        };
    }

    if (upper === "CREDITO") {
        return {
            name: rawName,
            days: null,
            wildcard: false,
            cosecha: false,
            genericCredit: true,
        };
    }

    return {
        name: rawName,
        days: null,
        wildcard: false,
        cosecha: false,
        genericCredit: false,
    };
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex justify-between">
            <span className={bold ? "font-semibold" : ""}>{label}</span>
            <span className={bold ? "font-semibold" : ""}>{value}</span>
        </div>
    );
}

export default function SeccionPagos({
    pagoMetodo,
    setPagoMetodo,
    pagoImporte,
    setPagoImporte,
    pagos,
    setPagos,
    subtotalConIVA,
    totalPagos,
    clp,
    onConfirmar,
    isPagosCompleto,
    isPreVentaMode,
    customerGroupNum,
    isAgriculturalOrder,
    customerCreditLimit,
    customerCreditUsed,
    customerAvailableCredit,
    loadingCustomerAvailableCredit,
    customerAvailableCreditMessage,
    customerHasCreditLine,
    creditReviewRequired,
    creditReviewMessage,
    isRequestingCreditAuthorization,
    onRequestCreditAuthorization,
}: {
    pagoMetodo: string;
    setPagoMetodo: (v: string) => void;
    pagoImporte: number;
    setPagoImporte: (n: number) => void;
    pagos: { metodo: string; importe: number }[];
    setPagos: React.Dispatch<React.SetStateAction<{ metodo: string; importe: number }[]>>;
    subtotalConIVA: number;
    totalPagos: number;
    clp: { format: (n: number) => string };
    onConfirmar: () => void;
    isPagosCompleto: boolean;
    isPreVentaMode?: boolean;
    customerGroupNum: number | null;
    isAgriculturalOrder: boolean;
    customerCreditLimit?: number | null;
    customerCreditUsed?: number | null;
    customerAvailableCredit?: number | null;
    loadingCustomerAvailableCredit?: boolean;
    customerAvailableCreditMessage?: string | null;
    customerHasCreditLine?: boolean | null;
    creditReviewRequired?: boolean;
    creditReviewMessage?: string | null;
    isRequestingCreditAuthorization?: boolean;
    onRequestCreditAuthorization?: (payload: {
        customerGroupNum: number | null;
        paymentMethod: string;
        authorizedLimit: number;
        usedCredit: number;
        availableCredit: number;
        totalPreventa: number;
        exceededAmount: number;
        reason: string;
    }) => Promise<boolean> | boolean;
}) {
    const [pagoSearch, setPagoSearch] = useState("");
    const [pagoOptions, setPagoOptions] = useState<{ label: string; value: string }[]>([
        { label: "Seleccione tipo de pago…", value: "" },
    ]);
    const [paymentTypesLoading, setPaymentTypesLoading] = useState(false);
    const [paymentTypesMeta, setPaymentTypesMeta] = useState<PaymentTypeMeta[]>([]);
    const [creditRequestReason, setCreditRequestReason] = useState("");
    const [creditAuthorizationRequested, setCreditAuthorizationRequested] = useState(false);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setPaymentTypesLoading(true);

                const resp = await fetch(PAYMENT_TYPES_API, { method: "GET" });
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status} al cargar tipos de pago`);
                }

                const payload = await resp.json() as PaymentTypeApiResponse | PaymentTypeApiRow[];
                const rows = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : [];

                const names: string[] = Array.from(
                    new Set(
                        rows
                            .map((r: PaymentTypeApiRow) => String(r?.name ?? "").trim())
                            .filter(Boolean)
                    )
                );

                const meta: PaymentTypeMeta[] = rows
                        .map((r: PaymentTypeApiRow, idx: number) => {
                        const name = String(r?.name ?? "").trim();
                        if (!name) return null;
                        const normalized = normalizePaymentType(name);
                        const rawGroupNum = r?.GroupNum ?? r?.groupNum ?? null;
                        const parsedGroupNum = rawGroupNum == null ? null : Number(rawGroupNum);
                        const resolvedGroupNum = Number.isFinite(parsedGroupNum as number)
                            ? Number(parsedGroupNum)
                            : null;
                        const rawExtraDays = r?.extraDays ?? r?.ExtraDays ?? null;
                        const parsedExtraDays = rawExtraDays == null ? null : Number(rawExtraDays);
                        const normalizedDays = normalized.days;
                        const apiDays = Number.isFinite(parsedExtraDays as number) ? parsedExtraDays : null;
                        const resolvedDays =
                            normalizedDays == null
                                ? apiDays
                                : apiDays == null
                                    ? normalizedDays
                                    : Math.max(normalizedDays, apiDays);
                        const idCandidate =
                            rawGroupNum ??
                            r?.referenceId ??
                            r?.ReferenceId ??
                            r?.Id ??
                            r?.id ??
                            r?.Code ??
                            r?.code ??
                            idx;

                        return {
                            id: String(idCandidate),
                            groupNum: resolvedGroupNum,
                            ...normalized,
                            days: resolvedDays,
                        };
                    })
                    .filter((x: PaymentTypeMeta | null): x is PaymentTypeMeta => Boolean(x));

                const opts = [
                    { label: "Seleccione tipo de pago…", value: "" },
                    ...names.map((name) => ({ label: name, value: name })),
                ];

                if (mounted) setPagoOptions(opts);
                if (mounted) setPaymentTypesMeta(meta);
            } catch {
                if (mounted) {
                    setPagoOptions([{ label: "Seleccione tipo de pago…", value: "" }]);
                    setPaymentTypesMeta([]);
                }
            } finally {
                if (mounted) setPaymentTypesLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const customerCondition = useMemo<CustomerCondition>(() => {
        if (customerGroupNum == null) {
            return { days: null, wildcard: false, matched: true, cosecha: false };
        }

        // Regla de negocio: GroupNum -1 equivale a contado.
        if (customerGroupNum === -1) {
            return { days: 0, wildcard: false, matched: true, cosecha: false };
        }

        const found = paymentTypesMeta.find((m) => {
            if (m.groupNum != null) {
                return m.groupNum === customerGroupNum;
            }
            const numericId = Number(m.id);
            return Number.isFinite(numericId) && numericId === customerGroupNum;
        });
        if (!found) {
            return { days: null, wildcard: false, matched: false, cosecha: false };
        }

        return { days: found.days, wildcard: found.wildcard, matched: true, cosecha: found.cosecha };
    }, [paymentTypesMeta, customerGroupNum]);

    const allowedMethodNames = useMemo(() => {
        if (customerGroupNum == null) {
            return new Set(paymentTypesMeta.map((m) => m.name));
        }

        if (customerGroupNum === -1) {
            return new Set(
                paymentTypesMeta
                    .filter((m) => normalizeText(m.name) === "CONTADO")
                    .map((m) => m.name)
            );
        }

        if (!customerCondition.matched) {
            return new Set<string>();
        }

        if (customerCondition.wildcard) {
            return new Set(paymentTypesMeta.map((m) => m.name));
        }

        return new Set(
            paymentTypesMeta
                .filter((m) => {
                    if (m.wildcard) return false;
                    if (m.genericCredit) return false;

                    if (m.cosecha) {
                        if (customerCondition.cosecha) return true;
                        return Boolean(isAgriculturalOrder) && (customerCondition.days ?? -1) >= 365;
                    }

                    if (m.days == null || customerCondition.days == null) return false;
                    return m.days <= customerCondition.days;
                })
                .map((m) => m.name)
        );
    }, [paymentTypesMeta, customerCondition, isAgriculturalOrder]);

    const filteredPagoOptions = useMemo(() => {
        if (paymentTypesMeta.length === 0) return pagoOptions;

        return [
            { label: "Seleccione tipo de pago…", value: "" },
            ...pagoOptions
                .filter((o) => o.value !== "" && allowedMethodNames.has(o.value))
                .map((o) => ({ label: o.label, value: o.value })),
        ];
    }, [pagoOptions, paymentTypesMeta, allowedMethodNames]);

    useEffect(() => {
        if (!pagoMetodo) return;
        if (!allowedMethodNames.has(pagoMetodo)) {
            setPagoMetodo("");
        }
    }, [pagoMetodo, allowedMethodNames, setPagoMetodo]);

    const isCreditValidationMethod = useMemo(() => {
        const method = normalizeText(pagoMetodo || "");
        if (!method) return false;
        return method !== "CONTADO";
    }, [pagoMetodo]);

    const hasLegacyCreditData = customerCreditLimit != null || customerCreditUsed != null;
    const hasAvailableCreditData = customerAvailableCredit != null;
    const hasCreditData = hasLegacyCreditData || hasAvailableCreditData;

    const usedCredit = useMemo(
        () => Math.max(0, Number(customerCreditUsed ?? 0) || 0),
        [customerCreditUsed]
    );

    const availableCredit = useMemo(() => {
        if (hasAvailableCreditData) {
            return Math.max(0, Number(customerAvailableCredit ?? 0) || 0);
        }
        if (hasLegacyCreditData) {
            const authorized = Math.max(0, Number(customerCreditLimit ?? 0) || 0);
            return Math.max(0, authorized - usedCredit);
        }
        return 0;
    }, [hasAvailableCreditData, customerAvailableCredit, hasLegacyCreditData, customerCreditLimit, usedCredit]);

    const authorizedLimit = useMemo(() => {
        if (customerCreditLimit != null) {
            return Math.max(0, Number(customerCreditLimit ?? 0) || 0);
        }
        return Math.max(0, availableCredit + usedCredit);
    }, [customerCreditLimit, availableCredit, usedCredit]);

    const exceededAmount = useMemo(() => Math.max(0, subtotalConIVA - availableCredit), [subtotalConIVA, availableCredit]);
    const needsCreditAuthorization = isCreditValidationMethod && hasCreditData && exceededAmount > 0;
    const isCreditValidationLoading = isCreditValidationMethod && Boolean(loadingCustomerAvailableCredit) && !hasCreditData;
    const missingCreditDataForValidation = isCreditValidationMethod && !hasCreditData && !isCreditValidationLoading && !Boolean(creditReviewRequired);
    const showCreditValidation =
        isCreditValidationMethod &&
        (hasCreditData || isCreditValidationLoading || customerHasCreditLine === false || Boolean(customerAvailableCreditMessage));

    useEffect(() => {
        setCreditAuthorizationRequested(false);
    }, [pagoMetodo, subtotalConIVA, customerGroupNum]);

    const canConfirmOrder =
        isPagosCompleto &&
        !needsCreditAuthorization &&
        !isCreditValidationLoading &&
        !missingCreditDataForValidation &&
        !Boolean(creditReviewRequired);

    const confirmBlockReasons = useMemo(() => {
        const reasons: string[] = [];

        if (!isPagosCompleto) {
            if (isPreVentaMode) {
                if (!String(pagoMetodo || "").trim()) {
                    reasons.push("Debes seleccionar un tipo de pago para la preventa.");
                }
            }

            if (!isPreVentaMode) {
                if (pagos.length === 0) {
                    reasons.push("Debes agregar al menos un metodo de pago.");
                }

                const hasInvalidPayment = pagos.some(
                    (p) => !String(p.metodo || "").trim() || Number(p.importe) <= 0
                );
                if (hasInvalidPayment) {
                    reasons.push("Hay pagos con metodo vacio o importe invalido.");
                }

                if (totalPagos < subtotalConIVA) {
                    reasons.push(
                        `El total de pagos (${clp.format(totalPagos)}) debe cubrir el total del pedido (${clp.format(subtotalConIVA)}).`
                    );
                }
            }
        }

        if (creditReviewRequired && !creditAuthorizationRequested) {
            reasons.push("La venta requiere revision de credito y debes solicitar autorizacion a cobranza.");
        }

        if (missingCreditDataForValidation) {
            reasons.push("No se pudo validar el cupo de credito del cliente. Recarga o selecciona nuevamente el cliente antes de confirmar.");
        }

        if (isCreditValidationLoading) {
            reasons.push("Validando cupo de credito del cliente. Espera un momento antes de confirmar.");
        }

        return reasons;
    }, [
        isPagosCompleto,
        pagos,
        totalPagos,
        subtotalConIVA,
        clp,
        needsCreditAuthorization,
        isCreditValidationLoading,
        missingCreditDataForValidation,
        creditReviewRequired,
        creditAuthorizationRequested,
        isPreVentaMode,
        pagoMetodo,
    ]);

    const showCreditAuthorizationPanel = showCreditValidation;

    const handleRequestCreditAuthorization = async () => {
        if (!needsCreditAuthorization && !creditReviewRequired) return;
        const reason = String(creditRequestReason || "").trim();
        if (!reason) return;

        const result = await onRequestCreditAuthorization?.({
            customerGroupNum,
            paymentMethod: pagoMetodo,
            authorizedLimit,
            usedCredit,
            availableCredit,
            totalPreventa: subtotalConIVA,
            exceededAmount,
            reason,
        });
        if (result) setCreditAuthorizationRequested(true);
    };

    return (
        <Card title="PAGOS" icon={BanknotesIcon} hasTitleDivider noDefaultStyles className="p-6 pb-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-xl">
                <div className="space-y-3">
                    {/* <FieldRows label="Tipo de pago">
                        <CollapsibleField
                            inline
                            label=""
                            value={pagoMetodo}
                            options={
                                [
                                    "Efectivo",
                                    "Contado (pago en caja)"
                                ]
                            }
                            onChange={(v) => setPagoMetodo(String(v))}
                        />
                    </FieldRows> */}

                    {/* <FieldRows label="Importe">
                        <Input
                            fullWidth
                            type="number"
                            value={pagoImporte}
                            onChange={(e: any) => setPagoImporte(Number(e.target.value || 0))}
                            className="[&>input]:p-0"
                        />
                    </FieldRows> */}

                    <FieldRows label="Tipo de pago">
                        <SelectSearchInline
                            id="pagoMetodo"
                            label=""
                            value={pagoMetodo}
                            options={filteredPagoOptions}
                            searchQuery={pagoSearch}
                            loading={paymentTypesLoading}
                            onSearch={setPagoSearch}
                            onChange={(val) => {
                                const next = String(val || "");
                                setPagoMetodo(next);
                            }}
                            placeholderFromDefault
                        />
                    </FieldRows>

                    {!isPreVentaMode ? (
                        <div className="pt-2">
                            <ActionButton
                                variant="primary"
                                onClick={() => {
                                    if (!pagoMetodo || !Number.isFinite(pagoImporte) || pagoImporte <= 0) return;
                                    setPagos((prev) => [...prev, { metodo: pagoMetodo, importe: pagoImporte }]);
                                    setPagoImporte(0);
                                }}
                            >
                                <PlusIcon className="h-4 w-4" />
                                Agregar método de pago
                            </ActionButton>
                        </div>
                    ) : null}

                    {!isPreVentaMode && pagos.length > 0 && (
                        <div className="pt-4 space-y-2">
                            {pagos.map((p, i) => (
                                <div key={i} className="flex items-center justify-between border rounded-md px-3 py-2">
                                    <div className="text-sm">
                                        <div className="font-medium">{p.metodo}</div>
                                        <div className="text-gray-600">{clp.format(p.importe)}</div>
                                    </div>
                                    <ActionButton
                                        variant="error"
                                        size="sm"
                                        onClick={() => setPagos((prev) => prev.filter((_, idx) => idx !== i))}
                                    >
                                        Eliminar
                                    </ActionButton>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="rounded-lg border bg-gray-50 p-4">
                        <p className="text-sm font-semibold mb-2">Resumen</p>
                        <div className="space-y-1 text-sm">
                            <Line label="Total items (con IVA)" value={clp.format(subtotalConIVA)} />
                            {!isPreVentaMode ? (
                                <>
                                    <Line label="Pagos agregados" value={clp.format(totalPagos)} />
                                    <Divider />
                                    <Line label="Saldo pendiente" value={clp.format(Math.max(0, subtotalConIVA - totalPagos))} bold />
                                </>
                            ) : (
                                <Line label="Tipo de pago seleccionado" value={pagoMetodo || "Pendiente"} bold />
                            )}
                        </div>
                    </div>

                    {showCreditAuthorizationPanel && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                            <p className="text-sm font-semibold text-slate-800">Validacion de credito</p>
                            {isCreditValidationLoading ? (
                                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                                    Consultando cupo de credito del cliente...
                                </div>
                            ) : null}
                            <div className="space-y-1 text-sm">
                                <Line label="Cupo disponible" value={clp.format(availableCredit)} />
                                <Line label="Total preventa" value={clp.format(subtotalConIVA)} />
                                <Line label="Monto excedido" value={clp.format(exceededAmount)} />
                            </div>

                            {(needsCreditAuthorization || creditReviewRequired) ? (
                                <>
                                    <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
                                        {creditReviewRequired
                                            ? (creditReviewMessage || "No tiene credito suficiente para completar la venta. Debes solicitar revision de credito.")
                                            : "Esta preventa excede el cupo disponible del cliente. Para continuar con credito interno, el asesor debe solicitar autorizacion a cobranza."}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Motivo de solicitud</label>
                                        <Input
                                            fullWidth
                                            multiline
                                            minRows={3}
                                            disableUnderline
                                            value={creditRequestReason}
                                            onChange={(e) => setCreditRequestReason(e.target.value)}
                                            placeholder="Ejemplo: Cliente frecuente, compra para obra activa, solicita autorizacion por monto excedido..."
                                            sx={{
                                                mt: 1,
                                                px: 1.5,
                                                py: 1.25,
                                                border: "1px solid",
                                                borderColor: "#94a3b8",
                                                borderRadius: "12px",
                                                backgroundColor: "#ffffff",
                                                transition: "border-color 120ms ease, box-shadow 120ms ease",
                                                "& textarea": {
                                                    color: "#0f172a",
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1.45,
                                                },
                                                "& textarea::placeholder": {
                                                    color: "#64748b",
                                                    opacity: 1,
                                                },
                                                "&:focus-within": {
                                                    borderColor: "#3b82f6",
                                                    boxShadow: "0 0 0 3px rgba(59,130,246,0.14)",
                                                },
                                            }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                        <ActionButton
                                            variant="secondary"
                                            onClick={() => {
                                                setCreditRequestReason("");
                                                setCreditAuthorizationRequested(false);
                                            }}
                                        >
                                            Cancelar
                                        </ActionButton>
                                        <ActionButton
                                            variant="primary"
                                            disabled={!creditRequestReason.trim() || Boolean(isRequestingCreditAuthorization)}
                                            onClick={() => {
                                                void handleRequestCreditAuthorization();
                                            }}
                                        >
                                            {isRequestingCreditAuthorization
                                                ? "Enviando solicitud..."
                                                : "Solicitar autorizacion de credito"}
                                        </ActionButton>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                    La preventa se encuentra dentro del cupo disponible del cliente.
                                </div>
                            )}

                            <div className="space-y-1 text-xs text-gray-600">
                                {(needsCreditAuthorization || creditReviewRequired) ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                                            <span>Preventa creada por asesor.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                                            <span>Customer credit detecto sobrecupo.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block h-2 w-2 rounded-full ${(creditAuthorizationRequested || isRequestingCreditAuthorization) ? "bg-blue-600" : "bg-gray-300"}`} />
                                            <span>
                                                {isRequestingCreditAuthorization
                                                    ? "Enviando solicitud a cobranza..."
                                                    : creditAuthorizationRequested
                                                        ? "Solicitud enviada a cobranza."
                                                        : "Solicitud pendiente de envio a cobranza."}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                                        <span>No requiere solicitud a cobranza.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 py-4">
                <ActionButton variant="primary" disabled={!canConfirmOrder} onClick={onConfirmar}>
                    Confirmar pedido
                </ActionButton>
            </div>

        </Card>
    );
}
