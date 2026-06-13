"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import { getCarrierCache, setCarrierCache } from "@/features/delivery/pages/Transportistas/Transportista/shared/carrier-cache";

import { TransportistaFields, Transportista } from "@/features/delivery/components/transportistas/transportista/TransportistaFields";

interface CarrierResponse {
    id: string;
    refId: string;
    name: string;
    description: string | null;
    shippingType: string | null;
    status: string | null;
    windowSchemaId?: string | null;
    dateCreated: string | null;
    dateModified: string | null;
    userCreated: { name?: string | null; email?: string | null } | string | null;
    userModified: { name?: string | null; email?: string | null } | string | null;
    generateRoute: boolean;
    secondFactor: { method?: string | null } | string | null;
    locationIds: string[] | null;
    businessDays: Array<number | string> | null;
    restrictions?: {
        tiempoMinEntrega?: string | null;
        tiempoMaxEntrega?: string | null;
        volumenMinPermitido?: string | null;
        volumenMaxPermitido?: string | null;
        pesoMinPermitido?: string | null;
        pesoMaxPermitido?: string | null;
    } | null;
    defaultPackageQuantity?: number | null;
    packingRules?: { packageTypes?: string[] | null } | null;
}

const mapCarrierToTransportista = (carrier: CarrierResponse): Transportista => {
    const createdByName =
        typeof carrier.userCreated === "string"
            ? carrier.userCreated
            : (carrier.userCreated?.name ?? "-");
    const createdByEmail =
        typeof carrier.userCreated === "object" && carrier.userCreated
            ? (carrier.userCreated.email ?? "-")
            : "-";

    const modifiedByName =
        typeof carrier.userModified === "string"
            ? carrier.userModified
            : (carrier.userModified?.name ?? "-");
    const modifiedByEmail =
        typeof carrier.userModified === "object" && carrier.userModified
            ? (carrier.userModified.email ?? "-")
            : "-";

    return {
        id: carrier.id,
        refId: carrier.refId ?? "",
        nombre: carrier.name ?? "",
        descripcion: carrier.description ?? "",
        tipoEntrega: carrier.shippingType ?? "",
        ubicaciones: carrier.locationIds ?? [],
        diasLaborales: carrier.businessDays ?? [],
        restricciones: {
            tiempoMinEntrega: carrier.restrictions?.tiempoMinEntrega ?? "",
            tiempoMaxEntrega: carrier.restrictions?.tiempoMaxEntrega ?? "",
            volumenMinPermitido: carrier.restrictions?.volumenMinPermitido ?? "",
            volumenMaxPermitido: carrier.restrictions?.volumenMaxPermitido ?? "",
            pesoMinPermitido: carrier.restrictions?.pesoMinPermitido ?? "",
            pesoMaxPermitido: carrier.restrictions?.pesoMaxPermitido ?? "",
        },
        configuracion: {
            estado: (carrier.status ?? "").toLowerCase() === "active" ? "Active" : "Inactive",
            generarRuta: Boolean(carrier.generateRoute),
            metodoSegundoFactor:
                typeof carrier.secondFactor === "string"
                    ? carrier.secondFactor
                    : (carrier.secondFactor?.method ?? ""),
        },
        creador: {
            nombre: createdByName,
            email: createdByEmail,
            fechaCreacion: carrier.dateCreated ? new Date(carrier.dateCreated).toLocaleString("es-CL") : "-",
        },
        modificador: {
            nombre: modifiedByName,
            email: modifiedByEmail,
            fechaModificacion: carrier.dateModified ? new Date(carrier.dateModified).toLocaleString("es-CL") : "-",
        },
        max_paquetes: carrier.defaultPackageQuantity != null ? String(carrier.defaultPackageQuantity) : "",
        tipos_paquete: carrier.packingRules?.packageTypes?.join(", ") ?? "",
    };
};

export function TransportistaEditView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<Transportista | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!recordId) {
            setLoading(false);
            setError("Carrier id inválido");
            return;
        }

        if (!BASE_DELIVERY_SERVICE) {
            setLoading(false);
            setError("Falta NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE en variables de entorno");
            return;
        }

        const controller = new AbortController();
        const cachedCarrier = getCarrierCache<CarrierResponse>(recordId);

        if (cachedCarrier) {
            setRecord(mapCarrierToTransportista(cachedCarrier));
            setLoading(false);
            setError(null);
        }

        const loadCarrier = async () => {
            try {
                if (!cachedCarrier) {
                    setLoading(true);
                }
                setError(null);

                const response = await fetch(`${BASE_DELIVERY_SERVICE}/carrier/${encodeURIComponent(recordId)}`, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status} al consultar el transportista`);
                }

                const data = (await response.json()) as CarrierResponse;
                setCarrierCache(recordId, data);
                setRecord(mapCarrierToTransportista(data));
            } catch (err) {
                if (controller.signal.aborted) return;

                if (!cachedCarrier) {
                    setRecord(null);
                    setError(err instanceof Error ? err.message : "No se pudo consultar el transportista");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadCarrier();

        return () => {
            controller.abort();
        };
    }, [recordId]);

    const handleChange = (field: keyof Transportista, value: any) => {
        if (record) setRecord({ ...record, [field]: value });
    };

    /* acciones cabecera tipo sales-channels (Resumen) */
    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("Apply", record) },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("Save", record) },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/delivery/transportistas/listado-transportistas") },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Transportistas</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.nombre ?? "Resumen"}</div>
                </div>
            ),
            action: headerActions,
            status: { text: record?.configuracion?.estado, variant: record?.configuracion?.estado === "Active" ? "success" : "warning" },
        } as unknown as PageHeaderProps),
        [record, headerActions]
    );

    if (loading) return <p className="p-4">Cargando…</p>;
    if (error) return <p className="p-4 text-red-500">{error}</p>;
    if (!record) return <p className="p-4 text-red-500">Registro no encontrado</p>;

    return (
        <div className="p-6 bg-white">
            <TransportistaFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
