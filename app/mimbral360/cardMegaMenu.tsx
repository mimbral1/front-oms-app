// app\mimbral360\cardMegaMenu.tsx
"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { Role } from "@/app/context/auth/AuthContext";
import type { SubMenuItem } from "@/lib/menu-items";

type Props = {
    open: boolean;
    anchorEl: HTMLElement | null;
    items?: SubMenuItem[];
    role?: Role;
    canAccess: (route: string | undefined, role: Role | undefined) => boolean;
    onNavigate: (route: string) => void;
    onClose: () => void;
};

type Section = {
    title: string;
    route?: string;
    children?: { text: string; route?: string; children?: { text: string; route?: string }[] }[];
};

const VIEWPORT_MARGIN = 12;
const POPOVER_OFFSET = 10;
const MAX_WIDTH = 920;
const COL_MIN = 1;
const COL_MAX = 3;
const COL_WIDTH = 260;
const MAX_VH = 0.56;

function filterTree(items?: SubMenuItem[]): SubMenuItem[] {
    if (!Array.isArray(items)) return [];
    return items
        .map((it) => {
            const kids = filterTree(it.subItems);
            const meaningful = (it.route && it.route.trim() !== "") || kids.length > 0;
            return meaningful ? { ...it, subItems: kids } : null;
        })
        .filter(Boolean) as SubMenuItem[];
}

function mapToSections(items?: SubMenuItem[]): Section[] {
    const pruned = filterTree(items);
    return pruned.map((s) => ({
        title: s.text,
        route: s.route,
        children:
            s.subItems?.map((c) => ({
                text: c.text,
                route: c.route,
                children: c.subItems?.map((g) => ({ text: g.text, route: g.route })) ?? [],
            })) ?? [],
    }));
}

