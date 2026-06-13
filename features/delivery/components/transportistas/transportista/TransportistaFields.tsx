"use client";
import { DELIVERY_API_BASE, PACKAGE_TYPES_URL } from "@/lib/delivery-api";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import type { StylesConfig } from "react-select";
import Card from "@/components/ui/card/Card";
import { Toggle } from "@/components/ui/togle/togle";
import { ClipboardDocumentListIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { User2Icon } from "lucide-react";
import { COMMERCE_SERVICE_LOCATIONS_API } from "@/lib/http/endpoints";

const LOCATIONS_ENDPOINT = COMMERCE_SERVICE_LOCATIONS_API;
const SHIPPING_TYPES_ENDPOINT = `${DELIVERY_API_BASE}/shipping-type`;
const PACKAGE_TYPES_ENDPOINT = PACKAGE_TYPES_URL;
const COMPANY_ENDPOINT = `${DELIVERY_API_BASE}/company`;
const WINDOW_SCHEMA_ENDPOINT = `${DELIVERY_API_BASE}/window-schema`;

type SelectOption = { value: string | number; label: string; meta?: any };

export interface Transportista {
    id?: string;
    refId: string;
    nombre: string;
    descripcion: string;
    companyId?: string;
    tipoEntrega: string;
    tipoEntregaLabel?: string;
    integrationId?: string;
    windowSchemaId?: string;
    timezone?: string;
    ubicaciones: any;
    diasLaborales: any;
    minFulfillmentTime?: string;
    defaultShippingQuantity?: string;
    defaultProductQuantity?: string;
    defaultPackageQuantity?: string;
    defaultExtraDeliveryCost?: string;
    preDispatchTime?: string;
    restricciones?: {
        tiempoMinEntrega: string;
        tiempoMaxEntrega: string;
        volumenMinPermitido: string;
        volumenMaxPermitido: string;
        pesoMinPermitido: string;
        pesoMaxPermitido: string;
        largoMaxPermitido?: string;
        anchoMaxPermitido?: string;
        altoMaxPermitido?: string;
    };
    configuracion?: {
        estado: "Active" | "Inactive";
        generarRuta: boolean;
        metodoSegundoFactor: string;
        needsAutomaticRouting?: boolean;
        isInternal?: boolean;
        isExternal?: boolean;
    };
    creador: { nombre: string; email: string; fechaCreacion: string };
    modificador?: { nombre: string; email: string; fechaModificacion: string };
    max_paquetes: string;
    tipos_paquete: string;
    tipos_paquete_restringidos?: string;
    grupos_producto_restringidos?: string;
}

interface Props {
    record: Transportista;
    readOnly?: boolean;
    onChange?: (field: keyof Transportista, value: any) => void;
    hideAuditUsers?: boolean;
    splitDetailCards?: boolean;
}

const diasLaboralesOptions = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miercoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sabado" },
    { value: 7, label: "Domingo" },
];
const metodoSegundoFactorOptions: SelectOption[] = [
    { value: "none", label: "Ninguno" },
    { value: "Numerical pin", label: "PIN numérico" },
    { value: "Alphanumeric pin", label: "PIN alfanumérico" },
    { value: "Secret word", label: "Palabra secreta" },
];

const headerLikeSelectStyles: StylesConfig<SelectOption, boolean> = {
    control: (base, state) => ({
        ...base,
        minHeight: 40,
        borderRadius: 8,
        borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 1px #6366f1" : "none",
        backgroundColor: "#ffffff",
        ":hover": {
            borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
        },
    }),
    valueContainer: (base) => ({
        ...base,
        padding: "0 12px",
    }),
    placeholder: (base) => ({
        ...base,
        color: "#9ca3af",
    }),
    indicatorSeparator: () => ({
        display: "none",
    }),
    dropdownIndicator: (base) => ({
        ...base,
        color: "#9ca3af",
        ":hover": { color: "#6b7280" },
    }),
    menu: (base) => ({
        ...base,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        overflow: "hidden",
        zIndex: 50,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "#eff6ff" : "#ffffff",
        color: "#111827",
        cursor: "pointer",
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: "#f3f4f6",
        borderRadius: 8,
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: "#374151",
    }),
};

const toMultiValue = (input?: Array<string | number> | string | number | null) => {
    const arr = Array.isArray(input)
        ? input
        : typeof input === "string"
            ? input.split(",")
            : input == null
                ? []
                : [input];

    const clean = Array.from(
        new Set(arr.map((s) => String(s ?? "").trim()).filter(Boolean))
    );

    return clean.map((v) => ({ label: v, value: v }));
};

const toStringArray = (input?: Array<string | number> | string | number | null): string[] => {
    const arr = Array.isArray(input)
        ? input
        : typeof input === "string"
            ? input.split(",")
            : input == null
                ? []
                : [input];

    return Array.from(new Set(arr.map((s) => String(s ?? "").trim()).filter(Boolean)));
};

const normalizeBusinessDays = (input?: Array<string | number> | string | number | null): number[] => {
    const arr = Array.isArray(input)
        ? input
        : typeof input === "string"
            ? input.split(",")
            : input == null
                ? []
                : [input];

    return arr
        .map((d) => Number(String(d).trim()))
        .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7);
};

/* IDs estables para SSR */
const selectIds = {
    companyId: "transportista-company-id",
    tipoEntrega: "transportista-tipo-entrega",
    windowSchemaId: "transportista-window-schema-id",
    ubicaciones: "transportista-ubicaciones",
    diasLaborales: "transportista-diasLaborales",
    tiposPaquete: "transportista-tipos-paquete",
    tiposPaqueteRestringidos: "transportista-tipos-paquete-restringidos",
};

