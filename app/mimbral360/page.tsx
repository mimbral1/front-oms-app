// app\mimbral360\page.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildMenuItems, MenuItem, SubMenuItem } from "@/lib/menu-items";
import { ROUTE_PERMISSIONS } from "@/lib/route-permissions";
import { Role, useAuth } from "@/app/context/auth/AuthContext";
import { PageHeader } from "@/components/layout/page-header";
import CardMegaMenu from "./cardMegaMenu";

const canAccess = (route: string | undefined, role: Role | undefined): boolean => {
    if (!route) return true;
    const rule = ROUTE_PERMISSIONS.find((r) => r.pattern.test(route));
    return !rule || (!!role && rule.allowed.includes(role));
};

const subTreeAllowed = (items: SubMenuItem[] | undefined, role: Role | undefined): boolean =>
    !!items?.some((i) => canAccess(i.route, role) || subTreeAllowed(i.subItems, role));

export default function Mimbral360Page() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const role = user?.role;

    // Menú base
    const baseMenuItems: MenuItem[] = useMemo(() => buildMenuItems(logout), [logout]);

    //  Ocultar en Mimbral360: Configuraciones, Monitoreo y LogOut
    const filteredMenuItems: MenuItem[] = useMemo(
        () =>
            baseMenuItems.filter(
                (m) => !/^(Configuraciones|Monitoreo|LogOut|Buscador)$/i.test(m.text)
            ),
        [baseMenuItems]
    );

    // Estado para mega-popover anclado
    const [openIdx, setOpenIdx] = useState<number | null>(null);
    const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const isDisabled = (item: MenuItem) => {
        const direct = canAccess(item.route, role);
        const subtree = subTreeAllowed(item.subSidebarItems, role);
        return !direct && !subtree;
    };

    const handleCardPrimaryClick = (item: MenuItem, idx: number) => {
        // Acciones (aunque en esta vista ya no mostramos LogOut)
        if (item.onClick) {
            item.onClick();
            return;
        }
        // Ruta directa sin submenú
        if (item.route && !item.hasSubSidebar) {
            router.push(item.route);
            return;
        }
        // Submenú
        if (item.hasSubSidebar) {
            setOpenIdx((prev) => (prev === idx ? null : idx));
            return;
        }
        if (item.route) router.push(item.route);
    };

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                title="Mimbral 360"
                description="Accesos rápidos a todos los apartados del sistema."
            />

            <div className="flex-1 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredMenuItems.map((item, idx) => {
                        const disabled = isDisabled(item);

                        return (
                            <div key={item.text} className="relative">
                                <button
                                    ref={(el: HTMLButtonElement | null) => {
                                        cardRefs.current[idx] = el;
                                    }}
                                    onClick={() => !disabled && handleCardPrimaryClick(item, idx)}
                                    className={[
                                        "group text-left w-full rounded-xl bg-white border border-gray-200",
                                        "p-5 shadow-sm transition-all duration-150 ease-in-out",
                                        disabled
                                            ? "opacity-40 cursor-not-allowed pointer-events-none"
                                            : "hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5",
                                    ].join(" ")}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={[
                                                "shrink-0 flex items-center justify-center rounded-lg p-2",
                                                disabled
                                                    ? "bg-gray-100 text-gray-400"
                                                    : "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
                                            ].join(" ")}
                                        >
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div
                                                className={[
                                                    "font-medium",
                                                    disabled ? "text-gray-500" : "text-gray-900",
                                                ].join(" ")}
                                            >
                                                {item.text}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {item.onClick
                                                    ? "Acción"
                                                    : item.route && !item.hasSubSidebar
                                                        ? "Ir al módulo"
                                                        : item.hasSubSidebar
                                                            ? "Contiene submenú"
                                                            : ""}
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Mega-popover anclado al card */}
                                {item.hasSubSidebar && (
                                    <CardMegaMenu
                                        open={openIdx === idx}
                                        anchorEl={cardRefs.current[idx]}
                                        items={item.subSidebarItems}
                                        role={role}
                                        canAccess={canAccess}
                                        onClose={() => setOpenIdx(null)}
                                        onNavigate={(route) => {
                                            setOpenIdx(null);
                                            router.push(route);
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
