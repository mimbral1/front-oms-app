"use client";

import { type ComponentType } from "react";
import { ChevronLeft, Pencil, Share2, CheckCircle2 } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/mobile/ui";
import type { NativeItem } from "./NativeListScreen";

export type DetailSection = { title: string; rows: { label: string; value: string }[] };

export function NativeDetailView({
  title,
  right,
  badges,
  sections,
  timeline,
  onBack,
}: {
  title: string;
  right?: string;
  badges?: { label: string; tone?: BadgeTone }[];
  sections: DetailSection[];
  timeline?: { text: string; time: string }[];
  onBack: () => void;
}) {
  return (
    <div className="pt-2">
      <div className="flex items-center gap-1 px-2 pt-3">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="flex h-10 w-10 items-center justify-center rounded-full text-blue-600 active:bg-gray-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="text-[15px] font-medium text-blue-600">Volver</span>
      </div>

      {/* Hero */}
      <div className="px-4 pt-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-gray-900">
            {title}
          </h1>
          {right && <span className="shrink-0 text-[22px] font-bold text-gray-900">{right}</span>}
        </div>
        {badges && badges.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {badges.map((b) => (
              <Badge key={b.label} tone={b.tone}>{b.label}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 px-4 pt-4">
        <ActionBtn Icon={Pencil} label="Editar" />
        <ActionBtn Icon={CheckCircle2} label="Acción" />
        <ActionBtn Icon={Share2} label="Compartir" />
      </div>

      {/* Secciones */}
      <div className="space-y-4 px-4 pt-4">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
              {s.title}
            </h2>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
              {s.rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[14px] text-gray-500">{r.label}</span>
                  <span className="text-right text-[15px] font-medium text-gray-900">{r.value}</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {timeline && timeline.length > 0 && (
          <section>
            <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
              Actividad
            </h2>
            <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                    {i < timeline.length - 1 && <span className="w-px flex-1 bg-gray-200" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-[15px] text-gray-900">{t.text}</p>
                    <p className="text-[13px] text-gray-400">{t.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ Icon, label }: { Icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-white py-3 text-blue-600 shadow-sm active:bg-gray-50">
      <Icon className="h-5 w-5" />
      <span className="text-[12px] font-medium text-gray-600">{label}</span>
    </button>
  );
}

// Construye un detalle genérico a partir de un item de lista.
export function detailFromItem(item: NativeItem): {
  title: string;
  right?: string;
  badges?: { label: string; tone?: BadgeTone }[];
  sections: DetailSection[];
  timeline: { text: string; time: string }[];
} {
  const infoRows = [
    { label: "Identificador", value: item.id },
    ...(item.lines?.map((l, i) => ({ label: i === 0 ? "Detalle" : "Información", value: l.text })) ?? []),
  ];
  return {
    title: item.title,
    right: item.right,
    badges: item.badges,
    sections: [
      { title: "Resumen", rows: infoRows },
      {
        title: "Datos",
        rows: [
          { label: "Estado", value: item.badges?.[0]?.label ?? "Activo" },
          { label: "Creado", value: "Hoy 17:26" },
          { label: "Actualizado", value: "Hace 5 min" },
        ],
      },
    ],
    timeline: [
      { text: "Registro creado", time: "Hoy 17:26" },
      { text: "Actualización de estado", time: "Hoy 17:31" },
      { text: "Última sincronización", time: "Hace 5 min" },
    ],
  };
}
