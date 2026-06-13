"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import {
    ArrowDownOnSquareIcon,
    CheckCircleIcon,
    ChevronUpDownIcon,
    ClipboardIcon,
    CubeIcon,
    CurrencyDollarIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import { PageHeader } from "@/components/layout/page-header";

const canales = [
    "Seleccione canal...",
    "B2C Web",
    "Marketplace",
    "Tienda física",
];

const condicionesPago = ["Contado", "Crédito interno"];
const clientes = ["Seleccione cliente...", "Cliente Demo A", "Cliente Demo B"];
const criteriosSustitucion = ["", "Misma marca", "Mismo precio", "Libre"];

type Producto = {
    id: string;
    nombre: string;
    precio: number;
    imagen: string;
};

const productosDemo: Producto[] = [
    {
        id: "SKU-001",
        nombre: "ALIMENTO GATO SALMON CAT CHOW",
        precio: 255.02,
        imagen: "/VTEX.png",
    },
    {
        id: "SKU-002",
        nombre: "ALIMENTO PERRO ADULTO",
        precio: 489.9,
        imagen: "/VTEX.png",
    },
];

const clp = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function TotalLine({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className={bold ? "font-semibold text-gray-900" : "text-gray-600"}>{label}</span>
            <span className={bold ? "font-semibold text-gray-900" : "text-gray-600"}>{value}</span>
        </div>
    );
}

function StatusPill({ text, tone }: { text: string; tone: "warning" | "danger" | "success" }) {
    const tones = {
        warning: "bg-orange-100 text-orange-700",
        danger: "bg-red-100 text-red-700",
        success: "bg-green-100 text-green-700",
    };

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
            {text}
        </span>
    );
}

function SelectControl({
    value,
    onChange,
    options,
    placeholder,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={`relative ${className ?? ""}`}>
            <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
            <ChevronUpDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
    );
}

