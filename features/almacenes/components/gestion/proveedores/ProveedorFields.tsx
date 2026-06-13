"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, UserIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuth } from "@/lib/http/client";

/* ================================
 * Tipos de la UI (idénticos a clientes)
 * ================================ */
export interface ProveedorRecord {
    id: string;
    firstName: string;
    lastName: string;
    docType: "RUT";
    docNumber: string;
    mainEmail: string;
    phone: string;
    status: boolean;
    created: { name: string; date: string };
    modified: { name: string; date: string };
    isNew?: boolean;

    // ===== Datos comerciales / precios =====
    partnerType?: string;       // API.PartnerType (solo "P" aquí)
    groupCode?: number;
    groupNum?: number;
    payTermsGrpCode?: number;
    currency: string;
    listNum: number;
    notes?: string;

    // ===== Direcciones mínimas requeridas =====
    addressBilling: { code: string; name: string; street: string; city: string; country: string; isActive: boolean; };
    addressShipping: { code: string; name: string; street: string; city: string; country: string; isActive: boolean; };

    // Campos “dirección común” (UI)
    addressStreet?: string;
    addressCity?: string;
    addressCountry?: string;
    addressActive?: boolean;
}

type OptS = { label: string; value: string };

export function ProveedorFields({
    record,
    readOnly = false,
    onChange,
    rutError,
    errors,
}: {
    record: ProveedorRecord;
    readOnly?: boolean;
    onChange?: <K extends keyof ProveedorRecord>(field: K, value: ProveedorRecord[K]) => void;
    rutError?: string | null;
    errors?: Partial<Record<keyof ProveedorRecord, string>>;
}) {
    const handle =
        <K extends keyof ProveedorRecord>(field: K) =>
            (value: ProveedorRecord[K]) =>
                onChange?.(field, value);

    const { fetchWithAuth } = useFetchWithAuth();

    // === Price Lists (ListNum) ===
    const [plOpts, setPlOpts] = useState<OptS[]>([{ label: "-", value: "" }]);
    const [plSearch, setPlSearch] = useState("");
    const [plLoading, setPlLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setPlLoading(true);
                const res = await fetchWithAuth<any>("catalog/price-lists?page=1&pageSize=100");
                const rows = Array.isArray(res?.data) ? res.data : [];
                const opts: OptS[] = [{ label: "-", value: "" }].concat(
                    rows.map((r: any) => ({ label: `Lista ${r?.ListNum ?? ""}`, value: String(r?.ListNum ?? "") }))
                );
                if (mounted) setPlOpts(opts);
            } catch (e) {
                console.error("No se pudo cargar price-lists:", e);
                if (mounted) setPlOpts([{ label: "-", value: "" }]);
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

    // Dirección común (mismo patrón)
    const street = record.addressStreet ?? record.addressBilling?.street ?? record.addressShipping?.street ?? "";
    const city = record.addressCity ?? record.addressBilling?.city ?? record.addressShipping?.city ?? "";
    const country = record.addressCountry ?? record.addressBilling?.country ?? record.addressShipping?.country ?? "CL";
    const active = record.addressActive ?? record.addressBilling?.isActive ?? record.addressShipping?.isActive ?? true;

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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* Columna izquierda */}
                <div className="lg:col-span-4 space-y-6">
                    <Card title="DETALLE" icon={ClipboardDocumentListIcon} hasTitleDivider noDefaultStyles className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm font-bold text-gray-700">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.firstName}
                                    onChange={(e) => handle("firstName")(e.target.value)}
                                    className={`w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.firstName ? "border-red-500" : "border-gray-300"}`}
                                    aria-invalid={!!errors?.firstName}
                                    aria-describedby={errors?.firstName ? "error-firstName" : undefined}
                                    placeholder="Nombre"
                                />
                                {errors?.firstName && <p id="error-firstName" className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Apellido</span>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.lastName}
                                    onChange={(e) => handle("lastName")(e.target.value)}
                                    className={`w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.lastName ? "border-red-500" : "border-gray-300"}`}
                                    aria-invalid={!!errors?.lastName}
                                    aria-describedby={errors?.lastName ? "error-lastName" : undefined}
                                    placeholder="Apellido"
                                />
                                {errors?.lastName && <p id="error-lastName" className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Documento</span>
                            <div className="col-span-5 grid grid-cols-10 gap-3">
                                <input
                                    disabled
                                    value={record.docType}
                                    className={`col-span-1 w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.docType ? "border-red-500" : "border-gray-300"}`}
                                    aria-invalid={!!errors?.docType}
                                    aria-describedby={errors?.docType ? "error-docType" : undefined}
                                />
                                <input
                                    disabled={readOnly}
                                    value={record.docNumber}
                                    onChange={(e) => handle("docNumber")(e.target.value)}
                                    className={`col-span-9 w-full border-b bg-transparent py-1 text-sm outline-none ${rutError || errors?.docNumber ? "border-red-500" : "border-gray-300"}`}
                                    title={rutError ?? errors?.docNumber ?? ""}
                                    aria-invalid={!!(rutError || errors?.docNumber)}
                                    aria-describedby={rutError || errors?.docNumber ? "error-docNumber" : undefined}
                                    placeholder="12345678-9"
                                />
                                <div className="col-span-1">{errors?.docType && <p id="error-docType" className="mt-1 text-xs text-red-600">{errors.docType}</p>}</div>
                                <div className="col-span-9">{(rutError || errors?.docNumber) && <p id="error-docNumber" className="mt-1 text-xs text-red-600">{rutError ?? errors?.docNumber}</p>}</div>
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Email</span>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.mainEmail}
                                    onChange={(e) => handle("mainEmail")(e.target.value)}
                                    className={`w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.mainEmail ? "border-red-500" : "border-gray-300"}`}
                                    aria-invalid={!!errors?.mainEmail}
                                    aria-describedby={errors?.mainEmail ? "error-mainEmail" : undefined}
                                    placeholder="correo@dominio.cl"
                                />
                                {errors?.mainEmail && <p id="error-mainEmail" className="mt-1 text-xs text-red-600">{errors.mainEmail}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Teléfono</span>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.phone}
                                    onChange={(e) => handle("phone")(e.target.value)}
                                    className={`w-full border-b bg-transparent py-1 text-sm outline-none ${errors?.phone ? "border-red-500" : "border-gray-300"}`}
                                    aria-invalid={!!errors?.phone}
                                    aria-describedby={errors?.phone ? "error-phone" : undefined}
                                    placeholder="+56 9 1234 5678"
                                />
                                {errors?.phone && <p id="error-phone" className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Estado</span>
                            <div className="col-span-5">
                                <CollapsibleField inline label="" value={record.status ? "Activo" : "Inactivo"} options={["Activo", "Inactivo"]} onChange={(v) => onChange?.("status" as any, v === "Activo")} />
                            </div>
                        </div>
                    </Card>

                    <Card title="FACTURACIÓN Y PRECIOS" icon={ClipboardDocumentListIcon} hasTitleDivider noDefaultStyles className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            {/* partnerType oculto; fijo "P" en POST/PUT */}
                            <span className="col-span-1 text-sm font-bold text-gray-700">Group Code</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.groupCode == null ? "-" : String(record.groupCode)}
                                    options={["-", "100"]}
                                    onChange={(v) => onChange?.("groupCode" as any, v === "-" ? undefined : Number(v))}
                                />
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Group Num</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.groupNum == null ? "-" : String(record.groupNum)}
                                    options={["-", "1"]}
                                    onChange={(v) => onChange?.("groupNum" as any, v === "-" ? undefined : Number(v))}
                                />
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Plazo de pago</span>
                            <div className="col-span-5">
                                <CollapsibleField inline label="" value={String(record.payTermsGrpCode ?? 1)} options={["1"]} onChange={(v) => onChange?.("payTermsGrpCode" as any, Number(v))} />
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Moneda</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.currency || "-"}
                                    options={["-", "CLP"]}
                                    onChange={(v) => onChange?.("currency" as any, v === "-" ? "" : String(v))}
                                />
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Giros</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.notes || "-"}
                                    options={["-", "Particular"]}
                                    onChange={(v) => onChange?.("notes" as any, v === "-" ? undefined : String(v))}
                                />
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Listas</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="listNum"
                                    label=""
                                    value={record.listNum != null ? String(record.listNum) : ""}
                                    options={plVisible}
                                    searchQuery={plSearch}
                                    loading={plLoading}
                                    onSearch={setPlSearch}
                                    onChange={(val) => onChange?.("listNum" as any, val ? Number(val) : ("" as any))}
                                    placeholderFromDefault
                                />
                                {errors?.listNum && <p id="error-listNum" className="mt-1 text-xs text-red-600">{errors.listNum}</p>}
                            </div>
                        </div>
                    </Card>

                    <Card title="DIRECCIONES" icon={ClipboardDocumentListIcon} hasTitleDivider noDefaultStyles className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm font-bold text-gray-700">Facturación</span>
                            <div className="col-span-5 text-sm text-gray-800">
                                <span className="inline-block mr-2">Código: <b>B1</b></span>
                                <span className="inline-block">Nombre: <b>Facturación</b></span>
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Envío</span>
                            <div className="col-span-5 text-sm text-gray-800">
                                <span className="inline-block mr-2">Código: <b>S1</b></span>
                                <span className="inline-block">Nombre: <b>Envío</b></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-6 gap-4 mt-4">
                            <span className="col-span-1 text-sm font-bold text-gray-700">Calle</span>
                            <input disabled={readOnly} value={street} onChange={(e) => setCommonStreet(e.target.value)} className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none" />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Ciudad</span>
                            <input disabled={readOnly} value={city} onChange={(e) => setCommonCity(e.target.value)} className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none" />

                            <span className="col-span-1 text-sm font-bold text-gray-700">País</span>
                            <input disabled={readOnly} value={country} onChange={(e) => setCommonCountry(e.target.value)} className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none" />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Activa</span>
                            <div className="col-span-5">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" disabled={readOnly} checked={Boolean(active)} onChange={(e) => setCommonActive(e.target.checked)} />
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
                <div className="lg:col-span-3 space-y-6">
                    <Card title="USUARIO CREADOR" icon={UserIcon} hasTitleDivider noDefaultStyles className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-2 text-sm font-bold text-gray-700">Nombre</span>
                            <span className="col-span-4 text-sm text-gray-900">{record.created.name || "—"}</span>

                            <span className="col-span-2 text-sm font-bold text-gray-700">Fecha</span>
                            <span className="col-span-4 text-sm text-gray-900">{record.created.date || "—"}</span>
                        </div>
                    </Card>

                    <Card title="ÚLTIMA MODIFICACIÓN" icon={UserIcon} hasTitleDivider noDefaultStyles className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-2 text-sm font-bold text-gray-700">Nombre</span>
                            <span className="col-span-4 text-sm text-gray-900">{record.modified.name || "—"}</span>

                            <span className="col-span-2 text-sm font-bold text-gray-700">Fecha</span>
                            <span className="col-span-4 text-sm text-gray-900">{record.modified.date || "—"}</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ProveedorFields;
