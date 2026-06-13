// app/customers/proveedores/[id]/page.tsx
"use client";

/*
Estructura/acciones basadas en SalesChannelsResumenView:
*/

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { ProveedorFields, ProveedorRecord } from "@/features/almacenes/components/gestion/proveedores/ProveedorFields";
import {
    customerGet, customerUpdate, type CustomerDTO,
    customerAddressesGet, customerAddressesPut
} from "@/app/fetchWithAuth/api-clientes/clientes/customers";
import { isRutValid, formatRut } from "@/features/customers/components/clientes/utils-rut";

type FieldErrors = Partial<Record<keyof ProveedorRecord, string>>;

/* ---------- map DTO -> UI ---------- */
function mapDtoToRecord(dto: CustomerDTO): ProveedorRecord {
    const street = dto.Address ?? "";
    const city = dto.City ?? "";
    const country = dto.Country ?? "CL";
    return {
        id: dto.Id,
        firstName: dto.FirstName ?? "",
        lastName: dto.LastName ?? "",
        docType: "RUT",
        docNumber: dto.RUT ?? "",
        mainEmail: dto.Email ?? "",
        phone: dto.Phone ?? "",
        status: dto.IsActive,
        created: { name: "—", date: dto.CreatedAt ? new Date(dto.CreatedAt).toLocaleString("es-CL") : "—" },
        modified: { name: "—", date: dto.UpdatedAt ? new Date(dto.UpdatedAt).toLocaleString("es-CL") : "—" },

        partnerType: (dto as any).PartnerType ?? "P",
        groupCode: dto.GroupCode ?? undefined,
        groupNum: dto.GroupNum ?? undefined,
        payTermsGrpCode: (dto as any).PayTermsGrpCode ?? 1,
        currency: (dto.Currency ?? "") as string,
        notes: (dto as any).Notes ?? undefined,
        listNum: dto.ListNum ?? (undefined as unknown as number),

        addressBilling: { code: "B1", name: "Facturación", street, city, country, isActive: true },
        addressShipping: { code: "S1", name: "Envío", street, city, country, isActive: true },
        addressStreet: street,
        addressCity: city,
        addressCountry: country,
        addressActive: true,
    };
}

/* ---------- snapshot & diffs ---------- */
function snapshotFromRecord(r: ProveedorRecord) {
    const general = {
        firstName: r.firstName || "",
        lastName: r.lastName || "",
        email: r.mainEmail || "",
        phone: r.phone || "",
        rut: r.docNumber || "",
        isActive: r.status || "",
        groupCode: r.groupCode || "",
        groupNum: r.groupNum || "",
        currency: r.currency || "",
        listNum: r.listNum || "",
        notes: r.notes || "",
        PayTermsGrpCode: r.payTermsGrpCode || "",
        partnerType: r.partnerType || "P",
    };

    const street = r.addressStreet || r.addressBilling.street || r.addressShipping.street || "";
    const city = r.addressCity || r.addressBilling.city || r.addressShipping.city || "";
    const country = r.addressCountry || r.addressBilling.country || r.addressShipping.country || "CL";
    const active = Boolean(r.addressActive ?? r.addressBilling.isActive ?? r.addressShipping.isActive ?? true);

    const B = { CustomerId: r.id, AddressCode: r.addressBilling.code || "B1", AddressName: r.addressBilling.name || "Facturación", AddressType: "B", Street: street, City: city, Country: country, IsActive: active };
    const S = { CustomerId: r.id, AddressCode: r.addressShipping.code || "S1", AddressName: r.addressShipping.name || "Envío", AddressType: "S", Street: street, City: city, Country: country, IsActive: active };

    return { general, addresses: [B, S] };
}

const isEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
function toCanonicalAddr(a: any) {
    return {
        addressCode: a?.addressCode ?? a?.AddressCode ?? "",
        addressName: a?.addressName ?? a?.AddressName ?? "",
        addressType: (a?.addressType ?? a?.AddressType ?? "").toUpperCase(),
        street: a?.street ?? a?.Street ?? "",
        city: a?.city ?? a?.City ?? "",
        country: a?.country ?? a?.Country ?? "",
        isActive: (a?.isActive ?? a?.IsActive ?? true) as boolean,
    };
}
function pickChangedFields(prev: Record<string, any> | null, curr: Record<string, any>) {
    if (!prev) {
        const out: Record<string, any> = {};
        Object.keys(curr).forEach(k => { const v = (curr as any)[k]; if (v !== undefined && v !== null) out[k] = v; });
        return out;
    }
    const out: Record<string, any> = {};
    Object.keys(curr).forEach(k => {
        const cv = (curr as any)[k];
        const pv = (prev as any)[k];
        if (!isEqual(cv, pv) && cv !== undefined && cv !== null) out[k] = cv;
    });
    return out;
}
function pickChangedAddresses(prev: any[] | null, curr: any[]) {
    const prevCanon = (prev ?? []).map(toCanonicalAddr);
    const currCanon = (curr ?? []).map(toCanonicalAddr);
    const byCode = (arr: any[], code: string) => arr.find(a => (a.addressCode ?? "").toUpperCase() === code.toUpperCase());
    const byType = (arr: any[], type: "B" | "S") => arr.find(a => (a.addressType ?? "").toUpperCase() === type);
    const Bprev = byCode(prevCanon, "B1") || byType(prevCanon, "B");
    const Sprev = byCode(prevCanon, "S1") || byType(prevCanon, "S");
    const Bcurr = byCode(currCanon, "B1") || byType(currCanon, "B");
    const Scurr = byCode(currCanon, "S1") || byType(currCanon, "S");
    const changed: any[] = [];
    if (!isEqual(Bprev, Bcurr) && Bcurr) changed.push(Bcurr);
    if (!isEqual(Sprev, Scurr) && Scurr) changed.push(Scurr);
    return changed;
}

