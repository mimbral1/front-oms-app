"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { SprintFieldsResumen, SprintRecord } from "@/features/almacenes/components/gestion/sprints/SprintsFieldsResumen";
import { fmtDateTime } from "@/lib/format/date";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";


import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
const API_BASE = BASE_WAREHOUSES;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});

type ApiSprintDetail = {
    id?: string | null;
    displayId?: string | null;
    source?: { warehousesIds?: string[] | null } | null;
    destination?: { warehousesIds?: string[] | null } | null;
    totals?: {
        movements?: number | null;
        warehouses?: number | null;
        orders?: number | null;
        packages?: number | null;
        skus?: number | null;
    } | null;
    movementsIds?: string[] | null;
    assigneeId?: string | null;
    receiverId?: string | null;
    dateStarted?: string | null;
    dateEnded?: string | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    userCreated?: string | null;
    userModified?: string | null;
};

/* ───────────────────────────── Helpers UI ───────────────────────────── */

function Modal({
    open,
    title,
    onClose,
    onApply,
    children,
    width = 520,
}: {
    open: boolean;
    title: string;
    onClose: () => void;
    onApply: () => void;
    children: React.ReactNode;
    width?: number;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/30 p-4">
            <div className="mt-10 w-full rounded-xl bg-white shadow-xl" style={{ maxWidth: width }}>
                <div className="flex items-center justify-between border-b px-5 py-3">
                    <div className="text-sm font-semibold uppercase text-gray-700">{title}</div>
                    <button className="rounded p-1 text-gray-500 hover:bg-gray-100" onClick={onClose}>✕</button>
                </div>
                <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
                <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
                    <ActionButton variant="secondary" size="sm" onClick={onClose}>
                        Cancelar
                    </ActionButton>
                    <ActionButton variant="primary" size="sm" onClick={onApply}>
                        Aplicar
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}

function DateTimeStack({
    date,
    time,
    onDate,
    onTime,
    label,
}: {
    date: string;
    time: string;
    onDate: (v: string) => void;
    onTime: (v: string) => void;
    label: string;
}) {
    return (
        <>
            <span className="col-span-2 text-sm text-gray-600">{label}</span>
            <div className="col-span-10">
                <div className="grid grid-cols-1 gap-2">
                    <input
                        type="date"
                        className="w-full border-b border-gray-300 text-sm outline-none"
                        value={date}
                        onChange={(e) => onDate(e.target.value)}
                    />
                    <input
                        type="time"
                        className="w-full border-b border-gray-300 text-sm outline-none"
                        value={time}
                        onChange={(e) => onTime(e.target.value)}
                    />
                </div>
            </div>
        </>
    );
}

/* ───────────────────────────── Modales ───────────────────────────── */

// A) Añadir movimiento
function AddMovementModal({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: () => void }) {
    const [warehouse, setWarehouse] = useState("");
    const [srcPos, setSrcPos] = useState("");
    const [dstPos, setDstPos] = useState("");
    const [order, setOrder] = useState("");
    const [pkg, setPkg] = useState("");
    const [barcode, setBarcode] = useState("");
    const [sku, setSku] = useState("");
    const [qty, setQty] = useState<string | number>("");
    const [dateStart, setDateStart] = useState("");
    const [timeStart, setTimeStart] = useState("");
    const [receiver, setReceiver] = useState("");

    return (
        <Modal open={open} onClose={onClose} onApply={onApply} title="AÑADIR MOVIMIENTO">
            <div className="grid grid-cols-12 gap-4">
                <span className="col-span-2 text-sm text-gray-600">Almacén</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={warehouse} options={["PLC", "Piso 1", "Piso 2"]} onChange={(v) => setWarehouse(String(v))} inline />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Posición origen</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={srcPos} options={["", "A-01", "B-02", "C-03"]} onChange={(v) => setSrcPos(String(v))} inline />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Posición destino</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={dstPos} options={["", "D-10", "E-11"]} onChange={(v) => setDstPos(String(v))} inline />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Pedido</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={order} options={["", "VSC-116546...-01"]} onChange={(v) => setOrder(String(v))} inline />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Paquete</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={pkg} options={["", "PKG-001", "PKG-002"]} onChange={(v) => setPkg(String(v))} inline />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Código de barras</span>
                <div className="col-span-10">
                    <input className="w-full border-b border-gray-300 text-sm outline-none" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                </div>

                <span className="col-span-2 text-sm text-gray-600">SKU</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={sku} options={["", "SKU-001", "SKU-002"]} onChange={(v) => setSku(String(v))} inline />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Cantidad</span>
                <div className="col-span-10">
                    <input type="number" className="w-full border-b border-gray-300 text-sm outline-none" value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>

                <DateTimeStack label="Fecha de inicio" date={dateStart} time={timeStart} onDate={setDateStart} onTime={setTimeStart} />

                <span className="col-span-2 text-sm text-gray-600">Receptor</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={receiver} options={["", "Ismael García", "Ariel Mikowski"]} onChange={(v) => setReceiver(String(v))} inline />
                </div>
            </div>
        </Modal>
    );
}

// B) Pickear movimiento
function PickMovementModal({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: () => void }) {
    const [movement, setMovement] = useState("");
    const [srcPos, setSrcPos] = useState("");
    const [barcode, setBarcode] = useState("");
    const [datePicked, setDatePicked] = useState("");
    const [timePicked, setTimePicked] = useState("");
    const [receiver, setReceiver] = useState("");

    return (
        <Modal open={open} onClose={onClose} onApply={onApply} title="PICKEAR MOVIMIENTO">
            <div className="grid grid-cols-12 gap-4">
                <span className="col-span-2 text-sm text-gray-600">Movimiento</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={movement} options={["", "210930-65TQHP - VSC-1165460210122-01"]} onChange={(v) => setMovement(String(v))} inline />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Posición origen</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={srcPos} options={["", "A-01", "B-02"]} onChange={(v) => setSrcPos(String(v))} inline />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Código de barras</span>
                <div className="col-span-10">
                    <input className="w-full border-b border-gray-300 text-sm outline-none" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                </div>

                <DateTimeStack label="Fecha de pick" date={datePicked} time={timePicked} onDate={setDatePicked} onTime={setTimePicked} />

                <span className="col-span-2 text-sm text-gray-600">Receptor</span>
                <div className="col-span-10">
                    <input className="w-full border-b border-gray-300 text-sm outline-none" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
                </div>
            </div>
        </Modal>
    );
}

// C) Terminar movimiento
function EndMovementModal({ open, onClose, onApply, movementOptions }: { open: boolean; onClose: () => void; onApply: (movementId: string) => void; movementOptions: string[] }) {
    const [movement, setMovement] = useState("");
    const [movementId, setMovementId] = useState("");
    const [dstPos, setDstPos] = useState("");
    const [barcode, setBarcode] = useState("");
    const [datePicked, setDatePicked] = useState("");
    const [timePicked, setTimePicked] = useState("");
    const [dateEnded, setDateEnded] = useState("");
    const [timeEnded, setTimeEnded] = useState("");
    const [receiver, setReceiver] = useState("");

    return (
        <Modal open={open} onClose={onClose} onApply={() => onApply(movementId.trim())} title="TERMINAR MOVIMIENTO">
            <div className="grid grid-cols-12 gap-4">
                <span className="col-span-2 text-sm text-gray-600">Movimiento</span>
                <div className="col-span-10">
                    <CollapsibleField
                        label=""
                        value={movement}
                        options={["", ...movementOptions]}
                        onChange={(v) => {
                            const selected = String(v);
                            setMovement(selected);
                            if (selected.trim()) setMovementId(selected.trim());
                        }}
                        inline
                    />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Movement ID</span>
                <div className="col-span-10">
                    <input
                        className="w-full border-b border-gray-300 text-sm outline-none"
                        value={movementId}
                        onChange={(e) => setMovementId(e.target.value)}
                        placeholder="57cc4c02-0b72-4338-9b6d-c40556b17b19"
                    />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Posición destino</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={dstPos} options={["", "D-10", "E-11"]} onChange={(v) => setDstPos(String(v))} inline />
                </div>

                <span className="col-span-2 text-sm text-gray-600">Código de barras</span>
                <div className="col-span-10">
                    <input className="w-full border-b border-gray-300 text-sm outline-none" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                </div>

                <DateTimeStack label="Fecha de pick" date={datePicked} time={timePicked} onDate={setDatePicked} onTime={setTimePicked} />
                <DateTimeStack label="Fecha de fin" date={dateEnded} time={timeEnded} onDate={setDateEnded} onTime={setTimeEnded} />

                <span className="col-span-2 text-sm text-gray-600">Receptor</span>
                <div className="col-span-10">
                    <input className="w-full border-b border-gray-300 text-sm outline-none" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
                </div>
            </div>
        </Modal>
    );
}

// D) Rechazar movimientos / sprint
function RejectMovementsModal({ open, onClose, onApply, movementOptions }: { open: boolean; onClose: () => void; onApply: () => void; movementOptions: string[] }) {
    const [globalMessage] = useState("No se pudo completar el sprint");
    const [items, setItems] = useState<{ movement: string; message: string; id: string }[]>([]);

    const addItem = () =>
        setItems((prev) => [...prev, { id: Math.random().toString(36).slice(2), movement: "", message: "" }]);

    const updateItem = (id: string, patch: Partial<{ movement: string; message: string }>) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

    const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

    return (
        <Modal open={open} onClose={onClose} onApply={onApply} title="RECHAZAR MOVIMIENTOS / SPRINT" width={650}>
            <div className="grid grid-cols-12 gap-4">
                <span className="col-span-3 text-sm text-gray-600">Mensaje de rechazo</span>
                <div className="col-span-9">
                    <input className="w-full border-b border-gray-300 text-sm outline-none" value={globalMessage} readOnly />
                </div>

                <div className="col-span-12">
                    {items.map((it, idx) => (
                        <div key={it.id} className="mb-4 rounded-lg border border-gray-200 p-3">
                            <div className="mb-3 grid grid-cols-12 gap-4">
                                <span className="col-span-3 text-sm text-gray-600">Movimiento #{idx + 1}</span>
                                <div className="col-span-9">
                                    <CollapsibleField label="" value={it.movement} options={["", ...movementOptions]} onChange={(v) => updateItem(it.id, { movement: String(v) })} inline />
                                </div>

                                <span className="col-span-3 text-sm text-gray-600">Mensaje de rechazo</span>
                                <div className="col-span-9">
                                    <input className="w-full border-b border-gray-300 text-sm outline-none" value={it.message} onChange={(e) => updateItem(it.id, { message: e.target.value })} placeholder="Motivo específico..." />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <ActionButton variant="error" size="sm" onClick={() => removeItem(it.id)}>
                                    Quitar
                                </ActionButton>
                            </div>
                        </div>
                    ))}

                    <ActionButton variant="primary" size="sm" className="mt-2" onClick={addItem}>
                        Agregar movimiento a rechazar
                    </ActionButton>
                </div>
            </div>
        </Modal>
    );
}

// E) Terminar sprint
function EndSprintModal({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: () => void }) {
    const [dateEnded, setDateEnded] = useState("");
    const [timeEnded, setTimeEnded] = useState("");
    const [receiver, setReceiver] = useState("");

    return (
        <Modal open={open} onClose={onClose} onApply={onApply} title="TERMINAR SPRINT">
            <div className="grid grid-cols-12 gap-4">
                <DateTimeStack label="Fecha de fin" date={dateEnded} time={timeEnded} onDate={setDateEnded} onTime={setTimeEnded} />
                <span className="col-span-2 text-sm text-gray-600">Receptor</span>
                <div className="col-span-10">
                    <CollapsibleField label="" value={receiver} options={["", "Ismael García", "Ariel Mikowski"]} onChange={(v) => setReceiver(String(v))} inline />
                </div>
            </div>
        </Modal>
    );
}

/* ───────────────── Vista Resumen ───────────────── */

export default function SprintResumenView() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const sprintId = String(params?.id || "");

    const [record, setRecord] = useState<SprintRecord>({
        id: "-",
        title: "-",
        status: "Started",
        destLocation: "-",
        destWarehouse: "-",
        sourceGroup: "-",
        startedAt: "-",
        endedAt: "-",
        assignee: { name: "-", email: "-" },
        creator: { name: "-", email: "-" },
    });
    const [movementOptions, setMovementOptions] = useState<string[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    // Modals
    const [addOpen, setAddOpen] = useState(false);
    const [pickOpen, setPickOpen] = useState(false);
    const [endOpen, setEndOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [endSprintOpen, setEndSprintOpen] = useState(false);

    const normalizeStatus = (statusRaw?: string | null): string => {
        const s = String(statusRaw || "").trim().toLowerCase();
        if (s === "ended" || s === "posted") return "Ended";
        if (s === "rejected" || s === "cancelled" || s === "canceled") return "Rejected";
        return "Started";
    };

    const mapWarehouses = (ids?: string[] | null) => {
        if (!Array.isArray(ids) || ids.length === 0) return "-";
        return ids.join(", ");
    };

    const mapDate = (value?: string | null) => (value ? fmtDateTime(value) : "-");

    const fetchSprintDetail = useCallback(async () => {
        if (!sprintId) return;
        try {
            setLoadingDetail(true);
            setDetailError(null);
            const response = await fetch(`${API_BASE}/sprint/${encodeURIComponent(sprintId)}`, {
                method: "GET",
                headers: JANIS_HEADERS,
            });
            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(text || `HTTP ${response.status}`);
            }

            const data = (await response.json()) as ApiSprintDetail;
            const displayId = String(data.displayId || data.id || "-");

            setMovementOptions(Array.isArray(data.movementsIds) ? data.movementsIds.map((id) => String(id)) : []);
            setRecord({
                id: displayId,
                title: displayId,
                status: normalizeStatus(data.status),
                destLocation: mapWarehouses(data.destination?.warehousesIds),
                destWarehouse: mapWarehouses(data.destination?.warehousesIds),
                sourceGroup: mapWarehouses(data.source?.warehousesIds),
                startedAt: mapDate(data.dateStarted),
                endedAt: mapDate(data.dateEnded),
                assignee: { name: String(data.assigneeId || "-"), email: "-" },
                creator: {
                    name: String(data.userCreated || "-"),
                    email: "-",
                    date: mapDate(data.dateCreated),
                },
            });
        } catch (error: any) {
            setDetailError(error?.message || "Error al cargar el sprint");
        } finally {
            setLoadingDetail(false);
        }
    }, [sprintId]);

    useEffect(() => {
        fetchSprintDetail();
    }, [fetchSprintDetail]);

    const postSprintAction = async (path: string, body?: unknown) => {
        const response = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: {
                ...JANIS_HEADERS,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(text || `HTTP ${response.status}`);
        }

        try {
            return await response.json();
        } catch {
            return null;
        }
    };

    const handleEndSprint = async () => {
        if (!sprintId) {
            alert("No se encontró el ID del sprint.");
            return;
        }
        try {
            await postSprintAction(`/sprint/${encodeURIComponent(sprintId)}/end`);
            setEndSprintOpen(false);
            await fetchSprintDetail();
            alert("Sprint terminado correctamente.");
        } catch (error: any) {
            alert(`No se pudo terminar el sprint: ${error?.message || "Error desconocido"}`);
        }
    };

    const handleRejectSprint = async () => {
        if (!sprintId) {
            alert("No se encontró el ID del sprint.");
            return;
        }
        try {
            await postSprintAction(`/sprint/${encodeURIComponent(sprintId)}/reject`, {
                rejectedMessage: "No se pudo completar el sprint",
            });
            setRejectOpen(false);
            await fetchSprintDetail();
            alert("Sprint rechazado correctamente.");
        } catch (error: any) {
            alert(`No se pudo rechazar el sprint: ${error?.message || "Error desconocido"}`);
        }
    };

    const handleEndMovement = async (movementId: string) => {
        if (!sprintId) {
            alert("No se encontró el ID del sprint.");
            return;
        }
        if (!movementId) {
            alert("Debes ingresar el ID del movimiento.");
            return;
        }
        try {
            await postSprintAction(`/sprint/${encodeURIComponent(sprintId)}/movement/${encodeURIComponent(movementId)}/end`);
            setEndOpen(false);
            await fetchSprintDetail();
            alert("Movimiento terminado correctamente.");
        } catch (error: any) {
            alert(`No se pudo terminar el movimiento: ${error?.message || "Error desconocido"}`);
        }
    };

    // Header
    const headerActions: Action[] = [
        // { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-4 w-4" />, onClick: () => console.log("Aplicar") },
        // { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("Guardar") },
        // {
        //     label: "Guardar & Crear nuevo",
        //     variant: "success",
        //     icon: (
        //         <div className="relative flex h-5 w-5 items-center justify-center">
        //             <SaveOutlined className="h-4 w-4 text-current" />
        //             <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
        //                 <FaPlus className="h-2.5 w-2.5 text-blue-500" />
        //             </div>
        //         </div>
        //     ),
        //     onClick: () => console.log("Guardar & nuevo"),
        // },
        { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-4 w-4" />, onClick: () => router.push("/almacen/gestion/sprints") },
    ];

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Sprint</div>
                    <div className="text-2xl font-semibold text-gray-900">{record.title}</div>
                </div>
            ),
            action: headerActions,
            status: record.status
                ? { text: record.status, variant: record.status === "Ended" ? "success" : "warning" }
                : undefined,
        } as unknown as PageHeaderProps),
        [record.title, record.status]
    );

    return (
        <div className="p-6 bg-white">
            {/* Barra de acciones arriba a la derecha */}
            <div className="mb-4 flex justify-end">
                <div className="flex flex-wrap gap-2">
                    <ActionButton variant="primary" size="sm" onClick={() => setAddOpen(true)}>Añadir movimiento</ActionButton>
                    <ActionButton variant="primary" size="sm" onClick={() => setPickOpen(true)}>Pickear movimiento</ActionButton>
                    <ActionButton variant="success" size="sm" onClick={() => setEndOpen(true)}>Terminar movimiento</ActionButton>
                    <ActionButton variant="error" size="sm" onClick={() => setRejectOpen(true)}>Rechazar movimientos / sprint</ActionButton>
                    <ActionButton variant="success" size="sm" onClick={() => setEndSprintOpen(true)}>Terminar sprint</ActionButton>
                </div>
            </div>

            {/* Campos del resumen */}
            {loadingDetail && <p className="mb-3 text-sm text-gray-500">Cargando sprint...</p>}
            {detailError && <p className="mb-3 text-sm text-red-600">{detailError}</p>}
            <SprintFieldsResumen record={record} />

            {/* Modales */}
            <AddMovementModal open={addOpen} onClose={() => setAddOpen(false)} onApply={() => setAddOpen(false)} />
            <PickMovementModal open={pickOpen} onClose={() => setPickOpen(false)} onApply={() => setPickOpen(false)} />
            <EndMovementModal open={endOpen} onClose={() => setEndOpen(false)} onApply={handleEndMovement} movementOptions={movementOptions} />
            <RejectMovementsModal open={rejectOpen} onClose={() => setRejectOpen(false)} onApply={handleRejectSprint} movementOptions={movementOptions} />
            <EndSprintModal open={endSprintOpen} onClose={() => setEndSprintOpen(false)} onApply={handleEndSprint} />
        </div>
    );
}
