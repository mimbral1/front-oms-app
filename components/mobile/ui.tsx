"use client";

// Primitivos de UI mobile-nativa (estilo App Store) reutilizados por las
// pantallas de /m/*. Tailwind v3.

import { ReactNode } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Bell,
  ChevronRight,
} from "lucide-react";

// Formatea CLP: 47980 -> "$47.980"
export const clp = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export function ScreenHeader({
  title,
  subtitle,
  onAdd,
  onRefresh,
}: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex items-start justify-between px-4 pt-3">
      <div className="min-w-0">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[15px] text-gray-400">{subtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-1">
        {onRefresh && (
          <button
            onClick={onRefresh}
            aria-label="Actualizar"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-blue-600 active:bg-gray-200"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            aria-label="Nuevo"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm active:bg-blue-700"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}

export function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <div className="px-4 pt-3">
      <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3">
        <Search className="h-5 w-5 shrink-0 text-gray-400" />
        <input
          placeholder={placeholder}
          className="w-full bg-transparent text-[15px] text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
        <SlidersHorizontal className="h-5 w-5 shrink-0 text-gray-400" />
      </div>
    </div>
  );
}

export type PillTone = "blue" | "red" | "default";

export function Pills({
  items,
  active,
  onChange,
}: {
  items: { key: string; label: string; count?: number; tone?: PillTone }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
      {items.map((it) => {
        const isActive = it.key === active;
        const tone = it.tone ?? "default";
        const base =
          "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-semibold transition-colors";
        const cls = isActive
          ? "border-blue-600 bg-blue-600 text-white"
          : tone === "red"
            ? "border-gray-200 bg-white text-red-500"
            : "border-gray-200 bg-white text-gray-700";
        const countCls = isActive
          ? "bg-white/25 text-white"
          : "bg-gray-100 text-gray-500";
        return (
          <button key={it.key} onClick={() => onChange(it.key)} className={`${base} ${cls}`}>
            {it.label}
            {typeof it.count === "number" && (
              <span className={`min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${countCls}`}>
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function AlertBanner({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className="px-4 pt-3">
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-left active:bg-red-100"
      >
        <Bell className="h-5 w-5 shrink-0 text-red-500" />
        <span className="flex-1 text-[15px] text-red-600">{children}</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-red-400" />
      </button>
    </div>
  );
}

export type BadgeTone = "red" | "amber" | "gray" | "green" | "blue";

export function Badge({
  children,
  tone = "gray",
  icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
}) {
  const map: Record<BadgeTone, string> = {
    red: "bg-red-500 text-white",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-500",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${map[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

export function Card({
  children,
  accent = "none",
  onClick,
}: {
  children: ReactNode;
  accent?: "red" | "blue" | "amber" | "green" | "none";
  onClick?: () => void;
}) {
  const bar: Record<string, string> = {
    red: "before:bg-red-500",
    blue: "before:bg-blue-500",
    amber: "before:bg-amber-400",
    green: "before:bg-emerald-500",
    none: "before:bg-transparent",
  };
  return (
    <button
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-2xl bg-white p-4 text-left shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1.5 ${bar[accent]} active:bg-gray-50`}
    >
      {children}
    </button>
  );
}

export { ChevronRight };
