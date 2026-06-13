// components\layout\sidebar.tsx

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import UserBadge from "../ui/badge/UserBadge";
import { Role, useAuth } from "@/app/context/auth/AuthContext";
import { ROUTE_PERMISSIONS } from "@/lib/route-permissions";
import {
    buildMenuItems,
    type MenuItem,
    type SubMenuItem,
} from "@/lib/menu-items";
import { LogOutIcon } from "lucide-react";
import { flattenMenuForSearch } from "@/lib/menu-search";
import SearchModal from "../presets/search/searchModal";

// interface SubMenuItem {
//   text: string;
//   route?: string;
//   hasSubItems?: boolean;
//   subItems?: SubMenuItem[];
// }

// interface MenuItem {
//   text: string;
//   icon: JSX.Element;
//   route?: string;
//   hasSubSidebar?: boolean;
//   subSidebarItems?: SubMenuItem[];
//   onClick?: () => void;
// }

const canAccess = (route: string | undefined, role: Role | undefined) => {
    if (!route) return true; // items sin ruta (solo submenús)
    const rule = ROUTE_PERMISSIONS.find((r) => r.pattern.test(route));
    return !rule || (role && rule.allowed.includes(role));
};
const subTreeAllowed = (
    items: SubMenuItem[] | undefined,
    role: Role | undefined
): boolean =>
    !!items?.some(
        (i) => canAccess(i.route, role) || subTreeAllowed(i.subItems, role)
    );
