"use client";

import React, { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    UserIcon,
    PencilIcon,
    ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { Toggle } from "@/components/ui/togle/togle";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import ChevronDownIcon from "@heroicons/react/24/outline/ChevronDownIcon";
import ChevronRightIcon from "@heroicons/react/24/outline/ChevronRightIcon";

export type Estado = "Activo" | "Inactivo";

export interface MotivoRecord {
    id?: string;
    refId: string;
    nombre: string;
    nombreInterno: string;
    descripcion: string;
    solicitarComentario: boolean;
    status: Estado;
    targets: Record<string, boolean>; /** selección de targets por clave */
    created?: { username: string; email?: string; date: string };
    modified?: { username: string; email?: string; date: string };
}

interface Props {
    record: MotivoRecord;
    readOnly?: boolean;
    onChange?: (field: keyof MotivoRecord, value: any) => void;
}

/* ---------- DATASET tipo árbol (similar a PERMISSIONS_DATA) ---------- */
type TargetNode = {
    text: string;
    key?: string;          // solo hojas
    children?: TargetNode[];
};

const TARGET_DATA: TargetNode[] = [
    {
        text: "oms",
        children: [
            {
                text: "order-audit",
                children: [
                    { text: "approve", key: "oms/order-audit/approve" },
                    { text: "reject", key: "oms/order-audit/reject" },
                ],
            },
            {
                text: "order-cancellation",
                children: [
                    { text: "request", key: "oms/order-cancellation/request" },
                    { text: "approve", key: "oms/order-cancellation/approve" },
                    { text: "reject", key: "oms/order-cancellation/reject" },
                ],
            },
            {
                text: "order-rescheduling",
                children: [
                    { text: "change-store", key: "oms/order-rescheduling/change-store" },
                    { text: "reschedule", key: "oms/order-rescheduling/reschedule" },
                    { text: "reschedule-delivery", key: "oms/order-rescheduling/reschedule-delivery" },
                ],
            },
            {
                text: "order-picking",
                children: [{ text: "unpick", key: "oms/order-picking/unpick" }],
            },
        ],
    },
];

/* ---------- Helpers para recorrer el árbol ---------- */
const collectLeafKeys = (node: TargetNode): string[] =>
    node.children
        ? node.children.flatMap(collectLeafKeys)
        : node.key
            ? [node.key]
            : [];

const countLeaves = (node: TargetNode): number =>
    node.children ? node.children.reduce((a, n) => a + countLeaves(n), 0) : node.key ? 1 : 0;

const countCheckedLeaves = (node: TargetNode, targets: Record<string, boolean>): number =>
    node.children
        ? node.children.reduce((a, n) => a + countCheckedLeaves(n, targets), 0)
        : node.key
            ? (targets[node.key] ? 1 : 0)
            : 0;

/* ---------- Ítem recursivo (inspirado en PermissionItem) ---------- */
const TargetItem: React.FC<{
    node: TargetNode;
    targets: Record<string, boolean>;
    readOnly: boolean;
    onToggleLeaf: (key: string, checked: boolean) => void;
    onToggleTree: (node: TargetNode, checked: boolean) => void;
}> = ({ node, targets, readOnly, onToggleLeaf, onToggleTree }) => {
    const hasChildren = !!node.children?.length;
    const [collapsed, setCollapsed] = useState(true);

    const total = useMemo(() => countLeaves(node), [node]);
    const checked = useMemo(() => countCheckedLeaves(node, targets), [node, targets]);

    const isParentChecked = hasChildren && checked > 0;

    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <div className="flex items-center py-3">
                {/* Toggle collapse si tiene children */}
                <div className="flex items-center space-x-2 flex-grow">
                    {hasChildren && (
                        <button
                            type="button"
                            className="p-1 rounded-full text-gray-500 hover:text-gray-900"
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                        </button>
                    )}

                    {/* Checkbox: si es padre, marca/desmarca todo; si es hoja, solo su clave */}
                    {hasChildren ? (
                        <input
                            type="checkbox"
                            checked={isParentChecked}
                            onChange={(e) => onToggleTree(node, e.target.checked)}
                            disabled={readOnly}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            style={{ accentColor: isParentChecked ? "#2563eb" : "inherit" }}
                        />
                    ) : (
                        <input
                            type="checkbox"
                            checked={!!(node.key && targets[node.key])}
                            onChange={(e) => node.key && onToggleLeaf(node.key, e.target.checked)}
                            disabled={readOnly}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            style={{ accentColor: node.key && targets[node.key] ? "#2563eb" : "inherit" }}
                        />
                    )}

                    <span className="text-sm font-medium">{node.text}</span>
                </div>

                {hasChildren && <span className="text-xs text-gray-500 ml-auto mr-2">({checked}/{total})</span>}
            </div>

            {!collapsed && hasChildren && (
                <div className="relative ml-8">
                    <div className="pl-4">
                        {node.children!.map((child, idx) => (
                            <TargetItem
                                key={`${node.text}-${idx}`}
                                node={child}
                                targets={targets}
                                readOnly={readOnly}
                                onToggleLeaf={onToggleLeaf}
                                onToggleTree={onToggleTree}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const statusOptions: Estado[] = ["Activo", "Inactivo"];

export const AbmMotivosFields: React.FC<Props> = ({
    record,
    readOnly = true,
    onChange,
}) => {
    const handle =
        (field: keyof MotivoRecord) =>
            (
                e:
                    | React.ChangeEvent<HTMLInputElement>
                    | React.ChangeEvent<HTMLSelectElement>
                    | React.ChangeEvent<HTMLTextAreaElement>
            ) => {
                const isCheck = (e.target as HTMLInputElement).type === "checkbox";
                onChange?.(field, isCheck ? (e.target as HTMLInputElement).checked : e.target.value);
            };

    const isNew = !record.created?.username;
    const targets = record.targets || {};

    // Operaciones sobre targets
    const onToggleLeaf = (key: string, checked: boolean) => {
        onChange?.("targets", { ...targets, [key]: checked });
    };

    const onToggleTree = (node: TargetNode, checked: boolean) => {
        const leaves = collectLeafKeys(node);
        const next = { ...targets };
        leaves.forEach((k) => (next[k] = checked));
        onChange?.("targets", next);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* LEFT (span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600">Ref ID</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {record.refId}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.refId}
                                        onChange={handle("refId")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Nombre</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {record.nombre}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.nombre}
                                        onChange={handle("nombre")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Nombre interno</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {record.nombreInterno}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.nombreInterno}
                                        onChange={handle("nombreInterno")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Descripción</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {record.descripcion || "—"}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.descripcion}
                                        onChange={handle("descripcion")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* TARGET (árbol con checkboxes) */}
                    <Card
                        title="TARGET"
                        icon={ClipboardDocumentCheckIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="p-2 rounded-lg max-h-96 overflow-y-auto">
                            {TARGET_DATA.map((node, idx) => (
                                <TargetItem
                                    key={`${node.text}-${idx}`}
                                    node={node}
                                    targets={targets}
                                    readOnly={readOnly}
                                    onToggleLeaf={onToggleLeaf}
                                    onToggleTree={onToggleTree}
                                />
                            ))}
                        </div>
                    </Card>
                </div>

                {/* RIGHT */}
                <div className="space-y-6">
                    <Card
                        title="OTROS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Toggle: Solicitar comentario */}
                            <span className="col-span-1 text-sm text-gray-600">Solicitar comentario</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm text-gray-900">
                                        {record.solicitarComentario ? "Sí" : "No"}
                                    </span>
                                ) : (
                                    <Toggle
                                        checked={record.solicitarComentario}
                                        onCheckedChange={(checked) => onChange?.("solicitarComentario", checked)}
                                    />
                                )}
                            </div>

                            {/* Estado con CollapsibleField */}
                            <span className="col-span-1 text-sm text-gray-600">Estado</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900">{record.status}</span>
                                ) : (
                                    <CollapsibleField
                                        inline
                                        label=""
                                        value={record.status}
                                        options={statusOptions}
                                        onChange={(v) => onChange?.("status", v as Estado)}
                                    />
                                )}
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
                        {isNew ? (
                            <span className="text-sm text-gray-500">—</span>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-900">{record.created?.username ?? "—"}</span>
                                    <span className="text-xs text-gray-500">{record.created?.date ?? "—"}</span>
                                </div>
                                <span className="text-sm text-gray-500">{record.created?.email ?? ""}</span>
                            </>
                        )}
                    </Card>

                    <Card
                        title="ÚLTIMA MODIFICACIÓN"
                        icon={PencilIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        {record.modified ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-900">{record.modified?.username}</span>
                                    <span className="text-xs text-gray-500">{record.modified?.date}</span>
                                </div>
                                <span className="text-sm text-gray-500">{record.modified?.email}</span>
                            </>
                        ) : (
                            <span className="text-sm text-gray-500">—</span>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AbmMotivosFields;
