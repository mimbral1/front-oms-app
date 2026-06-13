// components\search\searchModal.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { MenuItem } from "@/lib/menu-items";
import { flattenMenuForSearch } from "@/lib/menu-search";
import { Role } from "@/app/context/auth/AuthContext";
import { ROUTE_PERMISSIONS } from "@/lib/route-permissions";

interface Props {
    open: boolean;
    onClose: () => void;
    menuItems: MenuItem[];
    role?: Role;
}

const canAccess = (route: string | undefined, role?: Role) => {
    if (!route) return false;
    const rule = ROUTE_PERMISSIONS.find((r) => r.pattern.test(route));
    return !rule || (role && rule.allowed.includes(role));
};

const normalizeText = (text: string) =>
    text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const splitWords = (text: string) =>
    normalizeText(text)
        .split(/[\s>]+/)
        .filter(Boolean);

export default function SearchModal({
    open,
    onClose,
    menuItems,
    role,
}: Props) {
    const router = useRouter();
    const [query, setQuery] = useState("");

    // salir del buscador con escape 
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (!open) setQuery("");
    }, [open]);

    // escucha pulsar escape para cerrar modal 
    useEffect(() => {
        if (!open) return;

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, handleKeyDown]);


    const searchIndex = useMemo(
        () => flattenMenuForSearch(menuItems),
        [menuItems]
    );

    const results = useMemo(() => {
        if (!query.trim()) return [];

        const queryWords = splitWords(query);

        return searchIndex.filter((i) => {
            if (!canAccess(i.route, role)) return false;

            const labelWords = splitWords(i.label);

            // TODAS las palabras buscadas deben existir en el label
            return queryWords.every((q) =>
                labelWords.some((lw) => lw.includes(q))
            );
        });
    }, [query, searchIndex, role]);


    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[300]">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 ">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar secciones…"
                        className="flex-1 outline-none text-sm"
                    />
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Results */}
                <ul className="max-h-[60vh] overflow-auto">
                    {results.length === 0 && query && (
                        <li className="px-4 py-3 text-sm text-gray-500">
                            Sin resultados
                        </li>
                    )}

                    {results.map((res) => (
                        <li key={res.id}>
                            <button
                                onClick={() => {
                                    router.push(res.route);
                                    onClose();
                                }}
                                className="w-full px-4 py-3 flex items-center gap-3 text-left text-sm hover:bg-gray-100"
                            >
                                {res.icon && (
                                    <span className="text-gray-400">{res.icon}</span>
                                )}
                                <span>{res.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
