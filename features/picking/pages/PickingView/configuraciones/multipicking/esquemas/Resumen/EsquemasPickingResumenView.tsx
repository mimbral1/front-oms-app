// views\PickingView\configuraciones\multipicking\esquemas\Resumen\EsquemasPickingResumenView.tsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { toast } from "react-hot-toast";

import { EsquemasPickingFields, type PickingScheme } from "@/features/picking/components/pickingview/configuraciones/multipicking/esquemas/EsquemasPickingFields";
import { useApiEsquemasPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/esquemas-picking/api-esquemas-picking";
import { useAuth } from "@/app/context/auth/AuthContext";

export default function EsquemasPickingResumenView() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { user } = useAuth();
  const { getPickingSchemaById, updatePickingSchema } =
    useApiEsquemasPicking();

  const [record, setRecord] = useState<PickingScheme | null>(null);
  const recordRef = useRef<PickingScheme | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* ===============================
     Mantener ref sincronizada
  =============================== */
  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  /* ===============================
     LOAD (idéntico a Sectores)
  =============================== */
  const load = async () => {
    if (!id) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await getPickingSchemaById(id);
      const data = res.data;

      setRecord({
        id: data.id,
        nombre: data.name,
        pickingZones: data.pickingZoneIds ?? [],
        default: Boolean(data.isDefault),
        estado: data.isActive ? "Activo" : "Inactivo",

        created: data.userCreatedProfile
          ? {
            username: `${data.userCreatedProfile.nombres} ${data.userCreatedProfile.apellidos}`,
            email: data.userCreatedProfile.email ?? "—",
            avatar: data.userCreatedProfile.urlImagenPerfil ?? undefined,
            date: data.dateCreatedCL,
          }
          : undefined,

        modified: data.userModifiedProfile
          ? {
            username: `${data.userModifiedProfile.nombres} ${data.userModifiedProfile.apellidos}`,
            email: data.userModifiedProfile.email ?? "—",
            avatar: data.userModifiedProfile.urlImagenPerfil ?? undefined,
            date: data.dateModifiedCL,
          }
          : undefined,
      });
    } catch (e: any) {
      console.error("Error cargando esquema:", e);
      setErrorMessage(
        e?.message || "No se pudo cargar el esquema de picking."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  /* ===============================
     GUARDAR (PATCH)
  =============================== */
  const handleSave = async (goBack = false) => {
    const current = recordRef.current;
    if (!current || !id) return;

    setSaving(true);

    try {
      await updatePickingSchema(String(id), {
        name: current.nombre,
        isDefault: current.default,
        status: current.estado === "Activo" ? "active" : "inactive",
        pickingZoneIds: current.pickingZones,
        userModified: Number(user?.id),
      });

      toast.success("Esquema de picking actualizado correctamente");

      await load();

      if (goBack) {
        router.push("/picking/configuraciones/multipicking/esquemas");
      }
    } catch (e: any) {
      toast.error(
        e?.message || "Ocurrió un error al actualizar el esquema"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ===============================
     HEADER 
  =============================== */
  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: saving ? (
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
        ) : (
          <CheckCircleIcon className="h-5 w-5" />
        ),
        onClick: () => handleSave(false),
        disabled: saving,
      },
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveOutlined className="h-4 w-4" />,
        onClick: () => handleSave(true),
        disabled: saving,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () =>
          router.push(
            "/picking/configuraciones/multipicking/esquemas"
          ),
      },
    ],
    [saving, router]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Esquemas de Picking
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {record?.nombre || `#${id}`}
          </div>
        </div>
      ),
      action: headerActions,
    } as PageHeaderProps),
    [headerActions, record?.nombre, id]
  );

  /* ===============================
     ESTADOS
  =============================== */
  if (loading) {
    return (
      <div className="mt-6 overflow-x-auto border rounded-md bg-white">
        <table className="min-w-full text-sm">
          <tbody>
            <tr>
              <td className="px-4 py-6 text-center text-gray-500">
                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                Cargando esquema…
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              Error al cargar el esquema
            </h3>
            <p className="mt-2 text-sm">{errorMessage}</p>
            <div className="mt-4">
              <button
                onClick={load}
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) return null;

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="p-6 bg-white">
      <EsquemasPickingFields
        record={record}
        readOnly={false}
        onChange={(field, value) =>
          setRecord((prev) =>
            prev ? { ...prev, [field]: value } : prev
          )
        }
      />
    </div>
  );
}