export default function CardMegaMenu({
    open,
    anchorEl,
    items,
    role,
    canAccess,
    onNavigate,
    onClose,
}: Props) {
    const portal = typeof document !== "undefined" ? document.body : null;
    const panelRef = useRef<HTMLDivElement | null>(null);

    const sections = useMemo(() => mapToSections(items), [items]);

    const [style, setStyle] = useState<React.CSSProperties>({});
    const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
    const [arrowTop, setArrowTop] = useState(true);
    const [cols, setCols] = useState(1);

    const computeLayout = () => {
        const panel = panelRef.current;
        const anchor = anchorEl;
        if (!panel || !anchor) return;

        const vpW = window.innerWidth;
        const vpH = window.innerHeight;
        const rect = anchor.getBoundingClientRect();

        // columnas adaptativas
        const maxAvailable = Math.min(MAX_WIDTH, vpW - VIEWPORT_MARGIN * 2);
        const computedCols = Math.max(COL_MIN, Math.min(COL_MAX, Math.floor(maxAvailable / COL_WIDTH)));
        setCols(computedCols);

        const estWidth = Math.min(MAX_WIDTH, Math.max(COL_WIDTH * computedCols, COL_WIDTH));
        let top = rect.bottom + POPOVER_OFFSET;
        let placeBelow = true;
        const maxHeight = Math.round(vpH * MAX_VH);

        // medir
        panel.style.visibility = "hidden";
        panel.style.display = "block";
        panel.style.maxHeight = `${maxHeight}px`;
        panel.style.width = `${estWidth}px`;
        const ph = panel.offsetHeight || maxHeight;
        panel.style.visibility = "";
        panel.style.display = "";

        if (top + ph + VIEWPORT_MARGIN > vpH) {
            const t = rect.top - POPOVER_OFFSET - ph;
            if (t >= VIEWPORT_MARGIN) {
                top = t;
                placeBelow = false;
            } else {
                top = Math.max(VIEWPORT_MARGIN, Math.min(vpH - VIEWPORT_MARGIN - ph, top));
                placeBelow = true;
            }
        }

        let left = rect.left;
        if (left + estWidth + VIEWPORT_MARGIN > vpW) left = vpW - VIEWPORT_MARGIN - estWidth;
        if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

        const cardMid = rect.left + rect.width / 2;
        const arrowLeft = Math.max(18, Math.min(estWidth - 18, cardMid - left));

        setStyle({ position: "fixed", top, left, width: estWidth, maxWidth: maxAvailable, maxHeight });
        setArrowStyle({ left: arrowLeft - 8 });
        setArrowTop(placeBelow);
    };

    useLayoutEffect(() => {
        if (!open) return;
        computeLayout();
    }, [open, anchorEl, sections.length]);

    useEffect(() => {
        if (!open) return;
        const onResize = () => computeLayout();
        const onScroll = () => computeLayout();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onScroll, { passive: true });
        document.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("scroll", onScroll);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (panelRef.current?.contains(t)) return;
            if (anchorEl?.contains(t)) return;
            onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open, anchorEl, onClose]);

    if (!open || !portal || sections.length === 0) return null;

    return createPortal(
        <div
            ref={panelRef}
            className="z-[60] rounded-2xl border border-gray-200 bg-white shadow-xl p-4 overflow-hidden"
            style={style}
            role="dialog"
            aria-modal="true"
        >
            {/* Arrow */}
            <div
                className={[
                    "absolute h-4 w-4 rotate-45 rounded-sm border border-gray-200 bg-white",
                    arrowTop ? "-top-2" : "-bottom-2",
                ].join(" ")}
                style={arrowStyle}
            />

            {/* Contenido con scroll interno */}
            <div
                className="overflow-auto pr-1 overscroll-contain"
                style={{ maxHeight: "inherit", scrollbarGutter: "stable" as any }}
            >
                <div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(220px, 1fr))` }}
                >
                    {sections.map((sec, i) => (
                        <div key={`${sec.title}-${i}`} className="min-w-[220px] max-w-full">
                            {/* Título sección */}
                            <button
                                onClick={() => sec.route && onNavigate(sec.route)}
                                className={[
                                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 transition",
                                    "text-gray-900 whitespace-normal break-words hyphens-auto leading-tight",
                                    sec.route ? "hover:bg-blue-50" : "",
                                ].join(" ")}
                            >
                                <span className="font-medium max-w-full">{sec.title}</span>
                                {sec.route && <ChevronRightIcon className="h-4 w-4 text-blue-600 shrink-0" />}
                            </button>

                            {/* Hijos */}
                            {Array.isArray(sec.children) && sec.children.length > 0 && (
                                <ul className="mt-1 space-y-1">
                                    {sec.children.map((c, idx) => (
                                        <li key={`${sec.title}-child-${idx}`}>
                                            <button
                                                onClick={() => c.route && onNavigate(c.route)}
                                                className={[
                                                    "w-full text-left rounded-md px-2 py-1 text-sm transition",
                                                    "text-gray-700 whitespace-normal break-words hyphens-auto leading-tight",
                                                    c.route ? "hover:bg-blue-50" : "",
                                                ].join(" ")}
                                            >
                                                <span className="inline-flex items-start gap-1 max-w-full">
                                                    <span className="max-w-full">{c.text}</span>
                                                    {Array.isArray(c.children) && c.children.length > 0 && (
                                                        <span className="ml-1 text-[11px] rounded bg-gray-100 px-1 py-0.5 text-gray-500 shrink-0">
                                                            submenú
                                                        </span>
                                                    )}
                                                </span>
                                            </button>

                                            {/* Nietos */}
                                            {Array.isArray(c.children) && c.children.length > 0 && (
                                                <ul className="mt-0.5 ml-3 space-y-0.5">
                                                    {c.children.map((g, j) => (
                                                        <li key={`${sec.title}-child-${idx}-g-${j}`}>
                                                            <button
                                                                onClick={() => g.route && onNavigate(g.route)}
                                                                className={[
                                                                    "w-full text-left rounded-md px-2 py-1 text-xs transition",
                                                                    "text-gray-600 whitespace-normal break-words break-all hyphens-auto leading-tight",
                                                                    g.route ? "hover:bg-blue-50" : "",
                                                                ].join(" ")}
                                                            >
                                                                {g.text}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        portal
    );
}
