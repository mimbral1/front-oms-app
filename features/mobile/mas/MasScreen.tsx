"use client";

import Link from "next/link";
import {
  ShoppingCart,
  ClipboardList,
  Package,
  Truck,
  FileText,
  Warehouse,
  Users,
  MapPin,
  DollarSign,
  UserCog,
  Activity,
  Cable,
  Boxes,
  LineChart,
  Eye,
  ChevronRight,
} from "lucide-react";

type Mod = { label: string; href: string; Icon: typeof ShoppingCart };

// Todos los módulos del sistema (espejo de lib/menu-items.tsx). Todos abren su
// pantalla mobile-nativa bajo /m/*.
const GROUPS: { title: string; items: Mod[] }[] = [
  {
    title: "Ventas",
    items: [
      { label: "Pedidos", href: "/m/pedidos", Icon: ShoppingCart },
      { label: "Picking", href: "/m/picking", Icon: ClipboardList },
      { label: "Packing", href: "/m/packing", Icon: Package },
      { label: "Delivery", href: "/m/delivery", Icon: Truck },
    ],
  },
  {
    title: "Catálogo e Inventario",
    items: [
      { label: "Catálogo", href: "/m/catalogo", Icon: FileText },
      { label: "Almacén", href: "/m/almacen", Icon: Warehouse },
      { label: "Insumos", href: "/m/insumos", Icon: Boxes },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Clientes", href: "/m/clientes", Icon: Users },
      { label: "Ubicaciones", href: "/m/ubicaciones", Icon: MapPin },
    ],
  },
  {
    title: "Finanzas",
    items: [{ label: "Finanzas", href: "/m/finanzas", Icon: DollarSign }],
  },
  {
    title: "Operaciones",
    items: [
      { label: "Monitor de competidores", href: "/m/monitor-competidores", Icon: Eye },
      { label: "Reporte de Ventas", href: "/m/reporte-ventas", Icon: LineChart },
    ],
  },
  {
    title: "Administración",
    items: [
      { label: "Cuenta", href: "/m/cuenta", Icon: UserCog },
      { label: "Monitoreo", href: "/m/monitoreo", Icon: Activity },
      { label: "Integración", href: "/m/integracion", Icon: Cable },
    ],
  },
];

function Row({ m }: { m: Mod }) {
  return (
    <Link href={m.href} className="flex items-center gap-3 px-4 py-3 active:bg-gray-50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <m.Icon className="h-5 w-5" />
      </div>
      <span className="flex-1 text-[16px] font-medium text-gray-900">{m.label}</span>
      <ChevronRight className="h-5 w-5 text-gray-300" />
    </Link>
  );
}

export default function MasScreen() {
  return (
    <div className="pt-2">
      <div className="px-4 pt-3">
        <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900">Más</h1>
        <p className="mt-0.5 text-[15px] text-gray-400">Todos los módulos del sistema</p>
      </div>

      <div className="space-y-5 px-4 pt-4">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
              {g.title}
            </h2>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
              {g.items.map((m) => (
                <Row key={m.label} m={m} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