/* ---------- Página ---------- */
export default function ProveedorResumenView() {
    const router = useRouter();
    const { id } = useParams();
    if (!id) throw new Error("ID de proveedor no especificado en la ruta");
    const recordId: string = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<ProveedorRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [rutError, setRutError] = useState<string | null>(null);

    const REQUIRED_FIELDS: (keyof ProveedorRecord)[] = ["firstName", "lastName", "docType", "docNumber", "phone"];
    function validateBeforeSave(rec: ProveedorRecord): FieldErrors {
        const errs: FieldErrors = {};
        for (const k of REQUIRED_FIELDS) {
            const v = (rec[k] ?? "") as unknown as string;
            if (typeof v === "string" && !v.trim()) errs[k] = "Este campo es requerido";
        }
        return errs;
    }

    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    const lastSavedRef = useRef<{ general: any; addresses: any[] } | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const dto = await customerGet(recordId);
                if (!mounted) return;
                setRecord(mapDtoToRecord(dto));

                try {
                    const addrs = await customerAddressesGet(recordId);
                    const canon = (addrs ?? []).map(toCanonicalAddr);
                    const b = canon.find((a: { addressType: string; }) => a.addressType === "B") || canon.find((a: { addressCode: any; }) => (a.addressCode ?? "").toUpperCase() === "B1");
                    const s = canon.find((a: { addressType: string; }) => a.addressType === "S") || canon.find((a: { addressCode: any; }) => (a.addressCode ?? "").toUpperCase() === "S1");
                    if (mounted) {
                        setRecord(prev => {
                            if (!prev) return prev;
                            const street = b?.street ?? s?.street ?? prev.addressBilling.street ?? "";
                            const city = b?.city ?? s?.city ?? prev.addressBilling.city ?? "";
                            const country = b?.country ?? s?.country ?? prev.addressBilling.country ?? "CL";
                            const active = (b?.isActive ?? s?.isActive ?? true) as boolean;
                            return {
                                ...prev,
                                addressBilling: { code: b?.addressCode ?? "B1", name: b?.addressName ?? "Facturación", street: b?.street ?? street ?? "", city: b?.city ?? city ?? "", country: b?.country ?? country ?? "CL", isActive: b?.isActive ?? active ?? true },
                                addressShipping: { code: s?.addressCode ?? "S1", name: s?.addressName ?? "Envío", street: s?.street ?? street ?? "", city: s?.city ?? city ?? "", country: s?.country ?? country ?? "CL", isActive: s?.isActive ?? active ?? true },
                                addressStreet: street ?? "", addressCity: city ?? "", addressCountry: country ?? "CL", addressActive: Boolean(active),
                            };
                        });
                    }
                } catch (e) {
                    console.error("No se pudieron cargar direcciones del proveedor:", e);
                }

                const f = formatRut(dto.RUT ?? "");
                setRecord((prev) => prev ? { ...prev, docNumber: f } : prev);
                setRutError(f && isRutValid(f) ? null : "RUT inválido");
            } catch (e) {
                console.error(e);
                setRecord(null);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [recordId]);

    useEffect(() => {
        if (!loading && record && !lastSavedRef.current) {
            lastSavedRef.current = snapshotFromRecord(record);
        }
    }, [loading, record]);

    const handleChange = <K extends keyof ProveedorRecord>(field: K, value: ProveedorRecord[K]) => {
        if (!record) return;
        if (field === "docNumber") {
            setRecord({ ...record, docNumber: String(value ?? "") });
            setRutError(null);
        } else {
            setRecord({ ...record, [field]: value });
        }
    };

    useEffect(() => {
        if (!record) return;
        const v = record.docNumber ?? "";
        const t = setTimeout(() => {
            if (!v.trim()) { setRutError("RUT requerido"); return; }
            const maybeFormatted = formatRut(v);
            setRutError(isRutValid(maybeFormatted) ? null : "RUT inválido");
        }, 400);
        return () => clearTimeout(t);
    }, [record?.docNumber]);

    const handleApply = useCallback(async () => {
        if (!recordRef.current) return;
        const r = recordRef.current;

        const localErrs = validateBeforeSave(r);
        if (Object.keys(localErrs).length) {
            setFieldErrors(localErrs);
            const firstKey = Object.keys(localErrs)[0];
            const el = document.getElementById(`error-${firstKey}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        setSaving(true); setFieldErrors({});
        try {
            const snap = snapshotFromRecord(r);
            const prev = lastSavedRef.current;

            const patchPayload = pickChangedFields(prev?.general ?? null, snap.general);
            if (Object.keys(patchPayload).length) await customerUpdate(r.id, patchPayload);

            const changedAddrs = pickChangedAddresses(prev?.addresses ?? null, snap.addresses);
            for (const addr of changedAddrs) await customerAddressesPut(r.id, addr);

            lastSavedRef.current = snapshotFromRecord(r);
        } catch (e) {
            console.error("Error en Aplicar (proveedor):", e);
            alert("No se pudo aplicar los cambios.");
        } finally {
            setSaving(false);
        }
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: async () => { await handleApply(); },
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: async () => { await handleApply(); router.push(`/almacen/gestion/proveedores/`); },
                disabled: saving,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/almacen/gestion/proveedores"), disabled: saving },
        ],
        [router, handleApply, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Proveedores</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {record ? `${record.firstName} ${record.lastName}`.trim() || "Resumen" : "Resumen"}
                    </div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : record
                    ? { text: record.status ? "Activo" : "Inactivo", variant: record.status ? "success" : "warning" }
                    : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, record?.status, record?.firstName, record?.lastName]
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró el proveedor.</div>;

    return (
        <div className="p-6 bg-white">
            <ProveedorFields
                record={record}
                readOnly={false}
                onChange={handleChange}
                rutError={rutError}
                errors={fieldErrors}
            />
        </div>
    );
}
