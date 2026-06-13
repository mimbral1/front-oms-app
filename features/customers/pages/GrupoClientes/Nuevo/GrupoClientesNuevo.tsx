// views/Customers/GrupoClientes/Nuevo/Nuevo.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import {
    GrupoClientesFields,
    CustomerGroupRecord,
    CustomerGroupFieldErrors,
} from "@/features/customers/components/grupoclientes/GrupoClientesFields";
import { customerGroupCreate } from "@/app/fetchWithAuth/api-grupo-clientes/grupo-clientes";
import { toast } from "react-hot-toast";

/* ================================
 * Estado inicial
 * ================================ */

const initialRecord: CustomerGroupRecord = {
    groupCode: 0,
    groupName: "",
    partnerType: "C",
    isActive: true,
    created: { name: "—", date: "—" },
    modified: { name: "—", date: "—" },
};

export default function GrupoClientesNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<CustomerGroupRecord>({ ...initialRecord });

    const REQUIRED_FIELDS: (keyof CustomerGroupRecord)[] = ["groupCode", "groupName"];

    type TouchedMap = Partial<Record<keyof CustomerGroupRecord, boolean>>;

    const [fieldErrors, setFieldErrors] = useState<CustomerGroupFieldErrors>({});
    const [touched, setTouched] = useState<TouchedMap>({});
    const [submitted, setSubmitted] = useState(false);

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    const markTouched = <K extends keyof CustomerGroupRecord>(k: K) =>
        setTouched((prev) => ({ ...prev, [k]: true }));

    function validateRequired(rec: CustomerGroupRecord): CustomerGroupFieldErrors {
        const errs: CustomerGroupFieldErrors = {};
        for (const key of REQUIRED_FIELDS) {
            const val = rec[key] as any;
            const isEmpty =
                val == null ||
                (typeof val === "string" && !val.trim()) ||
                (typeof val === "number" && Number.isNaN(val)) ||
                (typeof val === "number" && val === 0);
            if (isEmpty) errs[key] = "Este campo es requerido";
        }
        return errs;
    }

    function mapApiErrorsToFields(err: any): CustomerGroupFieldErrors {
        const out: CustomerGroupFieldErrors = {};
        const src = err?.data?.errors ?? err?.response?.data?.errors ?? null;
        if (src && typeof src === "object") {
            for (const rawKey of Object.keys(src)) {
                const key = rawKey as keyof CustomerGroupRecord;
                out[key] = String(src[rawKey] ?? "Dato inválido");
            }
        }
        return out;
    }

    const handleChange = <K extends keyof CustomerGroupRecord>(
        field: K,
        value: CustomerGroupRecord[K]
    ) => {
        markTouched(field);
        setRecord((prev) => ({ ...prev, [field]: value }));

        if (REQUIRED_FIELDS.includes(field)) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                const v = value as any;
                const isEmpty =
                    v == null ||
                    (typeof v === "string" && !v.trim()) ||
                    (typeof v === "number" && Number.isNaN(v)) ||
                    (typeof v === "number" && v === 0);
                if (isEmpty) next[field] = "Este campo es requerido";
                else delete next[field];
                return next;
            });
        }
    };

    const doCreate = useCallback(async (): Promise<number | null> => {
        const current = recordRef.current;
        if (!current) return null;

        setSubmitted(true);

        const localErrs = validateRequired(current);
        if (Object.keys(localErrs).length) {
            setFieldErrors(localErrs);
            const firstKey = Object.keys(localErrs)[0];
            const el = document.getElementById(`error-${firstKey}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            toast.error("Revisa los campos requeridos antes de guardar");

            return null;
        }

        try {
            const res = await customerGroupCreate(
                {
                    groupCode: Number(current.groupCode),
                    groupName: current.groupName.trim(),
                    partnerType: current.partnerType || "C",
                    isActive: Boolean(current.isActive),
                },
                { onConflict: "error" }
            );

            const createdList: number[] = Array.isArray(res?.created) ? res.created : [];
            const newCode = createdList[0] ?? current.groupCode;

            //  mensaje de éxito (si te quedas en la página con "Guardar & Crear nuevo" lo ves)
            toast.success(`Grupo de clientes ${newCode} creado correctamente`);

            return Number(newCode);
        } catch (e: any) {
            console.error("Error creando grupo de clientes:", e);
            const apiErrs = mapApiErrorsToFields(e);
            if (Object.keys(apiErrs).length) {
                setFieldErrors(apiErrs);
            }

            //  sin alert, solo badge en header
            toast.error(
                e?.response?.data?.message ||
                e?.message ||
                "No se pudo crear el grupo de clientes."
            );

            return null;
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
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: async () => {
                    const newId = await doCreate();
                    if (!newId) return;
                    // Por ahora volvemos al listado
                    router.push("/customers/grupo-clientes");
                },
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
                onClick: async () => {
                    const newId = await doCreate();
                    if (!newId) return;
                    setRecord({ ...initialRecord });
                    setFieldErrors({});
                    setTouched({});
                    setSubmitted(false);
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/customers/grupo-clientes"),
            },
        ],
        [router, doCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Grupo de clientes
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    const errorsForUI: CustomerGroupFieldErrors = useMemo(() => {
        const out: CustomerGroupFieldErrors = {};
        for (const k of Object.keys(fieldErrors) as (keyof CustomerGroupRecord)[]) {
            if (submitted || touched[k]) out[k] = fieldErrors[k]!;
        }
        return out;
    }, [fieldErrors, submitted, touched]);

    return (
        <div className="p-6 bg-white">
            <GrupoClientesFields
                record={record}
                readOnly={false}
                canEditCode={true}
                onChange={handleChange}
                errors={errorsForUI}
            />
        </div>
    );
}
