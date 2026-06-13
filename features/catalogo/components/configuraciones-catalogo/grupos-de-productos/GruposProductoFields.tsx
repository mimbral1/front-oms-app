// app/views/Productos/Grupos/components/GruposProductoFields.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    UserIcon,
    QuestionMarkCircleIcon,
    CubeIcon,
    BanknotesIcon,
    TruckIcon,
    AdjustmentsHorizontalIcon,
    Bars3BottomLeftIcon,
    PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuth } from "@/lib/http/client";
import { FlagIcon } from "lucide-react";
import {
    PRODUCT_GROUP_ICON_OPTIONS,
    ProductGroupIcon,
    getProductGroupIconLabel,
} from "@/features/catalogo/components/configuraciones-catalogo/grupos-de-productos/product-group-icons";

/* ====== Interfaz ====== */
export interface ProductGroup {
    id?: string;

    // Detalle
    nombre: string;
    refId: string; // oculto en create (read-only en resumen)
    icono: string; // clave/emoji
    estado: "Activo" | "Inactivo";

    // Reglas
    eanComienzaCon?: string;
    refIdComienzaCon?: string;
    categorias?: string[]; // multi (por nombre)
    canalesVenta?: string[]; // multi (por nombre, mostrado como chips)
    canalesVentaIds?: number[]; // multi (ids desde API)
    unidadMedida?: string;
    skusExcluidos?: string[];

    // Condicionales / Picking
    inventario?: string;
    esquemaBarcode?: string;
    umbralInferior?: number;
    umbralSuperior?: number;
    loteRequerido?: boolean;
    loteVencimiento?: boolean;
    autoPicking?: boolean;
    requierePreparacion?: boolean;
    tipoCandidato?: string;

    // OMS
    omsComportamientos?: string;
    omsComplementanIds?: string;

    // Packing
    tiposPaquete?: string;
    diasPreparacion?: number;

    // Facturación
    umFacturacion?: string;

    // Fulfillment
    almacenesPrioritarios?: string[]; // chips

    // Entrega
    modalidadEntrega?: string;
    metodosEntrega?: string[]; // multi (por nombre, chips)

    // Usuario (solo en resumen)
    created?: { username: string; email: string; date: string };
    modified?: { username: string; email: string; date: string };
}

