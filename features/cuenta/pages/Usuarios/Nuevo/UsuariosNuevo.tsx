// views\Cuenta\Usuarios\Nuevo\Nuevo.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { Usuario, UsuariosFields } from "@/features/cuenta/components/usuarios/UsuariosFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { isRutValid, estandarizarRut } from "@/features/customers/components/clientes/utils-rut";
import { toast } from "react-hot-toast";

const USERS_BASE = "idservice/usuarios";

type FieldErrors = Partial<Record<keyof Usuario, string>>;
type TouchedMap = Partial<Record<keyof Usuario, boolean>>;

// requeridos para POST (a rajatabla)
const REQUIRED_FIELDS: (keyof Usuario)[] = ["nombre", "apellido", "email", "password", "perfil", "idDepartamento"];

const initialRecord: Usuario = {
  nombre: "",
  apellido: "",
  email: "",
  idFuncionario: "",
  documento: "",
  perfil: [],
  roles: [],
  idDepartamento: "",
  tipo: "regular",
  externo: false,
  soloLectura: false,
  idioma: "Español (Chile)",
  estado: "Activo",
  avatarUrl: "",
  comercioAccesoTotal: false,
  password: "",
  telefono: "",
  plataformas: [], // multi requerido
  salesChannelId: "", // en caso de seleccionarse perfil tipo vendedor 
  salesChannelName: "",
  salesChannelRefId: "",
  creador: {
    nombre: "",
    email: "",
    avatar: "",
  },
  creadorFecha: "",
  modificador: {
    nombre: "",
    email: "",
    avatar: "",
  },
  modificadorFecha: "",
};

type SalesChannel = {
  Id: number;
  CompanyId: number;
  CompanyName: string;
  ReferenceId: string;
  Name: string;
  ExternalDelivery: boolean;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string | null;
  UserCreated: string;
  UserModified: string | null;
};