export default function CrearCotizacionView() {
    const router = useRouter();

    const [clienteExpanded, setClienteExpanded] = useState(true);
    const [itemsExpanded, setItemsExpanded] = useState(false);

    const [canal, setCanal] = useState("");
    const [condicionPago, setCondicionPago] = useState("Contado");
    const [cliente, setCliente] = useState("");
    const [item, setItem] = useState(productosDemo[0].nombre);
    const [cantidadInput, setCantidadInput] = useState("1");
    const [criterio, setCriterio] = useState("");
    const [notas, setNotas] = useState("");

    const productoSeleccionado =
        productosDemo.find((p) => p.nombre === item) ?? productosDemo[0];

    const cantidad = useMemo(() => {
        if (cantidadInput.trim() === "") return 0;
        const parsed = Number(cantidadInput);
        if (Number.isNaN(parsed) || parsed <= 0) return 0;
        return parsed;
    }, [cantidadInput]);

    const totalItems = useMemo(() => productoSeleccionado.precio * cantidad, [productoSeleccionado, cantidad]);
    const canGoToItems = canal.trim() !== "" && cliente.trim() !== "";
    const canContinueItems = cantidad > 0 && item.trim() !== "";

    const headerActions = [
        {
            label: "Guardar",
            variant: "primary" as const,
            onClick: () => router.push("/pedidos/listado-pedidos"),
            icon: <ArrowDownOnSquareIcon className="h-5 w-5" />,
        },
        {
            label: "Cancelar",
            variant: "secondary" as const,
            onClick: () => router.push("/pedidos/listado-pedidos"),
            icon: <XCircleIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Nueva cotización"
                description="PEDIDOS"
                action={headerActions}
            />

            <div className="space-y-6 p-6">
                <Accordion
                    expanded={clienteExpanded}
                    onChange={(_, expanded) => setClienteExpanded(expanded)}
                    className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm"
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} className="bg-white">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">Cliente</span>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails className="space-y-6 bg-white px-5 pb-5 pt-2 md:px-6">

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <div className="space-y-5">
                                <FieldRows label="Canal de venta">
                                    <SelectControl
                                        value={canal}
                                        onChange={setCanal}
                                        options={canales.slice(1)}
                                        placeholder="Seleccione canal..."
                                        className="max-w-[760px]"
                                    />
                                </FieldRows>

                                <FieldRows label="Cliente">
                                    <SelectControl
                                        value={cliente}
                                        onChange={setCliente}
                                        options={clientes.slice(1)}
                                        placeholder="Seleccione cliente..."
                                        className="max-w-[760px]"
                                    />
                                </FieldRows>
                            </div>

                            <div className="space-y-5">
                                <FieldRows label="Condición de pago">
                                    <SelectControl
                                        value={condicionPago}
                                        onChange={setCondicionPago}
                                        options={condicionesPago}
                                        className="max-w-[760px]"
                                    />
                                </FieldRows>

                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                                    <p className="text-sm text-gray-600">Crédito interno disponible</p>
                                    <div className="mt-2 inline-flex">
                                        <StatusPill text="15.000.000" tone="success" />
                                    </div>

                                    <p className="pt-4 text-sm text-gray-600">Estado</p>
                                    <div className="mt-2 flex gap-2">
                                        <StatusPill text="Por vencer" tone="warning" />
                                        <StatusPill text="Vencido" tone="danger" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <ActionButton variant="secondary">
                                    <EditIcon className="h-4 w-4" />
                                    Editar
                                </ActionButton>
                                <ActionButton variant="success">
                                    <PlusIcon className="h-4 w-4" />
                                    Nuevo
                                </ActionButton>
                            </div>

                            <ActionButton
                                variant="primary"
                                disabled={!canGoToItems}
                                onClick={() => {
                                    setItemsExpanded(true);
                                    setClienteExpanded(false);
                                }}
                            >
                                Siguiente
                            </ActionButton>
                        </div>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    expanded={itemsExpanded}
                    onChange={(_, expanded) => setItemsExpanded(expanded)}
                    className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm"
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} className="bg-white">
                        <div className="flex items-center gap-2">
                            <CubeIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">Items</span>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails className="bg-white px-5 pb-5 pt-2 md:px-6">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-700">
                                    <MagnifyingGlassIcon className="h-4 w-4" />
                                    PRODUCTOS
                                </div>

                                <FieldRows label="Ítems">
                                    <SelectControl
                                        value={item}
                                        onChange={setItem}
                                        options={productosDemo.map((p) => p.nombre)}
                                        className="max-w-[880px]"
                                    />
                                </FieldRows>

                                <FieldRows label="Cantidad">
                                    <div className="flex max-w-[300px] items-center rounded-lg border border-gray-300 bg-white shadow-sm">
                                        <button
                                            type="button"
                                            className="h-11 w-11 text-lg text-gray-600 transition hover:bg-slate-50"
                                            onClick={() => setCantidadInput(String(Math.max(1, (cantidad || 1) - 1)))}
                                        >
                                            -
                                        </button>
                                        <input
                                            value={cantidadInput}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                if (/^\d*$/.test(next)) {
                                                    setCantidadInput(next);
                                                }
                                            }}
                                            onBlur={() => {
                                                if (cantidadInput.trim() === "" || Number(cantidadInput) <= 0) {
                                                    setCantidadInput("1");
                                                }
                                            }}
                                            type="number"
                                            min={1}
                                            className="h-11 w-full border-x border-gray-200 px-3 text-center text-sm focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            className="h-11 w-11 text-lg text-gray-600 transition hover:bg-slate-50"
                                            onClick={() => setCantidadInput(String((cantidad || 0) + 1))}
                                        >
                                            +
                                        </button>
                                    </div>
                                </FieldRows>

                                <FieldRows label="Criterio de sustitución">
                                    <SelectControl
                                        value={criterio}
                                        onChange={setCriterio}
                                        options={criteriosSustitucion.slice(1)}
                                        placeholder="Seleccione..."
                                        className="max-w-[880px]"
                                    />
                                </FieldRows>

                                <FieldRows label="Notas">
                                    <div className="max-w-[880px] space-y-2">
                                        <textarea
                                            value={notas}
                                            onChange={(e) => setNotas(e.target.value)}
                                            rows={4}
                                            placeholder="Añade indicaciones para esta cotización..."
                                            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        <div className="text-right text-xs text-gray-500">{notas.length}/500</div>
                                    </div>
                                </FieldRows>

                                <div className="max-w-[980px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row">
                                        <img
                                            src={productoSeleccionado.imagen}
                                            alt={productoSeleccionado.nombre}
                                            className="h-24 w-24 rounded-xl border border-slate-200 bg-white object-cover"
                                        />
                                        <div className="flex flex-1 items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{productoSeleccionado.nombre}</p>
                                                <p className="mt-2 text-sm text-gray-600">Precio desde</p>
                                                <ActionButton variant="secondary" size="sm" className="mt-3">
                                                    <ClipboardIcon className="h-4 w-4" />
                                                    Mostrar stock
                                                </ActionButton>
                                            </div>
                                            <p className="text-3xl font-semibold text-gray-800">{clp.format(productoSeleccionado.precio)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <ActionButton variant="success">
                                        <PlusIcon className="h-4 w-4" />
                                        Agregar producto
                                    </ActionButton>
                                    <ActionButton variant="secondary">Productos similares</ActionButton>
                                </div>
                            </div>

                            <aside className="rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24 lg:h-fit">
                                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
                                    TOTALES
                                </div>
                                <div className="space-y-2">
                                    <TotalLine label="Ítems" value={clp.format(totalItems)} />
                                    <TotalLine label="Descuentos" value={clp.format(0)} />
                                    <TotalLine label="Impuestos" value={clp.format(0)} />
                                    <TotalLine label="Intereses de financiación" value={clp.format(0)} />
                                </div>
                                <Divider className="!my-4" />
                                <div className="space-y-2">
                                    <TotalLine label="SUBTOTAL" value={clp.format(totalItems)} bold />
                                    <TotalLine label="TOTAL" value={clp.format(totalItems)} bold />
                                </div>

                            </aside>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <ActionButton variant="primary" disabled={!canContinueItems}>Siguiente</ActionButton>
                        </div>
                    </AccordionDetails>
                </Accordion>
            </div>
        </div>
    );
}
