// views/Cuenta/CuentasComercio/Cuentas/Configuraciones/ConfigFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    KeyIcon,
    BuildingStorefrontIcon,
    CurrencyDollarIcon,
    UserIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

/* Toggle (checkbox con el estilo simple que usamos) */
function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? "bg-blue-600" : "bg-gray-300"
                }`}
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-1"
                    }`}
            />
        </button>
    );
}

/* Interfaz del config (sólo los campos de las capturas) */
export interface AccountConfig {
    // Detalle
    detalle_nombre: string;
    detalle_tipo: string;
    detalle_cuentaVtex: string;
    detalle_parent: string;
    // Autenticación
    auth_usuario: string;
    auth_password: string;
    // Comercio
    comercio_publicarSalesChannels: boolean;
    comercio_importarSalesChannels: boolean;
    // Catálogo
    catalogo_publicarMarcas: boolean;
    catalogo_importarMarcas: boolean;
    catalogo_publicarCategorias: boolean;
    catalogo_importarCategorias: boolean;
    catalogo_publicarAtributos: boolean;
    catalogo_importarAtributos: boolean;
    catalogo_publicarProductos: boolean;
    catalogo_generateUniqueSlugs: boolean;
    catalogo_importarProductos: boolean;
    catalogo_importProductsSync: boolean;
    catalogo_publishSkuImages: boolean;
    catalogo_importSkuImages: boolean;
    catalogo_restringirCanalesVenta: string;
    // Precios
    precios_publicar: boolean;
    precios_importar: boolean;
    precios_importarSync: boolean;
    precios_useBasePricesAsPrices: boolean;
    precios_importarListPrice: boolean;
    // Meta (chips de la derecha)
    creador: { initials: string; name: string; email: string };
    creador_fecha: string;
    ultimaMod: { initials: string; name: string; email: string };
    ultimaMod_fecha: string;
}