export function GruposProductoFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: ProductGroup;
    readOnly?: boolean;
    onChange?: (field: keyof ProductGroup, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof ProductGroup) => (v: any) => onChange?.(field, v);
    const { fetchWithAuth } = useFetchWithAuth();

    /* ====== Listas (mocks para selects simples) ====== */
    const [listas, setListas] = useState<{
        categorias: string[];
        unidades: string[];
        paquetes: string[];
        modalidadesEntrega: string[];
        esquemasBarcode: string[];
        tiposCandidato: string[];
        iconos: { label: string; value: string }[];
        estados: string[];
        omsComportamientos: string[];
    }>({
        categorias: ["Lácteos", "Electro", "Congelados", "Preparables"],
        unidades: ["UN", "KG", "LT"],
        paquetes: ["Caja", "Bolsa", "Bundle"],
        modalidadesEntrega: ["Pickup", "Delivery"],
        esquemasBarcode: ["Default", "PesoVariable", "EAN13"],
        tiposCandidato: ["Traditional", "Weighted"],
        iconos: [
            { label: "balanza-pesable", value: "⚖ï¸‍" },
            { label: "caja", value: "📦" },
            { label: "frasco", value: "🧴" },
        ],
        estados: ["Activo", "Inactivo"],
        omsComportamientos: ["Default", "Prioridad"],
    });

    /* ====== Canales de venta desde API (igual patrón que CommerceAccounts) ====== */
    // Doc base: CommerceAccountsFields (carga de canales)  :contentReference[oaicite:2]{index=2}
    const [channels, setChannels] = useState<Array<{ Id: number; Name: string }>>([]);
    const [channelSearch, setChannelSearch] = useState("");
    const [loadingChannels, setLoadingChannels] = useState(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoadingChannels(true);
                const res = await fetchWithAuth<{ ok: boolean; data: any[] }>(
                    "comerce-service/sales-channel/Listar?page=1&pageSize=200&isActive=1"
                );
                if (!mounted) return;
                const rows = Array.isArray(res?.data) ? res.data : [];
                setChannels(rows.map((r: any) => ({ Id: Number(r.Id), Name: String(r.Name ?? `#${r.Id}`) })));
            } catch (e) {
                console.error("Error listando canales:", e);
                setChannels([]);
            } finally {
                if (mounted) setLoadingChannels(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]); // usa fetch-with-auth centralizado  :contentReference[oaicite:3]{index=3}

    // 1) Dedupe por Id (garantiza keys únicas)
    const uniqueChannels = useMemo(() => {
        const map = new Map<string, { Id: number; Name: string }>();
        for (const c of channels) {
            const k = String(c.Id);
            if (!map.has(k)) map.set(k, c); // conserva el primero (o el último si prefieres)
        }
        return Array.from(map.values());
    }, [channels]);

    // 2) Opciones ya únicas (incluye solo un "Seleccione…")
    const channelOptions = useMemo(
        () => [
            { label: "Seleccione canal…", value: "" },
            ...uniqueChannels.map((c) => ({ label: c.Name, value: String(c.Id) })),
        ],
        [uniqueChannels]
    );


    // helper para agregar canal (mantener arrays de ids y nombres sincronizados)
    const addCanalVenta = (val?: string, label?: string) => {
        if (!val || !label) return;
        const idNum = Number(val);
        if (Number.isNaN(idNum)) return;

        const ids = new Set(record.canalesVentaIds ?? []);
        const names = new Set(record.canalesVenta ?? []);
        if (!ids.has(idNum)) {
            ids.add(idNum);
            handle("canalesVentaIds")(Array.from(ids));
        }
        if (!names.has(label)) {
            names.add(label);
            handle("canalesVenta")(Array.from(names));
        }
    };

    const removeCanalVenta = (label: string) => {
        const nameList = (record.canalesVenta ?? []).filter((n) => n !== label);
        handle("canalesVenta")(nameList);

        // también sacar el id correspondiente (buscamos por label)
        const opt = channels.find((c) => c.Name === label);
        if (opt) {
            handle("canalesVentaIds")((record.canalesVentaIds ?? []).filter((id) => id !== opt.Id));
        }
    };

    /* ====== Chips helper ====== */
    const Chips = ({
        values,
        onRemove,
    }: {
        values: string[] | undefined;
        onRemove: (value: string) => void;
    }) => (
        <div className="flex flex-wrap gap-2">
            {(values ?? []).map((v) => (
                <span key={v} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs">
                    {v}
                    <button className="ml-1 text-blue-600" onClick={() => onRemove(v)} aria-label={`Quitar ${v}`}>
                        ×
                    </button>
                </span>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-8 gap-4">
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Nombre</span>
                            <div className="col-span-6">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>

                            {!isCreate && (
                                <>
                                    <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Ref ID</span>
                                    <div className="col-span-6">
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={record.refId}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                </>
                            )}

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Ícono</span>
                            <div className="col-span-6">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#8b9aba]">
                                        <ProductGroupIcon iconKey={record.icono} className="h-5 w-5 stroke-[1.8]" />
                                    </span>
                                    <div className="flex-1">
                                        <CollapsibleField
                                            label=""
                                            value={getProductGroupIconLabel(record.icono)}
                                            options={PRODUCT_GROUP_ICON_OPTIONS.map((i) => i.label)}
                                            onChange={(label) => {
                                                const found = PRODUCT_GROUP_ICON_OPTIONS.find((i) => i.label === label);
                                                handle("icono")(found?.value ?? "");
                                            }}
                                            inline
                                        />
                                    </div>
                                </div>
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Estado</span>
                            <div className="col-span-6">
                                <CollapsibleField
                                    label=""
                                    value={record.estado}
                                    options={listas.estados}
                                    onChange={(v) => handle("estado")(v as ProductGroup["estado"])}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/* REGLAS */}
                    <Card
                        title="REGLAS"
                        icon={FlagIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-8 gap-4">
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">EAN comienza con</span>
                            <div className="col-span-6">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.eanComienzaCon ?? ""}
                                    onChange={(e) => handle("eanComienzaCon")(e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Ref ID comienza con</span>
                            <div className="col-span-6">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.refIdComienzaCon ?? ""}
                                    onChange={(e) => handle("refIdComienzaCon")(e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Categorías</span>
                            <div className="col-span-6">
                                {/* Selección por CollapsibleField (uno por vez) + chips */}
                                <div className="flex flex-col gap-2">
                                    <CollapsibleField
                                        label=""
                                        value=""
                                        options={listas.categorias}
                                        onChange={(label) => {
                                            if (!label) return;
                                            const current = record.categorias ?? [];
                                            if (!current.includes(label)) {
                                                handle("categorias")([...current, label]);
                                            }
                                        }}
                                        inline
                                    />
                                    <Chips values={record.categorias} onRemove={(v) => handle("categorias")((record.categorias ?? []).filter((x) => x !== v))} />
                                </div>
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Canales de venta</span>
                            <div className="col-span-6">
                                {/* Basado en Accounts: buscador con API (multi con chips)  :contentReference[oaicite:4]{index=4} */}
                                <div className="flex flex-col gap-2">
                                    <SelectSearchInline
                                        id="sales-channels"
                                        label="Canal"
                                        value=""
                                        options={channelOptions}   // <- ahora sin duplicados
                                        searchQuery={channelSearch}
                                        loading={loadingChannels}
                                        onSearch={setChannelSearch}
                                        onChange={(val, label) => addCanalVenta(val, label)}
                                        placeholderFromDefault
                                    />

                                    <Chips values={record.canalesVenta} onRemove={removeCanalVenta} />
                                </div>
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Unidad de medida</span>
                            <div className="col-span-6">
                                <CollapsibleField
                                    label=""
                                    value={record.unidadMedida ?? ""}
                                    options={listas.unidades}
                                    onChange={handle("unidadMedida")}
                                    inline
                                />
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">SKUs excluidos</span>
                            <div className="col-span-6">
                                <input
                                    className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="Escriba SKU y Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const v = (e.target as HTMLInputElement).value.trim();
                                            if (!v) return;
                                            handle("skusExcluidos")([...(record.skusExcluidos ?? []), v]);
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }}
                                    disabled={readOnly}
                                />
                                <Chips
                                    values={record.skusExcluidos}
                                    onRemove={(v) => handle("skusExcluidos")((record.skusExcluidos ?? []).filter((x) => x !== v))}
                                />
                            </div>

                            <div className="col-span-8 flex flex-col gap-4 pt-2">
                                <ActionButton
                                    type="button"
                                    size="sm"
                                    className="w-fit rounded-full border-0 bg-[#63d38a] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#57c57d]"
                                >
                                    Añadir atributo de producto
                                    <Bars3BottomLeftIcon className="order-first h-5 w-5" />
                                </ActionButton>
                                <ActionButton
                                    type="button"
                                    size="sm"
                                    className="w-fit rounded-full border-0 bg-[#63d38a] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#57c57d]"
                                >
                                    Añadir atributo de SKU
                                    <Bars3BottomLeftIcon className="order-first h-5 w-5" />
                                </ActionButton>
                                <ActionButton
                                    type="button"
                                    size="sm"
                                    className="w-fit rounded-full border-0 bg-[#4e83ee] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3f74de]"
                                >
                                    Reglas nuevas
                                    <PlusCircleIcon className="order-first h-5 w-5" />
                                </ActionButton>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* CONDICIONALES */}
                    <Card
                        title="CONDICIONALES"
                        icon={QuestionMarkCircleIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-8 gap-4">
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Inventario</span>
                            <div className="col-span-6">
                                {/* si más adelante viene de API, lo enchufamos aquí también */}
                                <CollapsibleField
                                    label=""
                                    value={record.inventario ?? ""}
                                    options={["Palermo", "Belgrano", "Centro"]}
                                    onChange={handle("inventario")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/* COMPORTAMIENTO EN PICKING */}
                    <Card
                        title="COMPORTAMIENTO EN PICKING"
                        icon={AdjustmentsHorizontalIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-8 gap-4">
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Esquema de Barcode</span>
                            <div className="col-span-6">
                                <CollapsibleField
                                    label=""
                                    value={record.esquemaBarcode ?? ""}
                                    options={listas.esquemasBarcode}
                                    onChange={handle("esquemaBarcode")}
                                    inline
                                />
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Umbral inferior</span>
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <span>%</span>
                                    <input
                                        type="number"
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.umbralInferior ?? 0}
                                        onChange={(e) => handle("umbralInferior")(Number(e.target.value))}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Umbral superior</span>
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <span>%</span>
                                    <input
                                        type="number"
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.umbralSuperior ?? 0}
                                        onChange={(e) => handle("umbralSuperior")(Number(e.target.value))}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            {/* Toggles */}
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Lote requerido</span>
                            <div className="col-span-6">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={!!record.loteRequerido}
                                    onClick={() => handle("loteRequerido")(!record.loteRequerido)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.loteRequerido ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.loteRequerido ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Lote y vencimiento</span>
                            <div className="col-span-6">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={!!record.loteVencimiento}
                                    onClick={() => handle("loteVencimiento")(!record.loteVencimiento)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.loteVencimiento ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.loteVencimiento ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Auto picking</span>
                            <div className="col-span-6">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={!!record.autoPicking}
                                    onClick={() => handle("autoPicking")(!record.autoPicking)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.autoPicking ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.autoPicking ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Requiere preparación</span>
                            <div className="col-span-6">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={!!record.requierePreparacion}
                                    onClick={() => handle("requierePreparacion")(!record.requierePreparacion)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.requierePreparacion ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.requierePreparacion ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Tipo de candidato</span>
                            <div className="col-span-6">
                                <CollapsibleField
                                    label=""
                                    value={record.tipoCandidato ?? ""}
                                    options={listas.tiposCandidato}
                                    onChange={handle("tipoCandidato")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/* OMS */}
                    <Card
                        title="COMPORTAMIENTOS DE LAS OMS"
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6">
                        <div className="grid grid-cols-8 gap-4">
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Comportamientos</span>
                            <div className="col-span-6">
                                <CollapsibleField
                                    label=""
                                    value={record.omsComportamientos ?? ""}
                                    options={listas.omsComportamientos}
                                    onChange={handle("omsComportamientos")}
                                    inline
                                />
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">complementan ids</span>
                            <div className="col-span-6">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.omsComplementanIds ?? ""}
                                    onChange={(e) => handle("omsComplementanIds")(e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* PACKING */}
                    <Card
                        title="COMPORTAMIENTOS DE PACKING"
                        icon={CubeIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-8 gap-4">
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Tipos de paquete</span>
                            <div className="col-span-6">
                                <CollapsibleField
                                    label=""
                                    value={record.tiposPaquete ?? ""}
                                    options={listas.paquetes}
                                    onChange={handle("tiposPaquete")}
                                    inline
                                />
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Días de preparación</span>
                            <div className="col-span-6">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.diasPreparacion ?? 0}
                                    onChange={(e) => handle("diasPreparacion")(Number(e.target.value))}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* FACTURACIÓN */}
                    <Card
                        title="FACTURACIÓN"
                        icon={BanknotesIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-8 gap-4">
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">UM Facturación</span>
                            <div className="col-span-6">
                                <CollapsibleField
                                    label=""
                                    value={record.umFacturacion ?? ""}
                                    options={listas.unidades}
                                    onChange={handle("umFacturacion")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/* FULFILLMENT */}
                    <Card
                        icon={AdjustmentsHorizontalIcon}
                        title="FULFILLMENT"
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6">
                        <div className="grid grid-cols-8 gap-4">
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Almacenes prioritarios</span>
                            <div className="col-span-6">
                                <input
                                    className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="Escriba almacén y Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const v = (e.target as HTMLInputElement).value.trim();
                                            if (!v) return;
                                            handle("almacenesPrioritarios")([...(record.almacenesPrioritarios ?? []), v]);
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }}
                                    disabled={readOnly}
                                />
                                <Chips
                                    values={record.almacenesPrioritarios}
                                    onRemove={(v) =>
                                        handle("almacenesPrioritarios")((record.almacenesPrioritarios ?? []).filter((x) => x !== v))
                                    }
                                />
                            </div>
                        </div>
                    </Card>

                    {/* ENTREGA */}
                    <Card
                        title="COMPORTAMIENTOS DE ENTREGA"
                        icon={TruckIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-8 gap-4">
                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Modalidad de entrega</span>
                            <div className="col-span-6">
                                <CollapsibleField
                                    label=""
                                    value={record.modalidadEntrega ?? ""}
                                    options={listas.modalidadesEntrega}
                                    onChange={handle("modalidadEntrega")}
                                    inline
                                />
                            </div>

                            <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Métodos de entrega</span>
                            <div className="col-span-6">
                                {/* Multi por CollapsibleField + chips (uno por vez) */}
                                <div className="flex flex-col gap-2">
                                    <CollapsibleField
                                        label=""
                                        value=""
                                        options={["Retiro", "Envío normal", "Envío express"]}
                                        onChange={(label) => {
                                            if (!label) return;
                                            const current = record.metodosEntrega ?? [];
                                            if (!current.includes(label)) {
                                                handle("metodosEntrega")([...current, label]);
                                            }
                                        }}
                                        inline
                                    />
                                    <Chips
                                        values={record.metodosEntrega}
                                        onRemove={(v) => handle("metodosEntrega")((record.metodosEntrega ?? []).filter((x) => x !== v))}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* USUARIOS (solo en Resumen) */}
                    {!isCreate && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="grid grid-cols-8 gap-4">
                                <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Usuario</span>
                                <div className="col-span-6 text-sm text-gray-700">{record.created?.username ?? "—"}</div>

                                <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Email</span>
                                <div className="col-span-6 text-sm text-gray-700">{record.created?.email ?? "—"}</div>

                                <span className="col-span-2 whitespace-nowrap text-sm font-bold text-gray-600">Fecha</span>
                                <div className="col-span-6 text-sm text-gray-700">{record.created?.date ?? "—"}</div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}




