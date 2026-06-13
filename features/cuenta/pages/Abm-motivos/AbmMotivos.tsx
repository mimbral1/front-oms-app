// app/views/AbmMotivos/AbmMotivosView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PlusIcon, CloudArrowDownIcon } from "@heroicons/react/24/outline";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { fmtDateTime } from "@/lib/format/date";

/* ================= Utils ================ */
/** Formats ISO date + time using the shared date utility */
const formatDateTimeWithTime = fmtDateTime;

const getStatusColor = (status: string) => {
    switch (status) {
        case "Activo":
            return "bg-green-500";
        case "Inactivo":
            return "bg-red-600";
        default:
            return "bg-gray-500";
    }
};

/* ======================= Tipos ======================= */
type Estado = "Activo" | "Inactivo";
type Target = "OMS" | "WMS" | "ERP" | "Otro";

interface UserMeta {
    name: string;
    email?: string;
}

export interface MotivoRow {
    id: string;
    refId: string;
    nombre: string;
    nombreInterno: string;
    solicitarComentario: boolean;
    fechaCreacion: string;
    fechaModificacion: string;
    usuarioCreador?: UserMeta;
    usuario?: UserMeta;
    status: Estado;
    target: Target;
}

interface MotivoFilters {
    refId: string;
    nombre: string;
    nombreInterno: string;
    target: "" | Target;
}

/* ======================= Mock data ======================= */
function buildMock(): MotivoRow[] {
    // 4 filas “idénticas” a las del screenshot para que lo veas igual
    const seed: MotivoRow[] = [
        {
            id: "MOT-0035",
            refId: "35",
            nombre: "Cambio de fecha",
            nombreInterno: "Reagendar delivery",
            solicitarComentario: false,
            fechaCreacion: "2023-11-24T11:21:00.000Z",
            fechaModificacion: "2023-11-24T11:27:00.000Z",
            usuarioCreador: { name: "" },
            usuario: { name: "" },
            status: "Inactivo",
            target: "OMS",
        },
        {
            id: "MOT-0004",
            refId: "04",
            nombre: "Cambio de tienda",
            nombreInterno: "Cambio de tienda",
            solicitarComentario: true,
            fechaCreacion: "2023-11-24T11:20:00.000Z",
            fechaModificacion: "2023-11-24T11:20:00.000Z",
            usuarioCreador: { name: "" },
            usuario: { name: "" },
            status: "Activo",
            target: "OMS",
        },
        {
            id: "MOT-0002",
            refId: "02",
            nombre: "Pago rechazado",
            nombreInterno: "Pago rechazado",
            solicitarComentario: false,
            fechaCreacion: "2023-11-16T23:09:00.000Z",
            fechaModificacion: "2023-12-04T12:41:00.000Z",
            usuarioCreador: { name: "" },
            usuario: { name: "" },
            status: "Activo",
            target: "WMS",
        },
        {
            id: "MOT-0001",
            refId: "01",
            nombre: "Pedido de Cliente",
            nombreInterno: "Pedido de Cliente",
            solicitarComentario: true,
            fechaCreacion: "2023-11-16T20:42:00.000Z",
            fechaModificacion: "2024-01-09T16:35:00.000Z",
            usuarioCreador: { name: "" },
            usuario: { name: "" },
            status: "Activo",
            target: "ERP",
        },
    ];

    // Completo hasta 60 para que coincida con “60 por página”
    const names = ["Ana Torres", "Bruno Díaz", "Camila Rojas", "Diego Pérez"];
    const mails = ["ana@acme.com", "bruno@acme.com", "camila@acme.com", "diego@acme.com"];
    const targets: Target[] = ["OMS", "WMS", "ERP", "Otro"];

    const out: MotivoRow[] = [];
    for (let i = 0; i < 60; i++) {
        if (i < seed.length) {
            out.push(seed[i]);
            continue;
        }
        const ref = String(100 + i);
        const created = new Date();
        created.setDate(created.getDate() - (i % 15));
        const modified = new Date(created);
        modified.setHours(modified.getHours() + ((i * 3) % 48));
        const creatorIdx = i % names.length;
        const userIdx = (i + 1) % names.length;

        out.push({
            id: `MOT-${String(i + 1).padStart(4, "0")}`,
            refId: ref,
            nombre: ["Cambio de fecha", "Cambio de tienda", "Pago rechazado", "Pedido de Cliente"][i % 4],
            nombreInterno: ["Reagendar delivery", "Cambio de tienda", "Pago rechazado", "Pedido de Cliente"][i % 4],
            solicitarComentario: i % 2 === 0,
            fechaCreacion: created.toISOString(),
            fechaModificacion: modified.toISOString(),
            usuarioCreador: { name: names[creatorIdx], email: mails[creatorIdx] },
            usuario: { name: names[userIdx], email: mails[userIdx] },
            status: i % 7 === 0 ? "Inactivo" : "Activo",
            target: targets[i % targets.length],
        });
    }
    return out;
}

