"use client";

import React from "react";
import type { PickerByConfigItem } from "../../types/api";

interface CreateSessionModalProps {
    open: boolean;
    creating: boolean;
    validateSession: boolean;
    onValidateSessionChange: (value: boolean) => void;
    selectedPickerId: string;
    onPickerChange: (pickerId: string) => void;
    pickerOptions: PickerByConfigItem[];
    pickersLoading: boolean;
    pickersError: string | null;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * Modal for creating a picking session.
 * Lets the user choose a picker and optionally filter by active-session status.
 */
export default function CreateSessionModal({
    open,
    creating,
    validateSession,
    onValidateSessionChange,
    selectedPickerId,
    onPickerChange,
    pickerOptions,
    pickersLoading,
    pickersError,
    onClose,
    onConfirm,
}: CreateSessionModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => !creating && onClose()}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900">Crear sesion</h3>
                <p className="mt-1 text-sm text-gray-600">
                    Selecciona el picker que realizara la sesion.
                </p>

                {/* Active-session filter */}
                <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-blue-600"
                            checked={validateSession}
                            onChange={(e) => onValidateSessionChange(e.target.checked)}
                            disabled={creating || pickersLoading}
                        />
                        Pickers con sesion activa
                    </label>
                </div>

                {/* Picker selector */}
                <div className="mt-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Picker
                    </label>
                    <select
                        value={selectedPickerId}
                        onChange={(e) => onPickerChange(e.target.value)}
                        disabled={creating || pickersLoading || pickerOptions.length === 0}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                        <option value="">
                            {pickersLoading
                                ? "Cargando pickers..."
                                : "Selecciona un picker"}
                        </option>
                        {pickerOptions.map((picker) => (
                            <option key={picker.pickerId} value={picker.pickerId}>
                                {picker.userName} ({picker.userEmail})
                            </option>
                        ))}
                    </select>
                    {pickersError && (
                        <p className="mt-2 text-xs text-red-600">{pickersError}</p>
                    )}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={creating}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!selectedPickerId || creating}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {creating ? "Creando sesion..." : "Confirmar y crear"}
                    </button>
                </div>
            </div>
        </div>
    );
}
