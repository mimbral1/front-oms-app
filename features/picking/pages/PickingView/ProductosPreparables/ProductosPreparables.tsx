// app/(preparacion)/productos-preparables/page.tsx
"use client";

import {
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import { BarcodeIcon, FileInput } from "lucide-react";
import { clp } from "@/lib/format/money";
import { fmtDateTime } from "@/lib/format/date";
import { renderActionBtn } from "./helpers/helperactions";
import { Pagination } from "@/components/ui/pagination";

/** Alias for the shared date formatter */
const formatDateTime = fmtDateTime;

// para manejar estados
type PrepStatusLabel = "En preparación" | "Pendiente" | "Preparado";
type PrepStatusKey = "Preparando" | "Pendiente" | "Preparado";

const STATUS_META: Record<PrepStatusKey, { label: PrepStatusLabel; badgeClass: string }> = {
  Preparando: { label: "En preparación", badgeClass: "bg-yellow-400 text-white" },
  Pendiente: { label: "Pendiente", badgeClass: "bg-gray-400 text-white" },
  Preparado: { label: "Preparado", badgeClass: "bg-emerald-500 text-white" },
};

// Normalizador robusto: quita acentos, tolera espacios/typos como "prearación" / "en preparacion" / "preparando"
const toStatusKey = (value: string): PrepStatusKey => {
  const s = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos sin \p{}
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/(^| )preparando( |$)/.test(s)) return "Preparando";
  if (/(^| )en preparacion( |$)/.test(s)) return "Preparando";
  if (/preparad[oa]/.test(s)) return "Preparado";
  if (/preparac|prearac/.test(s)) return "Preparando";
  return "Pendiente";
};



export interface PrepItem {
  refId: string;
  image: string;
  name: string;
  ean: string;
  orderId: string;
  price: number;
  qty: string;
  dateDelivery: string;
  labelPrinted: boolean;
  status: PrepStatusLabel; // label que puede traer espacios/acentos
  _statusKey?: PrepStatusKey;
  notes: string;
  actions?: string[];
  productGroup?: string;
}

const mockItems: PrepItem[] = [
  {
    refId: "201",
    image:
      "https://http2.mlstatic.com/D_Q_NP_813051-CBT81738074479_012025-O.webp",
    name: "Tornillo rosca fina 5x20 mm",
    ean: "7891234500012",
    orderId: "ORD-250707-A1B2C",
    price: 12.5,
    qty: "100 unidades",
    dateDelivery: "2025-07-10T09:00:00",
    labelPrinted: true,
    status: "En preparación",
    notes: "-",
    actions: ["Pick"],
  },
  {
    refId: "202",
    image:
      "https://mimbralb2c.vtexassets.com/arquivos/ids/156854-800-1067?v=638225558626830000&width=800&height=1067&aspect=true",
    name: "Martillo de acero 16 oz.",
    ean: "7891234500029",
    orderId: "ORD-250707-A1B2C",
    price: 24.9,
    qty: "1 unidad",
    dateDelivery: "2025-07-10T09:00:00",
    labelPrinted: true,
    status: "En preparación",
    notes: "-",
    actions: ["Pick"],
  },
  {
    refId: "203",
    image:
      "https://mimbralb2c.vtexassets.com/arquivos/ids/217837-800-1067?v=638832635407970000&width=800&height=1067&aspect=true",
    name: "Taladro inalámbrico 18 V con batería",
    ean: "7891234500036",
    orderId: "ORD-250707-A1B2C",
    price: 159.99,
    qty: "1 unidad",
    dateDelivery: "2025-07-12T10:00:00",
    labelPrinted: false,
    status: "Pendiente",
    notes: "Verificar carga de batería",
    actions: ["Iniciar", "Pick"],
  },
  {
    refId: "301",
    image:
      "https://media.istockphoto.com/id/177492022/es/foto/apple.jpg?s=612x612&w=0&k=20&c=9Y4uIgPGHi_ZQV89EmDwTQLJOfQwackujknQlVesf8E=",
    name: "Manzana Amarilla Dispersa",
    ean: "2340405000006",
    orderId: "1472660527360-01",
    price: 31.09,
    qty: "0.44 kg",
    dateDelivery: "2024-10-30T15:00:00",
    labelPrinted: false, // la captura muestra "No"
    status: "Preparado", // verde "Preparado"
    notes: "-",
    actions: ["Imprimir etiqueta"],
    productGroup: "Frutas",
  },
  {
    refId: "302",
    image:
      "https://d26z5keclpxl8.cloudfront.net/web-dist/fotos/productos/62/jpg/manzana_verde_1_kg_9547_600x600.jpg",
    name: "Manzana Verde Dispersa",
    ean: "2515354000005",
    orderId: "1472660527360-01",
    price: 240.8,
    qty: "0.437 kg",
    dateDelivery: "2024-10-30T15:00:00",
    labelPrinted: false,
    status: "Pendiente",
    notes: "-",
    actions: ["Iniciar", "Pick"],
    productGroup: "Frutas",
  },
];

interface PrepFilters {
  refId: string;
  name: string;
  ean: string;
  productGroup: string;
  orderId: string;
}
const filterConfig = (f: PrepFilters) => [
  { id: "refId", label: "Ref ID", type: "text" as const, value: f.refId },
  { id: "name", label: "Nombre", type: "text" as const, value: f.name },
  { id: "ean", label: "Código de barras", type: "text" as const, value: f.ean },
  { id: "productGroup", label: "Grupo de productos", type: "text" as const, value: f.productGroup }, // nuevo
  { id: "orderId", label: "Pedido", type: "text" as const, value: f.orderId }, // nuevo
];

