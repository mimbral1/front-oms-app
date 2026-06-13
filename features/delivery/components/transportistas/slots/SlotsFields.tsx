// app/delivery/slots/components/SlotsFields.tsx
"use client";
import { DELIVERY_API_BASE } from "@/lib/delivery-api";

/* ---------- Fields para Slots (mismo patrón que SalesChannelsFields) ---------- */
import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield"; // <- nuevo
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { Toggle } from "@/components/ui/togle/togle";
import DateTimePickerField from "@/components/ui/date-time-picker/DateTimePickerField";

/* Interfaz del formulario */
export interface SlotForm {
    // DETALLE
    inventoryId?: string;
    inventoryName?: string;
    slotCode: string;
    skuId?: string;
    skuName?: string;
    isDefault: boolean;

    // CAPACIDADES
    minUnits?: number | "";
    maxUnits?: number | "";

    // CREATE API BODY
    carrierId?: string;
    dateStart?: string;
    dateEnd?: string;
    locked?: boolean;
    comment?: boolean;
    maxShippingQuantity?: number | "";
    maxPackageQuantity?: number | "";
    maxProductQuantity?: number | "";
    extraDeliveryCost?: number | "";
}

type ApiCarrierItem = {
    id?: string;
    refId?: string | null;
    reference?: string | null;
    name?: string | null;
    displayId?: string | null;
};

type ApiCarrierResponse = {
    data?: ApiCarrierItem[];
    items?: ApiCarrierItem[];
    rows?: ApiCarrierItem[];
    results?: ApiCarrierItem[];
    totalPages?: number;
};

type CarrierOption = {
    value: string;
    label: string;
};

const extractCarrierItems = (payload: unknown): ApiCarrierItem[] => {
    if (Array.isArray(payload)) return payload as ApiCarrierItem[];
    if (!payload || typeof payload !== "object") return [];

    const asResponse = payload as ApiCarrierResponse;
    if (Array.isArray(asResponse.data)) return asResponse.data;
    if (Array.isArray(asResponse.items)) return asResponse.items;
    if (Array.isArray(asResponse.rows)) return asResponse.rows;
    if (Array.isArray(asResponse.results)) return asResponse.results;

    return [];
};

