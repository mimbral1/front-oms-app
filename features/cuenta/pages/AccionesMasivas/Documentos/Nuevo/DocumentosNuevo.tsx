"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import DocumentosFields, { Documento } from "@/features/cuenta/components/accionesmasivas/documentos/DocumentosFields";

export default function NuevoDocumento() {
    const router = useRouter();

    const [record, setRecord] = useState<Documento>({
        id: "",
        servicio: "",
        entidad: "",
        generated_href: "#",
        status: "Pendiente",
        template: "",          // el fields usa default si viene vacío
        template_barcode: "",  // idem
        sample_data: "",       // idem
        user_created: {
            name: "Felipe Pino",
            email: "fpino@mimbral.cl",
            date: new Date().toLocaleString("es-CL"),
        },
    });

    const onChange = <K extends keyof Documento>(k: K, v: Documento[K]) =>
        setRecord((r) => ({ ...r, [k]: v }));

    const actions: Action[] = useMemo(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("save", record),
            },
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
                onClick: () => {
                    console.log("save&new", record);
                    setRecord((r) => ({
                        ...r,
                        id: "new",
                        template: "",
                        template_barcode: "",
                        sample_data: "",
                    }));
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/cuenta/acciones-masivas/documentos"),
            },
        ],
        [record, router]
    );

    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Documentos
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            status: { text: record.status, variant: record.status === "Subido" ? "success" : "warning" },
            action: actions,
        }),
        [actions, record.status]
    );

    return (
        <div className="flex flex-col bg-white">
            <div className="p-6">
                <DocumentosFields record={record} onChange={onChange} />
            </div>
        </div>
    );
}
