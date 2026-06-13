// app/customers/proveedores/nuevo/page.tsx
"use client";

/*
Estructura/acciones basadas en SalesChannelsNuevoView:
:contentReference[oaicite:1]{index=1}
*/

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, DocumentPlusIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { ProveedorFields, ProveedorRecord } from "@/features/almacenes/components/gestion/proveedores/ProveedorFields";
import { customerCreate } from "@/app/fetchWithAuth/api-clientes/clientes/customers";
import { isRutValid, formatRut, cleanRut, computeDV } from "@/features/customers/components/clientes/utils-rut";

/* ================================
 * Estado inicial (alineado con ProveedorFields)
 * ================================ */
const initialRecord: ProveedorRecord = {
    id: "",
    firstName: "",
    lastName: "",
    docType: "RUT",
    docNumber: "",
    mainEmail: "",
    phone: "",
    status: false,
    created: { name: "—", date: "—" },
    modified: { name: "—", date: "—" },
    isNew: true,

    // comerciales
    partnerType: "P",
    groupCode: 100,
    groupNum: 1,
    payTermsGrpCode: 1,
    currency: "CLP",
    notes: "Particular",
    listNum: undefined as unknown as number, // el usuario debe elegir “Listas” (ListNum) en el select

    // direcciones fijas (códigos/nombres) + comunes
    addressBilling: {
        code: "B1",
        name: "Facturación",
        street: "",
        city: "",
        country: "CL",
        isActive: true,
    },
    addressShipping: {
        code: "S1",
        name: "Envío",
        street: "",
        city: "",
        country: "CL",
        isActive: true,
    },
    addressStreet: "",
    addressCity: "",
    addressCountry: "CL",
    addressActive: true,
};

function deriveIdFromRut(rut?: string) {
    if (!rut) return "";
    const { base } = cleanRut(rut); // cuerpo sin DV
    return base ? `${base}P` : "";
}

