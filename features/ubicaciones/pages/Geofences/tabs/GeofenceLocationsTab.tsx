"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/user-avatar";

export type GeofenceLocationRow = {
    id: string;
    nombre: string;
    refId: string;
    modificado: string;
    usuario: string;
    status: "Activo" | "Inactivo";
};

export default function GeofenceLocationsTab({
    loading,
    rows,
}: {
    loading: boolean;
    rows: GeofenceLocationRow[];
}) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Ubicaciones Asociadas</h3>
                    <p className="mt-1 text-xs text-gray-500">Relación actual de ubicaciones para esta geocerca.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {rows.length} registro(s)
                </span>
            </div>

            <div className="overflow-x-auto px-4 py-4">
                <table className="min-w-full overflow-hidden rounded-xl border border-gray-200 text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Nombre</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Ref ID</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Modificado</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Usuario</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                                    <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                                    Cargando ubicaciones...
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                                    Sin ubicaciones asociadas.
                                </td>
                            </tr>
                        ) : (
                            rows.map((location) => (
                                <tr key={location.id} className="bg-white transition-colors hover:bg-gray-50">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-block h-7 w-1 rounded-full bg-green-500" />
                                            <span className="font-medium text-gray-800">{location.nombre || "--"}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-gray-700">{location.refId || "--"}</td>
                                    <td className="px-5 py-4 text-gray-700">{location.modificado}</td>
                                    <td className="px-5 py-4 text-gray-700">
                                        <div className="inline-flex items-center gap-2">
                                            <Avatar
                                                name={location.usuario || "Usuario"}
                                                className="h-7 w-7 text-[11px]"
                                            />
                                            <span className="truncate">{location.usuario}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${location.status === "Activo"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-700"
                                                }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${location.status === "Activo" ? "bg-green-600" : "bg-gray-500"
                                                    }`}
                                            />
                                            {location.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