export function SlotsFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: SlotForm;
    readOnly?: boolean;
    onChange?: (field: keyof SlotForm, value: any) => void;
    isCreate?: boolean;
}) {
    const handle =
        (field: keyof SlotForm) =>
            (v: any) =>
                onChange?.(field, v);

    /* ---------- Opciones locales (mock); reemplaza por tus fuentes cuando toque ---------- */
    const [carrierOptions, setCarrierOptions] = useState<CarrierOption[]>([]);
    const [carrierSearchQuery, setCarrierSearchQuery] = useState("");

    useEffect(() => {
        if (!isCreate) return;

        let mounted = true;
        const loadCarrierOptions = async () => {
            try {
                const allCarriers: ApiCarrierItem[] = [];
                const limit = 200;
                let page = 1;

                for (let attempt = 0; attempt < 20; attempt += 1) {
                    const response = await fetch(`${DELIVERY_API_BASE}/carrier?page=${page}&limit=${limit}`, {
                        method: "GET",
                        cache: "no-store",
                    });

                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    const payload = (await response.json()) as ApiCarrierResponse;
                    const items = extractCarrierItems(payload);
                    allCarriers.push(...items);

                    const totalPages = Number(payload?.totalPages || 0);
                    if (totalPages > 0) {
                        if (page >= totalPages) break;
                        page += 1;
                        continue;
                    }

                    if (items.length < limit) break;
                    page += 1;
                }

                const mapped = allCarriers
                    .map((item) => {
                        const value = String(item.id || "").trim();
                        const label = String(item.displayId || item.name || item.refId || item.reference || value).trim();
                        if (!value) return null;
                        return { value, label: label || value } as CarrierOption;
                    })
                    .filter((item): item is CarrierOption => Boolean(item));

                const deduped = Array.from(new Map(mapped.map((item) => [item.value, item])).values());
                if (!mounted) return;
                setCarrierOptions(deduped);
            } catch (error) {
                console.error("Error cargando opciones de transportistas:", error);
                if (!mounted) return;
                setCarrierOptions([]);
            }
        };

        loadCarrierOptions();
        return () => {
            mounted = false;
        };
    }, [isCreate]);

    const inventoryOptions = useMemo(
        () => ["Seleccione inventario…", "Palermo", "Villa Crespo"],
        []
    );
    const slotOptions = useMemo(
        () => ["1-1-1", "3-4-8", "5-2-2"], // agrega aquí tus slots frecuentes
        []
    );
    const skuOptions = useMemo(
        () => ["Seleccione SKU…", "Batidora Artisan KS…", "Tostadora 4R…"],
        []
    );

    const valueOrEmpty = (v?: string) => (v ? String(v) : "");
    const carrierSelectOptions = useMemo(() => {
        const base = [{ label: "Todos los transportistas", value: "" }, ...carrierOptions];
        const q = carrierSearchQuery.trim().toLowerCase();
        if (!q) return base;
        return base.filter((option) =>
            (option.label + " " + option.value).toLowerCase().includes(q)
        );
    }, [carrierOptions, carrierSearchQuery]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA ÚNICA (como en tu referencia) */}
                <div className="lg:col-span-7 space-y-6">
                    {isCreate ? (
                        <>
                            <Card
                                title="DETALLE"
                                icon={ClipboardDocumentListIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                            >
                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                    <div className="space-y-2 lg:col-span-2 lg:max-w-xl">
                                        <span className="text-sm font-bold text-gray-700">Transportista</span>
                                        <SelectSearchInline
                                            id="carrierId"
                                            label="Transportista"
                                            value={valueOrEmpty(record.carrierId)}
                                            options={carrierSelectOptions}
                                            searchQuery={carrierSearchQuery}
                                            onSearch={setCarrierSearchQuery}
                                            onChange={(value) => onChange?.("carrierId", value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-sm font-bold text-gray-700">Inicio</span>
                                        <DateTimePickerField
                                            value={valueOrEmpty(record.dateStart)}
                                            onChange={(next) => onChange?.("dateStart", next)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-sm font-bold text-gray-700">Fin</span>
                                        <DateTimePickerField
                                            value={valueOrEmpty(record.dateEnd)}
                                            onChange={(next) => onChange?.("dateEnd", next)}
                                        />
                                    </div>

                                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                        <div className="mb-2 text-sm font-bold text-gray-700">Bloqueado</div>
                                        <Toggle
                                            checked={Boolean(record.locked)}
                                            onCheckedChange={(checked) => onChange?.("locked", checked)}
                                            aria-label="Bloqueado"
                                        />
                                    </div>

                                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                        <div className="mb-2 text-sm font-bold text-gray-700">Comment</div>
                                        <Toggle
                                            checked={Boolean(record.comment)}
                                            onCheckedChange={(checked) => onChange?.("comment", checked)}
                                            aria-label="Comment"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card
                                title="CAPACIDADES"
                                icon={ClipboardDocumentListIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                            >
                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                    <div className="space-y-2">
                                        <span className="text-sm font-bold text-gray-700">Max shippings</span>
                                        <input
                                            type="number"
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                            value={record.maxShippingQuantity === "" ? "" : Number(record.maxShippingQuantity || 0)}
                                            onChange={(e) => onChange?.("maxShippingQuantity", e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="#"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-sm font-bold text-gray-700">Max packages</span>
                                        <input
                                            type="number"
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                            value={record.maxPackageQuantity === "" ? "" : Number(record.maxPackageQuantity || 0)}
                                            onChange={(e) => onChange?.("maxPackageQuantity", e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="#"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-sm font-bold text-gray-700">Max products</span>
                                        <input
                                            type="number"
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                            value={record.maxProductQuantity === "" ? "" : Number(record.maxProductQuantity || 0)}
                                            onChange={(e) => onChange?.("maxProductQuantity", e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="#"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-sm font-bold text-gray-700">Costo extra</span>
                                        <input
                                            type="number"
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                            value={record.extraDeliveryCost === "" ? "" : Number(record.extraDeliveryCost || 0)}
                                            onChange={(e) => onChange?.("extraDeliveryCost", e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="#"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </>
                    ) : (
                        <>
                            {/* DETALLE */}
                            <Card
                                title="DETALLE"
                                icon={ClipboardDocumentListIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Inventario + Slot (misma fila 1–2–1–2) */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">
                                        Inventario
                                    </span>
                                    <div className="col-span-5">
                                        <CollapsibleField
                                            label=""
                                            value={
                                                (record.inventoryName && String(record.inventoryName)) ||
                                                (record.inventoryId ? String(record.inventoryId) : "")
                                            }
                                            options={inventoryOptions} // array de strings
                                            onChange={(val) => {
                                                const v = val === "Seleccione inventario…" ? "" : val;
                                                onChange?.("inventoryId", v);
                                                onChange?.("inventoryName", v);
                                            }}
                                            inline
                                        />
                                    </div>

                                    <span className="col-span-1 flex items-center justify-center text-sm text-gray-600 font-bold">
                                        Slot
                                    </span>
                                    <div className="col-span-5">
                                        <CollapsibleField
                                            label=""
                                            value={record.slotCode || ""}
                                            options={slotOptions} // array de strings, ej.: ["1-1-1","3-4-8","5-2-2"]
                                            onChange={(val) => onChange?.("slotCode", val || "")}
                                            inline
                                        />
                                    </div>

                                    {/* SKU  */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">
                                        SKU
                                    </span>
                                    <div className="col-span-11">
                                        <CollapsibleField
                                            label=""
                                            value={
                                                (record.skuName && String(record.skuName)) ||
                                                (record.skuId ? String(record.skuId) : "")
                                            }
                                            options={skuOptions} // array de strings
                                            onChange={(val) => {
                                                const v = val === "Seleccione SKU…" ? "" : val;
                                                onChange?.("skuId", v);
                                                onChange?.("skuName", v);
                                            }}
                                            inline
                                        />
                                    </div>

                                    {/* Por defecto (switch igual que en SalesChannels) */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">
                                        Por defecto
                                    </span>
                                    <div className="col-span11">
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={record.isDefault}
                                            onClick={() => handle("isDefault")(!record.isDefault)}
                                            disabled={readOnly}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.isDefault ? "bg-blue-500" : "bg-gray-300"
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.isDefault ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </Card>

                            {/* CAPACIDADES */}
                            <Card
                                title="CAPACIDADES"
                                icon={ClipboardDocumentListIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Unidades mín. */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">
                                        Unidades mín.
                                    </span>
                                    <div className="col-span-5">
                                        <input
                                            type="number"
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={record.minUnits === "" ? "" : Number(record.minUnits)}
                                            onChange={(e) =>
                                                handle("minUnits")(
                                                    e.target.value === "" ? "" : Number(e.target.value)
                                                )
                                            }
                                            placeholder="#"
                                        />
                                    </div>

                                    {/* Unidades Máx. */}
                                    <span className="col-span-1 flex items-center justify-center text-sm text-gray-600 font-bold">
                                        Unidades Máx.
                                    </span>
                                    <div className="col-span-5">
                                        <input
                                            type="number"
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={record.maxUnits === "" ? "" : Number(record.maxUnits)}
                                            onChange={(e) =>
                                                handle("maxUnits")(
                                                    e.target.value === "" ? "" : Number(e.target.value)
                                                )
                                            }
                                            placeholder="#"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