/* ======================= Columnas ======================= */
function getColumns(router: ReturnType<typeof useRouter>) {
    const Chip = ({ text }: { text: string }) => (
        <span className="inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm bg-white">
            {text}
        </span>
    );

    // Reemplaza tu UserChip por este
    const UserChip = ({ user }: { user?: UserMeta }) => {
        if (!user?.name) {
            return <span className="text-sm text-gray-500">-</span>;
        }
        const initials = user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

        return (
            <div className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded-full max-w-[220px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold">
                    {initials}
                </div>
                <div className="flex flex-col ml-2 overflow-hidden">
                    <span className="text-sm font-medium leading-tight truncate">{user.name}</span>
                    {user.email && (
                        <span className="text-xs text-gray-500 leading-tight truncate">{user.email}</span>
                    )}
                </div>
            </div>
        );
    };


    return [
        { header: "Ref ID", accessorKey: "refId" as const, cell: (r: MotivoRow) => <span>{r.refId}</span> },
        { header: "Nombre", accessorKey: "nombre" as const, cell: (r: MotivoRow) => <span>{r.nombre}</span> },
        { header: "Nombre interno", accessorKey: "nombreInterno" as const, cell: (r: MotivoRow) => <span>{r.nombreInterno}</span> },
        {
            header: "Solicitar comentario",
            accessorKey: "solicitarComentario" as const,
            cell: (r: MotivoRow) => <Chip text={r.solicitarComentario ? "Sí" : "No"} />,
        },
        {
            header: "Creación",
            accessorKey: "fechaCreacion" as const,
            cell: (r: MotivoRow) => <span>{formatDateTimeWithTime(r.fechaCreacion)}</span>,
        },
        {
            header: "Modificado",
            accessorKey: "fechaModificacion" as const,
            cell: (r: MotivoRow) => <span>{formatDateTimeWithTime(r.fechaModificacion)}</span>,
        },
        {
            header: "Usuario creador",
            accessorKey: "usuarioCreador" as const,
            cell: (r: MotivoRow) => <UserChip user={r.usuarioCreador} />,
        },
        {
            header: "Usuario",
            accessorKey: "usuario" as const,
            cell: (r: MotivoRow) => <UserChip user={r.usuario} />,
        },
        {
            header: "Estado",
            accessorKey: "status" as const,
            cell: (r: MotivoRow) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-6 py-1 text-sm font-medium text-white ${getStatusColor(
                        r.status
                    )}`}
                >
                    {r.status}
                </div>
            ),
        },
    ];
}

/* ======================= Filtros ======================== */
function getMotivoFilters(f: MotivoFilters) {
    return [
        { id: "refId", label: "Ref ID", type: "text" as const, value: f.refId ?? "" },
        { id: "nombre", label: "Nombre", type: "text" as const, value: f.nombre ?? "" },
        { id: "nombreInterno", label: "Nombre interno", type: "text" as const, value: f.nombreInterno ?? "" },
        {
            id: "target",
            label: "Target",
            type: "select" as const,
            value: f.target ?? "",
            options: [
                { label: "Todos", value: "" },
                { label: "OMS", value: "OMS" },
                { label: "WMS", value: "WMS" },
                { label: "ERP", value: "ERP" },
                { label: "Otro", value: "Otro" },
            ],
        },
    ];
}

/* ======================= Vista ======================= */
export function AbmMotivosView() {
    const router = useRouter();

    // mock y filtros locales
    const [allMotivos] = useState<MotivoRow[]>(() => buildMock());
    const [filters, setFilters] = useState<MotivoFilters>({
        refId: "",
        nombre: "",
        nombreInterno: "",
        target: "",
    });

    // acciones del header
    const handleCreate = () => router.push("/cuenta/abm-motivos/nuevo");
    const handleExport = () => console.log("Exportar CSV");

    const headerActions = [
        { label: "Nuevo", variant: "success" as const, onClick: handleCreate, icon: <PlusIcon className="h-5 w-5" /> },
        { label: "Exportar", variant: "primary" as const, onClick: handleExport, icon: <CloudArrowDownIcon className="h-5 w-5" /> },
    ];

    // aplicar filtros (coinciden con la UI del screenshot)
    const filtered = useMemo(() => {
        const ref = filters.refId.trim().toLowerCase();
        const nom = filters.nombre.trim().toLowerCase();
        const nin = filters.nombreInterno.trim().toLowerCase();

        return allMotivos.filter((m) => {
            if (ref && !m.refId.toLowerCase().includes(ref)) return false;
            if (nom && !m.nombre.toLowerCase().includes(nom)) return false;
            if (nin && !m.nombreInterno.toLowerCase().includes(nin)) return false;
            if (filters.target && m.target !== filters.target) return false;
            return true;
        });
    }, [allMotivos, filters]);

    // paginación
    const ITEMS_PER_PAGE = 60;
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => setCurrentPage(1), [filters]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
        if (currentPage < 1) setCurrentPage(1);
    }, [totalPages, currentPage]);

    // columnas
    const columns = useMemo(() => getColumns(router), [router]);
    const motivoFilters = getMotivoFilters(filters);

    const onFilterChange = (id: string, value: string) => setFilters((prev) => ({ ...prev, [id]: value }));

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Motivos"
                filters={motivoFilters}
                onFilterChange={onFilterChange}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl shadow-sm">
                        <DataTable
                            data={paginated}
                            columns={columns}
                            dataType="motivo"
                            statusKey="status"
                            rowPaddingY={28}
                            rowBgClass="bg-white"
                            onRowClick={(row: MotivoRow) => router.push(`/cuenta/abm-motivos/${row.refId}`)}
                        />
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
