"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import AbmMotivosFields, { MotivoRecord } from "@/features/cuenta/components/abm-motivos/AbmMotivosFields";

/** Mock de ejemplo con un target marcado (change-store) */
const MOCK: MotivoRecord[] = [
    {
        id: "04",
        refId: "04",
        nombre: "Cambio de tienda por pedido del cliente",
        nombreInterno: "Cambio de tienda por pedido del cliente",
        descripcion: "Cambio de tienda por pedido del cliente",
        solicitarComentario: true,
        status: "Activo",
        targets: {
            "oms/order-rescheduling/change-store": true,
        },
        created: { username: "Julian Mediavilla", email: "julian.mediavilla@example.com", date: "24/11/2023 11:20:33" },
        modified: { username: "Julian Mediavilla", email: "julian.mediavilla@example.com", date: "24/11/2023 11:20:33" },
    },
];

export default function AbmMotivoEditView() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = Array.isArray(params?.id) ? params!.id[0] : params?.id;

    const [record, setRecord] = useState<MotivoRecord | null>(null);

    useEffect(() => {
        const found = MOCK.find((m) => m.id === id) ?? null;
        setRecord(found);
    }, [id]);

    const handleChange = (field: keyof MotivoRecord, value: any) =>
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("Aplicar", record) },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("Guardar", record) },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: () => router.push("/configuracion/motivos/nuevo"),
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/abm-motivos") },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: `Motivo: ${record?.nombre ?? "—"}`,
            action: headerActions,
            status: record
                ? { text: record.status, variant: record.status === "Activo" ? "success" : "warning" }
                : undefined,
        } as PageHeaderProps),
        [record?.nombre, headerActions]
    );

    if (!record) return <p className="p-4">Cargando…</p>;

    return (
        <div className="p-6 bg-white">
            <AbmMotivosFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
