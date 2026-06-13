// views/MonitorCompetencia/InventarioMonitorCompetencia.tsx
"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";

/* ===============================
   MOCKS – LISTAS MAESTRAS
================================ */

const MOCK_MARCAS: string[] = [
    "3 CLAVELES",
    "3M",
    "ABB",
    "ADISOL",
    "AGOREX",
    "AIROLITE",
    "AISLANGLASS",
    "AISLAPOL",
    "ALCAZAR",
    "ALLPA",
];

const MOCK_CATEGORIAS: string[] = [
    "AIRE LIBRE Y MASCOTAS",
    "AUTOMÓVIL",
    "BAÑO",
    "COCINA Y MENAJE",
    "DECORACIÓN E ILUMINACIÓN",
    "DORMITORIO",
    "ELECTROHOGAR Y CLIMATIZACIÓN",
    "FERRETERIA Y SEGURIDAD",
    "GASFITERIA Y ELECTRICIDAD",
    "HERRAMIENTAS Y MAQUINARIAS",
    "JARDÍN Y TERRAZA",
    "MATERIALES DE CONSTRUCCIÓN",
    "MUEBLES",
    "ORGANIZACIÓN Y LIMPIEZA",
    "PINTURA Y TERMINACIONES",
    "PISOS Y ALFOMBRAS",
    "PUERTAS Y VENTANAS",
];

/* ===============================
   COMPONENTE CARD SIMPLE
================================ */

function SimpleCard({
    title,
    items,
}: {
    title: string;
    items: string[];
}) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-600">
                {title}
            </h3>

            <div className="grid grid-cols-1 gap-2 max-h-[520px] overflow-y-auto pr-2">
                {items.map((item) => (
                    <div
                        key={item}
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-gray-50"
                    >
                        {item}
                    </div>
                ))}
            </div>

            <div className="mt-4 text-xs text-gray-500">
                Total: <span className="font-semibold">{items.length}</span>
            </div>
        </div>
    );
}

/* ===============================
   VISTA
================================ */

export default function InventarioMonitorCompetencia() {

    /* ===============================
       DATA
    ================================ */
    const marcas = useMemo(() => MOCK_MARCAS, []);
    const categorias = useMemo(() => MOCK_CATEGORIAS, []);

    /* ===============================
       RENDER
    ================================ */
    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title={
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Monitor de Competencia
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">
                            Inventario
                        </div>
                    </div>
                }
            />

            <div className="flex-1 p-6">
                <div className="space-y-8">

                    {/* ====== TITULO SECCIÓN ====== */}
                    <h2 className="text-xl font-semibold text-gray-900">
                        Listas Maestras
                    </h2>

                    {/* ====== GRID ====== */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                        {/* MARCAS */}
                        <SimpleCard
                            title="Marcas"
                            items={marcas}
                        />

                        {/* CATEGORÍAS */}
                        <SimpleCard
                            title="Categorías"
                            items={categorias}
                        />

                    </div>
                </div>
            </div>
        </div>
    );
}
