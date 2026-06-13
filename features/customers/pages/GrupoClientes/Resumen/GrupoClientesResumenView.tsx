// views/Customers/GrupoClientes/Resumen/Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import {
  GrupoClientesFields,
  CustomerGroupRecord,
  CustomerGroupFieldErrors,
} from "@/features/customers/components/grupoclientes/GrupoClientesFields";
import {
  customerGroupGet,
  customerGroupUpdate,
  type CustomerGroupDTO,
} from "@/app/fetchWithAuth/api-grupo-clientes/grupo-clientes";
import { toast } from "react-hot-toast";

/* ================================
 * Mapeo API -> UI
 * ================================ */

function mapDtoToRecord(dto: CustomerGroupDTO): CustomerGroupRecord {
  return {
    groupCode: dto.GroupCode,
    groupName: dto.GroupName ?? "",
    partnerType: dto.PartnerType ?? "C",
    isActive: dto.IsActive,
    created: {
      name: "—",
      date: dto.CreatedAt ? new Date(dto.CreatedAt).toLocaleString("es-CL") : "—",
    },
    modified: {
      name: "—",
      date: dto.UpdatedAt ? new Date(dto.UpdatedAt).toLocaleString("es-CL") : "—",
    },
  };
}

/* ================================
 * Página Resumen Grupo de Clientes
 * ================================ */

export default function GrupoClientesResumenView() {
  const router = useRouter();
  const { id } = useParams();
  if (!id) throw new Error("ID de grupo de clientes no especificado en la ruta");

  const recordId = Array.isArray(id) ? id[0] : id;
  const groupCode = Number(recordId);

  const [record, setRecord] = useState<CustomerGroupRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // errores
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<CustomerGroupFieldErrors>({});

  const REQUIRED_FIELDS: (keyof CustomerGroupRecord)[] = ["groupCode", "groupName"];

  const recordRef = useRef<CustomerGroupRecord | null>(null);
  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  // cargar detalle
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!groupCode) {
        if (mounted) {
          setError("Código de grupo de clientes no proporcionado.");
          setLoading(false);
        }
        return;
      }

      if (!mounted) return;

      setLoading(true);
      setError(null);

      try {
        const dto = await customerGroupGet(groupCode);
        if (!mounted) return;
        setRecord(mapDtoToRecord(dto));
      } catch (err: any) {
        console.error("Error al cargar grupo de clientes:", err);
        if (!mounted) return;
        toast.error("Error al cargar el grupo de clientes");
        setRecord(null);

      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [groupCode]);


  const handleChange = <K extends keyof CustomerGroupRecord>(
    field: K,
    value: CustomerGroupRecord[K]
  ) => {
    setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    // limpiar error del campo al modificarlo
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (next[field]) delete next[field];
      return next;
    });
  };

  function validateBeforeSave(rec: CustomerGroupRecord): CustomerGroupFieldErrors {
    const errs: CustomerGroupFieldErrors = {};
    for (const k of REQUIRED_FIELDS) {
      const v = rec[k] as any;
      const isEmpty =
        v == null ||
        (typeof v === "string" && !v.trim()) ||
        (typeof v === "number" && Number.isNaN(v));
      if (isEmpty) {
        errs[k] = "Este campo es requerido";
      }
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

    setSaving(true);
    try {
      const dto = await customerGroupUpdate(r.groupCode, {
        groupCode: r.groupCode,
        groupName: r.groupName,
        partnerType: r.partnerType || "C",
        isActive: r.isActive,
      });

      //  mensaje de éxito en el header
      toast.success(`Grupo de clientes ${dto.GroupCode} actualizado correctamente`);

    } catch (e: any) {
      console.error("Error al actualizar grupo de clientes:", e);
      const apiErrs = mapApiErrorsToFields(e);
      if (Object.keys(apiErrs).length) {
        setFieldErrors(apiErrs);
      }

      //  nada de alert, solo badge en header
      toast.error(
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo guardar los cambios del grupo de clientes."
      );

    } finally {
      setSaving(false);
    }
  }, []);


  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: saving ? (
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
        ) : (
          <CheckCircleIcon className="h-5 w-5" />
        ),
        onClick: handleApply,
        disabled: saving,
      },
      {
        label: "Guardar",
        variant: "success",
        icon: saving ? (
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
        ) : (
          <SaveOutlined className="h-4 w-4" />
        ),
        onClick: async () => {
          await handleApply();
          router.push("/customers/grupo-clientes");
        },
        disabled: saving,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/customers/grupo-clientes"),
        disabled: saving,
      },
    ],
    [router, handleApply, saving]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Grupo de clientes
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {record
              ? record.groupName || `Grupo ${record.groupCode}`
              : "Resumen"}
          </div>
        </div>
      ),
      action: headerActions,
      status: saving
        ? { text: "Guardando…", variant: "info" }
        : record
          ? {
            text: record.isActive ? "Activo" : "Inactivo",
            variant: record.isActive ? "success" : "warning",
          }
          : undefined,
    } as PageHeaderProps),
    [headerActions, saving, record?.isActive, record?.groupName, record?.groupCode]
  );

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center py-10">
        <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin text-gray-500" />
        <span className="text-gray-500">Cargando…</span>
      </div>
    );
  }


  if (!record) {
    return (
      <p className="p-4 text-center text-gray-500">
        Grupo de clientes no encontrado o no disponible.
      </p>
    );
  }

  return (
    <div className="p-6 bg-white">
      <GrupoClientesFields
        record={record}
        readOnly={false}
        canEditCode={false}
        onChange={handleChange}
        errors={fieldErrors}
      />
    </div>
  );
}
