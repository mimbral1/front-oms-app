"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  ScreenHeader,
  SearchBar,
  Pills,
  Card,
  Badge,
  ChevronRight,
  type BadgeTone,
} from "@/components/mobile/ui";
import { FileText, Clock } from "lucide-react";
import { NativeDetailView, detailFromItem } from "./NativeDetail";

// Genera una config nativa de muestra para una sección de submenú (leaf) que aún
// no tiene pantalla a medida. Así cada sección abre una pantalla real (lista +
// detalle), no un placeholder. Los datos se reemplazarán por los del backend.
export function genericConfigFor(title: string): NativeListConfig {
  const items: NativeItem[] = Array.from({ length: 6 }).map((_, i) => {
    const ok = i % 3 === 0;
    return {
      id: `${title}-${1000 + i}`,
      title: `${title} #${1000 + i}`,
      lines: [
        { Icon: FileText, text: `Registro ${1000 + i}` },
        { Icon: Clock, text: "Actualizado hoy" },
      ],
      badges: [{ label: ok ? "Activo" : "Pendiente", tone: ok ? "green" : "amber" }],
      accent: ok ? "green" : "blue",
    };
  });
  return {
    title,
    subtitle: "Registros de la sección",
    searchPlaceholder: `Buscar en ${title}`,
    items,
  };
}

export type NativeLine = { Icon: ComponentType<{ className?: string }>; text: string };
export type NativeItem = {
  id: string;
  bucket?: string; // para filtrar por pills
  title: string;
  right?: string;
  lines?: NativeLine[];
  badges?: { label: string; tone?: BadgeTone }[];
  accent?: "red" | "blue" | "amber" | "green" | "none";
  progress?: number; // 0..100
};
export type NativePill = { key: string; label: string; tone?: "blue" | "red" | "default" };

export type NativeListConfig = {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  pills?: NativePill[]; // el primero debe ser el "todos" (key "all" recomendado)
  items: NativeItem[];
  showAdd?: boolean;
};

export default function NativeListScreen({
  config,
  onBack,
}: {
  config: NativeListConfig;
  onBack?: () => void;
}) {
  const { title, subtitle, searchPlaceholder, pills, items, showAdd = true } = config;
  const [active, setActive] = useState(pills?.[0]?.key ?? "all");
  const [selected, setSelected] = useState<NativeItem | null>(null);

  const pillItems = useMemo(
    () =>
      pills?.map((p) => ({
        ...p,
        count:
          p.key === (pills[0]?.key ?? "all")
            ? items.length
            : items.filter((i) => i.bucket === p.key).length,
      })),
    [pills, items]
  );

  const visible = useMemo(() => {
    if (!pills || active === (pills[0]?.key ?? "all")) return items;
    return items.filter((i) => i.bucket === active);
  }, [items, pills, active]);

  if (selected) {
    const d = detailFromItem(selected);
    return <NativeDetailView {...d} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="pt-2">
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        onRefresh={() => {}}
        onAdd={showAdd ? () => {} : undefined}
      />
      {searchPlaceholder && <SearchBar placeholder={searchPlaceholder} />}
      {pillItems && <Pills active={active} onChange={setActive} items={pillItems} />}

      <div className="space-y-3 px-4 pt-3">
        {visible.map((it) => (
          <Card key={it.id} accent={it.accent ?? "blue"} onClick={() => setSelected(it)}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate text-[17px] font-bold text-gray-900">{it.title}</h3>
              {it.right && (
                <span className="shrink-0 text-[16px] font-bold text-gray-900">{it.right}</span>
              )}
            </div>
            {it.lines?.map((l, idx) => (
              <div key={idx} className="mt-1.5 flex items-center gap-2 text-[14px] text-gray-500">
                <l.Icon className="h-4 w-4 shrink-0" />
                <span>{l.text}</span>
              </div>
            ))}
            {typeof it.progress === "number" && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${it.progress}%` }} />
              </div>
            )}
            {(it.badges?.length || true) && (
              <div className="mt-3 flex items-center gap-2">
                {it.badges?.map((b) => (
                  <Badge key={b.label} tone={b.tone}>{b.label}</Badge>
                ))}
                <ChevronRight className="ml-auto h-5 w-5 text-gray-300" />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
