// views\Customers\Clientes\components\clientesFields.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, UserIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuth } from "@/lib/http/client";

/* ================================
 * Tipos de la UI
 * ================================ */

export interface CustomerRecord {
    id: string;            // Id (API.Id)
    firstName: string;     // API.FirstName
    lastName: string;      // API.LastName
    docType: "RUT";        // fijo por ahora
    docNumber: string;     // API.RUT
    mainEmail: string;     // API.Email
    phone: string;         // API.Phone
    status: boolean;
    created: { name: string; date: string };
    modified: { name: string; date: string };
    // Flags UI
    isNew?: boolean;
    // ===== Datos comerciales / precios =====
    partnerType?: string;       // API.PartnerType (solo "C")
    groupCode?: number;         // API.GroupCode
    groupNum?: number;          // API.GroupNum
    payTermsGrpCode?: number;   // API.PayTermsGrpCode
    currency: string;           // API.Currency
    listNum: number;            // API.ListNum
    notes?: string;             // API.Notes  (label "Giros")

    // ===== Direcciones mínimas requeridas =====
    addressBilling: {           // "B1"
        code: string;             // AddressCode
        name: string;             // AddressName
        street: string;           // Street
        city: string;             // City
        country: string;          // Country (ej: "CL")
        isActive: boolean;        // IsActive
    };
    addressShipping: {          // "S1"
        code: string;             // AddressCode
        name: string;             // AddressName
        street: string;           // Street
        city: string;             // City
        country: string;          // Country (ej: "CL")
        isActive: boolean;        // IsActive
    };

    addressStreet?: string;
    addressCity?: string;
    addressCountry?: string;
    addressActive?: boolean;
}

type OptS = { label: string; value: string };

