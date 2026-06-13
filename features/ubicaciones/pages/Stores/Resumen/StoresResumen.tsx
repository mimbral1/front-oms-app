// views\Ubicaciones\Stores\components\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { StoreFields, StoreRecord } from "@/features/ubicaciones/components/stores/StoreFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";

type AuthUserLike = { id?: number | string } | null | undefined;

type StoreApiData = {
    Id?: number | string;
    CompanyId?: number;
    CompanyName?: string;
    Name?: string;
    Email?: string;
    PhoneNumber?: string;
    Status?: number | boolean;
    CreatedAt?: string;
    UpdatedAt?: string;
};

type StoreDetailResponse = { ok: boolean; data: StoreApiData };
type SaveStoreBody = {
    Name: string;
    Email: string;
    PhoneNumber: string;
    Status: number;
    UserModified: number;
    CompanyId?: number;
};

const toUserId = (user: AuthUserLike): number => {
    if (!user) return 0;
    const parsed = Number(user.id);
    return Number.isFinite(parsed) ? parsed : 0;
};

const errorPayload = (err: unknown): unknown => {
    if (err && typeof err === "object" && "payload" in err) {
        return (err as { payload?: unknown }).payload ?? err;
    }
    return err;
};

/* ---------- estado inicial (solo para tipado) ---------- */
const EMPTY: StoreRecord = {
    id: "",
    name: "",
    email: "",
    phone: "",
    status: "Activo",
    created: { username: "—", email: "—", date: "—" },
};

export default function StoreResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();

    const [record, setRecord] = useState<StoreRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* Mantener refs estables para evitar loops en header */
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    /* ---------- cargar detalle desde la API ---------- */
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                const res = await fetchWithAuth<StoreDetailResponse>(
                    `comerce-service/store/${recordId}`
                );
                if (!mounted) return;
                const a = res?.data || {};

                const mapped: StoreRecord = {
                    id: String(a?.Id ?? recordId ?? ""),
                    companyId: typeof a?.CompanyId === "number" ? a.CompanyId : undefined,
                    companyName: a?.CompanyName ?? undefined,
                    name: a?.Name ?? "",
                    email: a?.Email ?? "",
                    phone: a?.PhoneNumber ?? "",
                    status: a?.Status ? "Activo" : "Inactivo",
                    created: {
                        username: "", // si luego hay endpoint de usuarios, lo traemos
                        email: "",
                        date: a?.CreatedAt ? new Date(a.CreatedAt).toLocaleString("es-CL") : "—",
                    },
                    modified: {
                        username: "",
                        email: "",
                        date: a?.UpdatedAt ? new Date(a.UpdatedAt).toLocaleString("es-CL") : "—",
                    },
                };

                setRecord(mapped);
            } catch (err) {
                console.error("Error cargando store:", errorPayload(err));
                setRecord({ ...EMPTY, id: String(recordId ?? "") });
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (recordId) load();
        return () => { mounted = false; };
    }, [recordId, fetchWithAuth]);

    /* ---------- handlers ---------- */
    const handleChange = <K extends keyof StoreRecord>(field: K, value: StoreRecord[K]) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    // Guarda 
    const handleSave = useCallback(async (): Promise<boolean> => {
        const current = recordRef.current as StoreRecord | null;
        const currentUser = userRef.current as AuthUserLike;
        if (!current) return false;

        const body: SaveStoreBody = {
            Name: current.name,
            Email: current.email,
            PhoneNumber: current.phone,
            Status: current.status === "Activo" ? 1 : 0,
            UserModified: toUserId(currentUser),
        };
        if (typeof current.companyId === "number") {
            body.CompanyId = current.companyId;
        }

        setSaving(true);
        try {
            await fetchWithAuth<{ ok: boolean; message?: string }>(
                `comerce-service/store/${current.id}`,
                { method: "PUT", body: JSON.stringify(body) }
            );
            return true;
        } catch (err) {
            console.error("Error al guardar tienda:", errorPayload(err));
            return false;
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth]);

    // “Aplicar” = guarda y se queda. “Guardar” = guarda y vuelve al listado.
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: async () => { await handleSave(); },
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: async () => {
                    const ok = await handleSave();
                    if (ok) router.push("/ubicaciones/stores"); // <- vuelve al listado
                },
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/ubicaciones/stores"),
                disabled: saving,
            },
        ],
        [router, handleSave, saving]
    );


    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Stores</div>
                    <div className="text-2xl font-semibold text-gray-900">Store #{id}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : record
                    ? { text: record.status, variant: record.status === "Activo" ? "success" : "warning" }
                    : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, record?.status]
    );

    /* ---------- render ---------- */
    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró la store.</div>;

    return (
        <div className="p-6 bg-white">
            {/* En Resumen NO pasamos isCreate, así se muestran tarjetas de usuario */}
            <StoreFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
