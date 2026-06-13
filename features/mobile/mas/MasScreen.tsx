"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { buildMenuItems, type SubMenuItem } from "@/lib/menu-items";
import NativeListScreen, { genericConfigFor } from "@/features/mobile/_generic/NativeListScreen";

type Node = {
  text: string;
  route?: string;
  icon?: ReactNode;
  group?: string;
  children?: Node[];
  placeholder?: boolean;
};

// Rutas que ya tienen pantalla mobile-nativa.
const NATIVE: Record<string, string> = {
  "/pedidos/listado-pedidos": "/m/pedidos",
  "/picking/rondas": "/m/picking",
  "/delivery/envios": "/m/delivery",
  "/delivery/rutas": "/m/delivery",
  "/almacen/almacenes": "/m/almacen",
  "/catalogo/productos": "/m/catalogo",
  "/clientes": "/m/clientes",
  "/ubicaciones/listado-ubicaciones": "/m/ubicaciones",
  "/finanzas/transacciones": "/m/finanzas",
  "/monitoreo/adm-modulos-endpoints": "/m/monitoreo",
  "/integracion": "/m/integracion",
};

const normSub = (items?: SubMenuItem[]): Node[] | undefined =>
  items?.length
    ? items.map((s) => ({ text: s.text, route: s.route, children: normSub(s.subItems) }))
    : undefined;

const TOP: Node[] = buildMenuItems(() => {})
  .filter((m) => m.text !== "Cerrar sesión" && m.text !== "Buscador" && m.text !== "Alertas")
  .map((m) => ({
    text: m.text,
    route: m.route,
    icon: m.icon,
    group: m.group || "Otros",
    children: normSub(m.subSidebarItems),
  }));

function Row({
  node,
  onTap,
}: {
  node: Node;
  onTap: (n: Node) => void;
}) {
  return (
    <button
      onClick={() => onTap(node)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50"
    >
      {node.icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {node.icon}
        </div>
      )}
      <span className="flex-1 text-[16px] font-medium text-gray-900">{node.text}</span>
      {NATIVE[node.route ?? ""] && (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          App
        </span>
      )}
      <ChevronRight className="h-5 w-5 text-gray-300" />
    </button>
  );
}

export default function MasScreen() {
  const router = useRouter();
  // stack de nodos abiertos (drill-down). Vacío = nivel superior (módulos).
  const [stack, setStack] = useState<Node[]>([]);

  const current = stack[stack.length - 1];

  const onTap = (n: Node) => {
    if (n.children?.length) {
      setStack((s) => [...s, n]);
      return;
    }
    const native = NATIVE[n.route ?? ""];
    if (native) {
      router.push(native);
      return;
    }
    // leaf sin pantalla nativa aún -> placeholder nativo (no cae a la UI vieja)
    setStack((s) => [...s, { ...n, placeholder: true }]);
  };

  // ---- Nivel superior: módulos agrupados ----
  if (stack.length === 0) {
    const groups = TOP.reduce<Record<string, Node[]>>((acc, n) => {
      (acc[n.group || "Otros"] ||= []).push(n);
      return acc;
    }, {});
    return (
      <div className="pt-2">
        <div className="px-4 pt-3">
          <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900">Más</h1>
          <p className="mt-0.5 text-[15px] text-gray-400">Todos los módulos y submenús</p>
        </div>
        <div className="space-y-5 px-4 pt-4">
          {Object.entries(groups).map(([g, items]) => (
            <section key={g}>
              <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
                {g}
              </h2>
              <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
                {items.map((n) => (
                  <Row key={n.text} node={n} onTap={onTap} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  // ---- Sección leaf: pantalla nativa genérica (lista + detalle) ----
  if (current.placeholder) {
    return (
      <NativeListScreen
        config={genericConfigFor(current.text)}
        onBack={() => setStack((s) => s.slice(0, -1))}
      />
    );
  }

  // ---- Nivel de submenú (drill-down) ----
  return (
    <div className="pt-2">
      <Header title={current.text} onBack={() => setStack((s) => s.slice(0, -1))} />
      <div className="px-4 pt-3">
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
          {current.children!.map((n) => (
            <Row key={n.text} node={n} onTap={onTap} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1 px-2 pt-3">
      <button
        onClick={onBack}
        aria-label="Volver"
        className="flex h-10 w-10 items-center justify-center rounded-full text-blue-600 active:bg-gray-100"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <h1 className="truncate text-[22px] font-extrabold tracking-tight text-gray-900">{title}</h1>
    </div>
  );
}