export function CustomersFields({
    record,
    readOnly = false,
    onChange,
    rutError,
    errors,
    hideAuditCards = false,
}: {
    record: CustomerRecord;
    readOnly?: boolean;
    onChange?: <K extends keyof CustomerRecord>(field: K, value: CustomerRecord[K]) => void;
    rutError?: string | null;
    errors?: Partial<Record<keyof CustomerRecord, string>>;
    hideAuditCards?: boolean;
}) {
    const handle =
        <K extends keyof CustomerRecord>(field: K) =>
            (value: CustomerRecord[K]) =>
                onChange?.(field, value);

    // helper para clases estilo “línea RUT”
    const inputClass = (hasError: boolean) =>
        [
            "col-span-9 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2",
            // mismo patrón que el RUT:
            !readOnly && hasError ? "border-red-400 ring-red-200" : "border-gray-300 ring-blue-200",
        ].join(" ");

    // llamadas a la api 
    const { fetchWithAuth } = useFetchWithAuth();

    // === Price Lists (ListNum) desde API ===
    const [plOpts, setPlOpts] = useState<OptS[]>([{ label: "Seleccione lista…", value: "" }]);
    const [plSearch, setPlSearch] = useState("");
    const [plLoading, setPlLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setPlLoading(true);
                const res = await fetchWithAuth<any>("catalog/price-lists?page=1&pageSize=100");
                const rows = Array.isArray(res?.data) ? res.data : [];
                const opts: OptS[] = [{ label: "Seleccione lista…", value: "" }].concat(
                    rows.map((r: any) => ({
                        // Mostrar "Lista N", pero el value DEBE ser string
                        label: `Lista ${r?.ListNum ?? ""}`,
                        value: String(r?.ListNum ?? ""),
                    }))
                );
                if (mounted) setPlOpts(opts);
            } catch (e) {
                console.error("No se pudo cargar price-lists:", e);
                if (mounted) setPlOpts([{ label: "Seleccione lista…", value: "" }]);
            } finally {
                if (mounted) setPlLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [fetchWithAuth]);

    const plVisible = useMemo(() => {
        const q = plSearch.trim().toLowerCase();
        if (!q) return plOpts;
        return plOpts.filter(o => o.label.toLowerCase().includes(q));
    }, [plOpts, plSearch]);

    // === Dirección común: inicializar visualmente desde billing/shipping si no viene seteado ===
    const street = record.addressStreet ?? record.addressBilling?.street ?? record.addressShipping?.street ?? "";
    const city = record.addressCity ?? record.addressBilling?.city ?? record.addressShipping?.city ?? "";
    const country = record.addressCountry ?? record.addressBilling?.country ?? record.addressShipping?.country ?? "CL";
    const active = record.addressActive ?? record.addressBilling?.isActive ?? record.addressShipping?.isActive ?? true;

    // Handlers que duplican en B1/S1
    const setCommonStreet = (v: string) => {
        onChange?.("addressStreet" as any, v);
        onChange?.("addressBilling" as any, { ...record.addressBilling, street: v });
        onChange?.("addressShipping" as any, { ...record.addressShipping, street: v });
    };
    const setCommonCity = (v: string) => {
        onChange?.("addressCity" as any, v);
        onChange?.("addressBilling" as any, { ...record.addressBilling, city: v });
        onChange?.("addressShipping" as any, { ...record.addressShipping, city: v });
    };
    const setCommonCountry = (v: string) => {
        onChange?.("addressCountry" as any, v);
        onChange?.("addressBilling" as any, { ...record.addressBilling, country: v });
        onChange?.("addressShipping" as any, { ...record.addressShipping, country: v });
    };
    const setCommonActive = (v: boolean) => {
        onChange?.("addressActive" as any, v);
        onChange?.("addressBilling" as any, { ...record.addressBilling, isActive: v });
        onChange?.("addressShipping" as any, { ...record.addressShipping, isActive: v });
    };

    return (
        <div className="space-y-6">
            <div className={`grid grid-cols-1 gap-6 ${hideAuditCards ? "" : "lg:grid-cols-7"}`}>
                {/* Columna izquierda */}
                <div className={`${hideAuditCards ? "space-y-6" : "lg:col-span-4 space-y-6"}`}>
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Nombre */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.firstName}
                                    onChange={(e) => handle("firstName")(e.target.value)}
                                    className={`w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.firstName ? "border-red-500" : "border-gray-300"
                                        }`}
                                    aria-invalid={!!errors?.firstName}
                                    aria-describedby={errors?.firstName ? "error-firstName" : undefined}
                                    placeholder="Nombre"
                                />
                                {errors?.firstName && (
                                    <p id="error-firstName" className="mt-1 text-xs text-red-600">
                                        {errors.firstName}
                                    </p>
                                )}
                            </div>

                            {/* Apellido */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Apellido</span>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.lastName}
                                    onChange={(e) => handle("lastName")(e.target.value)}
                                    className={`w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.lastName ? "border-red-500" : "border-gray-300"
                                        }`}
                                    aria-invalid={!!errors?.lastName}
                                    aria-describedby={errors?.lastName ? "error-lastName" : undefined}
                                    placeholder="Apellido"
                                />
                                {errors?.lastName && (
                                    <p id="error-lastName" className="mt-1 text-xs text-red-600">
                                        {errors.lastName}
                                    </p>
                                )}
                            </div>

                            {/* Documento */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Documento</span>
                            <div className="col-span-5 grid grid-cols-10 gap-3">
                                {/* Tipo (docType) */}
                                <input
                                    disabled
                                    value={record.docType}
                                    className={`col-span-1 w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.docType ? "border-red-500" : "border-gray-300"
                                        }`}
                                    aria-invalid={!!errors?.docType}
                                    aria-describedby={errors?.docType ? "error-docType" : undefined}
                                />
                                {/* Número (docNumber / RUT) */}
                                <input
                                    disabled={readOnly}
                                    value={record.docNumber}
                                    onChange={(e) => handle("docNumber")(e.target.value)}
                                    className={`col-span-9 w-full border-b bg-transparent py-1 text-sm outline-none ${rutError || errors?.docNumber ? "border-red-500" : "border-gray-300"
                                        }`}
                                    title={rutError ?? errors?.docNumber ?? ""}
                                    aria-invalid={!!(rutError || errors?.docNumber)}
                                    aria-describedby={rutError || errors?.docNumber ? "error-docNumber" : undefined}
                                    placeholder="12345678-9"
                                />
                                {/* Mensajes de error por campo dentro del grid de 10 columnas */}
                                <div className="col-span-1">
                                    {errors?.docType && (
                                        <p id="error-docType" className="mt-1 text-xs text-red-600">
                                            {errors.docType}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-9">
                                    {(rutError || errors?.docNumber) && (
                                        <p id="error-docNumber" className="mt-1 text-xs text-red-600">
                                            {rutError ?? errors?.docNumber}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Email</span>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.mainEmail}
                                    onChange={(e) => handle("mainEmail")(e.target.value)}
                                    className={`w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.mainEmail ? "border-red-500" : "border-gray-300"
                                        }`}
                                    aria-invalid={!!errors?.mainEmail}
                                    aria-describedby={errors?.mainEmail ? "error-mainEmail" : undefined}
                                    placeholder="correo@dominio.cl"
                                />
                                {errors?.mainEmail && (
                                    <p id="error-mainEmail" className="mt-1 text-xs text-red-600">
                                        {errors.mainEmail}
                                    </p>
                                )}
                            </div>

                            {/* Teléfono */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Teléfono</span>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.phone}
                                    onChange={(e) => handle("phone")(e.target.value)}
                                    className={`w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.phone ? "border-red-500" : "border-gray-300"
                                        }`}
                                    aria-invalid={!!errors?.phone}
                                    aria-describedby={errors?.phone ? "error-phone" : undefined}
                                    placeholder="+56 9 1234 5678"
                                />
                                {errors?.phone && (
                                    <p id="error-phone" className="mt-1 text-xs text-red-600">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Estado */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Estado</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.status ? "Activo" : "Inactivo"}
                                    options={["Activo", "Inactivo"]}
                                    onChange={(v) => onChange?.("status" as any, v === "Activo")}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* -------- FACTURACIÓN Y PRECIOS -------- */}
                    <Card
                        title="FACTURACIÓN Y PRECIOS"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* partnerType (solo "C") */}
                            {/* <span className="col-span-1 text-sm font-bold text-gray-700">Tipo de socio</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.partnerType ?? "C"}
                                    options={["C"]}
                                    onChange={(v) => onChange?.("partnerType" as any, String(v))}
                                />
                            </div> */}

                            {/* groupCode (select con "100") */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Group Code</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={String(record.groupCode ?? 100)}
                                    options={["100"]}
                                    onChange={(v) => onChange?.("groupCode" as any, Number(v))}
                                />
                            </div>

                            {/* groupNum (select con "1") */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Group Num</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={String(record.groupNum ?? 1)}
                                    options={["1"]}
                                    onChange={(v) => onChange?.("groupNum" as any, Number(v))}
                                />
                            </div>

                            {/* PayTermsGrpCode (select con "1") */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Plazo de pago</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={String(record.payTermsGrpCode ?? 1)}
                                    options={["1"]}
                                    onChange={(v) => onChange?.("payTermsGrpCode" as any, Number(v))}
                                />
                            </div>

                            {/* currency (select con "CLP") */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Moneda</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.currency ?? "CLP"}
                                    options={["CLP"]}
                                    onChange={(v) => onChange?.("currency" as any, String(v))}
                                />
                            </div>

                            {/* Giros (notes) select "Particular" */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Giros</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.notes ?? "Particular"}
                                    options={["Particular"]}
                                    onChange={(v) => onChange?.("notes" as any, String(v))}
                                />
                            </div>

                            {/* Listas (listNum) desde API con SelectSearchInline */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Listas</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="listNum"
                                    label=""
                                    // value debe ser string:
                                    value={record.listNum != null ? String(record.listNum) : ""}
                                    options={plVisible}
                                    searchQuery={plSearch}
                                    loading={plLoading}
                                    onSearch={setPlSearch}
                                    // Convertimos el string del select a number para el record
                                    onChange={(val) => onChange?.("listNum" as any, val ? Number(val) : ("" as any))}
                                    placeholderFromDefault
                                />
                            </div>
                        </div>
                    </Card>

                    {/* -------- DIRECCIONES -------- */}
                    <Card
                        title="DIRECCIONES"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        {/* Fijos B1/S1 (muestra) */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm font-bold text-gray-700">Facturación</span>
                            <div className="col-span-5 text-sm text-gray-800">
                                <span className="inline-block mr-2">
                                    Código: <b>B1</b>
                                </span>
                                <span className="inline-block">
                                    Nombre: <b>Facturación</b>
                                </span>
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Envío</span>
                            <div className="col-span-5 text-sm text-gray-800">
                                <span className="inline-block mr-2">
                                    Código: <b>S1</b>
                                </span>
                                <span className="inline-block">
                                    Nombre: <b>Envío</b>
                                </span>
                            </div>
                        </div>

                        {/* Dirección común (se duplica en B1 y S1) */}
                        <div className="grid grid-cols-6 gap-4 mt-4">
                            <span className="col-span-1 text-sm font-bold text-gray-700">Calle</span>
                            <input
                                disabled={readOnly}
                                value={street}
                                onChange={(e) => setCommonStreet(e.target.value)}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />
                            <span className="col-span-1 text-sm font-bold text-gray-700">Ciudad</span>
                            <input
                                disabled={readOnly}
                                value={city}
                                onChange={(e) => setCommonCity(e.target.value)}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />
                            <span className="col-span-1 text-sm font-bold text-gray-700">País</span>
                            <input
                                disabled={readOnly}
                                value={country}
                                onChange={(e) => setCommonCountry(e.target.value)}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Activa</span>
                            <div className="col-span-5">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        disabled={readOnly}
                                        checked={Boolean(active)}
                                        onChange={(e) => setCommonActive(e.target.checked)}
                                    />
                                    <span>Usar en ambas direcciones (B/S)</span>
                                </label>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            * Se guardará <b>Facturación</b> (B1) y <b>Envío</b> (S1) con estos mismos datos.
                        </p>
                    </Card>
                </div>

                {/* Columna derecha */}
                {!hideAuditCards && (
                    <div className="lg:col-span-3 space-y-6">
                        {/* Usuario creador */}
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            hasTitleDivider
                            noDefaultStyles
                            className="rounded-xl p-6"
                        >
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-2 text-sm font-bold text-gray-700">Nombre</span>
                                <span className="col-span-4 text-sm text-gray-900">{record.created.name || "—"}</span>

                                <span className="col-span-2 text-sm font-bold text-gray-700">Fecha</span>
                                <span className="col-span-4 text-sm text-gray-900">{record.created.date || "—"}</span>
                            </div>
                        </Card>

                        {/* Última modificación */}
                        <Card
                            title="ÚLTIMA MODIFICACIÓN"
                            icon={UserIcon}
                            hasTitleDivider
                            noDefaultStyles
                            className="rounded-xl p-6"
                        >
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-2 text-sm font-bold text-gray-700">Nombre</span>
                                <span className="col-span-4 text-sm text-gray-900">{record.modified.name || "—"}</span>

                                <span className="col-span-2 text-sm font-bold text-gray-700">Fecha</span>
                                <span className="col-span-4 text-sm text-gray-900">{record.modified.date || "—"}</span>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );

}

export default CustomersFields;