export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
    const [activeSubSub, setActiveSubSub] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();
    const role = user?.role;

    // Menú único, centralizado
    const menuItems: MenuItem[] = useMemo(() => buildMenuItems(logout), [logout]);

    // para log out 
    const [showUserActions, setShowUserActions] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const toggleUserMenu = () => {
        setUserMenuOpen((v) => !v);
    };

    const closeUserMenu = () => {
        setUserMenuOpen(false);
    };

    const toggleUserActions = () => {
        setShowUserActions((v) => !v);
    };

    const closeUserActions = () => {
        setShowUserActions(false);
    };

    ////////////////////////

    // busqueda
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const searchIndex = useMemo(
        () => flattenMenuForSearch(menuItems),
        [menuItems]
    );

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        return searchIndex.filter((item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, searchIndex]);

    ////////////////////////


    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 640);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        (window as any).router = router;
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node)
            ) {
                setActiveSection(null);
                setActiveSubSection(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const disabledStyle = "opacity-40 cursor-not-allowed pointer-events-none";

    const handleMouseEnter = () => {
        if (!isMobile) setOpen(true);
    };

    const handleMouseLeave = () => {
        if (!isMobile) setOpen(false);
    };

    const closeIfMobile = () => {
        if (isMobile) {
            setOpen(false);
            setActiveSection(null);
            setActiveSubSection(null);
            setActiveSubSub(null);
            setUserMenuOpen(false);
            setShowUserActions(false);
        }
    };

    const handleMenuClick = (item: MenuItem, allowed: boolean) => {

        if (item.text === "Buscador") {
            setSearchOpen(true);
            return;
        }

        // Si el usuario no tiene permisos para el elemento, bloqueamos el clic.
        if (!allowed) {
            return;
        }

        // Si el elemento tiene una función onClick (como el botón de logout), la ejecutamos.
        if (item.onClick) {
            item.onClick();
            if (isMobile) {
                setOpen(false);
            }
            return; // Salimos de la función después de ejecutar el onClick.
        }

        // Si el elemento tiene sub-menú, manejamos su estado.
        if (item.hasSubSidebar) {
            setActiveSection(activeSection === item.text ? null : item.text);
            setActiveSubSection(null);
        }
        // Si tiene una ruta, navegamos a ella.
        else if (item.route) {
            router.push(item.route);
            if (isMobile) {
                setOpen(false);
            }
        }
    };
    const handleSubItemClick = (it: SubMenuItem, allowed: boolean) => {
        if (!allowed) return;
        if (it.hasSubItems) {
            setActiveSubSection(activeSubSection === it.text ? null : it.text);
            setActiveSubSub(null);
        } else if (it.route) {
            router.push(it.route);
            closeIfMobile();
        }
    };
    const handleSubSubClick = (it: SubMenuItem, allowed: boolean) => {
        if (!allowed) return;
        if (it.hasSubItems) {
            setActiveSubSub(activeSubSub === it.text ? null : it.text);
        } else if (it.route) {
            router.push(it.route);
            closeIfMobile();
        }
    };

    /* const handleSubSubClick = (item: SubMenuItem) => {
    if (item.route) {
      router.push(item.route);
    } else {
      setActiveSubSub(activeSubSub === item.text ? null : item.text);
    }
  };	 */
    const activeMenuItem = menuItems.find((item) => item.text === activeSection);

    return (
        <div className="flex" ref={sidebarRef}>
            {/* Sidebar Principal */}
            <nav
                className={`fixed top-0 h-screen bg-[#2F2F2F] text-white transition-all duration-300 z-[100]
    flex flex-col overflow-y-hidden
    ${open ? "w-60" : "w-[70px]"}
    ${isMobile && !open ? "-translate-x-full" : "translate-x-0"}
  `}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Header */}
                <div
                    className="bg-blue-600 p-4 flex justify-center items-center cursor-pointer flex-shrink-0"
                    onClick={() => router.push("/mimbral360")}
                >
                    <h2 className={`text-xl font-semibold ${open ? "ml-2" : ""}`}>
                        {open ? "Mimbral 360" : "360"}
                    </h2>
                </div>

                <div className="border-b border-gray-700 flex-shrink-0" />

                {/* Menu Items (SIN Alertas ni Buscador) */}
                <ul className="py-2">
                    {menuItems.map((item, idx) => {
                        if (item.text === "Alertas" || item.text === "Buscador") {
                            return null;
                        }

                        const allowed =
                            canAccess(item.route, role) ||
                            subTreeAllowed(item.subSidebarItems, role);

                        return (
                            <li key={idx}>
                                <button
                                    onClick={() => handleMenuClick(item, allowed)}
                                    className={`w-full px-4 py-3 flex items-center transition-colors duration-200
              ${open ? "justify-start" : "justify-center"}
              ${activeSection === item.text ? "bg-gray-700" : "hover:bg-gray-700"}
              ${!allowed ? disabledStyle : ""}`}
                                >
                                    <span className={open ? "mr-4" : ""}>{item.icon}</span>
                                    {open && <span>{item.text}</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {/* Footer (ya NO es absoluto, vive en el flujo) */}
                <div className="mt-auto w-full">
                    {/* Separador de sección inferior */}
                    <div className="border-t border-gray-700 mb-2" />

                    {/* ALERTAS */}
                    <button
                        onClick={() =>
                            handleMenuClick(
                                menuItems.find((i) => i.text === "Alertas")!,
                                true
                            )
                        }
                        className={`w-full px-4 py-3 flex items-center transition-colors duration-200
        ${open ? "justify-start" : "justify-center"}
        hover:bg-gray-700`}
                    >
                        <span className={open ? "mr-4" : ""}>
                            {menuItems.find((i) => i.text === "Alertas")!.icon}
                        </span>
                        {open && <span>Alertas</span>}
                    </button>

                    {/* BUSCADOR */}
                    <button
                        onClick={() =>
                            handleMenuClick(
                                menuItems.find((i) => i.text === "Buscador")!,
                                true
                            )
                        }
                        className={`w-full px-4 py-3 flex items-center transition-colors duration-200
        ${open ? "justify-start" : "justify-center"}
        hover:bg-gray-700`}
                    >
                        <span className={open ? "mr-4" : ""}>
                            {menuItems.find((i) => i.text === "Buscador")!.icon}
                        </span>
                        {open && <span>Buscador</span>}
                    </button>

                    <div className="border-t border-gray-700 my-2" />

                    {/* Usuario + Logout */}
                    <div
                        className="relative"
                        onMouseEnter={() => !isMobile && setUserMenuOpen(true)}
                        onMouseLeave={() => !isMobile && setUserMenuOpen(false)}
                    >
                        {/* LOGOUT */}
                        {userMenuOpen && (
                            <ul className="border-gray-700"> {/* border-t */}
                                <li>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setUserMenuOpen(false);
                                            if (isMobile) setOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 flex items-center transition-colors duration-200
                ${open ? "justify-start" : "justify-center"}
                hover:bg-gray-700`}
                                    >
                                        <span className={open ? "mr-4" : ""}>
                                            <LogOutIcon className="h-6 w-6" />
                                        </span>
                                        {open && <span>Cerrar sesión</span>}
                                    </button>
                                </li>
                            </ul>
                        )}

                        {/* USER BADGE */}
                        <div
                            onClick={() => setUserMenuOpen((v) => !v)}
                            className="cursor-pointer pb-4"
                        >
                            {user?.nombre ? (
                                <UserBadge name={user.nombre} open={open} />
                            ) : (
                                <UserBadge name="Mimbral360" open={open} />
                            )}
                        </div>
                    </div>
                </div>
            </nav>



            {/* Sub Sidebar */}
            {activeMenuItem?.hasSubSidebar && (
                <nav
                    className={`fixed top-0 h-screen bg-white text-gray-800 transition-all duration-300 z-[90]
          w-60 border-r border-gray-200
          ${open ? "left-60" : "left-[70px]"}
          ${isMobile && !open ? "-translate-x-full" : "translate-x-0"}
        `}
                >
                    {/* Título + search */}
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold">{activeMenuItem.text}</h2>
                    </div>
                    {/* <div className="py-2">
            <input
              type="text"
              placeholder="Buscar…"
              className="w-full px-4 py-2 border-b border-gray-200 focus:outline-none"
            />
          </div> */}

                    {/* ---------- NIVEL‑2 ---------- */}

                    {/* <ul className="py-2">
            {activeMenuItem.subSidebarItems?.map((subItem) => (
              <li key={subItem.text}>
                <button
                  onClick={() => handleSubItemClick(subItem)}
                  className={`w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-100
                  ${activeSubSection === subItem.text ? "bg-gray-100" : ""}
                `}
                >
                  <span>{subItem.text}</span>
                  {subItem.hasSubItems && (
                    <ChevronRightIcon
                      className={`h-4 w-4 transition-transform ${
                        activeSubSection === subItem.text ? "rotate-90" : ""
                      }`}
                    />
                  )}
                </button>

                {/* ---------- NIVEL‑3 (si existe) ---------- /}
                {subItem.hasSubItems && activeSubSection === subItem.text && (
                  <ul className="bg-gray-50 py-1">
                    {subItem.subItems?.map((nested) => (
                      <li key={nested.text}>
                        <button
                          onClick={() => handleSubSubClick(nested)}
                          className="w-full pl-8 pr-4 py-2 flex items-center justify-between text-left text-sm hover:bg-gray-100"
                        >
                          {nested.text}
                          {nested.hasSubItems && (
                            <ChevronRightIcon
                              className={`h-4 w-4 transition-transform ${
                                activeSubSub === nested.text ? "rotate-90" : ""
                              }`}
                            />
                          )}
                        </button>
                        {/* ---------- NIVEL‑4 (tercer sub‑menú) ---------- /}
                        {nested.hasSubItems && activeSubSub === nested.text && (
                          <ul className="bg-gray-100 py-1">
                            {nested.subItems?.map((third) => (
                              <li key={third.text}>
                                <button
                                  onClick={() => router.push(third.route!)}
                                  className="w-full pl-12 pr-4 py-2  justify-between text-left text-sm hover:bg-gray-200"
                                >
                                  {third.text}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul> */}
                    <ul className="py-2">
                        {activeMenuItem.subSidebarItems?.map((sub) => {
                            const allowed =
                                canAccess(sub.route, role) ||
                                subTreeAllowed(sub.subItems, role);

                            return (
                                <li key={sub.text}>
                                    <button
                                        onClick={() => handleSubItemClick(sub, allowed)}
                                        className={`w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-100
                      ${activeSubSection === sub.text ? "bg-gray-100" : ""}
                      ${!allowed ? disabledStyle : ""}`}
                                    >
                                        <span>{sub.text}</span>
                                        {sub.hasSubItems && (
                                            <ChevronRightIcon
                                                className={`h-4 w-4 transition-transform ${activeSubSection === sub.text ? "rotate-90" : ""
                                                    }`}
                                            />
                                        )}
                                    </button>

                                    {/* ------ nivel 3 ------ */}
                                    {sub.hasSubItems && activeSubSection === sub.text && (
                                        <ul className="bg-gray-50 py-1">
                                            {sub.subItems?.map((nested) => {
                                                const allowed2 =
                                                    canAccess(nested.route, role) ||
                                                    subTreeAllowed(nested.subItems, role);

                                                return (
                                                    <li key={nested.text}>
                                                        <button
                                                            onClick={() =>
                                                                handleSubSubClick(nested, allowed2)
                                                            }
                                                            className={`w-full pl-8 pr-4 py-2 flex items-center justify-between text-left text-sm hover:bg-gray-100
                                ${!allowed2 ? disabledStyle : ""}`}
                                                        >
                                                            {nested.text}
                                                            {nested.hasSubItems && (
                                                                <ChevronRightIcon
                                                                    className={`h-4 w-4 transition-transform ${activeSubSub === nested.text
                                                                        ? "rotate-90"
                                                                        : ""
                                                                        }`}
                                                                />
                                                            )}
                                                        </button>

                                                        {/* ------ nivel 4 ------ */}
                                                        {nested.hasSubItems &&
                                                            activeSubSub === nested.text && (
                                                                <ul className="bg-gray-100 py-1">
                                                                    {nested.subItems?.map((third) => {
                                                                        const allowed3 = canAccess(
                                                                            third.route,
                                                                            role
                                                                        );

                                                                        return (
                                                                            <li key={third.text}>
                                                                                <button
                                                                                    onClick={() =>
                                                                                        allowed3 &&
                                                                                        router.push(third.route!)
                                                                                    }
                                                                                    className={`w-full pl-12 pr-4 py-2 text-left text-sm hover:bg-gray-200
                                          ${!allowed3 ? disabledStyle : ""}`}
                                                                                >
                                                                                    {third.text}
                                                                                </button>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            )}
            <SearchModal
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                menuItems={menuItems}
                role={role}
            />

        </div>
    );
}
