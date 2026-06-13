// views\Cuenta\Usuarios\UsuariosView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { formatDateTime } from "@/lib/format/date";
import { useFetchWithAuth } from "@/lib/http/client";
import { Pagination } from "@/components/ui/pagination";
import { type Estado } from "@/utils/status";

const USERS_BASE = "idservice/usuarios";

/* ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ Tipos UI ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */

export type UsuarioRow = {
  imagen?: string | null;
  firstName: string;
  lastName: string;
  refId: string | number;
  email: string;
  // ahora puede quedar vacío
  tipo?: string;
  // puede quedar undefined para mostrar en blanco
  soloLectura?: boolean;
  // en blanco
  profileDataName?: string;
  modificado: string;
  userCreated: { name: string; email: string; avatar?: string | null };
  estado: Estado;
  departamento?: number | string;
  documento?: string;
  externo?: boolean;
};

const PER_PAGE = 20;

const getInitialsFromFirstAndLast = (firstName?: string, lastName?: string) => {
  const first = String(firstName || "").trim();
  const last = String(lastName || "").trim();
  const firstInitial = first && first !== "--" ? first[0] : "";
  const lastInitial = last && last !== "--" ? last[0] : "";
  return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
};

const getInitialsFromEmail = (email?: string) => {
  const normalized = String(email || "").trim();
  if (!normalized || normalized === "--") return "U";

  const localPart = normalized.split("@")[0] || normalized;
  const lettersOnly = localPart.replace(/[^a-zA-Z0-9]/g, "");
  return lettersOnly.slice(0, 2).toUpperCase() || "U";
};

const InitialsAvatar = ({ initials, sizeClass }: { initials: string; sizeClass: string }) => (
  <div
    className={`${sizeClass} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold uppercase`}
    aria-label="Avatar con iniciales"
  >
    {initials}
  </div>
);

const normalizeImageValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

/* ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ UI helpers ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */
const Pill = ({ text }: { text: string }) => (
  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700">
    {text}
  </span>
);

