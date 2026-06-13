"use client";

import { useState } from "react";
import { ChevronLeft, Printer, XCircle, Truck, User } from "lucide-react";
import { Badge, clp } from "@/components/mobile/ui";

export type PedidoLike = {
  id: string;
  name: string;
  amount: number;
  ref: string;
  delivery: string;
  time: string;
  items: number;
  units: number;
  assign: string;
  overdue: boolean;
  validacion: boolean;
};

const TABS = ["Resumen", "Ítems", "Bultos", "Historial"] as const;
type Tab = (typeof TABS)[number];

const SAMPLE_ITEMS = [
  { sku: "100123", name: "Taladro percutor 750W", qty: 1, price: 39990 },
  { sku: "100456", name: "Set brocas 13 pzs", qty: 1, price: 7990 },
];

export default function PedidoDetail({
  order,
  onBack,
}: {
  order: PedidoLike;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Resumen");

  return (
    <div className="pb-6 pt-2">
      {/* Back */}
      <div className="flex items-center gap-1 px-2 pt-3">
        <button onClick={onBack} aria-label="Volver" className="flex h-10 w-10 items-center justify-center rounded-full text-blue-600 active:bg-gray-100">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="text-[15px] font-medium text-blue-600">Pedidos</span>
      </div>

      {/* Hero */}
      <div className="px-4 pt-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-gray-900">{order.name}</h1>
          <span className="shrink-0 text-[20px] font-bold text-gray-900">{clp(order.amount)}</span>
        </div>
        <p className="mt-0.5 text-[14px]">
          <span className="font-semibold text-blue-600">#{order.id}</span>
          <span className="text-gray-400"> · {order.ref}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {order.validacion && <Badge tone="amber">Validación cliente</Badge>}
          {order.overdue && <Badge tone="red">Vencido</Badge>}
          {!order.overdue && !order.validacion && <Badge tone="green">En tiempo</Badge>}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 px-4 pt-4">
        <Action Icon={Printer} label="Imprimir" />
        <Action Icon={Truck} label="Despacho" />
        <Action Icon={XCircle} label="Cancelar" tone="red" />
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full border px-4 py-2 text-[14px] font-semibold ${tab === t ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-600"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {tab === "Resumen" && (
          <Sectioned
            sections={[
              { title: "Cliente", rows: [["Nombre", order.name], ["RUT", "16.345.678-9"], ["Teléfono", "+56 9 8765 4321"]] },
              { title: "Entrega", rows: [["Tipo", order.delivery], ["Hora", order.time], ["Asignación", order.assign]] },
              { title: "Totales", rows: [["Ítems", `${order.items} (${order.units} un)`], ["Total", clp(order.amount)], ["Pago", "Webpay · Crédito"]] },
            ]}
          />
        )}

        {tab === "Ítems" && (
          <div className="space-y-3">
            {SAMPLE_ITEMS.map((it) => (
              <div key={it.sku} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[16px] font-semibold text-gray-900">{it.name}</span>
                  <span className="shrink-0 font-bold text-gray-900">{clp(it.price)}</span>
                </div>
                <p className="mt-1 text-[13px] text-gray-400">SKU {it.sku} · {it.qty} un</p>
              </div>
            ))}
          </div>
        )}

        {tab === "Bultos" && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" /><span className="font-semibold">Bulto #9012</span>
            </div>
            <p className="mt-1 text-[13px] text-gray-400">Caja M · 1.2 kg · {order.items} ítems</p>
          </div>
        )}

        {tab === "Historial" && (
          <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
            {[
              ["Pedido recibido", "Hoy 17:21"],
              ["En picking", "Hoy 17:26"],
              ["Validación cliente", "Hoy 17:31"],
            ].map(([t, time], i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  {i < arr.length - 1 && <span className="w-px flex-1 bg-gray-200" />}
                </div>
                <div className="pb-4">
                  <p className="text-[15px] text-gray-900">{t}</p>
                  <p className="text-[13px] text-gray-400">{time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Action({ Icon, label, tone }: { Icon: typeof Printer; label: string; tone?: "red" }) {
  return (
    <button className={`flex flex-1 flex-col items-center gap-1 rounded-2xl bg-white py-3 shadow-sm active:bg-gray-50 ${tone === "red" ? "text-red-500" : "text-blue-600"}`}>
      <Icon className="h-5 w-5" />
      <span className="text-[12px] font-medium text-gray-600">{label}</span>
    </button>
  );
}

function Sectioned({ sections }: { sections: { title: string; rows: [string, string][] }[] }) {
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">{s.title}</h2>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
            {s.rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-[14px] text-gray-500">{k}</span>
                <span className="text-right text-[15px] font-medium text-gray-900">{v}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
