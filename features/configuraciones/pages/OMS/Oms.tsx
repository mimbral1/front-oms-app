// app/views/Configuracion/OMS/Tabs/OmsVtexConfigView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import Card from "@/components/ui/card/Card";

/* ------------------------------------------------------------
   Vista: OMS ? Tab VTEX (config sencilla con un toggle)
   ------------------------------------------------------------ */

interface VtexConfig {
    useKitComponents: boolean;
}

const INITIAL: VtexConfig = {
    useKitComponents: false, // como en la captura (toggle gris / off)
};

export default function OmsVtexConfigView() {
    const [saving, setSaving] = useState(false);
    const [cfg, setCfg] = useState<VtexConfig>({ ...INITIAL });

    const handleSave = async () => {
        setSaving(true);
        try {
            // Aquí enchufas fetch-with-auth cuando exista endpoint
            await new Promise((r) => setTimeout(r, 300));
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
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Configuración</div>
                    <div className="text-2xl font-semibold text-gray-900">OMS</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="flex-1 bg-[#e8eaf5]">
            <div className="p-6">
                <Card
                    title="PEDIDO"
                    noDefaultStyles
                    hasTitleDivider
                    className="rounded-xl bg-white p-6"
                >
                    <div className="grid grid-cols-6 gap-4">
                        {/* Usar componentes de KIT */}
                        <span className="col-span-1 text-sm text-gray-600 font-bold">Usar componentes de KIT</span>
                        <div className="col-span-5">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={cfg.useKitComponents}
                                onClick={() => setCfg((r) => ({ ...r, useKitComponents: !r.useKitComponents }))}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${cfg.useKitComponents ? "bg-blue-500" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${cfg.useKitComponents ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