const ChipEstado = ({ s }: { s: Estado }) => (
  <div
    className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${s === "Activo" ? "bg-green-500" : "bg-red-500"
      }`}
  >
    {s}
  </div>
);

/* ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ Columnas ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */
function getColumns(): Column<UsuarioRow>[] {
  return [
    { header: "Ref ID", accessorKey: "refId", cell: (r) => <CopyableText text={String(r.refId)}>{r.refId}</CopyableText> },
    {
      header: "Imagen",
      accessorKey: "imagen",
      cell: (r) => {
        const fullName = `${r.firstName || ""} ${r.lastName || ""}`.trim();
        const hasImage = r.imagen !== null && r.imagen !== undefined;
        const initials = getInitialsFromFirstAndLast(r.firstName, r.lastName);

        return (
          <div className="flex items-center ml-5">
            {hasImage ? (
              <img
                src={r.imagen as string}
                alt={fullName || "Usuario"}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <InitialsAvatar initials={initials} sizeClass="h-8 w-8 text-xs" />
            )}
          </div>
        );
      },
    },
    { header: "Nombre", accessorKey: "firstName" },
    { header: "Apellido", accessorKey: "lastName" },
    {
      header: "Documento",
      accessorKey: "documento",
      cell: (r) => r.documento ? <CopyableText text={r.documento}>{r.documento}</CopyableText> : "--",
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (r) => <span className="break-all">{r.email || "--"}</span>,
    },
    {
      header: "Departamento",
      accessorKey: "departamento",
      cell: (r) => (r.departamento ?? "--"),
    },
    {
      header: "Externo",
      accessorKey: "externo",
      cell: (r) =>
        r.externo === undefined
          ? <span>--</span>
          : <Pill text={r.externo ? "Sí" : "No"} />,
    },
    // {
    //   header: "Tipo",
    //   accessorKey: "tipo",
    //   cell: (r) => (r.tipo ? <Pill text={r.tipo} /> : <span>--</span>),
    // },
    // {
    //   header: "Solo lectura",
    //   accessorKey: "soloLectura",
    //   cell: (r) =>
    //     r.soloLectura === undefined ? (
    //       <span>--</span>
    //     ) : (
    //       <Pill text={r.soloLectura ? "Sí" : "No"} />
    //     ),
    // },
    // {
    //   header: "Profile data name",
    //   accessorKey: "profileDataName",
    //   cell: (r) => (r.profileDataName ? <span>{r.profileDataName}</span> : <span>--</span>),
    // },
    {
      header: "Modificado",
      accessorKey: "modificado",
      cell: (r) => {
        const iso = r.modificado;
        if (!iso || iso === "--") return <span>--</span>;
        const { date, time } = formatDateTime(iso, {
          locale: "es-CL",
          timeZone: "America/Santiago",
        });
        return (
          <div className="flex flex-col leading-tight">
            <span>{date}</span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
        );
      },
    },
    {
      header: "Usuario creador",
      accessorKey: "userCreated",
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.userCreated.avatar ? (
            <img src={r.userCreated.avatar} className="h-8 w-8 rounded-full object-cover" alt={r.userCreated.name || "Usuario creador"} />
          ) : (
            <InitialsAvatar initials={getInitialsFromEmail(r.userCreated.email)} sizeClass="h-8 w-8 text-xs" />
          )}
          <div>
            <div className="text-sm font-medium">{r.userCreated.name || "--"}</div>
            <div className="text-xs text-gray-500">{r.userCreated.email || "--"}</div>
          </div>
        </div>
      ),
    },
    { header: "Estado", accessorKey: "estado", cell: (r) => <ChipEstado s={r.estado} /> },
  ];
}

/* ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ Página ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */
export default function UsuariosView() {
  const router = useRouter();
  const { fetchWithAuth } = useFetchWithAuth();
  const columns = useMemo(() => getColumns(), []);

  // tabla
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);

  // paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // helpers de paginación (ventana de 3 páginas)
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  // filtros (mantengo ids y mapeo a qs de tu API)
  const [filters, setFilters] = useState<{ search: string; refId: string }>({
    search: "",
    refId: "",
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("page", String(currentPage));
      q.set("pageSize", String(PER_PAGE));
      if (filters.search) {
        q.set("firstname", filters.search);
        q.set("lastname", filters.search);
        q.set("email", filters.search);
      }
      if (filters.refId) q.set("document", filters.refId);

      const resp = await fetchWithAuth<any>(`${USERS_BASE}?${q.toString()}`, { method: "GET" });

      const data = Array.isArray(resp?.data) ? resp.data : [];

      const mapped: UsuarioRow[] = data.map((u: any) => ({
        // IMAGEN
        imagen: normalizeImageValue(u?.IMAGEN),
        // NOMBRE/APELLIDO -> FIRSTNAME/LASTNAME
        firstName: u?.FIRSTNAME ?? "--",
        lastName: u?.LASTNAME ?? "--",
        // REF ID -> "REF ID" (con espacio en la clave)
        refId: u?.ID ?? "--",
        // EMAIL -> EMAIL
        email: u?.EMAIL ?? "--",
        // Departamento -> DEPARTMENTS
        departamento: u?.DEPARTMENTS ?? "--",
        // DOCUMENTO -> DOCUMENT
        documento: u?.DOCUMENT ?? "--",
        // TIPO / SOLO LECTURA / PROFILE DATA NAME -> en blanco
        tipo: "",
        soloLectura: undefined,
        profileDataName: "",
        // MODIFICADO -> DATE_CREATED
        modificado: u?.DATE_CREATED ?? "--",
        // USUARIO (nombre + email + avatar) -> USER_NAME_CREATED / EMAIL_USER_CREATED / IMAGE_USER_CREATED
        userCreated: {
          name: u?.USER_NAME_CREATED ?? "--",
          email: u?.EMAIL_USER_CREATED ?? "--",
          avatar: normalizeImageValue(u?.IMAGE_USER_CREATED),
        },
        // ESTADO -> true/false
        estado: u?.ACTIVE ? "Activo" : "Inactivo",
        // es externo
        externo: u?.IS_EXTERNAL ?? false,
      }));
      setRows(mapped);
      const total = Number(resp?.total ?? mapped.length);
      setTotalRecords(total);
      setTotalPages(Math.max(1, Math.ceil(total / PER_PAGE)));
    } catch (err) {
      console.error("Error listando usuarios:", err);
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, currentPage, filters.search, filters.refId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* Acciones header */
  const actions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/cuenta/usuarios/listado-usuarios/nuevo"),
        icon: <PlusIcon className="h-5 w-5" />,
      },
      {
        label: "Exportar",
        variant: "primary",
        onClick: () => {
          const headers = [
            "Imagen",
            "Nombre",
            "Apellido",
            "Ref ID",
            "Email",
            "Departamento",
            "Documento",
            "Tipo",
            "Solo lectura",
            "Modificado",
            "Usuario (nombre)",
            "Usuario (email)",
            "Estado",
          ];
          const data = rows.map((r) => [
            r.imagen || "",
            r.firstName,
            r.lastName,
            r.refId,
            r.email,
            r.departamento ?? "--",
            r.documento ?? "--",
            r.tipo || "--",
            r.soloLectura === undefined ? "--" : r.soloLectura ? "Sí" : "No",
            r.modificado,
            r.userCreated.name,
            r.userCreated.email,
            r.estado,
          ]);
          exportToCsv("usuarios.csv", [headers, ...data]);
        },
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
      },
      { label: "Actualizar", variant: "secondary", onClick: () => fetchList(), icon: <ArrowPathIcon className="h-5 w-5" /> },
    ],
    [router, rows, fetchList]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Usuarios"
        action={actions}
        filters={[
          { id: "search", label: "Buscar", type: "text" as const, value: filters.search },
          { id: "refId", label: "Ref ID", type: "text" as const, value: filters.refId },
        ]}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          setFilters((prev) => ({ ...prev, [id]: value as string }));
        }}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <div className="overflow-x-auto border rounded-md bg-white">
              <table className="min-w-full text-sm">
                <tbody>
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                      Cargando usuarios...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <DataTable
              data={rows}
              columns={columns}
              dataType="Usuarios"
              statusKey="estado"
              rowPaddingY={12}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: UsuarioRow) =>
                router.push(`/cuenta/usuarios/listado-usuarios/${row.refId}`)
              }
            />
          )}

          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}

