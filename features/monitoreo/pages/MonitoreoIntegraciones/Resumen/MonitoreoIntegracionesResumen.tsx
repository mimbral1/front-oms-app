// views\MonitoreoView\MonitoreoIntegraciones\Resumen\MonitoreoIntegracionesResumen.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import MonitoreoIntegracionesFields from "@/features/monitoreo/components/monitoreointegraciones/MonitoreoIntegracionesFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { cleanRut } from "@/features/customers/components/clientes/utils-rut";

const CUSTOMER_EDITABLE_FIELDS = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "document",
    "city",
    "street",
    "number",
];

function normalizeValue(field: string, value: any): string {
    if (field === "document") {
        if (typeof value === "string") {
            return cleanRut(value).base;
        }

        if (typeof value === "object" && value?.base) {
            return String(value.base);
        }

        return "";
    }

    return String(value ?? "").trim();
}

/**
 * Resumen Monitoreo de Integraciones
 */
export default function MonitoreoIntegracionesResumen() {
    const router = useRouter();
    const { id } = useParams();
    if (!id) throw new Error("orderErrorLinkID no especificado en la ruta");

    const inputRefs = {
        firstName: useRef<HTMLInputElement>(null),
        lastName: useRef<HTMLInputElement>(null),
        email: useRef<HTMLInputElement>(null),
        document: useRef<HTMLInputElement>(null),
    };

    const orderErrorLinkID: string = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuth } = useFetchWithAuth();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ===== Cliente (solo customer_error)
    const [customerRecord, setCustomerRecord] = useState<any>(null);
    const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});

    const customerSnapshot = useRef<Record<string, string> | null>(null);

    const isCustomerError = data?.error?.errorCode === "customer_error";


    const [orderID, setOrderID] = useState<number | null>(null);

    // ===================== Fetch detalle =====================
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await fetchWithAuth(
                    `oms-service/orders/errors/${orderErrorLinkID}`,
                    { method: "GET" }
                );

                if (!mounted) return;

                setData(res);

                setOrderID(res?.order?.orderID ?? null);

                if (
                    res?.error?.errorCode === "customer_error" &&
                    Array.isArray(res?.datosDelCliente) &&
                    res.datosDelCliente.length > 0
                ) {
                    const normalizedCustomer = CUSTOMER_EDITABLE_FIELDS.reduce(
                        (acc: any, key) => {
                            acc[key] = res.datosDelCliente[0]?.[key] ?? "";
                            return acc;
                        },
                        { orderID: res.datosDelCliente[0]?.orderID }
                    );
                    const baseCustomer = { ...normalizedCustomer };

                    setCustomerRecord(baseCustomer);

                    customerSnapshot.current = {
                        firstName: normalizeValue("firstName", baseCustomer.firstName),
                        lastName: normalizeValue("lastName", baseCustomer.lastName),
                        email: normalizeValue("email", baseCustomer.email),
                        document: normalizeValue("document", baseCustomer.document),
                    };

                    // console.log("[SNAPSHOT inicial]", customerSnapshot.current);

                }
            } catch (e) {
                toast.error("Error al cargar el detalle del error");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth, orderErrorLinkID]);

    // ===================== cambios cliente =====================
    const handleCustomerChange = (field: string, value: any) => {
        // console.log("[CHANGE]", field, "=>", value);

        setCustomerRecord((prev: any) => {
            const next = {
                ...prev,
                [field]: value,
            };

            // console.log("[STATE after change]", next);
            return next;
        });
    };



    // ===================== Guardar cliente =====================
    const handleSaveCustomer = async () => {
        // console.log("=== CLICK APLICAR ===");
        // console.log("customerRecord actual:", customerRecord);
        // console.log("customerSnapshot:", customerSnapshot.current);

        if (!customerRecord || !customerSnapshot.current) return;

        const fulfillmentPatch: Record<string, string> = {};
        const fields: Array<keyof typeof inputRefs> = [
            "firstName",
            "lastName",
            "email",
            "document",
        ];

        fields.forEach((field) => {
            const ref = inputRefs[field]?.current;
            if (!ref) return;

            const current = normalizeValue(field, ref.value);
            const previous = customerSnapshot.current![field];

            if (current !== previous) {
                fulfillmentPatch[field] = current;
            }
        });

        if (Object.keys(fulfillmentPatch).length === 0) {
            // console.log("[FULFILLMENT PATCH RESULTANTE]", fulfillmentPatch);
            toast.error("No hay cambios para guardar");
            return;
        }

        setSaving(true);
        const toastId = toast.loading("Guardando cliente...");

        try {
            // console.log("PATCH endpoint:", `/oms-service/orders/${orderErrorLinkID}`);
            // console.log("PATCH payload:", fulfillmentPatch);

            if (!orderID) {
                toast.error("No se pudo determinar la orden a actualizar");
                return;
            }

            await fetchWithAuth(
                `oms-service/orders/${orderID}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fulfillment: fulfillmentPatch,
                    }),
                }
            );

            toast.success("Cliente actualizado correctamente", { id: toastId });

            customerSnapshot.current = {
                ...customerSnapshot.current,
                ...fulfillmentPatch,
            };
        } catch (e) {
            toast.error("Error al actualizar el cliente", { id: toastId });
        } finally {
            setSaving(false);
        }
    };


    /* ===================== Header actions ===================== */
    const headerActions: Action[] = useMemo(() => {
        const actions: Action[] = [];

        if (isCustomerError) {
            actions.push({
                label: "Aplicar",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                ),
                onClick: handleSaveCustomer,
                disabled: saving,
            });
        }

        actions.push({
            label: "Volver",
            variant: "secondary",
            icon: <XCircleIcon className="h-5 w-5" />,
            onClick: () => router.push("/monitoreo/monitoreo-integraciones"),
            disabled: saving,
        });

        return actions;
    }, [router, saving, isCustomerError]);


    /* ===================== PageHeader ===================== */
    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Monitoreo de Integraciones
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Detalle de error
                    </div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : isCustomerError
                    ? { text: "Cliente editable", variant: "warning" }
                    : undefined,
            // messageBadge: message ? (
            //     <span
            //         className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${message.type === "error"
            //             ? "bg-red-500"
            //             : message.type === "success"
            //                 ? "bg-green-600"
            //                 : "bg-blue-500"
            //             }`}
            //     >
            //         {message.text}
            //     </span>
            // ) : undefined,
        } as PageHeaderProps),
        [headerActions, saving, isCustomerError]
    );

    /* ===================== Render ===================== */
    if (loading) {
        return (
            <div className="flex w-full items-center justify-center py-10">
                <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin text-gray-500" />
                <span className="text-gray-500">Cargando…</span>
            </div>
        );
    }

    if (!data) {
        return (
            <p className="p-4 text-center text-gray-500">
                Error no encontrado.
            </p>
        );
    }

    return (
        <div className="p-6 bg-white">
            <MonitoreoIntegracionesFields
                data={data}
                customerRecord={customerRecord}
                onCustomerChange={handleCustomerChange}
                inputRefs={inputRefs}
            />
        </div>
    );
}