export function ConfigFields({
    record,
    onChange,
}: {
    record: AccountConfig;
    onChange?: <K extends keyof AccountConfig>(field: K, value: AccountConfig[K]) => void;
}) {
    const set = <K extends keyof AccountConfig>(field: K) => (val: AccountConfig[K]) =>
        onChange?.(field, val);

    const UserChip = ({ u }: { u: AccountConfig["creador"] }) => (
        <div className="inline-flex max-w-[260px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-xs font-semibold text-white">
                {u.initials || "U"}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
                <span className="truncate text-sm font-medium">{u.name || "—"}</span>
                <span className="truncate text-xs text-gray-500">{u.email || "—"}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* ───── DETALLE ───── */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.detalle_nombre}
                                    onChange={(e) => set("detalle_nombre")(e.target.value)}
                                    placeholder="Janis"
                                />
                            </div>

                            {/* Cuenta VTEX */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Cuenta VTEX</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.detalle_cuentaVtex}
                                    onChange={(e) => set("detalle_cuentaVtex")(e.target.value)}
                                    placeholder="janis"
                                />
                            </div>

                            {/* Tipo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.detalle_tipo}
                                    options={["Parent", "Child"]}
                                    onChange={set("detalle_tipo")}
                                    inline
                                />
                            </div>

                            {/* Parent */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Parent</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.detalle_parent}
                                    options={["", "account-1", "account-2"]}
                                    onChange={set("detalle_parent")}
                                />
                            </div>
                        </div>
                    </Card>
                    {/* ───── COMERCIO ───── */}
                    <Card
                        title="COMERCIO"
                        icon={BuildingStorefrontIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 items-center gap-4">
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Publicar canales de venta</span>
                            <div className="col-span-3">
                                <Toggle
                                    checked={record.comercio_publicarSalesChannels}
                                    onChange={set("comercio_publicarSalesChannels")}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar canales de venta</span>
                            <div className="col-span-3">
                                <Toggle
                                    checked={record.comercio_importarSalesChannels}
                                    onChange={set("comercio_importarSalesChannels")}
                                />
                            </div>
                        </div>
                    </Card>


                    {/* ───── CATÁLOGO ───── */}
                    <Card
                        title="CATÁLOGO"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            {/* fila 1 */}
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Publicar Marcas</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_publicarMarcas} onChange={set("catalogo_publicarMarcas")} />
                            </div>
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar Marcas</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_importarMarcas} onChange={set("catalogo_importarMarcas")} />
                            </div>

                            {/* fila 2 */}
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Publicar Categorías</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_publicarCategorias} onChange={set("catalogo_publicarCategorias")} />
                            </div>
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar Categorías</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_importarCategorias} onChange={set("catalogo_importarCategorias")} />
                            </div>

                            {/* fila 3 */}
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Publicar Atributos</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_publicarAtributos} onChange={set("catalogo_publicarAtributos")} />
                            </div>
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar Atributos</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_importarAtributos} onChange={set("catalogo_importarAtributos")} />
                            </div>

                            {/* fila 4 */}
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Publicar Productos</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_publicarProductos} onChange={set("catalogo_publicarProductos")} />
                            </div>
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar Productos</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_importarProductos} onChange={set("catalogo_importarProductos")} />
                            </div>

                            {/* fila 5 */}
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Generate unique slugs</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_generateUniqueSlugs} onChange={set("catalogo_generateUniqueSlugs")} />
                            </div>
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar sincronización de productos</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_importProductsSync} onChange={set("catalogo_importProductsSync")} />
                            </div>

                            {/* fila 6 */}
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Publicar imágenes de SKU</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_publishSkuImages} onChange={set("catalogo_publishSkuImages")} />
                            </div>
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar imágenes de SKU</span>
                            <div className="col-span-3">
                                <Toggle checked={record.catalogo_importSkuImages} onChange={set("catalogo_importSkuImages")} />
                            </div>

                            {/* fila 7: input ancho */}
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Restringir Canales de venta</span>
                            <div className="col-span-9">
                                <CollapsibleField
                                    label=""
                                    value={record.catalogo_restringirCanalesVenta}
                                    options={["", "Sí", "No"]}
                                    onChange={set("catalogo_restringirCanalesVenta")}
                                />
                            </div>
                        </div>
                    </Card>


                    {/* ───── PRECIOS ───── */}
                    <Card
                        title="PRECIOS"
                        icon={CurrencyDollarIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Publicar Precios</span>
                            <div className="col-span-3">
                                <Toggle checked={record.precios_publicar} onChange={set("precios_publicar")} />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar Precios</span>
                            <div className="col-span-3">
                                <Toggle checked={record.precios_importar} onChange={set("precios_importar")} />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar Precios SYNC</span>
                            <div className="col-span-3">
                                <Toggle checked={record.precios_importarSync} onChange={set("precios_importarSync")} />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Utilizar precios base como precios</span>
                            <div className="col-span-3">
                                <Toggle checked={record.precios_useBasePricesAsPrices} onChange={set("precios_useBasePricesAsPrices")} />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Importar listas de Precios</span>
                            <div className="col-span-3">
                                <Toggle checked={record.precios_importarListPrice} onChange={set("precios_useBasePricesAsPrices")} />
                            </div>
                        </div>
                    </Card>

                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="AUTENTICACIÓN"
                        icon={KeyIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Usuario</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.auth_usuario}
                                    onChange={(e) => set("auth_usuario")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Contraseña</span>
                            <div className="col-span-5">
                                <input
                                    type="password"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.auth_password}
                                    onChange={(e) => set("auth_password")(e.target.value)}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <UserChip u={record.creador} />
                            <span className="text-xs text-gray-500">{record.creador_fecha}</span>
                        </div>
                    </Card>

                    <Card
                        title="ÚLTIMA MODIFICACIÓN"
                        icon={PencilSquareIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <UserChip u={record.ultimaMod} />
                            <span className="text-xs text-gray-500">{record.ultimaMod_fecha}</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