export default function ProveedorNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<ProveedorRecord>({ ...initialRecord });

    // Campos requeridos en el formulario
    const REQUIRED_FIELDS: (keyof ProveedorRecord)[] = [
        "firstName",
        "lastName",
        "docType",
        "docNumber",
        "phone",
        "listNum",
    ];

    // Errores por campo y “tocado” por campo para controlar cuándo mostrar rojo
    type FieldErrors = Partial<Record<keyof ProveedorRecord, string>>;
    type TouchedMap = Partial<Record<keyof ProveedorRecord, boolean>>;

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [touched, setTouched] = useState<TouchedMap>({});
    const [submitted, setSubmitted] = useState(false); // para mostrar errores tras intentar guardar

    function validateRequired(rec: ProveedorRecord): FieldErrors {
        const errs: FieldErrors = {};
        for (const key of REQUIRED_FIELDS) {
            const val = rec[key];
            if (key === "listNum") {
                const n = Number(val);
                if (!Number.isFinite(n) || n <= 0) errs[key] = "Este campo es requerido";
                continue;
            }
            const isEmpty =
                val == null ||
                (typeof val === "string" && !val.trim());
            if (isEmpty) errs[key] = "Este campo es requerido";
        }
        return errs;
    }

    // mapear errores de API a campos
    function mapApiErrorsToFields(err: any): FieldErrors {
        const out: FieldErrors = {};
        const errors = err?.response?.data?.errors ?? err?.errors ?? null;
        if (errors && typeof errors === "object") {
            for (const rawKey of Object.keys(errors)) {
                const key =
                    ({
                        apellido: "lastName",
                        last_name: "lastName",
                        firstname: "firstName",
                        first_name: "firstName",
                        doc_type: "docType",
                        rut: "docNumber",
                        phone: "phone",
                        listnum: "listNum",
                        list_num: "listNum",
                        listNum: "listNum",
                    } as Record<string, keyof ProveedorRecord>)[rawKey] ?? (rawKey as keyof ProveedorRecord);
                out[key] = String(errors[rawKey] ?? "Dato inválido");
            }
        }
        return out;
    }

    // Helpers para marcar touched
    const markTouched = <K extends keyof ProveedorRecord>(k: K) =>
        setTouched((t) => ({ ...t, [k]: true }));

    // para manejar errores en el rut 
    const [rutError, setRutError] = useState<string | null>(null);

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    // 1) handler: NO formatea ni valida por tecla
    const handleChange = <K extends keyof ProveedorRecord>(field: K, value: ProveedorRecord[K]) => {
        // marcar touched al escribir
        markTouched(field);

        if (field === "docNumber") {
            const raw = String(value ?? "");
            setRecord(prev => ({ ...prev, docNumber: raw })); // ↍ solo guarda lo escrito

            // validar requerido en vivo (sin alert) para pintar línea roja si corresponde
            setFieldErrors(prev => {
                const next = { ...prev };
                if (!raw.trim()) next.docNumber = "Este campo es requerido";
                else delete next.docNumber;
                return next;
            });

            setRutError(null); // no muestres error de RUT mientras escribe
        } else {
            // otros campos
            setRecord(prev => ({ ...prev, [field]: value }));

            // requerido en vivo
            if (REQUIRED_FIELDS.includes(field)) {
                setFieldErrors(prev => {
                    const next = { ...prev };
                    if (field === "listNum") {
                        const n = Number(value);
                        if (!Number.isFinite(n) || n <= 0) next[field] = "Este campo es requerido";
                        else delete next[field];
                        return next;
                    }
                    const asStr = typeof value === "string" ? value : String(value ?? "");
                    if (!asStr.trim()) next[field] = "Este campo es requerido";
                    else delete next[field];
                    return next;
                });
            }
        }
    };

    // 2) debounce para validar RUT sin tocar record
    useEffect(() => {
        const v = record.docNumber ?? "";
        const t = setTimeout(() => {
            // Solo validar/pintar si el usuario ya interactuó o intentó enviar
            if (!(touched.docNumber || submitted)) return;

            if (!v.trim()) {
                setFieldErrors(prev => ({ ...prev, docNumber: "Este campo es requerido" }));
                return;
            }
            const maybeFormatted = formatRut(v);
            const ok = isRutValid(maybeFormatted);
            setRutError(ok ? null : "RUT inválido");
            setFieldErrors(prev => {
                const next = { ...prev };
                if (!ok) next.docNumber = "RUT inválido";
                else delete next.docNumber;
                return next;
            });
        }, 400); // pausa 'humana'
        return () => clearTimeout(t);
         
    }, [record.docNumber, touched.docNumber, submitted]);

    /* ================================
     * Crear (POST /customers)
     * ================================ */
    const doCreate = useCallback(async (): Promise<string | null> => {
        const r = recordRef.current;
        if (!r) return null;

        // activar modo "intenté guardar" para que muestre errores
        setSubmitted(true);

        // 1) Requeridos vacíos
        const reqErrs = validateRequired(r);

        // 2) RUT inválido -> error de campo, sin throw
        if (!r.docNumber || !isRutValid(formatRut(r.docNumber))) {
            reqErrs.docNumber = reqErrs.docNumber || "RUT inválido";
            setRutError("RUT inválido");
        } else {
            setRutError(null);
        }

        // Si hay errores, setear y NO postear
        if (Object.keys(reqErrs).length > 0) {
            setFieldErrors(reqErrs);
            // (opcional) scroll al primer error
            const firstKey = Object.keys(reqErrs)[0] as keyof ProveedorRecord;
            const el = document.getElementById(`error-${String(firstKey)}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            return null; // no posteamos
        }

        // id desde RUT base + "P"
        const id = (r.id?.trim() || deriveIdFromRut(r.docNumber));
        if (!id) {
            setFieldErrors(prev => ({ ...prev, docNumber: "Este campo es requerido" }));
            return null;
        }

        // Dirección común -> duplicar en B1 y S1
        const street = r.addressStreet || r.addressBilling.street || r.addressShipping.street || "";
        const city = r.addressCity || r.addressBilling.city || r.addressShipping.city || "";
        const country = r.addressCountry || r.addressBilling.country || r.addressShipping.country || "CL";
        const active = Boolean(r.addressActive ?? true);

        // Normalizar y formatear RUT ANTES de enviar (base-dv)
        const { base: rutBase, dv: rutDv } = cleanRut(r.docNumber || "");
        const rutFmt = rutBase ? `${rutBase}-${rutDv || computeDV(rutBase)}` : undefined;
        const listNum = Number(r.listNum);

        if (!Number.isFinite(listNum) || listNum <= 0) {
            setFieldErrors(prev => ({ ...prev, listNum: "Este campo es requerido" }));
            return null;
        }

        try {
            await customerCreate({
                id,
                partnerType: r.partnerType || "P",
                rut: rutFmt, // ↍ "base-dv"
                firstName: r.firstName,
                lastName: r.lastName,
                email: r.mainEmail || undefined,

                groupCode: r.groupCode ?? 100,
                groupNum: r.groupNum ?? 1,
                PayTermsGrpCode: r.payTermsGrpCode ?? 1,
                currency: r.currency || "CLP",
                notes: r.notes || "Particular",
                listNum, // viene del SelectSearchInline “Listas”

                addresses: [
                    {
                        addressCode: "B1",
                        addressName: "Facturación",
                        addressType: "B",
                        street, city, country,
                        isActive: active,
                    },
                    {
                        addressCode: "S1",
                        addressName: "Envío",
                        addressType: "S",
                        street, city, country,
                        isActive: active,
                    },
                ],
            });
            return id;
        } catch (err: any) {
            const mapped = mapApiErrorsToFields(err);
            if (Object.keys(mapped).length) {
                setFieldErrors(mapped);
                return null;
            }
            throw err;
        }
    }, []);

    /* ================================
     * Header actions
     * ================================ */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: async () => {
                    try {
                        const newId = await doCreate();
                        if (!newId) return;
                        router.push(`/almacen/gestion/proveedores/`);
                    } catch (e: any) {
                        console.error(e);
                        alert(e?.message || "No se pudo crear el proveedor.");
                    }
                },
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                icon: <DocumentPlusIcon className="h-5 w-5" />,
                onClick: async () => {
                    try {
                        const newId = await doCreate();
                        if (!newId) return;
                        setRecord({ ...initialRecord });
                        setFieldErrors({});
                        setTouched({});
                        setSubmitted(false);
                        setRutError(null);
                    } catch (e: any) {
                        console.error(e);
                        alert(e?.message || "No se pudo crear el proveedor.");
                    }
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/gestion/proveedores"),
            },
        ],
        [router, doCreate]
    );

    usePageHeader(
        () =>
        ({
            title: "Proveedores",
            description: "Nuevo",
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    /* ================================
     * Render
     * ================================ */
    const errorsForUI: FieldErrors = useMemo(() => {
        const out: FieldErrors = {};
        for (const k of Object.keys(fieldErrors) as (keyof ProveedorRecord)[]) {
            if (submitted || touched[k]) out[k] = fieldErrors[k]!;
        }
        return out;
    }, [fieldErrors, submitted, touched]);

    return (
        <div className="p-6 bg-white">
            <ProveedorFields
                record={record}
                readOnly={false}
                onChange={handleChange}
                rutError={submitted || touched.docNumber ? rutError : null}
                errors={errorsForUI}
            />
        </div>
    );
}
