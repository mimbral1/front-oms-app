"use client";
import { DELIVERY_API_BASE } from "@/lib/delivery-api";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { TransportistaFields, Transportista } from "@/features/delivery/components/transportistas/transportista/TransportistaFields";

/* ---------- initial (conservado) ---------- */
const initial: Transportista = {
    refId: "",
    nombre: "",
    descripcion: "",
    companyId: "",
    tipoEntrega: "",
    tipoEntregaLabel: "",
    integrationId: "0",
    windowSchemaId: "",
    timezone: "America/Santiago",
    ubicaciones: [""],
    diasLaborales: ["", "", "", "", ""],
    minFulfillmentTime: "0",
    defaultShippingQuantity: "0",
    defaultProductQuantity: "0",
    defaultPackageQuantity: "0",
    defaultExtraDeliveryCost: "0",
    preDispatchTime: "0",
    restricciones: {
        tiempoMinEntrega: "",
        tiempoMaxEntrega: "",
        volumenMinPermitido: "",
        volumenMaxPermitido: "",
        pesoMinPermitido: "",
        pesoMaxPermitido: "",
        largoMaxPermitido: "100",
        anchoMaxPermitido: "30",
        altoMaxPermitido: "100",
    },
    configuracion: { estado: "Inactive", generarRuta: false, metodoSegundoFactor: "none", needsAutomaticRouting: false, isInternal: false, isExternal: true },
    creador: { nombre: "", email: "", fechaCreacion: "" },
    max_paquetes: "",
    tipos_paquete: "",
    tipos_paquete_restringidos: "",
    grupos_producto_restringidos: "",
};

export function TransportistaCreateView() {
    const router = useRouter();
    const [record, setRecord] = useState<Transportista>(initial);
    const [isSaving, setIsSaving] = useState(false);
    const handleChange = (field: keyof Transportista, value: any) => setRecord((prev) => ({ ...prev, [field]: value }));

    const toNumber = (value: unknown, fallback = 0) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    };

    const normalizeBusinessDays = (input: unknown): number[] => {
        const source = Array.isArray(input)
            ? input
            : typeof input === "string"
                ? input.split(",")
                : [];

        return source
            .map((day) => Number(String(day).trim()))
            .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7);
    };

    const normalizeStringList = (input: unknown): string[] => {
        const source = Array.isArray(input)
            ? input
            : typeof input === "string"
                ? input.split(",")
                : [];

        return source
            .map((item) => String(item ?? "").trim())
            .filter(Boolean);
    };

    const buildCarrierPayload = (current: Transportista) => ({
        refId: current.refId || "CARR-001",
        name: current.nombre || "Carrier Demo",
        description: current.descripcion || "Carrier demo",
        companyId: current.companyId || "COMPANY-ID",
        shippingTypeId: current.tipoEntrega || "",
        shippingType: current.tipoEntregaLabel || current.tipoEntrega || "delivery",
        integrationId: toNumber(current.integrationId, 0),
        windowSchemaId: current.windowSchemaId || "WINDOWSCHEMA-ID",
        timezone: current.timezone || "America/Santiago",
        ecommerceAccountIds: [],
        locationIds: normalizeStringList(current.ubicaciones),
        limitedToSalesChannels: [],
        minFulfillmentTime: toNumber(current.minFulfillmentTime),
        defaultShippingQuantity: toNumber(current.defaultShippingQuantity),
        defaultProductQuantity: toNumber(current.defaultProductQuantity),
        defaultPackageQuantity: toNumber(current.defaultPackageQuantity),
        defaultExtraDeliveryCost: toNumber(current.defaultExtraDeliveryCost),
        preDispatchTime: toNumber(current.preDispatchTime),
        generateRoute: Boolean(current?.configuracion?.generarRuta),
        needsAutomaticRouting: Boolean(current?.configuracion?.needsAutomaticRouting),
        isInternal: Boolean(current?.configuracion?.isInternal),
        isExternal: Boolean(current?.configuracion?.isExternal),
        businessDays: normalizeBusinessDays(current.diasLaborales),
        restrictions: {
            minDeliveryTime: toNumber(current?.restricciones?.tiempoMinEntrega),
            maxDeliveryTime: toNumber(current?.restricciones?.tiempoMaxEntrega),
            minVolumeAllowed: toNumber(current?.restricciones?.volumenMinPermitido),
            maxVolumeAllowed: toNumber(current?.restricciones?.volumenMaxPermitido),
            minWeightAllowed: toNumber(current?.restricciones?.pesoMinPermitido),
            maxWeightAllowed: toNumber(current?.restricciones?.pesoMaxPermitido),
            maxLengthAllowed: toNumber(current?.restricciones?.largoMaxPermitido, 100),
            maxWidthAllowed: toNumber(current?.restricciones?.anchoMaxPermitido, 30),
            maxHeightAllowed: toNumber(current?.restricciones?.altoMaxPermitido, 100),
        },
        packingRules: {
            maxPackages: toNumber(current.max_paquetes, 48),
            packageTypesAllowed: normalizeStringList(current.tipos_paquete),
            restrictedPackageTypes: normalizeStringList(current.tipos_paquete_restringidos),
            restrictedProductGroups: normalizeStringList(current.grupos_producto_restringidos),
        },
        secondFactor: {
            method: current?.configuracion?.metodoSegundoFactor || "none",
        },
        coverageArea: {
            type: "postalCode",
            postalCodes: [
                { start: "1000000", end: "9999999", cost: 0 },
            ],
        },
        status: current?.configuracion?.estado === "Active" ? "active" : "inactive",
    });

    const saveCarrier = async (resetAfterSave = false) => {
        try {
            setIsSaving(true);

            if (!String(record?.tipoEntrega ?? "").trim()) {
                throw new Error("Debes seleccionar un tipo de entrega válido");
            }

            const payload = buildCarrierPayload(record);

            const response = await fetch(`${DELIVERY_API_BASE}/carrier`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error ${response.status} al guardar transportista`);
            }

            if (resetAfterSave) {
                setRecord(initial);
            } else {
                router.push("/delivery/transportistas/listado-transportistas");
            }
        } catch (error) {
            console.error("No se pudo guardar el transportista", error);
        } finally {
            setIsSaving(false);
        }
    };

    /* acciones cabecera tipo sales-channels (Nuevo) */
    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => void saveCarrier(false), disabled: isSaving },
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
                onClick: () => void saveCarrier(true),
                disabled: isSaving,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/delivery/transportistas/listado-transportistas"), disabled: isSaving },
        ],
        [record, isSaving, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Transportistas</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo transportista</div>
                </div>
            ),
            action: headerActions,
            status: { text: record?.configuracion?.estado, variant: record?.configuracion?.estado === "Active" ? "success" : "warning" },

        } as unknown as PageHeaderProps),
        [record, headerActions]
    );

    return (
        <div className="mx-auto w-full max-w-[1500px] p-4 lg:p-6">
            <TransportistaFields record={record} readOnly={false} onChange={handleChange} hideAuditUsers splitDetailCards />
        </div>
    );
}
