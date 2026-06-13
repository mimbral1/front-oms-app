// views\ControlInsumos\Solicitar\components\ItemsAgregadosTable.tsx
"use client";

import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

export function SolicitarInsumosItemsTable({
    items,
    onDelete,
    onEdit,
}: {
    items: Array<{ id: string; nombre: string; cantidad: number }>;
    onDelete: (id: string) => void;
    onEdit?: (id: string) => void;
}) {
    return (
        <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Ítems agregados
            </h2>

            {items.length === 0 ? (
                <div className="border rounded-md bg-white p-4 text-gray-500 text-center">
                    No hay ítems agregados.
                </div>
            ) : (
                <div className="overflow-hidden border rounded-md bg-white">
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-semibold text-gray-600">
                                    Ítem
                                </th>
                                <th className="px-4 py-2 text-left font-semibold text-gray-600">
                                    Cantidad
                                </th>
                                <th className="px-4 py-2 text-center font-semibold text-gray-600 w-24">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {items.map((it) => (
                                <tr key={it.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{it.nombre}</td>
                                    <td className="px-4 py-2">{it.cantidad}</td>
                                    <td className="px-4 py-2 text-center space-x-2">
                                        {/* botón editar */}
                                        <button
                                            type="button"
                                            onClick={() => onEdit?.(it.id)}
                                            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-blue-100"
                                        >
                                            <PencilSquareIcon className="h-5 w-5 text-blue-600" />
                                        </button>

                                        {/* botón eliminar */}
                                        <button
                                            type="button"
                                            onClick={() => onDelete(it.id)}
                                            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-red-100"
                                        >
                                            <TrashIcon className="h-5 w-5 text-red-600" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
