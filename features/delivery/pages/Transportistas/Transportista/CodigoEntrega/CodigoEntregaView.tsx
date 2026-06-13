// views\Delivery\Transportistas\Transportista\CodigoEntrega\CodigoEntregaView.tsx

"use client";

import React, { useMemo, useState } from "react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    Cog6ToothIcon,
    UserIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

/* ------------------------------------------------------------
   Mock inicial 
   ------------------------------------------------------------ */

interface CoverageAreaConfig {
    verificacion: string;
    createdBy: { initials: string; name: string; email: string; date: string };
    lastModified: string;
}

const INITIAL: CoverageAreaConfig = {
    verificacion: "Verificacion entrega 1",
    createdBy: {
        initials: "FP",
        name: "Franco Pilafis",
        email: "franco.pilafis@janis.com",
        date: "26/02/2024 16:30:12",
    },
    lastModified: "19/09/2024 18:30:04",
};

/* Chip de usuario  */
function UserChip({ u }: { u: CoverageAreaConfig["createdBy"] }) {
    return (
        <div className="inline-flex max-w-[260px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                {u.initials}
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{u.name}</span>
                <span className="truncate text-xs text-gray-500">{u.email}</span>
            </div>
        </div>
    );
}

export default function CodigoEntregaView() {
    const [saving, setSaving] = useState(false);
    const [record, setRecord] = useState<CoverageAreaConfig>({ ...INITIAL });

    /* Acciones del header (calcadas del patrón de Resumen) */
    const handleSave = async () => {
        setSaving(true);
        try {
            // Aquí iría tu fetchWithAuth(...) cuando exista API
            await new Promise((r) => setTimeout(r, 350));
        } finally {
            setSaving(false);
        }
    };

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
                disabled: saving,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => history.back(), disabled: saving },
        ],
        [saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Transportistas</div>
                    <div className="text-2xl font-semibold text-gray-900">Resumen</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    /* Opciones del dropdown “Modalidad” (CollapsibleField inline) */
    const verificacionOpciones: string[] = ["Verificacion entrega 1", "Verificacion entrega 2", "Verificacion entrega 3"];

    return (
        <div className="p-6 bg-white">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA: CONFIGURACIONES */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="VERIFICACIÓN DE ENTREGA"
                        icon={Cog6ToothIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Modalidad */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Verificación de entrega</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.verificacion}
                                    options={verificacionOpciones}
                                    onChange={(v) => setRecord((r) => ({ ...r, verificacion: v as string }))}
                                    inline
                                />
                            </div>

                        </div>
                    </Card>
                </div>

                {/* DERECHA: USUARIO CREADOR y ÚLTIMA MODIFICACIÓN */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <UserChip u={record.createdBy} />
                            <span className="text-sm text-gray-600">{record.createdBy.date}</span>
                        </div>
                    </Card>

                    <Card
                        title="ÚLTIMA MODIFICACIÓN"
                        icon={PencilSquareIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="h-8" />
                            <span className="text-sm text-gray-600">{record.lastModified}</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
