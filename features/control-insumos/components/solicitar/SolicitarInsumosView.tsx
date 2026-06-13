// views\ControlInsumos\Solicitar\SolicitarInsumosFields.tsx
"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";

export function SolicitarInsumosFields({
    record,
    onChange,
    onAgregarItem,
}: {
    record: {
        colaborador: string;
        departamento: string;
        insumo: string;
        cantidad: string;
        motivo: string;
    };
    onChange: (field: any, value: any) => void;
    onAgregarItem: () => void;
}) {
    const handle = (field: any) => (value: any) => onChange(field, value);

    // mock local insumos
    const [search, setSearch] = useState("");
    const insumos = useMemo(
        () => [
            { label: "Papel A4", value: "Papel A4" },
            { label: "Tóner negro", value: "Tóner negro" },
            { label: "Bolígrafos azules", value: "Bolígrafos azules" },
        ],
        []
    );
    const filtrados = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return insumos;
        return insumos.filter((i) => i.label.toLowerCase().includes(q));
    }, [search, insumos]);

    return (
        <Card
            title="DETALLES DE LA SOLICITUD"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
        >
            <div className="grid grid-cols-6 gap-4">

                <span className="col-span-1 text-sm font-bold text-gray-600">
                    Colaborador
                </span>
                <div className="col-span-5">
                    <input
                        className="w-full border-b border-gray-300 text-sm outline-none"
                        value={record.colaborador}
                        onChange={(e) => handle("colaborador")(e.target.value)}
                        placeholder="Nombre del colaborador"
                    />
                </div>

                <span className="col-span-1 text-sm font-bold text-gray-600">
                    Departamento
                </span>
                <div className="col-span-5">
                    <input
                        className="w-full border-b border-gray-300 text-sm outline-none"
                        value={record.departamento}
                        onChange={(e) => handle("departamento")(e.target.value)}
                        placeholder="Área o departamento"
                    />
                </div>

                <span className="col-span-1 text-sm font-bold text-gray-600">
                    Insumo
                </span>
                <div className="col-span-5">
                    <SelectSearchInline
                        id="insumo"
                        label="Insumo"
                        value={record.insumo}
                        options={filtrados}
                        searchQuery={search}
                        onSearch={setSearch}
                        onChange={(v) => handle("insumo")(v)}
                        placeholderFromDefault
                    />
                </div>

                <span className="col-span-1 text-sm font-bold text-gray-600">
                    Cantidad
                </span>
                <div className="col-span-5">
                    <input
                        type="number"
                        className="w-full border-b border-gray-300 text-sm outline-none"
                        value={record.cantidad}
                        onChange={(e) => handle("cantidad")(e.target.value)}
                        placeholder="Ingrese cantidad"
                    />
                </div>

                <span className="col-span-1 text-sm font-bold text-gray-600">
                    Observaciones
                </span>
                <div className="col-span-5">
                    <textarea
                        className="w-full border border-gray-300 rounded-md text-sm outline-none p-2"
                        rows={3}
                        value={record.motivo}
                        onChange={(e) => handle("motivo")(e.target.value)}
                        placeholder="Escriba detalles adicionales..."
                    />
                </div>

                <div className="col-span-6 mt-4">
                    <ActionButton
                        type="button"
                        variant="primary"
                        className="w-full"
                        onClick={onAgregarItem}
                    >
                        Agregar ítem a la solicitud
                    </ActionButton>
                </div>

            </div>
        </Card>
    );
}
