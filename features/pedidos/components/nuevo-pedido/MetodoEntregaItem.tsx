// MetodoEntregaItem.tsx
import React, { useState } from "react";

type OpcionEntrega = "envio" | "retiro";

export default function MetodoEntregaItem({
    imgUrl,
    costoFmt,
    fechaTexto,
    conRetiro = false,
    onOpcionChange,
    groupName,
}: {
    imgUrl: string;
    costoFmt: string;      // ej: clp.format(4990)
    fechaTexto: string;    // ej: "Llega el lun 13 de oct. de 9 a 22 h"
    conRetiro?: boolean;   // solo true en la ENTREGA 2
    onOpcionChange?: (opcion: OpcionEntrega) => void;
    groupName: string;
}) {
    // Para cards con 2 opciones, default "envio"; para cards con 1 opción, siempre se verá como seleccionada
    const [opcionEntrega2, setOpcionEntrega2] = useState<OpcionEntrega>("envio");

    // seleccionado de tienda cuando es "Retiro en tienda"
    const [retiroStore, setRetiroStore] = useState<"talca" | "colin" | null>(null);

    const selectEnvio = () => {
        if (conRetiro) {
            setOpcionEntrega2("envio");
            setRetiroStore(null); // limpia radios de tienda
            onOpcionChange?.("envio");
        }
    };

    const selectRetiro = () => {
        if (conRetiro) {
            setOpcionEntrega2("retiro");
            onOpcionChange?.("retiro");
        }
    };

    const scrollToFecha = () => {
        const el = document.getElementById("bloque-fecha-entrega");
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
    };

    const boxBase = "rounded-xl border p-3 transition-colors select-none";
    const boxSelected = "border-blue-500 ring-1 ring-blue-100 bg-blue-50/30";
    const boxUnselected = "border-gray-300 hover:border-gray-400";

    // helper para el radio + título + meta
    const OpcionBox = ({
        checked,
        name,
        title,
        onChange,
        children,
    }: {
        checked: boolean;
        name: string;
        title: string;
        onChange: () => void;
        children?: React.ReactNode;
    }) => (
        <div
            className={`${boxBase} ${checked ? boxSelected : boxUnselected}`}
            onClick={onChange}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") onChange();
            }}
        >
            <label className="flex items-start gap-2 cursor-pointer w-full">
                <input
                    type="radio"
                    name={name}
                    className="mt-1 accent-blue-600"
                    checked={checked}
                    onChange={onChange}
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                        <div className="font-medium">{title}</div>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                className="text-sm underline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    scrollToFecha();
                                }}
                            >
                                Cambiar fecha
                            </button>
                            <div className="font-semibold">{costoFmt}</div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{fechaTexto}</div>
                    {children}
                </div>
            </label>
        </div>
    );

    return (
        <div className="flex gap-4 items-start">
            <img src={imgUrl} alt="Entrega" className="h-16 w-16 object-contain rounded-md" />
            <div className="flex-1 space-y-4">
                {/* Envío a domicilio */}
                <OpcionBox
                    checked={!conRetiro || opcionEntrega2 === "envio"}
                    name={groupName}
                    title="Envío a domicilio"
                    onChange={selectEnvio}
                />

                {/* Retiro en tienda (solo si aplica) */}
                {conRetiro && (
                    <div className={`${boxBase} ${opcionEntrega2 === "retiro" ? boxSelected : boxUnselected}`}>
                        {/* Cabecera similar al OpcionBox, pero SIN radio */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="font-medium">Retiro en tienda</div>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    className="text-sm underline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        scrollToFecha();
                                    }}
                                >
                                    Cambiar fecha
                                </button>
                                <div className="font-semibold">{costoFmt}</div>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600 mt-1">{fechaTexto}</div>

                        {/* Radios de tiendas */}
                        <div className="mt-2 pl-6 space-y-2 text-sm text-gray-700">
                            {/* Retiro en Sodimac Talca */}
                            <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={groupName}                              // MISMO grupo que “envío” => exclusión total
                                    className="accent-blue-600"
                                    checked={opcionEntrega2 === "retiro" && retiroStore === "talca"}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        setRetiroStore("talca");
                                        setOpcionEntrega2("retiro");
                                        onOpcionChange?.("retiro");
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <span>Desde el 20 de oct. En Sodimac Talca (5km)</span>
                            </label>

                            {/* Retiro en Sodimac Talca Colín */}
                            <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={groupName}                              // MISMO grupo que “envío”
                                    className="accent-blue-600"
                                    checked={opcionEntrega2 === "retiro" && retiroStore === "colin"}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        setRetiroStore("colin");
                                        setOpcionEntrega2("retiro");
                                        onOpcionChange?.("retiro");
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <span>Desde el 25 de oct. En Sodimac Talca Colín (7km)</span>
                            </label>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
