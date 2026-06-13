// components\layout\sidebar.tsx

"use client";

import { useState, useEffect, useRef, useMemo, useCallback, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRightIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import UserBadge from "../ui/badge/UserBadge";
import { Role, useAuth } from "@/app/context/auth/AuthContext";
import { ROUTE_PERMISSIONS } from "@/lib/route-permissions";
import {
  buildMenuItems,
  type MenuItem,
  type SubMenuItem,
} from "@/lib/menu-items";
import { LogOutIcon, PinIcon, PinOffIcon } from "lucide-react";
import SearchModal from "../presets/search/searchModal";
import { SimpleModal } from "@/components/ui/modal";

const canAccess = (route: string | undefined, role: Role | undefined) => {
  if (!route) return true;
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

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
};

const findFirstAllowedSubRoute = (
  items: SubMenuItem[] | undefined,
  role: Role | undefined
): string | null => {
  if (!items?.length) return null;
  for (const item of items) {
    if (item.route && canAccess(item.route, role)) {
      return item.route;
    }
    const nested = findFirstAllowedSubRoute(item.subItems, role);
    if (nested) return nested;
  }
  return null;
};

const findFirstAllowedRoute = (
  item: MenuItem,
  role: Role | undefined
): string | null => {
  if (item.route && canAccess(item.route, role)) {
    return item.route;
  }
  return findFirstAllowedSubRoute(item.subSidebarItems, role);
};

function isRouteActive(route: string | undefined, pathname: string): boolean {
  if (!route) return false;
  return pathname === route || pathname.startsWith(route + "/");
}

type ActiveTrail = {
  chain: string[];
  score: number;
};

const getRouteMatchScore = (
  route: string | undefined,
  pathname: string
): number => {
  if (!route) return -1;
  if (pathname === route) return 10_000 + route.length;
  if (pathname.startsWith(route + "/")) return route.length;
  return -1;
};

const findBestActiveTrail = (
  items: SubMenuItem[] | undefined,
  pathname: string,
  parentChain: string[] = []
): ActiveTrail | null => {
  if (!items?.length) return null;

  let best: ActiveTrail | null = null;

  for (const item of items) {
    const chain = [...parentChain, item.text];
    const ownScore = getRouteMatchScore(item.route, pathname);
    let candidate: ActiveTrail | null =
      ownScore >= 0 ? { chain, score: ownScore } : null;

    const nested = findBestActiveTrail(item.subItems, pathname, chain);
    if (nested && (!candidate || nested.score > candidate.score)) {
      candidate = nested;
    }

    if (candidate && (!best || candidate.score > best.score)) {
      best = candidate;
    }
  }

  return best;
};

const getActiveLabelSet = (
  items: SubMenuItem[] | undefined,
  pathname: string
): Set<string> => {
  const best = findBestActiveTrail(items, pathname);
  return new Set(best?.chain ?? []);
};

function isMenuSectionActive(item: MenuItem, pathname: string): boolean {
  if (isRouteActive(item.route, pathname)) return true;
  return (
    item.subSidebarItems?.some(
      (sub) =>
        isRouteActive(sub.route, pathname) ||
        sub.subItems?.some(
          (nested) =>
            isRouteActive(nested.route, pathname) ||
            nested.subItems?.some((deep) => isRouteActive(deep.route, pathname))
        )
    ) ?? false
  );
}

interface SidebarProps {
  pinned: boolean;
  onPinnedChange: (pinned: boolean) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

function SidebarLabelWithTooltip({
  text,
  className = "",
  wrap = true,
  showTooltip = true,
}: {
  text: string;
  className?: string;
  wrap?: boolean;
  showTooltip?: boolean;
}) {
  return (
    <span className="relative group/label min-w-0 flex-1">
      <span
        className={`block ${wrap ? "whitespace-normal break-words" : "truncate"
          } ${className}`}
      >
        {text}
      </span>
      {showTooltip && (
        <span
          className="pointer-events-none absolute bottom-full left-0 z-[260] mb-1 hidden max-w-[300px] rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover/label:block"
          role="tooltip"
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function Sidebar({
  pinned,
  onPinnedChange,
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [activeSubSub, setActiveSubSub] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, logout } = useAuth();
  const role = user?.role;

  const menuItems: MenuItem[] = useMemo(() => buildMenuItems(logout), [logout]);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sidebar abierto = hover o pinned
  const isOpen = open || pinned;

  // Cerrar popover de usuario al hacer click fuera
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // Sync: si el pin se activa, abrir
  useEffect(() => {
    if (pinned) setOpen(true);
  }, [pinned]);

  const quickAccessRoutes = useMemo(() => {
    const candidates = menuItems.filter(
      (i) => i.text !== "Alertas" && i.text !== "Buscador"
    );
    return candidates.map((item) => findFirstAllowedRoute(item, role));
  }, [menuItems, role]);

  // Atajos globales
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Algunos eventos sintéticos (autocomplete del navegador, dictado por
      // voz, IME composition) llegan con `key=undefined`. Sin este guard,
      // `e.key.toLowerCase()` crashea con "Cannot read properties of
      // undefined (reading 'toLowerCase')". El "" hace que ninguno de los
      // shortcuts matchee (todos comparan key === "b"/"r"/"k"/etc).
      const key = (e.key ?? "").toLowerCase();

      if (e.key === "Escape") {
        const hasOpenUi =
          searchOpen ||
          userMenuOpen ||
          shortcutsOpen ||
          logoutConfirmOpen ||
          (isMobile && open) ||
          !!activeSection ||
          !!activeSubSection ||
          !!activeSubSub;

        if (!hasOpenUi) return;

        e.preventDefault();
        setSearchOpen(false);
        setUserMenuOpen(false);
        setShortcutsOpen(false);
        setLogoutConfirmOpen(false);
        setActiveSection(null);
        setActiveSubSection(null);
        setActiveSubSub(null);
        if (isMobile) {
          setOpen(false);
          onMobileOpenChange?.(false);
        }
        return;
      }

      if (isTypingTarget(e.target)) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "b") {
        e.preventDefault();
        onPinnedChange(!pinned);
        if (!pinned) setOpen(true);
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && /^[1-9]$/.test(e.key)) {
        const index = Number(e.key) - 1;
        const targetRoute = quickAccessRoutes[index];
        if (!targetRoute) return;
        e.preventDefault();
        router.push(targetRoute);
        closeIfMobile();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && key === "r") {
        e.preventDefault();
        window.location.reload();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "r") {
        e.preventDefault();
        router.refresh();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === "/") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "l") {
        e.preventDefault();
        setLogoutConfirmOpen(true);
        setUserMenuOpen(false);
        return;
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    activeSection,
    activeSubSection,
    activeSubSub,
    isMobile,
    logoutConfirmOpen,
    onMobileOpenChange,
    onPinnedChange,
    open,
    pinned,
    quickAccessRoutes,
    router,
    searchOpen,
    shortcutsOpen,
    userMenuOpen,
  ]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setOpen(mobileOpen);
    }
  }, [isMobile, mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        if (isMobile) {
          setOpen(false);
          onMobileOpenChange?.(false);
        } else if (!pinned) {
          setActiveSection(null);
          setActiveSubSection(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pinned, isMobile, onMobileOpenChange]);

  useEffect(() => {
    if (isMobile) {
      setOpen(false);
      onMobileOpenChange?.(false);
    }
     
  }, [pathname]);

  const disabledStyle = "opacity-40 cursor-not-allowed pointer-events-none";

  const handleMouseEnter = useCallback(() => {
    if (!isMobile && !pinned) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      hoverTimeoutRef.current = setTimeout(() => setOpen(true), 80);
    }
  }, [isMobile, pinned]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile && !pinned) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      closeTimeoutRef.current = setTimeout(() => {
        setOpen(false);
        setActiveSection(null);
        setActiveSubSection(null);
        setActiveSubSub(null);
        setUserMenuOpen(false);
      }, 300);
    }
  }, [isMobile, pinned]);

  const closeIfMobile = () => {
    if (isMobile) {
      setOpen(false);
      onMobileOpenChange?.(false);
      setActiveSection(null);
      setActiveSubSection(null);
      setActiveSubSub(null);
      setUserMenuOpen(false);
    }
  };

  const isModifiedClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;
  };

  const handleRouteAnchorClick = (
    e: ReactMouseEvent<HTMLAnchorElement>,
    route: string,
    closeOnMobile = true
  ) => {
    if (isModifiedClick(e)) return;
    e.preventDefault();
    router.push(route);
    if (closeOnMobile) {
      closeIfMobile();
    }
  };

  const handleMenuClick = (item: MenuItem, allowed: boolean) => {
    if (item.text === "Buscador") {
      setSearchOpen(true);
      return;
    }
    if (!allowed) return;

    if (item.onClick) {
      item.onClick();
      if (isMobile) {
        setOpen(false);
        onMobileOpenChange?.(false);
      }
      return;
    }

    if (item.hasSubSidebar) {
      setActiveSection(activeSection === item.text ? null : item.text);
      setActiveSubSection(null);
    } else if (item.route) {
      router.push(item.route);
      if (isMobile) {
        setOpen(false);
        onMobileOpenChange?.(false);
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

  const activeMenuItem = menuItems.find((item) => item.text === activeSection);
  const activeMenuTrail = useMemo(
    () => getActiveLabelSet(activeMenuItem?.subSidebarItems, pathname),
    [activeMenuItem?.subSidebarItems, pathname]
  );

  // Estilos scrollbar
  const sidebarScrollStyles = `
  [&::-webkit-scrollbar]:w-0
  hover:[&::-webkit-scrollbar]:w-1.5
  [&::-webkit-scrollbar-thumb]:bg-transparent
  hover:[&::-webkit-scrollbar-thumb]:bg-white/30
  [&::-webkit-scrollbar-thumb]:rounded-full
  scrollbar-width:none
  hover:scrollbar-width:thin
  `;

  const [showScrollHint, setShowScrollHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const checkScroll = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight;
      const atBottom =
        Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
      setShowScrollHint(hasOverflow && !atBottom);
    };
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [menuItems, isOpen]);

  // Items visibles (sin Alertas ni Buscador), con orden explícito por grupo.
  const visibleItems = useMemo(() => {
    const groupOrder: Record<string, number> = {
      "Ventas": 1,
      "Catálogo e Inventario": 2,
      "Finanzas": 3,
      "CRM": 4,
      "Operaciones": 5,
      "Administración": 6,
    };

    return menuItems
      .filter((i) => i.text !== "Alertas" && i.text !== "Buscador")
      .slice()
      .sort((a, b) => {
        const aOrder = groupOrder[a.group ?? ""] ?? 999;
        const bOrder = groupOrder[b.group ?? ""] ?? 999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return 0;
      });
  }, [menuItems]);

  return (
    <div className="flex" ref={sidebarRef}>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Cerrar menu lateral"
          onClick={closeIfMobile}
          className="fixed inset-0 z-[95] bg-black/40"
        />
      )}

      {/* ========== Sidebar Principal ========== */}
      <nav
        className={`fixed top-0 h-screen bg-[#2F2F2F] text-white transition-all duration-300 z-[100]
          flex flex-col
          ${isMobile
            ? isOpen ? "w-[80vw] max-w-[300px]" : "w-[70px] -translate-x-full"
            : isOpen ? "w-60" : "w-[70px]"
          }
          ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
        `}
        style={isMobile ? { paddingTop: "env(safe-area-inset-top, 0px)" } : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className={`relative bg-blue-600 p-4 flex items-center flex-shrink-0 ${isOpen ? "justify-between" : "justify-center"}`}>
          <h2
            className={`text-xl font-semibold cursor-pointer select-none ${!isOpen ? "text-center" : ""}`}
            onClick={() => router.push("/mimbral360")}
          >
            {isOpen ? "Mimbral 360" : "360"}
          </h2>
          {isOpen && (
            <div className="flex items-center gap-2">
              {!isMobile && (
                <div className="group/pin relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinnedChange(!pinned);
                    }}
                    className={`p-1 rounded transition-colors ${pinned
                      ? "bg-blue-700 text-white"
                      : "text-blue-200 hover:text-white hover:bg-blue-700"
                      }`}
                    title={pinned ? "Desfijar sidebar" : "Fijar sidebar abierto"}
                  >
                    {pinned ? (
                      <PinOffIcon className="h-4 w-4" />
                    ) : (
                      <PinIcon className="h-4 w-4" />
                    )}
                  </button>
                  <kbd className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded border border-blue-300/70 bg-blue-700/90 px-1.5 py-0.5 text-[10px] text-blue-100 font-mono opacity-0 transition-opacity duration-150 sm:inline-flex group-hover/pin:opacity-100">
                    Ctrl+Shift+B
                  </kbd>
                </div>
              )}

              {isMobile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeIfMobile();
                  }}
                  className="rounded p-1 text-white/90 transition-colors hover:bg-blue-700 hover:text-white"
                  aria-label="Cerrar menu"
                  title="Cerrar menu"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Pin oculto en modo colapsado para evitar solapamiento con el logo "360" */}
        </div>

        <div className="border-b border-gray-700 flex-shrink-0" />

        {/* Menu Items SCROLLEABLES */}
        <div
          ref={scrollRef}
          className={`relative flex-1 overflow-y-auto ${isOpen ? sidebarScrollStyles : "overflow-y-hidden"
            }`}
        >
          <ul className="py-2 flex-1 overflow-y-auto overflow-x-hidden">
            {(() => {
              let lastGroup: string | undefined;
              return visibleItems.map((item, idx) => {
                const allowed =
                  canAccess(item.route, role) ||
                  subTreeAllowed(item.subSidebarItems, role);

                const sectionActive = isMenuSectionActive(item, pathname);
                const activeTrail = getActiveLabelSet(item.subSidebarItems, pathname);
                const showGroupLabel =
                  isOpen && item.group && item.group !== lastGroup;
                if (item.group) lastGroup = item.group;

                const isExpanded = pinned && activeSection === item.text && item.hasSubSidebar;
                const isExpandedMobileOrPinned =
                  (pinned || isMobile) && activeSection === item.text && item.hasSubSidebar;
                const quickAccessLabel = idx < 9 && quickAccessRoutes[idx] ? `Alt+${idx + 1}` : null;

                return (
                  <li key={idx}>
                    {/* Group label */}
                    {showGroupLabel && (
                      <div
                        className={`px-4 pt-4 pb-1 text-xs uppercase tracking-widest text-gray-400 font-semibold select-none ${idx > 0 ? "border-t border-gray-700 mt-1" : ""
                          }`}
                      >
                        {item.group}
                      </div>
                    )}
                    {allowed && !item.hasSubSidebar && !item.onClick && item.route ? (
                      <a
                        href={item.route}
                        onClick={(e) => handleRouteAnchorClick(e, item.route!)}
                        className={`group/item relative w-full px-4 flex items-start transition-colors duration-200
                          ${isMobile ? "py-4" : "py-3.5"}
                          ${isOpen ? "justify-start" : "justify-center"}
                          ${activeSection === item.text
                            ? "bg-gray-700"
                            : sectionActive
                              ? "bg-gray-700/50 border-l-[3px] border-blue-400"
                              : "hover:bg-gray-700 active:bg-gray-600"
                          }
                        `}
                      >
                        {/* Icono */}
                        <span
                          className={`flex-shrink-0 w-6 h-6 ${isOpen ? "mr-4 mt-0.5" : ""
                            } ${sectionActive ? "text-blue-400" : ""}`}
                        >
                          {item.icon}
                        </span>

                        {/* Texto */}
                        {isOpen && (
                          <SidebarLabelWithTooltip
                            text={item.text}
                            className={`text-left leading-snug text-[15px] ${sectionActive ? "font-medium" : ""}`}
                            wrap
                          />
                        )}

                        {isOpen && quickAccessLabel && (
                          <kbd className="hidden sm:inline-flex ml-2 items-center gap-0.5 rounded border border-gray-500 bg-gray-600 px-1.5 py-0.5 text-[10px] text-gray-300 font-mono opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
                            {quickAccessLabel}
                          </kbd>
                        )}

                        {/* Tooltip (modo colapsado) */}
                        {!isOpen && (
                          <span
                            className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md
                              opacity-0 group-hover/item:opacity-100 transition-opacity duration-150
                              whitespace-nowrap pointer-events-none z-[200] shadow-lg"
                          >
                            {item.text}
                          </span>
                        )}
                      </a>
                    ) : (
                      <button
                        onClick={() => handleMenuClick(item, allowed)}
                        className={`group/item relative w-full px-4 flex items-start transition-colors duration-200
                          ${isMobile ? "py-4" : "py-3.5"}
                          ${isOpen ? "justify-start" : "justify-center"}
                          ${activeSection === item.text
                            ? "bg-gray-700"
                            : sectionActive
                              ? "bg-gray-700/50 border-l-[3px] border-blue-400"
                              : "hover:bg-gray-700 active:bg-gray-600"
                          }
                          ${!allowed ? disabledStyle : ""}
                        `}
                      >
                        {/* Icono */}
                        <span
                          className={`flex-shrink-0 w-6 h-6 ${isOpen ? "mr-4 mt-0.5" : ""
                            } ${sectionActive ? "text-blue-400" : ""}`}
                        >
                          {item.icon}
                        </span>

                        {/* Texto */}
                        {isOpen && (
                          <SidebarLabelWithTooltip
                            text={item.text}
                            className={`text-left leading-snug text-[15px] ${sectionActive ? "font-medium" : ""}`}
                            wrap
                          />
                        )}

                        {isOpen && quickAccessLabel && (
                          <kbd className="hidden sm:inline-flex ml-2 items-center gap-0.5 rounded border border-gray-500 bg-gray-600 px-1.5 py-0.5 text-[10px] text-gray-300 font-mono opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
                            {quickAccessLabel}
                          </kbd>
                        )}

                        {/* Chevron para secciones con sub-sidebar en modo pinned */}
                        {isOpen && (pinned || isMobile) && item.hasSubSidebar && (
                          <ChevronRightIcon
                            className={`h-4 w-4 mt-0.5 transition-transform duration-200 text-gray-400 ${isExpandedMobileOrPinned ? "rotate-90" : ""
                              }`}
                          />
                        )}

                        {/* Tooltip (modo colapsado) */}
                        {!isOpen && (
                          <span
                            className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md
                              opacity-0 group-hover/item:opacity-100 transition-opacity duration-150
                              whitespace-nowrap pointer-events-none z-[200] shadow-lg"
                          >
                            {item.text}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Inline accordion sub-items (modo pinned) */}
                    {(pinned || isMobile) && item.hasSubSidebar && (
                      <div
                        className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpandedMobileOrPinned ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                          }`}
                      >
                        <ul className="bg-gray-800/50 py-1">
                          {item.subSidebarItems?.map((sub) => {
                            const subAllowed =
                              canAccess(sub.route, role) ||
                              subTreeAllowed(sub.subItems, role);
                            const subActive = activeTrail.has(sub.text);

                            return (
                              <li key={sub.text}>
                                {subAllowed && !sub.hasSubItems && sub.route ? (
                                  <a
                                    href={sub.route}
                                    onClick={(e) => handleRouteAnchorClick(e, sub.route!)}
                                    className={`w-full pl-11 pr-3 flex items-center justify-between text-left text-[15px] transition-colors
                                      ${isMobile ? "py-3.5" : "py-2.5"}
                                      ${subActive ? "text-blue-400 font-medium" : "text-gray-300 hover:text-white hover:bg-gray-700/50 active:bg-gray-600/50"}`}
                                  >
                                    <SidebarLabelWithTooltip text={sub.text} className="leading-snug" wrap showTooltip={false} />
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => handleSubItemClick(sub, subAllowed)}
                                    className={`w-full pl-11 pr-3 flex items-center justify-between text-left text-[15px] transition-colors
                                      ${isMobile ? "py-3.5" : "py-2.5"}
                                      ${subActive ? "text-blue-400 font-medium" : "text-gray-300 hover:text-white hover:bg-gray-700/50 active:bg-gray-600/50"}
                                      ${!subAllowed ? disabledStyle : ""}`}
                                  >
                                    <SidebarLabelWithTooltip text={sub.text} className="leading-snug" wrap showTooltip={false} />
                                    {sub.hasSubItems && (
                                      <ChevronRightIcon
                                        className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${activeSubSection === sub.text ? "rotate-90" : ""
                                          }`}
                                      />
                                    )}
                                  </button>
                                )}

                                {/* Nivel 3 inline */}
                                <div
                                  className={`overflow-hidden transition-all duration-200 ease-in-out ${sub.hasSubItems && activeSubSection === sub.text
                                    ? "max-h-[800px] opacity-100"
                                    : "max-h-0 opacity-0"
                                    }`}
                                >
                                  {sub.hasSubItems && (
                                    <ul className="py-0.5">
                                      {sub.subItems?.map((nested) => {
                                        const nestedAllowed =
                                          canAccess(nested.route, role) ||
                                          subTreeAllowed(nested.subItems, role);
                                        const nestedActive = activeTrail.has(nested.text);

                                        return (
                                          <li key={nested.text}>
                                            {nestedAllowed && !nested.hasSubItems && nested.route ? (
                                              <a
                                                href={nested.route}
                                                onClick={(e) => handleRouteAnchorClick(e, nested.route!)}
                                                className={`w-full pl-14 pr-3 flex items-center justify-between text-left text-sm transition-colors
                                                  ${isMobile ? "py-3" : "py-2"}
                                                  ${nestedActive ? "text-blue-400 font-medium" : "text-gray-400 hover:text-white hover:bg-gray-700/50 active:bg-gray-600/50"}`}
                                              >
                                                <SidebarLabelWithTooltip text={nested.text} className="leading-snug" wrap showTooltip={false} />
                                              </a>
                                            ) : (
                                              <button
                                                onClick={() => handleSubSubClick(nested, nestedAllowed)}
                                                className={`w-full pl-14 pr-3 flex items-center justify-between text-left text-sm transition-colors
                                                  ${isMobile ? "py-3" : "py-2"}
                                                  ${nestedActive ? "text-blue-400 font-medium" : "text-gray-400 hover:text-white hover:bg-gray-700/50 active:bg-gray-600/50"}
                                                  ${!nestedAllowed ? disabledStyle : ""}`}
                                              >
                                                <SidebarLabelWithTooltip text={nested.text} className="leading-snug" wrap showTooltip={false} />
                                                {nested.hasSubItems && (
                                                  <ChevronRightIcon
                                                    className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${activeSubSub === nested.text ? "rotate-90" : ""
                                                      }`}
                                                  />
                                                )}
                                              </button>
                                            )}

                                            {/* Nivel 4 inline */}
                                            <div
                                              className={`overflow-hidden transition-all duration-200 ease-in-out ${nested.hasSubItems && activeSubSub === nested.text
                                                ? "max-h-[500px] opacity-100"
                                                : "max-h-0 opacity-0"
                                                }`}
                                            >
                                              {nested.hasSubItems && (
                                                <ul className="py-0.5">
                                                  {nested.subItems?.map((third) => {
                                                    const thirdAllowed = canAccess(third.route, role);
                                                    const thirdActive = activeTrail.has(third.text);

                                                    return (
                                                      <li key={third.text}>
                                                        {thirdAllowed && third.route ? (
                                                          <a
                                                            href={third.route}
                                                            onClick={(e) => handleRouteAnchorClick(e, third.route!)}
                                                            className={`w-full block pl-[4.5rem] pr-3 text-left text-sm transition-colors
                                                              ${isMobile ? "py-3" : "py-2"}
                                                              ${thirdActive ? "text-blue-400 font-medium" : "text-gray-400 hover:text-white hover:bg-gray-700/50 active:bg-gray-600/50"}`}
                                                          >
                                                            {third.text}
                                                          </a>
                                                        ) : (
                                                          <button
                                                            onClick={() => thirdAllowed && router.push(third.route!)}
                                                            className={`w-full pl-[4.5rem] pr-3 text-left text-sm transition-colors
                                                              ${isMobile ? "py-3" : "py-2"}
                                                              ${thirdActive ? "text-blue-400 font-medium" : "text-gray-400 hover:text-white hover:bg-gray-700/50 active:bg-gray-600/50"}
                                                              ${!thirdAllowed ? disabledStyle : ""}`}
                                                          >
                                                            {third.text}
                                                          </button>
                                                        )}
                                                      </li>
                                                    );
                                                  })}
                                                </ul>
                                              )}
                                            </div>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              });
            })()}
          </ul>
        </div>

        {showScrollHint && isOpen && (
          <div className="pointer-events-none absolute bottom-[200px] right-1 text-gray-400 opacity-60 animate-bounce">
            <ChevronUpDownIcon className="h-5 w-5" />
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto w-full">
          <div className="border-t border-gray-700 mb-2" />

          {/* ALERTAS */}
          <button
            onClick={() =>
              handleMenuClick(
                menuItems.find((i) => i.text === "Alertas")!,
                true
              )
            }
            className={`group/item relative w-full px-4 py-3 flex items-center transition-colors duration-200
              ${isOpen ? "justify-start" : "justify-center"}
              hover:bg-gray-700`}
          >
            <span className={isOpen ? "mr-4" : ""}>
              {menuItems.find((i) => i.text === "Alertas")!.icon}
            </span>
            {isOpen && <span>Alertas</span>}
            {!isOpen && (
              <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-[200] shadow-lg">
                Alertas
              </span>
            )}
          </button>

          {/* BUSCADOR */}
          <button
            onClick={() =>
              handleMenuClick(
                menuItems.find((i) => i.text === "Buscador")!,
                true
              )
            }
            className={`group/item relative w-full px-4 py-3 flex items-center transition-colors duration-200
              ${isOpen ? "justify-start" : "justify-center"}
              hover:bg-gray-700`}
          >
            <span className={isOpen ? "mr-4" : ""}>
              {menuItems.find((i) => i.text === "Buscador")!.icon}
            </span>
            {isOpen && (
              <span className="flex items-center gap-2">
                Buscador
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-500 bg-gray-600 px-1.5 py-0.5 text-[10px] text-gray-300 font-mono opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
                  Ctrl+K
                </kbd>
              </span>
            )}
            {!isOpen && (
              <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-[200] shadow-lg">
                Buscador (Ctrl+K)
              </span>
            )}
          </button>

          {/* ATAJOS */}
          <button
            onClick={() => setShortcutsOpen(true)}
            className={`group/item relative w-full px-4 py-3 flex items-center transition-colors duration-200
              ${isOpen ? "justify-start" : "justify-center"}
              hover:bg-gray-700`}
          >
            <span className={`${isOpen ? "mr-4" : ""} text-lg leading-none`}>
              ?
            </span>
            {isOpen && (
              <span className="flex items-center gap-2">
                Atajos
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-500 bg-gray-600 px-1.5 py-0.5 text-[10px] text-gray-300 font-mono opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
                  Ctrl+/
                </kbd>
              </span>
            )}
            {!isOpen && (
              <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-[200] shadow-lg">
                Atajos (Ctrl+/)
              </span>
            )}
          </button>

          <div className="border-t border-gray-700 my-2" />

          {/* Usuario + Logout */}
          <div className="relative" ref={userMenuRef}>
            {/* Popover del usuario */}
            {userMenuOpen && (
              <div
                className={`absolute bottom-full mb-2 rounded-xl bg-gray-800 border border-gray-600/50 shadow-xl shadow-black/30 z-[210]
                  transition-all duration-200 animate-in fade-in slide-in-from-bottom-2
                  ${isOpen ? "left-2 right-2" : "left-1/2 -translate-x-1/2 w-52"}`}
              >
                {/* Info del usuario */}
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user?.nombre || "Mimbral360"}
                        className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm uppercase flex-shrink-0">
                        {(user?.nombre || "M")
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {user?.nombre || "Mimbral360"}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-600/50" />

                {/* Cerrar sesión */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                      if (isMobile) setOpen(false);
                    }}
                    className="group/logout w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-colors duration-150"
                  >
                    <span className="flex items-center gap-3">
                      <LogOutIcon className="h-[18px] w-[18px]" />
                      <span>Cerrar sesión</span>
                    </span>
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-red-400/60 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-300 font-mono opacity-0 group-hover/logout:opacity-100 transition-opacity duration-150">
                      Ctrl+Shift+L
                    </kbd>
                  </button>
                </div>
              </div>
            )}

            {/* Badge del usuario */}
            <div
              onClick={() => setUserMenuOpen((v) => !v)}
              className={`group/user cursor-pointer pb-4 px-3 py-2 rounded-lg transition-colors duration-150
                ${userMenuOpen ? "bg-gray-700/50" : "hover:bg-gray-700/30"}`}
            >
              {user?.nombre ? (
                <UserBadge name={user.nombre} open={isOpen} avatarUrl={user.avatarUrl} />
              ) : (
                <UserBadge name="Mimbral360" open={isOpen} />
              )}
              {!isOpen && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/user:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-[200] shadow-lg">
                  {user?.nombre || "Mimbral360"}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ========== Sub Sidebar (solo en modo hover, no pinned) ========== */}
      {!pinned && !isMobile && activeMenuItem?.hasSubSidebar && (
        <nav
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`fixed top-0 h-screen bg-gray-50 text-gray-800 transition-all duration-300 z-[90]
            w-60 border-r border-gray-200 overflow-y-auto shadow-sm
            ${isOpen ? "left-60" : "left-[70px]"}
            ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
          `}
        >
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">{activeMenuItem.text}</h2>
          </div>

          <ul className="py-2">
            {activeMenuItem.subSidebarItems?.map((sub) => {
              const allowed =
                canAccess(sub.route, role) ||
                subTreeAllowed(sub.subItems, role);
              const subActive = activeMenuTrail.has(sub.text);

              return (
                <li key={sub.text}>
                  {allowed && !sub.hasSubItems && sub.route ? (
                    <a
                      href={sub.route}
                      onClick={(e) => handleRouteAnchorClick(e, sub.route!, false)}
                      className={`w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-100 transition-colors
                        ${activeSubSection === sub.text ? "bg-gray-100" : ""}
                        ${subActive && activeSubSection !== sub.text
                          ? "border-l-[3px] border-blue-500 bg-blue-50/50 text-blue-700 font-medium"
                          : ""
                        }`}
                    >
                      <SidebarLabelWithTooltip text={sub.text} className="leading-snug" wrap showTooltip={false} />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleSubItemClick(sub, allowed)}
                      className={`w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-100 transition-colors
                        ${activeSubSection === sub.text ? "bg-gray-100" : ""}
                        ${subActive && activeSubSection !== sub.text
                          ? "border-l-[3px] border-blue-500 bg-blue-50/50 text-blue-700 font-medium"
                          : ""
                        }
                        ${!allowed ? disabledStyle : ""}`}
                    >
                      <SidebarLabelWithTooltip text={sub.text} className="leading-snug" wrap showTooltip={false} />
                      {sub.hasSubItems && (
                        <ChevronRightIcon
                          className={`h-4 w-4 transition-transform duration-200 ${activeSubSection === sub.text ? "rotate-90" : ""
                            }`}
                        />
                      )}
                    </button>
                  )}

                  {/* Nivel 3 con animación */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${sub.hasSubItems && activeSubSection === sub.text
                      ? "max-h-[800px] opacity-100"
                      : "max-h-0 opacity-0"
                      }`}
                  >
                    {sub.hasSubItems && (
                      <ul className="bg-gray-50 py-1">
                        {sub.subItems?.map((nested) => {
                          const allowed2 =
                            canAccess(nested.route, role) ||
                            subTreeAllowed(nested.subItems, role);
                          const nestedActive = activeMenuTrail.has(nested.text);

                          return (
                            <li key={nested.text}>
                              {allowed2 && !nested.hasSubItems && nested.route ? (
                                <a
                                  href={nested.route}
                                  onClick={(e) => handleRouteAnchorClick(e, nested.route!, false)}
                                  className={`w-full pl-8 pr-4 py-2 flex items-center justify-between text-left text-sm hover:bg-gray-100 transition-colors
                                    ${nestedActive
                                      ? "text-blue-600 font-medium"
                                      : ""
                                    }`}
                                >
                                  <SidebarLabelWithTooltip text={nested.text} className="leading-snug" wrap showTooltip={false} />
                                </a>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleSubSubClick(nested, allowed2)
                                  }
                                  className={`w-full pl-8 pr-4 py-2 flex items-center justify-between text-left text-sm hover:bg-gray-100 transition-colors
                                    ${nestedActive
                                      ? "text-blue-600 font-medium"
                                      : ""
                                    }
                                    ${!allowed2 ? disabledStyle : ""}`}
                                >
                                  <SidebarLabelWithTooltip text={nested.text} className="leading-snug" wrap showTooltip={false} />
                                  {nested.hasSubItems && (
                                    <ChevronRightIcon
                                      className={`h-4 w-4 transition-transform duration-200 ${activeSubSub === nested.text
                                        ? "rotate-90"
                                        : ""
                                        }`}
                                    />
                                  )}
                                </button>
                              )}

                              {/* Nivel 4 con animación */}
                              <div
                                className={`overflow-hidden transition-all duration-200 ease-in-out ${nested.hasSubItems &&
                                  activeSubSub === nested.text
                                  ? "max-h-[500px] opacity-100"
                                  : "max-h-0 opacity-0"
                                  }`}
                              >
                                {nested.hasSubItems && (
                                  <ul className="bg-gray-100 py-1">
                                    {nested.subItems?.map((third) => {
                                      const allowed3 = canAccess(
                                        third.route,
                                        role
                                      );
                                      const thirdActive = activeMenuTrail.has(third.text);

                                      return (
                                        <li key={third.text}>
                                          {allowed3 && third.route ? (
                                            <a
                                              href={third.route}
                                              onClick={(e) => handleRouteAnchorClick(e, third.route!, false)}
                                              className={`w-full block pl-12 pr-4 py-2 text-left text-sm hover:bg-gray-200 transition-colors
                                                ${thirdActive
                                                  ? "text-blue-600 font-medium"
                                                  : ""
                                                }`}
                                            >
                                              {third.text}
                                            </a>
                                          ) : (
                                            <button
                                              onClick={() =>
                                                allowed3 &&
                                                router.push(third.route!)
                                              }
                                              className={`w-full pl-12 pr-4 py-2 text-left text-sm hover:bg-gray-200 transition-colors
                                                ${thirdActive
                                                  ? "text-blue-600 font-medium"
                                                  : ""
                                                }
                                                ${!allowed3 ? disabledStyle : ""
                                                }`}
                                            >
                                              {third.text}
                                            </button>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
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

      <SimpleModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title="Atajos de teclado"
        maxWidth="sm:max-w-2xl"
      >
        <div className="space-y-5 text-sm text-gray-700">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800">
            Los atajos no se ejecutan cuando estás completando algun campo.
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 flex items-center justify-between">
              <span>Fijar / desfijar sidebar</span>
              <kbd className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs">Ctrl+Shift+B</kbd>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 flex items-center justify-between">
              <span>Navegar a módulos</span>
              <kbd className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs">Alt+1..9</kbd>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 flex items-center justify-between">
              <span>Refrescar datos del módulo</span>
              <kbd className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs">Ctrl+Shift+R</kbd>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 flex items-center justify-between">
              <span>Recarga completa</span>
              <kbd className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs">Ctrl+R</kbd>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 flex items-center justify-between">
              <span>Cerrar modal / panel activo</span>
              <kbd className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs">Esc</kbd>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 flex items-center justify-between">
              <span>Abrir esta ayuda</span>
              <kbd className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs">Ctrl+/</kbd>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50/70 px-3 py-2.5 flex items-center justify-between text-red-800">
            <span>Cerrar sesión (con confirmación)</span>
            <kbd className="rounded border border-red-300 bg-white px-2 py-0.5 font-mono text-xs text-red-700">Ctrl+Shift+L</kbd>
          </div>
        </div>
      </SimpleModal>

      <SimpleModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="Confirmar cierre de sesión"
        maxWidth="sm:max-w-md"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-700">
            ¿Quieres cerrar sesión ahora?
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setLogoutConfirmOpen(false);
                setUserMenuOpen(false);
                logout();
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
