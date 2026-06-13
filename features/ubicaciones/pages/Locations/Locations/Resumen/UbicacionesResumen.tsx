// views\Ubicaciones\Locations\Locations\Resumen\UbicacionesResumen.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps, Action } from "@/components/layout/page-header";
import { XCircleIcon, CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { useFetchWithAuth } from "@/lib/http/client";
import LocationFields, { ApiLocation, LocationStatus } from "@/features/ubicaciones/components/locations/locations/UbicacionesFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { toast } from "react-hot-toast";

const API_BASE = "comerce-service/locations";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const errorPayload = (err: unknown): unknown => {
  if (err && typeof err === "object" && "payload" in err) {
    return (err as { payload?: unknown }).payload ?? err;
  }
  return err;
};

const EMPTY: ApiLocation = {
  storeId: 1,
  name: "",
  phoneNumber: "",
  country: "",
  stateProvince: "",
  city: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  status: "inactive",
  user: "1",
};

export default function LocationResumen() {

  const { user } = useAuth();

  const router = useRouter();
  const params = useParams();
  const idRaw = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
  const isNumericId = !!idRaw && /^\d+$/.test(String(idRaw));
  const idParam = isNumericId ? Number(idRaw) : undefined;

  const { fetchWithAuth } = useFetchWithAuth();

  const [record, setRecord] = useState<ApiLocation>(EMPTY);
  const [saving, setSaving] = useState<boolean>(false);

  // storeId 
  const [storeOpts, setStoreOpts] = useState<{ label: string; value: string }[]>([
    { label: "Seleccione tienda…", value: "" },
  ]);
  const [storeSearch, setStoreSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchWithAuth<{
          ok: boolean;
          data: { Id: number; Name: string }[];
        }>("comerce-service/store/get?status=1");

        if (!mounted) return;

        setStoreOpts([
          { label: "Seleccione tienda…", value: "" },
          ...(res?.data ?? []).map((s) => ({
            value: String(s.Id),
            label: s.Name,
          })),
        ]);
      } catch (e) {
        console.error("Error cargando tiendas:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchWithAuth, user?.id]);

  // manejo de errores 
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mantén un ref con la versión más reciente del record (para usar dentro de save())
  const recordRef = useRef<ApiLocation>(record);
  useEffect(() => { recordRef.current = record; }, [record]);

  // Cargar detalle si hay ID válido
  useEffect(() => {
    if (!idParam) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const res = await fetchWithAuth<unknown>(`${API_BASE}/${idParam}`, { method: "GET" });
        const resObj = asRecord(res);
        const items = Array.isArray(resObj.items) ? resObj.items : [];
        const item = asRecord(items[0] ?? resObj.item ?? resObj);
        if (!mounted || !item) return;

        setRecord({
          id: Number(item.id ?? idParam),
          storeId: Number(item.storeId ?? 0),
          name: String(item.name ?? ""),
          phoneNumber: String(item.phoneNumber ?? ""),
          country: String(item.country ?? ""),
          stateProvince: String(item.stateProvince ?? ""),
          city: String(item.city ?? ""),
          addressLine1: String(item.addressLine1 ?? ""),
          addressLine2: String(item.addressLine2 ?? ""),
          postalCode: String(item.postalCode ?? ""),
          created: item.userCreatedProfile
            ? {
              username: `${asRecord(item.userCreatedProfile).nombres ?? ""} ${asRecord(item.userCreatedProfile).apellidos ?? ""}`.trim(),
              email: String(asRecord(item.userCreatedProfile).email ?? "—"),
              avatar: asRecord(item.userCreatedProfile).urlImagenPerfil as string | undefined,
              date: String(item.dateCreatedCL ?? "—"),
            }
            : undefined,

          modified: item.userModifiedProfile
            ? {
              username: `${asRecord(item.userModifiedProfile).nombres ?? ""} ${asRecord(item.userModifiedProfile).apellidos ?? ""}`.trim(),
              email: String(asRecord(item.userModifiedProfile).email ?? "—"),
              avatar: asRecord(item.userModifiedProfile).urlImagenPerfil as string | undefined,
              date: String(item.dateModifiedCL ?? "—"),
            }
            : undefined,
          status: (item.status as LocationStatus) ?? "active",
          user: String(item.user ?? "1"),
        });
      } catch (err) {
        console.error("Error cargando ubicación:", err);
        if (mounted) {
          setErrorMessage("No se pudo cargar la ubicación.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [idParam, fetchWithAuth]);

  // Cambios desde Fields
  const onChange = useCallback(
    <K extends keyof ApiLocation>(field: K, value: ApiLocation[K]) => {
      setRecord((r) => ({ ...r, [field]: value })); // ¡ojo al spread!
    },
    []
  );

  // ===== GUARDAR / APLICAR =====
  // POST /locations  (si no hay id)
  // PATCH /locations/{id} (si hay id)
  const save = useCallback(async (): Promise<boolean> => {
    const current = recordRef.current;
    if (!current) return false;

    // Validación mínima (la API responde NAME_REQUIRED)
    if (!current.name?.trim()) {
      console.warn("Nombre es requerido para guardar la ubicación.");
      return false;
    }

    const payload = {
      storeId: current.storeId,
      name: current.name,
      phoneNumber: current.phoneNumber?.trim() || null,
      country: current.country,
      stateProvince: current.stateProvince,
      city: current.city,
      addressLine1: current.addressLine1,
      addressLine2: current.addressLine2 ?? "",
      postalCode: current.postalCode,
      status: current.status,
      user: String(user?.id),
    };

    setErrorMessage(null);
    setSaving(true);
    try {
      if (current.id) {
        // PATCH /locations/{id}
        await fetchWithAuth<{ id: string; changed: boolean; message: string }>(
          `${API_BASE}/${current.id}`,
          { method: "PATCH", body: JSON.stringify(payload) }
        );

        toast.success("Ubicación actualizada correctamente");
      } else {
        // POST /locations
        const res = await fetchWithAuth<{ id: string; message: string }>(
          `${API_BASE}`,
          { method: "POST", body: JSON.stringify(payload) }
        );
        if (res?.id) {
          // Guardamos el nuevo id para futuras ediciones
          setRecord((r) => ({ ...r, id: Number(res.id) }));

          toast.success("Ubicación creada correctamente");
        }
      }
      return true;
    } catch (err) {
      console.error("Error guardando ubicación:", errorPayload(err));

      toast.error("Ocurrió un error al guardar la ubicación");

      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchWithAuth, user?.id]);

  // Guardar => guarda y va al listado
  const handleSaveAndGoList = useCallback(async () => {
    const ok = await save();
    if (ok) router.push("/ubicaciones/listado-ubicaciones");
  }, [save, router]);

  // Header
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: saving ? "Aplicando..." : "Aplicar",
        variant: "success",
        icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
        onClick: save,                 // se queda en la vista
        disabled: saving || loading,
      },
      {
        label: "Guardar",
        variant: "success",
        icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
        onClick: handleSaveAndGoList,  // guarda y va al listado
        disabled: saving || loading,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/ubicaciones/listado-ubicaciones"),
        disabled: saving,
      },
    ],
    [saving, loading, save, handleSaveAndGoList, router]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Ubicaciones</div>
          <div className="text-2xl font-semibold text-gray-900">
            {idParam ? `Ubicación #${idParam}` : "Ubicación"}
          </div>
        </div>
      ),
      action: headerActions,
      status: {
        text: record.status === "active" ? "Activo" : "Inactivo",
        variant: record.status === "active" ? "success" : "warning",
      },
    } as PageHeaderProps),
    [headerActions, record.status, idParam]
  );

  if (loading) {
    return (
      <div className="mt-6 overflow-x-auto border rounded-md bg-white">
        <table className="min-w-full text-sm">
          <tbody>
            <tr>
              <td className="px-4 py-6 text-center text-gray-500">
                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                Cargando ubicación…
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
              Error al cargar la ubicación
            </h3>
            <p className="mt-2 text-sm">{errorMessage}</p>
            <div className="mt-4">
              <button
                onClick={() => {
                  if (idParam) {
                    // fuerza recarga
                    setErrorMessage(null);
                    setLoading(true);
                  }
                }}
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

  return (
    <div className="flex flex-col bg-white">
      <div className="p-6">
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">
                  Error al crear la ubicación
                </h3>
                <p className="mt-2 text-sm">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-4 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        <LocationFields
          record={record}
          onChange={onChange}

          storeOpts={storeOpts}
          storeSearch={storeSearch}
          onStoreSearch={setStoreSearch}
        />
      </div>
    </div>
  );
}
