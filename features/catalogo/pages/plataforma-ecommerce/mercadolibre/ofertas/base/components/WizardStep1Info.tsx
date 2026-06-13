// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/WizardStep1Info.tsx
//
// Wizard Step 1: nombre, tipo, fechas, descuento global.
//
// Look OMS: Card con title + FieldRow + Input bordered.

"use client";

import { Card, Input } from "@/components/ui";
import { FieldRow } from "../../../../_shared/ui";

/**
 * Tipos de campaña que el SELLER puede crear via `POST /promotions`.
 * El resto (DEAL, BANK, DOD, LIGHTNING, SMART, MARKETPLACE_CAMPAIGN, etc.)
 * NO son creables — ML invita al seller a esas. Si vienen del wizard, el
 * backend devuelve 400 `INVALID_PROMOTION_TYPE`.
 *
 * Fuente: pim-service/CLAUDE.md → "Promociones ML" tabla — solo
 * SELLER_CAMPAIGN, VOLUME, SELLER_COUPON_CAMPAIGN tienen "Vendedor crea" en
 * la columna de "Quién crea la campaña".
 */
export type CreatableType =
    | "SELLER_CAMPAIGN"
    | "VOLUME"
    | "SELLER_COUPON_CAMPAIGN";

export interface WizardStep1Draft {
    name: string;
    type: CreatableType;
    start_date: string; // ISO yyyy-mm-dd
    end_date: string;   // ISO yyyy-mm-dd
    global_discount: number;
}

export interface WizardStep1InfoProps {
    draft: WizardStep1Draft;
    onChange: (next: Partial<WizardStep1Draft>) => void;
}

/**
 * Solo los 3 tipos creables. Los otros (DEAL, BANK, etc.) NO van acá —
 * para participar de esas campañas el seller usa el flow "Inscribirse" desde
 * la tab "Disponibles" (no crea, hace opt-in).
 */
const TYPE_OPTIONS: ReadonlyArray<{ value: CreatableType; label: string }> = [
    { value: "SELLER_CAMPAIGN", label: "Seller (5–80%, 14 días máx)" },
    { value: "VOLUME", label: "Volumen (descuento por cantidad)" },
    { value: "SELLER_COUPON_CAMPAIGN", label: "Cupones (solo MLB)" },
];

const SELECT_CLASSES = [
    "block w-full rounded-md border border-gray-300 px-3 py-2",
    "text-sm text-gray-900 bg-white shadow-sm",
    "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
    "cursor-pointer",
].join(" ");

export function WizardStep1Info({ draft, onChange }: WizardStep1InfoProps) {
    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            <Card title="Información básica">
                <FieldRow
                    label="Nombre"
                    hint="Visible para el seller en su panel. ML acepta hasta 60 caracteres."
                >
                    <Input
                        value={draft.name}
                        onChange={(e) => onChange({ name: e.target.value })}
                        placeholder="Ej. Mimbral Mayo 2026"
                        maxLength={60}
                    />
                </FieldRow>

                <FieldRow
                    label="Tipo de campaña"
                    hint="Las reglas (descuento mín/máx, stock obligatorio, lock post-inicio) dependen del tipo."
                >
                    <select
                        value={draft.type}
                        onChange={(e) =>
                            onChange({ type: e.target.value as CreatableType })
                        }
                        className={SELECT_CLASSES}
                    >
                        {TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </FieldRow>
            </Card>

            <Card title="Período">
                <div className="grid grid-cols-2 gap-x-8">
                    <FieldRow label="Inicio">
                        <Input
                            type="date"
                            value={draft.start_date}
                            onChange={(e) => onChange({ start_date: e.target.value })}
                        />
                    </FieldRow>
                    <FieldRow label="Fin">
                        <Input
                            type="date"
                            value={draft.end_date}
                            onChange={(e) => onChange({ end_date: e.target.value })}
                        />
                    </FieldRow>
                </div>
            </Card>

            <Card title="Descuento global">
                <FieldRow
                    label="% off por defecto"
                    hint="Se aplica a todos los SKUs seleccionados en el paso siguiente. Cada SKU puede sobreescribirlo."
                >
                    <Input
                        type="number"
                        min={0}
                        max={80}
                        value={draft.global_discount || ""}
                        onChange={(e) =>
                            onChange({
                                global_discount: Number(e.target.value) || 0,
                            })
                        }
                        placeholder="0"
                        className="tabular-nums"
                    />
                </FieldRow>
            </Card>
        </div>
    );
}
