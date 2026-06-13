"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
    ChevronDown,
    ChevronRight,
    MoreHorizontal,
    Megaphone,
    Pencil,
    X,
    ShoppingCart,
    Barcode,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { ActionButton } from "@/components/ui/button/action-button";

/* ==========
   Helpers UI (mismos criterios de ItemsView)
========== */
const GRID_COLS = "grid-cols-[minmax(0,1fr)_220px_180px_180px_48px]";

function money(n: number, currency: "CLP") {
    const v = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(v);
}

function Chip({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
    return (
        <span
            className={[
                "inline-flex items-center rounded-full px-3 py-1 text-xs border",
                muted ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-700",
            ].join(" ")}
        >
            {children}
        </span>
    );
}

/* ==========
   Mocks 
========== */
type UiItem = {
    id: string;
    name: string;
    image?: string;
    sku?: string;
    barcode?: string;
    unitPrice: number;
    qty: number;
    total: number;
    criteria?: string;
    storeCode?: string;
};

type UiGroup = {
    key: string;
    title: string;
    meta?: { code?: string; status?: string; date?: string };
    items: UiItem[];
};

const mockGroups: UiGroup[] = [
    {
        key: "ITEMS_SUELTOS",
        title: "ITEMS SUELTOS",
        meta: undefined,
        items: [
            {
                id: "ibup-400",
                name: "Ibupiril 400mg",
                image: "https://www.drogariaminasbrasil.com.br/media/webp/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/image/579196eeb/ibupril-400mg-com-10-capsulas-gelatinosas-moles_jpg.webp",
                sku: "3119812813528",
                barcode: "3119812813528",
                unitPrice: 76,
                qty: 3,
                total: 228,
                criteria: "No sustituir",
                storeCode: "659ebfaf5b03e…",
            },
            {
                id: "shampoo-200",
                name: "DRYSCALPCARE SHAMPOO 200ml",
                image: "https://i.ebayimg.com/images/g/9KAAAOSwbNBknmuc/s-l400.png",
                sku: "2714812894525",
                barcode: "2714812894525",
                unitPrice: 126,
                qty: 2,
                total: 252,
                criteria: "No sustituir",
            },
        ],
    },
];

/* ==========
   Reclamos – tipos y estado local
========== */
type Claim = {
    type: string;
    resolution: string;
    area: string;
    qty: number;
    price: number;
    comments?: string;
};

type ClaimsByItem = Record<string, Claim | undefined>;

const CLAIM_TYPES = [
    "Talle incorrecto",
    "Producto dañado",
    "Producto equivocado",
    "Faltante",
];

const CLAIM_RESOLUTIONS = [
    "Enviar nuevo ítem",
    "Reembolsar",
    "Generar nota de crédito",
];

const AREAS = ["Operación", "Atención al cliente", "Comercial"];

/* ==========
   Modal simple
========== */
function Modal({
    open,
    title,
    onClose,
    children,
    onApply,
    applyLabel = "Aplicar",
}: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    onApply: () => void;
    applyLabel?: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative z-10 w-full max-w-3xl rounded-xl border bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-5 py-3">
                    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
                <div className="flex items-center justify-end gap-3 border-t px-5 py-3">
                    <ActionButton variant="secondary" onClick={onClose}>
                        Cancelar
                    </ActionButton>
                    <ActionButton variant="primary" onClick={onApply}>
                        {applyLabel}
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}

/* ==========
   Menú flotante (…)
========== */
function Popover({
    open,
    onClose,
    children,
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="absolute right-0 top-8 z-20 w-64 rounded-lg border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2 text-sm font-medium text-gray-700">
                Acciones de reclamos
                <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
                    <X size={16} />
                </button>
            </div>
            <div className="p-2">{children}</div>
        </div>
    );
}

/* ==========
   Fila de item
========== */
function ItemRow({
    item,
    claim,
    onCreateOrEdit,
}: {
    item: UiItem;
    claim?: Claim;
    onCreateOrEdit: (itemId: string, current?: Claim) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="relative">
            <div className={`relative grid ${GRID_COLS} gap-x-6 px-6 py-5 hover:bg-blue-50/40`}>
                {/* Col 1: item */}
                <div className="flex items-start gap-4 min-w-0">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-white">
                        <img
                            src={item.image || "/placeholder-product.jpg"}
                            alt={item.name}
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-gray-800">{item.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
                            {item.barcode && <span className="font-mono">III {item.barcode}</span>}
                            {item.sku && <span className="font-mono"># {item.sku}</span>}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {item.criteria && <Chip muted>{item.criteria}</Chip>}
                            {item.storeCode && <Chip>{item.storeCode}</Chip>}
                        </div>
                    </div>
                </div>

                {/* Col 2: precio unitario */}
                <div className="justify-self-end text-right whitespace-nowrap text-gray-700">
                    <span className="font-medium">
                        {money(item.unitPrice, "CLP")} <span className="font-normal">x un</span>
                    </span>
                </div>

                {/* Col 3: cantidad */}
                <div className="justify-self-end text-right grid grid-rows-[auto_auto] gap-1">
                    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        <ShoppingCart size={18} className="text-gray-500" />
                        <span className="rounded-full border px-3 py-1 text-sm">{item.qty} un</span>
                    </div>
                    <div className="flex items-center justify-end gap-3 text-sm text-gray-500 whitespace-nowrap">
                        <Barcode size={18} className="text-gray-500" />
                        <span>{item.barcode && item.barcode.trim() !== "" ? item.barcode : "-"}</span>
                    </div>
                </div>

                {/* Col 4: total */}
                <div className="justify-self-end text-right whitespace-nowrap">
                    <span className="font-medium text-gray-900">{money(item.total, "CLP")}</span>
                </div>

                {/* Col 5: acciones (… ) */}
                <div className="flex items-start justify-end">
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                            aria-label="Más acciones"
                        >
                            <MoreHorizontal />
                        </button>
                        <Popover open={menuOpen} onClose={() => setMenuOpen(false)}>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onCreateOrEdit(item.id, claim);
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
                            >
                                <Megaphone size={16} />
                                Crear reclamo
                            </button>
                        </Popover>
                    </div>
                </div>

            </div>

            {/* Panel del reclamo (si existe) */}
            {claim && (
                <div className="mx-6 mb-5 rounded-xl border bg-slate-50 p-5">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div>
                            <div className="text-xs text-gray-500">Tipo de reclamo</div>
                            <div className="font-medium text-gray-800">{claim.type}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Área en cambio</div>
                            <div className="font-medium text-gray-800">{claim.area}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Resolución de reclamos de ítems</div>
                            <div className="font-medium text-gray-800">{claim.resolution}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Cantidad</div>
                            <div className="font-medium text-gray-800">{claim.qty}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Precio</div>
                            <div className="font-medium text-gray-800">{money(claim.price, "CLP")}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Total</div>
                            <div className="font-medium text-gray-800">
                                {money((claim.qty || 0) * (claim.price || 0), "CLP")}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-start justify-between">
                        <div className="min-w-0">
                            <div className="text-xs text-gray-500">Comentarios</div>
                            <div className="truncate text-gray-800">
                                {claim.comments?.trim() ? claim.comments : "—"}
                            </div>
                        </div>
                        <ActionButton variant="secondary" size="sm" onClick={() => onCreateOrEdit(item.id, claim)}>
                            <Pencil size={16} />
                            Editar
                        </ActionButton>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ==========
   Acordeón de grupo
========== */
function CollapsibleGroup({
    group,
    claims,
    onCreateOrEdit,
    defaultOpen = false,
}: {
    group: UiGroup;
    claims: ClaimsByItem;
    onCreateOrEdit: (itemId: string, current?: Claim) => void;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const total = group.items.reduce((acc, it) => acc + (it.total || 0), 0);

    return (
        <div className="rounded-xl border bg-white overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full px-4 py-3 border-b bg-gray-50 hover:bg-gray-100 transition flex items-center gap-3"
            >
                {open ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                <div className="flex-1 text-left font-medium text-gray-800">{group.title}</div>
                <div className="ml-auto flex items-center gap-6 text-sm text-gray-600">
                    <span>{group.items.length} ítem(s)</span>
                    <span className="font-medium">{money(total, "CLP")}</span>
                </div>
            </button>

            {open && (
                <>
                    <div className={`grid ${GRID_COLS} gap-x-6 px-6 py-2 text-[12px] text-gray-500 border-b bg-slate-50`}>
                        <div>Items</div>
                        <div className="text-right">Precio unitario</div>
                        <div className="text-right">Cantidad</div>
                        <div className="text-right">Total</div>
                        <div /> {/* nueva col para acciones */}
                    </div>


                    <div className="divide-y">
                        {group.items.map((it) => (
                            <ItemRow
                                key={it.id}
                                item={it}
                                claim={claims[it.id]}
                                onCreateOrEdit={onCreateOrEdit}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-end gap-10 border-t bg-gray-50 px-6 py-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">TOTAL:</span>
                            <span className="font-semibold">{money(total, "CLP")}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ==========
   Formulario de Claim (contenido del modal)
========== */
function ClaimForm({
    value,
    onChange,
}: {
    value: Claim;
    onChange: (next: Claim) => void;
}) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Tipo de reclamo</span>
                <select
                    className="rounded-lg border px-3 py-2 text-sm"
                    value={value.type}
                    onChange={(e) => onChange({ ...value, type: e.target.value })}
                >
                    <option value="">Selecciona…</option>
                    {CLAIM_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </label>

            <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Resolución de reclamos de ítems</span>
                <select
                    className="rounded-lg border px-3 py-2 text-sm"
                    value={value.resolution}
                    onChange={(e) => onChange({ ...value, resolution: e.target.value })}
                >
                    <option value="">Selecciona…</option>
                    {CLAIM_RESOLUTIONS.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </label>

            <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Área en cambio</span>
                <select
                    className="rounded-lg border px-3 py-2 text-sm"
                    value={value.area}
                    onChange={(e) => onChange({ ...value, area: e.target.value })}
                >
                    <option value="">Selecciona…</option>
                    {AREAS.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">Cantidad</span>
                    <input
                        type="number"
                        min={0}
                        className="rounded-lg border px-3 py-2 text-sm"
                        value={String(value.qty ?? 0)}
                        onChange={(e) => onChange({ ...value, qty: Number(e.target.value || 0) })}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">Precio</span>
                    <input
                        type="number"
                        min={0}
                        className="rounded-lg border px-3 py-2 text-sm"
                        value={String(value.price ?? 0)}
                        onChange={(e) => onChange({ ...value, price: Number(e.target.value || 0) })}
                    />
                </label>
            </div>

            <label className="md:col-span-2 flex flex-col gap-1">
                <span className="text-sm text-gray-600">Comentarios</span>
                <textarea
                    className="min-h-[80px] rounded-lg border px-3 py-2 text-sm"
                    value={value.comments || ""}
                    onChange={(e) => onChange({ ...value, comments: e.target.value })}
                />
            </label>
        </div>
    );
}

/* ==========
   Vista principal: Productos
========== */
export default function TicketsProductosView() {

    const router = useRouter();
    const { id } = useParams();
    const [saving, setSaving] = useState(false);

    const groups = useMemo(() => mockGroups, []);
    const [claims, setClaims] = useState<ClaimsByItem>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [draft, setDraft] = useState<Claim>({
        type: "",
        resolution: "",
        area: "",
        qty: 0,
        price: 0,
        comments: "",
    });

    function openClaimModal(itemId: string, current?: Claim) {
        setEditingItemId(itemId);
        setDraft(
            current ?? { type: "", resolution: "", area: "", qty: 0, price: 0, comments: "" }
        );
        setModalOpen(true);
    }

    function applyClaim() {
        if (!editingItemId) return;
        setClaims((prev) => ({ ...prev, [editingItemId]: { ...draft } }));
        setModalOpen(false);
    }

    const handleApply = useCallback(async () => {
        setSaving(true);
        try {
            console.log("MOCK APPLY claims:", claims);
        } finally {
            setSaving(false);
        }
    }, [claims]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            console.log("MOCK SAVE ticket + claims:", claims);
        } finally {
            setSaving(false);
        }
    }, [claims]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleApply,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/customers/csx/tickets"),
                disabled: saving,
            },
        ],
        [saving, handleApply, handleSave] // evita incluir router si no cambia
    );

    const pageHeader = useMemo(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">TICKETS</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {id ? `#${Array.isArray(id) ? id[0] : id}` : "Detalle"}{" "}
                        <span className="text-gray-400">· Productos</span>
                    </div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions, id]
    );

    usePageHeader(() => pageHeader, [pageHeader]);

    return (
        <section className="space-y-6">
            {/* Encabezado superior del tab (pedido) */}
            <div className="rounded-xl border bg-indigo-50/40 px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                    <span className="inline-flex items-center gap-2">
                        <span className="font-medium">Pedido</span>
                        <span className="text-gray-900 font-semibold">#1402320506934-01</span>
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="rounded-full border bg-white px-3 py-1 text-sm text-gray-700">3</span>
                    <span className="text-sm font-semibold text-gray-900">{money(484, "CLP")}</span>
                </div>
            </div>


            {/* Acordeones */}
            {groups.map((g, i) => (
                <CollapsibleGroup
                    key={g.key + i}
                    group={g}
                    claims={claims}
                    onCreateOrEdit={openClaimModal}
                    defaultOpen={i === 0}
                />
            ))}

            {/* Modal de creación/edición */}
            <Modal
                open={modalOpen}
                title="Crear reclamo"
                onClose={() => setModalOpen(false)}
                onApply={applyClaim}
                applyLabel="Aplicar"
            >
                <ClaimForm value={draft} onChange={setDraft} />
            </Modal>
        </section>
    );
}