function getColumns(onPrint: (p: PrepItem) => void): Column<PrepItem>[] {
  return [
    {
      accessorKey: "image",
      header: "Imagen",
      cell: (p) => (
        <img
          src={p.image}
          alt={p.name}
          width={56}
          height={56}
          className="h-16 w-16 rounded object-contain"
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Átem",
      cell: (p) => (
        <div className="text-sm space-y-0.5">
          <p className="font-medium pb-2">{p.name}</p>
          <div className="flex items-center text-xs text-gray-500">
            <BarcodeIcon className="h-3.5 w-3.5 font-black text-gray-950" />
            <CopyableText text={p.ean} className="ml-1 font-black text-gray-800">
              {p.ean}
            </CopyableText>
          </div>
          <CopyableText text={p.ean.slice(0, 7)} className="text-xs font-black text-gray-800">
            # {p.ean.slice(0, 7)}
          </CopyableText>
        </div>
      ),
    },
    {
      accessorKey: "orderId",
      header: "ID Pedido",
      cell: (p) => (
        <CopyableText text={p.orderId} className="text-primary-600 text-blue-550 text-sm font-medium">
          {p.orderId}
        </CopyableText>
      ),
    },
    { accessorKey: "price", header: "Precio", cell: (p) => <span className="text-sm">{clp.format(p.price)}</span> },
    {
      accessorKey: "qty",
      header: "Cantidad",
      cell: (p) => (
        <div className="flex flex-row items-center gap-2">
          <ShoppingCartIcon className="h-4 w-4 text-gray-500" />
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1.5 text-xs">
            {p.qty}
          </span>
        </div>
      ),
    },
    { accessorKey: "notes", header: "Notas", cell: () => "—" },
    { accessorKey: "dateDelivery", header: "Fecha entrega", cell: (p) => <span className="text-sm">{formatDateTime(p.dateDelivery)}</span> },
    { accessorKey: "labelPrinted", header: "Etiqueta", cell: (p) => (p.labelPrinted ? "Sí" : "No") },
    {
      accessorKey: "actions",
      header: "Acciones",
      cell: (p) => <div className="flex gap-2">{p.actions?.map((a) => renderActionBtn(a, p, onPrint))}</div>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: (p) => {
        const key = p._statusKey ?? toStatusKey(p.status);
        const meta = STATUS_META[key];
        return (
          <span className={`inline-block rounded-full px-3 py-2 text-xs font-semibold ${meta.badgeClass}`}>
            {meta.label}
          </span>
        );
      },
    },
  ];
}

/* Helpers de paginación — estilo SalesChannels */
const PER_PAGE = 20;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function PrepProductsView() {
  const router = useRouter();
  const [filters, setFilters] = useState<PrepFilters>({ refId: "", name: "", ean: "", productGroup: "", orderId: "" });
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(
    () =>
      mockItems.filter((item) => {
        return (
          (!filters.refId || item.refId.includes(filters.refId)) &&
          (!filters.name || item.name.toLowerCase().includes(filters.name.toLowerCase())) &&
          (!filters.ean || item.ean.includes(filters.ean)) &&
          (!filters.productGroup ||
            (item.productGroup ?? "").toLowerCase().includes(filters.productGroup.toLowerCase())) && // nuevo
          (!filters.orderId || item.orderId.includes(filters.orderId)) // nuevo
        );
      }),
    [filters]
  );

  // reset de página al cambiar filtros
  const onFilterChange = (id: string, v: string) => {
    setFilters((p) => ({ ...p, [id]: v }));
    setCurrentPage(1);
  };

  const onPrint = (p: PrepItem) => alert(`Imprimir etiqueta para ${p.refId}`);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safe = clamp(currentPage, 1, totalPages);
  const startIdx = (safe - 1) * PER_PAGE;
  const endIdx = Math.min(startIdx + PER_PAGE, filtered.length);
  const pageItems = filtered.slice(startIdx, endIdx).map(i => ({
    ...i,
    _statusKey: toStatusKey(i.status),
  }));


  const handleExport = () => {
    const headers = ["Ref ID", "Nombre", "EAN", "Pedido", "Precio", "Cantidad", "Fecha entrega", "Etiqueta", "Estado"];
    const rows = filtered.map((d) => {
      const key = toStatusKey(d.status);
      return [
        d.refId,
        d.name,
        d.ean,
        d.orderId,
        new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(d.price),
        d.qty,
        formatDateTime(d.dateDelivery),
        d.labelPrinted ? "Sí" : "No",
        STATUS_META[key].label, // <- en vez de d.status
      ];
    });

    exportToCsv("productos-preparables.csv", [headers, ...rows]);
  };

  const headerActions = [
    { label: "Exportar", variant: "primary" as const, onClick: handleExport, icon: <FileInput className="h-5 w-5" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        sticky
        stickyTop={0}
        title="Productos preparables"
        description=""
        filters={filterConfig(filters)}
        onFilterChange={onFilterChange}
        action={headerActions}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="overflow-hidden rounded-xl">
          <DataTable<PrepItem>
            data={pageItems}
            columns={getColumns(onPrint)}
            statusKey="_statusKey"
            dataType="Preparables"
            rowGap={4}
            rowPaddingY={12}
            rowBgClass="bg-white shadow-sm"
            onRowClick={(row: PrepItem) => router.push(`/picking/preparables/${encodeURIComponent(row.refId)}`)}
          />
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalRecords={filtered.length}
          pageSize={PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default PrepProductsView;

