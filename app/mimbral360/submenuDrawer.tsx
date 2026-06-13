// app\mimbral360\submenuDrawer.tsx
"use client";

/**
 * Drawer lateral para mostrar submenús de un item del Mimbral 360.
 * - Desliza desde la derecha, con overlay clickeable para cerrar.
 * - Respeta permisos: deshabilita opciones no accesibles.
 * - Soporta anidamiento (subItems) recursivo.
 * - Estilo consistente con el resto del sistema (fondos claros, acentos azules).
 */

import { Fragment } from "react";
import { XMarkIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Role } from "@/app/context/auth/AuthContext";
import type { SubMenuItem } from "@/lib/menu-items";

type Props = {
    open: boolean;
    title: string;
    onClose: () => void;
    subItems?: SubMenuItem[];
    role?: Role;
    canAccess: (route: string | undefined, role: Role | undefined) => boolean;
    onNavigate: (route: string) => void;
};

function ItemRow({
    item,
    depth = 0,
    role,
    canAccess,
    onNavigate,
}: {
    item: SubMenuItem;
    depth?: number;
    role?: Role;
    canAccess: (route: string | undefined, role: Role | undefined) => boolean;
    onNavigate: (route: string) => void;
}) {
    const allowed = canAccess(item.route, role) === true;
    const hasChildren = Array.isArray(item.subItems) && item.subItems.length > 0;

    return (
        <Fragment>
            <button
                onClick={() => {
                    if (!allowed) return;
                    if (item.route) onNavigate(item.route);
                }}
                className={[
                    "w-full flex items-center justify-between rounded-lg border p-3 transition",
                    "bg-white border-gray-200 shadow-sm hover:shadow",
                    allowed
                        ? "hover:border-blue-400 hover:-translate-y-0.5"
                        : "opacity-40 cursor-not-allowed pointer-events-none",
                    depth > 0 ? "ml-4" : "",
                ].join(" ")}
                aria-disabled={!allowed}
            >
                <span className="text-left">
                    <span className="block font-medium text-gray-900">{item.text}</span>
                    <span className="block text-xs text-gray-500">
                        {item.route ? item.route : hasChildren ? "Contiene submenú" : ""}
                    </span>
                </span>
                <ChevronRightIcon className="h-5 w-5 text-blue-600" />
            </button>

            {/* hijos */}
            {hasChildren && (
                <div className="mt-2 space-y-2">
                    {item.subItems!.map((child, idx) => (
                        <ItemRow
                            key={`${item.text}-${idx}`}
                            item={child}
                            depth={(depth ?? 0) + 1}
                            role={role}
                            canAccess={canAccess}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            )}
        </Fragment>
    );
}

export default function SubmenuDrawer({
    open,
    title,
    onClose,
    subItems,
    role,
    canAccess,
    onNavigate,
}: Props) {
    return (
        <div
            className={[
                "fixed inset-0 z-[60] transition",
                open ? "pointer-events-auto" : "pointer-events-none",
            ].join(" ")}
            aria-hidden={!open}
        >
            {/* Overlay */}
            <div
                className={[
                    "absolute inset-0 bg-black/30 transition-opacity",
                    open ? "opacity-100" : "opacity-0",
                ].join(" ")}
                onClick={onClose}
            />

            {/* Panel */}
            <aside
                className={[
                    "absolute right-0 top-0 h-full w-full sm:w-[480px] bg-page-bg shadow-xl",
                    "transition-transform duration-200 ease-out",
                    open ? "translate-x-0" : "translate-x-full",
                ].join(" ")}
            >
                {/* Header del drawer */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500">Selecciona un apartado</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100"
                        aria-label="Cerrar"
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    {Array.isArray(subItems) && subItems.length > 0 ? (
                        <div className="space-y-3">
                            {subItems.map((it, idx) => (
                                <ItemRow
                                    key={`${it.text}-${idx}`}
                                    item={it}
                                    role={role}
                                    canAccess={canAccess}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 italic">No hay submenús disponibles.</div>
                    )}
                </div>
            </aside>
        </div>
    );
}
