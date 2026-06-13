"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import PaqueteFields, { PaqueteRecord } from "@/features/delivery/components/seguimiento/paquetes/PaqueteFields";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";

const PACKAGE_URL = `${BASE_DELIVERY_SERVICE}/package`;

type ApiPackageItem = {
    id?: string;
    refId?: string | null;
    ean?: string | null;
    shippingId?: string | null;
    name?: string | null;
    description?: string | null;
    idx?: number | null;
    width?: number | null;
    height?: number | null;
    length?: number | null;
    volume?: number | null;
    weight?: number | null;
    currency?: string | null;
    price?: number | null;
    orderId?: string | null;
    packageTypeId?: string | null;
    locationLat?: number | null;
    locationLng?: number | null;
    trackingStatus?: string | null;
    trackingDate?: string | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    senderWarehouseId?: string | null;
    receiverWarehouseId?: string | null;
    location?: string | null;
};

const EMPTY_RECORD: PaqueteRecord = {
    id: "",
    refId: "",
    ean: "",
    shippingId: "",
    orderId: "",
    packageTypeId: "",
    currency: "",
    status: "",
    trackingStatus: "",
    trackingDate: "",
    fechaCreacion: "",
    fechaModificacion: "",
    locationLat: "",
    locationLng: "",
    senderWarehouseId: "",
    receiverWarehouseId: "",
    location: "",
    nombre: "",
    descripcion: "",
    costoAdquisicion: "",
    ancho: "",
    alto: "",
    largo: "",
    cubage: "",
    pesoMaximo: "",
};

const toInputNumber = (value?: number | null): number | string => {
    return typeof value === "number" && Number.isFinite(value) ? value : "";
};

const toText = (value?: string | null): string => String(value || "");

const toDateText = (value?: string | null): string => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-CL");
};

const mapApiPackageToRecord = (picked: ApiPackageItem, fallbackId: string): PaqueteRecord => {
    const volume = toInputNumber(picked.volume);

    return {
        id: String(picked.id || fallbackId),
        refId: toText(picked.refId),
        ean: toText(picked.ean),
        shippingId: toText(picked.shippingId),
        orderId: toText(picked.orderId),
        packageTypeId: toText(picked.packageTypeId),
        currency: toText(picked.currency),
        status: toText(picked.status),
        trackingStatus: toText(picked.trackingStatus),
        trackingDate: toDateText(picked.trackingDate),
        fechaCreacion: toDateText(picked.dateCreated),
        fechaModificacion: toDateText(picked.dateModified),
        locationLat: toInputNumber(picked.locationLat),
        locationLng: toInputNumber(picked.locationLng),
        senderWarehouseId: toText(picked.senderWarehouseId),
        receiverWarehouseId: toText(picked.receiverWarehouseId),
        location: toText(picked.location),
        nombre: String(picked.name || ""),
        descripcion: String(picked.description || ""),
        costoAdquisicion: toInputNumber(picked.price),
        ancho: toInputNumber(picked.width),
        alto: toInputNumber(picked.height),
        largo: toInputNumber(picked.length),
        cubage: volume,
        pesoMaximo: toInputNumber(picked.weight),
    };
};

export default function PaqueteResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const packageId = Array.isArray(id) ? id[0] : id;
    const [record, setRecord] = useState<PaqueteRecord>({ ...EMPTY_RECORD });
    const [loading, setLoading] = useState(false);

    const fetchPackage = useCallback(async () => {
        if (!packageId) return;

        setLoading(true);
        try {
            const response = await fetch(`${PACKAGE_URL}/${encodeURIComponent(packageId)}`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al cargar paquete ${packageId}`);
            }

            const picked = (await response.json()) as ApiPackageItem;
            setRecord(mapApiPackageToRecord(picked, packageId));
        } catch (error) {
            console.error("Error al cargar detalle de paquete", error);
            setRecord({ ...EMPTY_RECORD, id: packageId });
        } finally {
            setLoading(false);
        }
    }, [packageId]);

    useEffect(() => {
        fetchPackage();
    }, [fetchPackage]);

    const handleChange = <K extends keyof PaqueteRecord>(field: K, value: PaqueteRecord[K]) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const handleSave = () => {
        console.log("Guardar paquete (detalle):", record, id);
        // aquí va el PUT con fetch-with-auth cuando tengas API
    };

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-4 w-4" />, onClick: handleSave },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleSave },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-4 w-4" />, onClick: () => router.push("/delivery/seguimiento/paquetes") },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        PAQUETE
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {record.nombre || packageId || "Detalle"}
                    </div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions, record.nombre, packageId]
    );

    return (
        <>
            {loading && (
                <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    Cargando detalle de paquete...
                </div>
            )}
            <PaqueteFields record={record} onChange={handleChange} />
        </>
    );
}