const extractBusinessDays = (raw: any): number[] => {
    const dayMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 7,
        lunes: 1,
        martes: 2,
        miercoles: 3,
        miércoles: 3,
        jueves: 4,
        viernes: 5,
        sabado: 6,
        sábado: 6,
        domingo: 7,
    };

    const normalizeDay = (value: any): number | null => {
        if (value == null) return null;
        if (typeof value === "number") {
            return Number.isInteger(value) && value >= 1 && value <= 7 ? value : null;
        }

        const rawText = String(value).trim().toLowerCase();
        const numeric = Number(rawText);
        if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 7) return numeric;
        return dayMap[rawText] ?? null;
    };

    const expandDayRange = (start: number, end: number): number[] => {
        if (start === end) return [start];
        if (start < end) {
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        // Range that crosses week boundary (e.g., friday -> monday)
        return [...Array.from({ length: 8 - start }, (_, i) => start + i), ...Array.from({ length: end }, (_, i) => i + 1)];
    };

    const parseWindows = (value: any): any[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const directSource =
        raw?.businessDays ??
        raw?.BusinessDays ??
        raw?.workingDays ??
        raw?.WorkingDays ??
        raw?.days ??
        raw?.Days ??
        raw?.windowDays ??
        raw?.WindowDays ??
        [];

    const asDayNumber = (value: any): number | null => {
        const candidate =
            value?.day ??
            value?.Day ??
            value?.dayOfWeek ??
            value?.DayOfWeek ??
            value?.weekDay ??
            value?.WeekDay ??
            value;

        const num = Number(candidate);
        return Number.isInteger(num) && num >= 1 && num <= 7 ? num : null;
    };

    const collectFromArray = (arr: any[]): number[] => {
        return arr
            .map((item) => asDayNumber(item))
            .filter((day): day is number => day != null);
    };

    const fromDirect = Array.isArray(directSource) ? collectFromArray(directSource) : [];
    if (fromDirect.length > 0) {
        return Array.from(new Set(fromDirect));
    }

    const scheduleItems = raw?.scheduleItems ?? raw?.ScheduleItems ?? raw?.slots ?? raw?.Slots ?? [];
    if (Array.isArray(scheduleItems)) {
        const fromSchedule = collectFromArray(scheduleItems);
        if (fromSchedule.length > 0) {
            return Array.from(new Set(fromSchedule));
        }
    }

    const windows = parseWindows(raw?.windows ?? raw?.Windows ?? raw?.windowList ?? raw?.WindowList);
    if (windows.length > 0) {
        const days = new Set<number>();

        windows.forEach((windowItem: any) => {
            const dayOfWeek = normalizeDay(windowItem?.dayOfWeek ?? windowItem?.DayOfWeek);
            if (dayOfWeek != null) {
                days.add(dayOfWeek);
                return;
            }

            const startDay = normalizeDay(windowItem?.startDay ?? windowItem?.StartDay);
            const endDay = normalizeDay(windowItem?.endDay ?? windowItem?.EndDay);
            if (startDay != null && endDay != null) {
                expandDayRange(startDay, endDay).forEach((d) => days.add(d));
            }
        });

        if (days.size > 0) {
            return Array.from(days).sort((a, b) => a - b);
        }
    }

    return [];
};

export const TransportistaFields: React.FC<Props> = ({ record, readOnly = true, onChange, hideAuditUsers = false, splitDetailCards = false }) => {
    const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);
    const [shippingTypeOptions, setShippingTypeOptions] = useState<SelectOption[]>([]);
    const [packageTypeOptions, setPackageTypeOptions] = useState<SelectOption[]>([]);
    const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
    const [windowSchemaOptions, setWindowSchemaOptions] = useState<SelectOption[]>([]);

    const applyWindowSchemaBusinessDays = async (schemaId: string, fallbackMeta?: any) => {
        const applyFromPayload = (payload: any) => {
            const candidate = payload?.data ?? payload?.item ?? payload;
            const businessDays = extractBusinessDays(candidate);
            if (businessDays.length > 0) {
                onChange?.("diasLaborales", businessDays);
            }
        };

        if (fallbackMeta) {
            applyFromPayload(fallbackMeta);
        }

        try {
            const response = await fetch(`${WINDOW_SCHEMA_ENDPOINT}/${encodeURIComponent(schemaId)}`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) return;

            const detail = await response.json();
            applyFromPayload(detail);
        } catch {
            // keep existing business days if detail endpoint is unavailable
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        const loadLocations = async () => {
            try {
                const response = await fetch(LOCATIONS_ENDPOINT, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) return;

                const payload = await response.json();
                const source = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : [];

                const mapped = source
                    .map((item: any) => {
                        const value = String(item?.id ?? item?.locationId ?? item?.value ?? "").trim();
                        const label = String(item?.name ?? item?.refId ?? item?.code ?? value).trim();
                        if (!value) return null;
                        return { value, label };
                    })
                    .filter(Boolean) as SelectOption[];

                setLocationOptions(mapped);
            } catch {
                // keep local fallback options when locations endpoint is not available
            }
        };

        void loadLocations();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadCompanies = async () => {
            try {
                const response = await fetch(COMPANY_ENDPOINT, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) return;

                const payload = await response.json();
                const source = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : [];

                const mapped = source
                    .map((item: any) => {
                        const value = String(item?.Id ?? item?.id ?? item?.companyId ?? item?.CompanyId ?? "").trim();
                        const label = String(item?.Name ?? item?.name ?? item?.Title ?? item?.title ?? value).trim();
                        if (!value) return null;
                        return { value, label, meta: item };
                    })
                    .filter(Boolean) as SelectOption[];

                setCompanyOptions(mapped);
            } catch {
                // keep empty options when endpoint is not available
            }
        };

        void loadCompanies();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadWindowSchemas = async () => {
            try {
                const response = await fetch(WINDOW_SCHEMA_ENDPOINT, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) return;

                const payload = await response.json();
                const source = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : [];

                const mapped = source
                    .map((item: any) => {
                        const value = String(item?.Id ?? item?.id ?? item?.windowSchemaId ?? item?.WindowSchemaId ?? "").trim();
                        const label = String(item?.Name ?? item?.name ?? item?.Title ?? item?.title ?? value).trim();
                        if (!value) return null;
                        return { value, label, meta: item };
                    })
                    .filter(Boolean) as SelectOption[];

                setWindowSchemaOptions(mapped);
            } catch {
                // keep empty options when endpoint is not available
            }
        };

        void loadWindowSchemas();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadPackageTypes = async () => {
            try {
                const response = await fetch(PACKAGE_TYPES_ENDPOINT, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) return;

                const payload = await response.json();

                const source = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : [];

                const mapped = source
                    .map((item: any) => {
                        const value = String(
                            item?.Id ??
                            item?.id ??
                            item?.PackageTypeId ??
                            item?.packageTypeId ??
                            item?.Value ??
                            item?.value ??
                            item?.Code ??
                            item?.code ??
                            item?.Title ??
                            item?.title ??
                            item?.Name ??
                            item?.name ??
                            ""
                        ).trim();
                        const label = String(
                            item?.Title ??
                            item?.title ??
                            item?.Name ??
                            item?.name ??
                            item?.Label ??
                            item?.label ??
                            item?.Description ??
                            item?.description ??
                            value
                        ).trim();
                        if (!value) return null;
                        return { value, label };
                    })
                    .filter(Boolean) as SelectOption[];

                setPackageTypeOptions(mapped);
            } catch {
                // keep empty options when endpoint is not available
            }
        };

        void loadPackageTypes();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadShippingTypes = async () => {
            try {
                const response = await fetch(SHIPPING_TYPES_ENDPOINT, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) return;

                const payload = await response.json();
                const source = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : [];

                const mapped = source
                    .map((item: any) => {
                        const value = String(item?.id ?? item?.shippingTypeId ?? item?.value ?? item?.code ?? item?.name ?? item?.type ?? "").trim();
                        const label = String(item?.title ?? item?.name ?? item?.shippingType ?? item?.label ?? item?.description ?? value).trim();
                        if (!value) return null;
                        return { value, label };
                    })
                    .filter(Boolean) as SelectOption[];

                setShippingTypeOptions(mapped);
            } catch {
                // keep empty options when endpoint is not available
            }
        };

        void loadShippingTypes();

        return () => {
            controller.abort();
        };
    }, []);

    const selectedLocationOptions = useMemo(
        () => (Array.isArray(record?.ubicaciones) ? record.ubicaciones : [])
            .map((value) => String(value ?? "").trim())
            .filter(Boolean)
            .map((value) => ({ value, label: value })),
        [record?.ubicaciones]
    );

    const ubicacionesOptions = useMemo(() => {
        const map = new Map<string, SelectOption>();
        [...selectedLocationOptions, ...locationOptions].forEach((opt) => {
            map.set(String(opt.value), opt);
        });
        return Array.from(map.values());
    }, [locationOptions, selectedLocationOptions]);

    const ubicacionesSeleccionadas = useMemo(
        () => (Array.isArray(record?.ubicaciones) ? record.ubicaciones : [])
            .map((value) => String(value ?? "").trim())
            .filter(Boolean),
        [record?.ubicaciones]
    );

    const selectedShippingTypeOption = useMemo(() => {
        const value = String(record?.tipoEntrega ?? "").trim();
        if (!value) return null;
        return shippingTypeOptions.find((opt) => String(opt.value) === value) ?? { value, label: value };
    }, [record?.tipoEntrega, shippingTypeOptions]);

    const selectedCompanyOption = useMemo(() => {
        const value = String(record?.companyId ?? "").trim();
        if (!value) return null;
        return companyOptions.find((opt) => String(opt.value) === value) ?? { value, label: value };
    }, [record?.companyId, companyOptions]);

    const selectedWindowSchemaOption = useMemo(() => {
        const value = String(record?.windowSchemaId ?? "").trim();
        if (!value) return null;
        return windowSchemaOptions.find((opt) => String(opt.value) === value) ?? { value, label: value };
    }, [record?.windowSchemaId, windowSchemaOptions]);

    const shippingTypeSelectOptions = useMemo(() => {
        const map = new Map<string, SelectOption>();
        shippingTypeOptions.forEach((opt) => {
            map.set(String(opt.value), opt);
        });
        if (selectedShippingTypeOption) {
            map.set(String(selectedShippingTypeOption.value), selectedShippingTypeOption);
        }
        return Array.from(map.values());
    }, [shippingTypeOptions, selectedShippingTypeOption]);

    const diasLaboralesSeleccionados = normalizeBusinessDays(record?.diasLaborales);
    const tiposPaqueteSeleccionados = toStringArray(record?.tipos_paquete);
    const tiposPaqueteRestringidosSeleccionados = toStringArray(record?.tipos_paquete_restringidos);

    const selectedPackageTypeOptions = useMemo(
        () => tiposPaqueteSeleccionados.map((value) => {
            const match = packageTypeOptions.find((opt) => String(opt.value) === value);
            return match ?? { value, label: value };
        }),
        [tiposPaqueteSeleccionados, packageTypeOptions]
    );

    const packageTypeSelectOptions = useMemo(() => {
        const map = new Map<string, SelectOption>();
        [...selectedPackageTypeOptions, ...packageTypeOptions].forEach((opt) => {
            map.set(String(opt.value), opt);
        });
        return Array.from(map.values());
    }, [selectedPackageTypeOptions, packageTypeOptions]);

    const selectedRestrictedPackageTypeOptions = useMemo(
        () => tiposPaqueteRestringidosSeleccionados.map((value) => {
            const match = packageTypeOptions.find((opt) => String(opt.value) === value || String(opt.label) === value);
            return match ?? { value, label: value };
        }),
        [tiposPaqueteRestringidosSeleccionados, packageTypeOptions]
    );

    const restrictedPackageTypeSelectOptions = useMemo(() => {
        const map = new Map<string, SelectOption>();
        [...selectedRestrictedPackageTypeOptions, ...packageTypeOptions].forEach((opt) => {
            map.set(String(opt.value), opt);
        });
        return Array.from(map.values());
    }, [selectedRestrictedPackageTypeOptions, packageTypeOptions]);

    const handle =
        (field: keyof Transportista) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                onChange?.(field, e.target.value);
            };

    const handleRestricciones =
        <K extends keyof NonNullable<Transportista["restricciones"]>>(field: K) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const updated = { ...record, restricciones: { ...record?.restricciones, [field]: e.target.value || "" } };
                onChange?.("restricciones", updated.restricciones);
            };

    return (
        <div className="space-y-6">
            <div className={splitDetailCards ? "grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start" : "grid grid-cols-1 gap-6 lg:grid-cols-3"}>
                {/* ── LEFT ── */}
                <div className={splitDetailCards ? "space-y-6" : "lg:col-span-2 space-y-6"}>
                    {splitDetailCards ? (
                        <>
                            <Card title="DETALLES" icon={ClipboardDocumentListIcon} noDefaultStyles={!splitDetailCards} hasTitleDivider className={splitDetailCards ? "rounded-xl p-5" : "rounded-xl p-6"}>
                                <div className="grid grid-cols-6 gap-4">
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Ref ID</span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                                {record?.refId}
                                            </a>
                                        ) : (
                                            <input type="text" value={record?.refId} onChange={handle("refId")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                        )}
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                                {record?.nombre}
                                            </a>
                                        ) : (
                                            <input type="text" value={record?.nombre} onChange={handle("nombre")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                        )}
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Descripción</span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                                {record?.descripcion}
                                            </a>
                                        ) : (
                                            <input type="text" value={record?.descripcion} onChange={handle("descripcion")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                        )}
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Compañia</span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                                {selectedCompanyOption?.label ?? record?.companyId}
                                            </a>
                                        ) : (
                                            <Select
                                                instanceId={selectIds.companyId}
                                                inputId={`${selectIds.companyId}-input`}
                                                isMulti={false}
                                                name="companyId"
                                                options={companyOptions}
                                                placeholder="Seleccionar compañía"
                                                value={selectedCompanyOption}
                                                styles={headerLikeSelectStyles}
                                                onChange={(selected) => {
                                                    const next = selected as SelectOption | null;
                                                    onChange?.("companyId", String(next?.value ?? ""));
                                                }}
                                            />
                                        )}
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo de entrega</span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                                {selectedShippingTypeOption?.label ?? record?.tipoEntrega}
                                            </a>
                                        ) : (
                                            <Select
                                                instanceId={selectIds.tipoEntrega}
                                                inputId={`${selectIds.tipoEntrega}-input`}
                                                isMulti={false}
                                                name="tipoEntrega"
                                                options={shippingTypeSelectOptions}
                                                placeholder="Seleccionar tipo de entrega"
                                                value={selectedShippingTypeOption}
                                                styles={headerLikeSelectStyles}
                                                onChange={(selected) => {
                                                    const next = selected as SelectOption | null;
                                                    onChange?.("tipoEntrega", String(next?.value ?? ""));
                                                    onChange?.("tipoEntregaLabel", String(next?.label ?? ""));
                                                }}
                                            />
                                        )}
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Integración</span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                                {record?.integrationId}
                                            </a>
                                        ) : (
                                            <input type="number" value={record?.integrationId || ""} onChange={handle("integrationId")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                        )}
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Esquema de ventana</span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                                {selectedWindowSchemaOption?.label ?? record?.windowSchemaId}
                                            </a>
                                        ) : (
                                            <Select
                                                instanceId={selectIds.windowSchemaId}
                                                inputId={`${selectIds.windowSchemaId}-input`}
                                                isMulti={false}
                                                name="windowSchemaId"
                                                options={windowSchemaOptions}
                                                placeholder="Seleccionar esquema"
                                                value={selectedWindowSchemaOption}
                                                styles={headerLikeSelectStyles}
                                                onChange={(selected) => {
                                                    const next = selected as SelectOption | null;
                                                    onChange?.("windowSchemaId", String(next?.value ?? ""));
                                                    onChange?.("timezone", "America/Santiago");
                                                    const selectedId = String(next?.value ?? "");
                                                    if (selectedId) {
                                                        void applyWindowSchemaBusinessDays(selectedId, next?.meta);
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Ubicaciones</span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <div className="text-sm font-medium text-gray-900">
                                                {ubicacionesSeleccionadas
                                                    .map((id) => ubicacionesOptions.find((opt) => String(opt.value) === id)?.label ?? id)
                                                    .join(", ")}
                                            </div>
                                        ) : (
                                            <Select
                                                instanceId={selectIds.ubicaciones}
                                                inputId={`${selectIds.ubicaciones}-input`}
                                                isMulti
                                                name="ubicaciones"
                                                options={ubicacionesOptions}
                                                value={ubicacionesOptions.filter((opt) => ubicacionesSeleccionadas.includes(String(opt.value)))}
                                                styles={headerLikeSelectStyles}
                                                onChange={(selected) => {
                                                    const values = (selected as { value: string; label: string }[])
                                                        .map((s) => String(s?.value ?? "").trim())
                                                        .filter(Boolean);
                                                    onChange?.("ubicaciones", values);
                                                }}
                                                className="basic-multi-select"
                                                classNamePrefix="select"
                                            />
                                        )}
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Días laborales</span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <div className="text-sm font-medium text-gray-900">
                                                {diasLaboralesSeleccionados
                                                    .map((d) => diasLaboralesOptions.find((opt) => opt.value === d)?.label ?? String(d))
                                                    .join(", ")}
                                            </div>
                                        ) : (
                                            <Select
                                                instanceId={selectIds.diasLaborales}
                                                inputId={`${selectIds.diasLaborales}-input`}
                                                isMulti
                                                name="diasLaborales"
                                                options={diasLaboralesOptions}
                                                value={diasLaboralesOptions.filter((opt) => diasLaboralesSeleccionados.includes(opt.value))}
                                                styles={headerLikeSelectStyles}
                                                onChange={(selected) => {
                                                    const values = (selected as { value: number; label: string }[]).map((s) => s.value);
                                                    onChange?.("diasLaborales", values);
                                                }}
                                                className="basic-multi-select"
                                                classNamePrefix="select"
                                            />
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </>
                    ) : (
                        <Card title="DETALLE" icon={ClipboardDocumentListIcon} noDefaultStyles={!splitDetailCards} hasTitleDivider className={splitDetailCards ? "rounded-xl p-5" : "rounded-xl p-6"}>
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Ref ID</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                            {record?.refId}
                                        </a>
                                    ) : (
                                        <input type="text" value={record?.refId} onChange={handle("refId")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                            {record?.nombre}
                                        </a>
                                    ) : (
                                        <input type="text" value={record?.nombre} onChange={handle("nombre")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Descripción</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                            {record?.descripcion}
                                        </a>
                                    ) : (
                                        <input type="text" value={record?.descripcion} onChange={handle("descripcion")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Company ID</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                            {selectedCompanyOption?.label ?? record?.companyId}
                                        </a>
                                    ) : (
                                        <Select
                                            instanceId={selectIds.companyId}
                                            inputId={`${selectIds.companyId}-input`}
                                            isMulti={false}
                                            name="companyId"
                                            options={companyOptions}
                                            placeholder="Seleccionar compañía"
                                            value={selectedCompanyOption}
                                            styles={headerLikeSelectStyles}
                                            onChange={(selected) => {
                                                const next = selected as SelectOption | null;
                                                onChange?.("companyId", String(next?.value ?? ""));
                                            }}
                                        />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo de entrega</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                            {selectedShippingTypeOption?.label ?? record?.tipoEntrega}
                                        </a>
                                    ) : (
                                        <Select
                                            instanceId={selectIds.tipoEntrega}
                                            inputId={`${selectIds.tipoEntrega}-input`}
                                            isMulti={false}
                                            name="tipoEntrega"
                                            options={shippingTypeSelectOptions}
                                            placeholder="Seleccionar tipo de entrega"
                                            value={selectedShippingTypeOption}
                                            styles={headerLikeSelectStyles}
                                            onChange={(selected) => {
                                                const next = selected as SelectOption | null;
                                                onChange?.("tipoEntrega", String(next?.value ?? ""));
                                                onChange?.("tipoEntregaLabel", String(next?.label ?? ""));
                                            }}
                                        />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Integration ID</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                            {record?.integrationId}
                                        </a>
                                    ) : (
                                        <input type="number" value={record?.integrationId || ""} onChange={handle("integrationId")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Window schema ID</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                            {selectedWindowSchemaOption?.label ?? record?.windowSchemaId}
                                        </a>
                                    ) : (
                                        <Select
                                            instanceId={selectIds.windowSchemaId}
                                            inputId={`${selectIds.windowSchemaId}-input`}
                                            isMulti={false}
                                            name="windowSchemaId"
                                            options={windowSchemaOptions}
                                            placeholder="Seleccionar esquema"
                                            value={selectedWindowSchemaOption}
                                            styles={headerLikeSelectStyles}
                                            onChange={(selected) => {
                                                const next = selected as SelectOption | null;
                                                onChange?.("windowSchemaId", String(next?.value ?? ""));
                                                onChange?.("timezone", "America/Santiago");
                                                const selectedId = String(next?.value ?? "");
                                                if (selectedId) {
                                                    void applyWindowSchemaBusinessDays(selectedId, next?.meta);
                                                }
                                            }}
                                        />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Ubicaciones</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <div className="text-sm font-medium text-gray-900">
                                            {ubicacionesSeleccionadas
                                                .map((id) => ubicacionesOptions.find((opt) => String(opt.value) === id)?.label ?? id)
                                                .join(", ")}
                                        </div>
                                    ) : (
                                        <Select
                                            instanceId={selectIds.ubicaciones}
                                            inputId={`${selectIds.ubicaciones}-input`}
                                            isMulti
                                            name="ubicaciones"
                                            options={ubicacionesOptions}
                                            value={ubicacionesOptions.filter((opt) => ubicacionesSeleccionadas.includes(String(opt.value)))}
                                            styles={headerLikeSelectStyles}
                                            onChange={(selected) => {
                                                const values = (selected as { value: string; label: string }[])
                                                    .map((s) => String(s?.value ?? "").trim())
                                                    .filter(Boolean);
                                                onChange?.("ubicaciones", values);
                                            }}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Días laborales</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <div className="text-sm font-medium text-gray-900">
                                            {diasLaboralesSeleccionados
                                                .map((d) => diasLaboralesOptions.find((opt) => opt.value === d)?.label ?? String(d))
                                                .join(", ")}
                                        </div>
                                    ) : (
                                        <Select
                                            instanceId={selectIds.diasLaborales}
                                            inputId={`${selectIds.diasLaborales}-input`}
                                            isMulti
                                            name="diasLaborales"
                                            options={diasLaboralesOptions}
                                            value={diasLaboralesOptions.filter((opt) => diasLaboralesSeleccionados.includes(opt.value))}
                                            styles={headerLikeSelectStyles}
                                            onChange={(selected) => {
                                                const values = (selected as { value: number; label: string }[]).map((s) => s.value);
                                                onChange?.("diasLaborales", values);
                                            }}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card title="RESTRICIONES" icon={ClipboardDocumentListIcon} noDefaultStyles={!splitDetailCards} hasTitleDivider className={splitDetailCards ? "rounded-xl p-5" : "rounded-xl p-6"}>
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Tiempo mínimo de entrega</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                        {record?.restricciones?.tiempoMinEntrega}
                                    </a>
                                ) : (
                                    <input type="text" value={record?.restricciones?.tiempoMinEntrega} onChange={handleRestricciones("tiempoMinEntrega")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Tiempo máximo de entrega</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                        {record?.restricciones?.tiempoMaxEntrega}
                                    </a>
                                ) : (
                                    <input type="text" value={record?.restricciones?.tiempoMaxEntrega} onChange={handleRestricciones("tiempoMaxEntrega")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Volumen mínimo permitido</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                        {record?.restricciones?.volumenMinPermitido}
                                    </a>
                                ) : (
                                    <input type="text" value={record?.restricciones?.volumenMinPermitido} onChange={handleRestricciones("volumenMinPermitido")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Volumen máximo permitido</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                        {record?.restricciones?.volumenMaxPermitido}
                                    </a>
                                ) : (
                                    <input type="text" value={record?.restricciones?.volumenMaxPermitido} onChange={handleRestricciones("volumenMaxPermitido")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Peso mínimo permitido</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                        {record?.restricciones?.pesoMinPermitido}
                                    </a>
                                ) : (
                                    <input type="text" value={record?.restricciones?.pesoMinPermitido} onChange={handleRestricciones("pesoMinPermitido")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Peso máximo permitido</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                        {record?.restricciones?.pesoMaxPermitido}
                                    </a>
                                ) : (
                                    <input type="text" value={record?.restricciones?.pesoMaxPermitido} onChange={handleRestricciones("pesoMaxPermitido")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Largo máximo permitido</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                        {record?.restricciones?.largoMaxPermitido}
                                    </a>
                                ) : (
                                    <input type="text" value={record?.restricciones?.largoMaxPermitido} onChange={handleRestricciones("largoMaxPermitido")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ancho máximo permitido</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                        {record?.restricciones?.anchoMaxPermitido}
                                    </a>
                                ) : (
                                    <input type="text" value={record?.restricciones?.anchoMaxPermitido} onChange={handleRestricciones("anchoMaxPermitido")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Alto máximo permitido</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                        {record?.restricciones?.altoMaxPermitido}
                                    </a>
                                ) : (
                                    <input type="text" value={record?.restricciones?.altoMaxPermitido} onChange={handleRestricciones("altoMaxPermitido")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>
                        </div>
                    </Card>

                    {!splitDetailCards && (
                        <Card title="REGLAS DE PACKING" icon={ClipboardDocumentListIcon} noDefaultStyles={!splitDetailCards} hasTitleDivider className={splitDetailCards ? "rounded-xl p-5" : "rounded-xl p-6"}>
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Máx. Paquetes</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                            {record?.max_paquetes}
                                        </a>
                                    ) : (
                                        <input type="text" value={record?.max_paquetes} onChange={handle("max_paquetes")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Tipos de paquete</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <div className="text-sm font-medium text-gray-900">{selectedPackageTypeOptions.map((opt) => opt.label).join(", ")}</div>
                                    ) : (
                                        <Select
                                            instanceId={selectIds.tiposPaquete}
                                            inputId={`${selectIds.tiposPaquete}-input`}
                                            isMulti
                                            name="tipos_paquete"
                                            options={packageTypeSelectOptions}
                                            value={selectedPackageTypeOptions}
                                            styles={headerLikeSelectStyles}
                                            onChange={(selected) => {
                                                const values = (selected as any[]).map((s) => String(s?.label ?? "").trim()).filter(Boolean);
                                                onChange?.("tipos_paquete", values.join(","));
                                            }}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Tipos de paquete restringidos</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <div className="text-sm font-medium text-gray-900">{selectedRestrictedPackageTypeOptions.map((opt) => opt.label).join(", ")}</div>
                                    ) : (
                                        <Select
                                            instanceId={selectIds.tiposPaqueteRestringidos}
                                            inputId={`${selectIds.tiposPaqueteRestringidos}-input`}
                                            isMulti
                                            name="tipos_paquete_restringidos"
                                            options={restrictedPackageTypeSelectOptions}
                                            value={selectedRestrictedPackageTypeOptions}
                                            styles={headerLikeSelectStyles}
                                            onChange={(selected) => {
                                                const values = (selected as any[]).map((s) => String(s?.label ?? "").trim()).filter(Boolean);
                                                onChange?.("tipos_paquete_restringidos", values.join(","));
                                            }}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Grupos de producto restringidos</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <div className="text-sm font-medium text-gray-900">{toStringArray(record?.grupos_producto_restringidos).join(", ")}</div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={record?.grupos_producto_restringidos || ""}
                                            onChange={handle("grupos_producto_restringidos")}
                                            placeholder="Ej: Fragil, Refrigerado"
                                            className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                        />
                                    )}
                                </div>
                                <br />
                            </div>
                        </Card>
                    )}
                </div>

                {/* ── RIGHT ── */}
                <div className="space-y-6">
                    <Card title="CONFIGURACIONES" icon={Cog6ToothIcon} noDefaultStyles={!splitDetailCards} hasTitleDivider className={splitDetailCards ? "rounded-xl p-5" : "rounded-xl p-6"}>
                        <div className="grid grid-cols-6 gap-4 mt-6">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.configuracion?.estado}</div>
                                ) : (
                                    <div className="inline-flex items-center">
                                        <Toggle
                                            checked={record?.configuracion?.estado === "Active"}
                                            onCheckedChange={(checked) =>
                                                onChange?.("configuracion", {
                                                    ...record?.configuracion,
                                                    estado: checked ? "Active" : "Inactive",
                                                } as any)
                                            }
                                            aria-label="Status"
                                        />
                                    </div>
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Genera ruta</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.configuracion?.generarRuta ? "Sí" : "No"}</div>
                                ) : (
                                    <div className="inline-flex items-center">
                                        <Toggle
                                            checked={Boolean(record?.configuracion?.generarRuta)}
                                            onCheckedChange={(checked) =>
                                                onChange?.("configuracion", {
                                                    ...record?.configuracion,
                                                    generarRuta: checked,
                                                } as any)
                                            }
                                            aria-label="Genera ruta"
                                        />
                                    </div>
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ruteo automático</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.configuracion?.needsAutomaticRouting ? "Sí" : "No"}</div>
                                ) : (
                                    <div className="inline-flex items-center">
                                        <Toggle
                                            checked={Boolean(record?.configuracion?.needsAutomaticRouting)}
                                            onCheckedChange={(checked) =>
                                                onChange?.("configuracion", {
                                                    ...record?.configuracion,
                                                    needsAutomaticRouting: checked,
                                                } as any)
                                            }
                                            aria-label="Ruteo automático"
                                        />
                                    </div>
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Es interno</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.configuracion?.isInternal ? "Sí" : "No"}</div>
                                ) : (
                                    <div className="inline-flex items-center">
                                        <Toggle
                                            checked={Boolean(record?.configuracion?.isInternal)}
                                            onCheckedChange={(checked) =>
                                                onChange?.("configuracion", {
                                                    ...record?.configuracion,
                                                    isInternal: checked,
                                                    isExternal: checked ? false : Boolean(record?.configuracion?.isExternal),
                                                } as any)
                                            }
                                            aria-label="Es interno"
                                        />
                                    </div>
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Es externo</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.configuracion?.isExternal ? "Sí" : "No"}</div>
                                ) : (
                                    <div className="inline-flex items-center">
                                        <Toggle
                                            checked={Boolean(record?.configuracion?.isExternal)}
                                            onCheckedChange={(checked) =>
                                                onChange?.("configuracion", {
                                                    ...record?.configuracion,
                                                    isExternal: checked,
                                                    isInternal: checked ? false : Boolean(record?.configuracion?.isInternal),
                                                } as any)
                                            }
                                            aria-label="Es externo"
                                        />
                                    </div>
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Método segundo factor</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.configuracion?.metodoSegundoFactor}</div>
                                ) : (
                                    <Select
                                        instanceId="transportista-metodo-segundo-factor"
                                        inputId="transportista-metodo-segundo-factor-input"
                                        isMulti={false}
                                        name="metodoSegundoFactor"
                                        options={metodoSegundoFactorOptions}
                                        placeholder="Seleccionar método"
                                        value={metodoSegundoFactorOptions.find((opt) => opt.value === record?.configuracion?.metodoSegundoFactor) ?? null}
                                        styles={headerLikeSelectStyles}
                                        onChange={(selected) => {
                                            const next = selected as SelectOption | null;
                                            onChange?.("configuracion", { ...record?.configuracion, metodoSegundoFactor: String(next?.value ?? "") } as any);
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card title="PARÁMETROS OPERATIVOS" icon={Cog6ToothIcon} noDefaultStyles={!splitDetailCards} hasTitleDivider className={splitDetailCards ? "rounded-xl p-5" : "rounded-xl p-6"}>
                        <div className="grid grid-cols-6 gap-4 mt-6">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Tiempo min fulfillment</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.minFulfillmentTime}</div>
                                ) : (
                                    <input type="number" value={record?.minFulfillmentTime || ""} onChange={handle("minFulfillmentTime")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Cantidad de envío predeterminada</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.defaultShippingQuantity}</div>
                                ) : (
                                    <input type="number" value={record?.defaultShippingQuantity || ""} onChange={handle("defaultShippingQuantity")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Cantidad de producto predeterminada</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.defaultProductQuantity}</div>
                                ) : (
                                    <input type="number" value={record?.defaultProductQuantity || ""} onChange={handle("defaultProductQuantity")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Cantidad de paquetes predeterminada</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.defaultPackageQuantity}</div>
                                ) : (
                                    <input type="number" value={record?.defaultPackageQuantity || ""} onChange={handle("defaultPackageQuantity")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Costo de entrega extra</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.defaultExtraDeliveryCost}</div>
                                ) : (
                                    <input type="number" value={record?.defaultExtraDeliveryCost || ""} onChange={handle("defaultExtraDeliveryCost")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Tiempo de pre despacho</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record?.preDispatchTime}</div>
                                ) : (
                                    <input type="number" value={record?.preDispatchTime || ""} onChange={handle("preDispatchTime")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                )}
                            </div>
                        </div>
                    </Card>

                    {splitDetailCards && (
                        <Card title="REGLAS DE PACKING" icon={ClipboardDocumentListIcon} noDefaultStyles={!splitDetailCards} hasTitleDivider className={splitDetailCards ? "rounded-xl p-5" : "rounded-xl p-6"}>
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Máx. Paquetes</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <a href="#" className="text-sm font-medium text-blue-600 underline truncate">
                                            {record?.max_paquetes}
                                        </a>
                                    ) : (
                                        <input type="text" value={record?.max_paquetes} onChange={handle("max_paquetes")} className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900" />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Tipos de paquete</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <div className="text-sm font-medium text-gray-900">{selectedPackageTypeOptions.map((opt) => opt.label).join(", ")}</div>
                                    ) : (
                                        <Select
                                            instanceId={selectIds.tiposPaquete}
                                            inputId={`${selectIds.tiposPaquete}-input`}
                                            isMulti
                                            name="tipos_paquete"
                                            options={packageTypeSelectOptions}
                                            value={selectedPackageTypeOptions}
                                            styles={headerLikeSelectStyles}
                                            onChange={(selected) => {
                                                const values = (selected as any[]).map((s) => String(s?.label ?? "").trim()).filter(Boolean);
                                                onChange?.("tipos_paquete", values.join(","));
                                            }}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Tipos de paquete restringidos</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <div className="text-sm font-medium text-gray-900">{selectedRestrictedPackageTypeOptions.map((opt) => opt.label).join(", ")}</div>
                                    ) : (
                                        <Select
                                            instanceId={selectIds.tiposPaqueteRestringidos}
                                            inputId={`${selectIds.tiposPaqueteRestringidos}-input`}
                                            isMulti
                                            name="tipos_paquete_restringidos"
                                            options={restrictedPackageTypeSelectOptions}
                                            value={selectedRestrictedPackageTypeOptions}
                                            styles={headerLikeSelectStyles}
                                            onChange={(selected) => {
                                                const values = (selected as any[]).map((s) => String(s?.label ?? "").trim()).filter(Boolean);
                                                onChange?.("tipos_paquete_restringidos", values.join(","));
                                            }}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    )}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Grupos de producto restringidos</span>
                                <div className="col-span-5">
                                    {readOnly ? (
                                        <div className="text-sm font-medium text-gray-900">{toStringArray(record?.grupos_producto_restringidos).join(", ")}</div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={record?.grupos_producto_restringidos || ""}
                                            onChange={handle("grupos_producto_restringidos")}
                                            placeholder="Ej: Fragil, Refrigerado"
                                            className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                        />
                                    )}
                                </div>
                                <br />
                            </div>
                        </Card>
                    )}

                    {!hideAuditUsers && (
                        <>
                            <Card title="USUARIO CREADOR" icon={User2Icon} noDefaultStyles={!splitDetailCards} hasTitleDivider className={splitDetailCards ? "rounded-xl p-5" : "rounded-xl p-6"}>
                                <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                                    <div className="col-span-3">
                                        <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                                            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                                {record?.creador?.nombre?.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-semibold text-blue-600">{record?.creador?.nombre}</div>
                                                <div className="text-gray-500 truncate max-w-[200px]">{record?.creador?.email}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-sm text-gray-500 text-right truncate">{record?.creador?.fechaCreacion}</div>
                                </div>
                            </Card>

                            <Card title="USUARIO MODIFICADOR" icon={User2Icon} noDefaultStyles={!splitDetailCards} hasTitleDivider className={splitDetailCards ? "rounded-xl p-5" : "rounded-xl p-6"}>
                                <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                                    <div className="col-span-3">
                                        <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                                            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                                {(record?.modificador?.nombre || "-")
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase() || "-"}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-semibold text-blue-600">{record?.modificador?.nombre || "-"}</div>
                                                <div className="text-gray-500 truncate max-w-[200px]">{record?.modificador?.email || "-"}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-sm text-gray-500 text-right truncate">{record?.modificador?.fechaModificacion || "-"}</div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