function getUserIdFromLS(): number | undefined {
  try {
    const raw = localStorage.getItem("authState");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    const id = Number(parsed?.user?.id ?? parsed?.id ?? parsed?.userId);
    return Number.isFinite(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

export default function UsuarioNuevoView() {
  const router = useRouter();
  const { fetchWithAuth } = useFetchWithAuth();

  const [record, setRecord] = useState<Usuario>({ ...initialRecord });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitting, setSubmitting] = useState(false);

  // estado para canales de venta ---
  const [salesChannels, setSalesChannels] = useState<SalesChannel[] | null>(null);
  const [salesChannelsLoading, setSalesChannelsLoading] = useState(false);
  const [salesChannelsError, setSalesChannelsError] = useState<string | null>(null);
  const [selectedSalesChannelId, setSelectedSalesChannelId] = useState<string>("");

  const recordRef = useRef(record);
  useEffect(() => { recordRef.current = record; }, [record]);

  const setError = (k: keyof Usuario, msg?: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (msg) next[k] = msg;
      else delete next[k];
      return next;
    });

  const handleChange = <K extends keyof Usuario>(field: K, value: Usuario[K]) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setRecord((prev) => ({ ...prev, [field]: value }));

    if (REQUIRED_FIELDS.includes(field)) {
      const str = typeof value === "string" ? value : String(value ?? "");
      setError(field, str.trim() ? undefined : "Este campo es requerido");
    }

    // Validación de RUT: si no está vacío, debe ser válido
    if (field === "documento") {
      const s = String(value ?? "").trim();
      if (!s) setError("documento", undefined);
      else setError("documento", isRutValid(s) ? undefined : "RUT inválido");
    }

    if (field === "plataformas") {
      const arr = Array.isArray(value) ? value : [];
      setError("plataformas", arr.length ? undefined : "Debe seleccionar al menos una plataforma");
    }

    // si cambia el perfil, y ya no es "vendedor", limpiamos selección de canal
    if (field === "perfil") {
      setSelectedSalesChannelId("");
    }
  };

  // Determinar si el perfil seleccionado "parece" vendedor (no atado al ID=10 necesariamente)
  // - Si existe record as any con 'perfilNombre', lo evaluamos por nombre
  // - Si no tenemos el nombre, mantenemos compatibilidad con ID "10"
  // UTIL: remover diacríticos sin usar \p{Diacritic} ni flag 'u'
  const stripDiacritics = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Determinar si el perfil "parece" vendedor (por nombre), con fallback por ID "10"
  const perfilPareceVendedor = (r: Usuario): boolean => {
    const maybeNombre = (r as any)?.perfilNombre as string | undefined;
    if (maybeNombre && typeof maybeNombre === "string") {
      const plain = stripDiacritics(maybeNombre).toLowerCase();
      return plain.includes("vendedor");
    }
    return String(r.perfil) === "10";
  };


  // Cargar canales de venta cuando el perfil sea vendedor
  useEffect(() => {
    const debeListarCanales = perfilPareceVendedor(record);
    if (!debeListarCanales) {
      setSalesChannels(null);
      setSalesChannelsError(null);
      setSalesChannelsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setSalesChannelsLoading(true);
        setSalesChannelsError(null);
        const url = `comerce-service/sales-channel/Listar?search=&companyId=&isActive=1&externalDelivery=`;
        const resp = await fetchWithAuth<{ ok?: boolean; data?: SalesChannel[]; page?: number; pageSize?: number; total?: number }>(url, {
          method: "GET",
        });
        if (cancelled) return;
        setSalesChannels(Array.isArray(resp?.data) ? resp.data : []);
      } catch (e: any) {
        if (cancelled) return;
        setSalesChannelsError(e?.message || "Error al cargar canales de venta");
        setSalesChannels([]);
      } finally {
        if (!cancelled) setSalesChannelsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [record.perfil, fetchWithAuth]); // se recalcula al cambiar el perfil

  const validateBeforePost = (r: Usuario): FieldErrors => {
    const errs: FieldErrors = {};
    for (const k of REQUIRED_FIELDS) {
      if (k === "perfil") continue; // manejamos perfil aparte (multi)
      const v = (r[k] ?? "") as any;
      const s = typeof v === "string" ? v : String(v ?? "");
      if (!s.trim()) errs[k] = "Este campo es requerido";
    }

    // Perfil / roles: requiere al menos 1 (perfil o roles)
    const hasAnyRole = (r.roles && r.roles.length > 0) || !!r.perfil;
    if (!hasAnyRole) errs.perfil = "Debe seleccionar al menos un perfil";

    // Si hay roles, todos deben ser numéricos
    if (r.roles && r.roles.length && !r.roles.every(x => Number.isFinite(Number(x)))) {
      errs.perfil = "Seleccione roles válidos";
    }
    // Si además hay 'perfil' (compat), debe ser numérico si viene
    if (r.perfil && !Number.isFinite(Number(r.perfil))) {
      errs.perfil = "Seleccione un rol válido";
    }

    if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) errs.email = "Formato de email inválido";
    if (r.idDepartamento && !Number.isFinite(Number(r.idDepartamento))) errs.idDepartamento = "Seleccione un departamento válido";
    if (!Array.isArray(r.plataformas) || r.plataformas.length === 0) errs.plataformas = "Debe seleccionar al menos una plataforma";

    if (r.documento && !isRutValid(r.documento)) errs.documento = "RUT inválido";

    // Canal de venta: **opcional** (no validar requerido)

    return errs;
  };

  const doCreate = useCallback(async (): Promise<number | null> => {
    const r = recordRef.current;
    if (!r) return null;

    const reqErrs = validateBeforePost(r);
    setFieldErrors(reqErrs);
    if (Object.keys(reqErrs).length) {
      const firstKey = Object.keys(reqErrs)[0] as keyof Usuario;
      const el = document.getElementById(`error-${String(firstKey)}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }

    const rolesNums = ((r.roles && r.roles.length ? r.roles : (r.perfil ? [r.perfil] : [])))
      .map(x => Number(x))
      .filter(n => Number.isFinite(n));

    const payload: any = {
      correo: r.email?.trim() || undefined,
      password: r.password,
      activo: r.estado === "Activo",
      usuarioCreadorId: getUserIdFromLS(),
      nombres: r.nombre,
      apellidos: r.apellido,
      rut: r.documento ? estandarizarRut(r.documento) : undefined,
      departamentoId: Number(r.idDepartamento),
      telefono: r.telefono || undefined,
      urlImagenPerfil: "",
      rolesIds: rolesNums.length ? rolesNums : undefined,
      plataformaIds: (r.plataformas || []).map((p) => Number(p)),
      esExterno: r.externo ?? false,
    };

    // Canal de venta: **opcional**. Solo si hay selección.
    if (r.salesChannelId) {
      payload.canalDeVenta = r.salesChannelName || undefined;
      payload.canalDeVentaId = r.salesChannelRefId || undefined;
    }

    try {
      setSubmitting(true);
      const resp = await fetchWithAuth<{ id?: number; ID?: number }>(`${USERS_BASE}/crear`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const newId = Number((resp as any)?.id ?? (resp as any)?.ID);
      toast.success("Usuario creado correctamente");

      return Number.isFinite(newId) ? newId : null;

    } catch (err) {
      console.error("Error creando usuario:", err);
      toast.error("Ocurrió un error al crear el usuario");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [fetchWithAuth, selectedSalesChannelId]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveOutlined className="h-4 w-4" />,
        onClick: async () => {
          const id = await doCreate();
          if (id != null) router.push(`/cuenta/usuarios/listado-usuarios/${id}`);
        },
        disabled: submitting,
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
          const id = await doCreate();
          if (id != null) {
            setRecord({ ...initialRecord });
            setFieldErrors({});
            setTouched({});
            setSelectedSalesChannelId("");
            setSalesChannels(null);
          }
        },
        disabled: submitting,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/cuenta/usuarios/listado-usuarios"),
        disabled: submitting,
      },
    ],
    [router, doCreate, submitting]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Usuarios</div>
          <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
        </div>
      ),
      action: headerActions,
      status: submitting ? { text: "Guardando…", variant: "info" } : undefined,
    } as unknown as PageHeaderProps),
    [headerActions, submitting]
  );

  return (
    <div className="p-6 bg-white">
      <UsuariosFields
        record={record}
        readOnly={false}
        onChange={handleChange}
        isCreate
        errors={fieldErrors}
      />
    </div>
  );
}
