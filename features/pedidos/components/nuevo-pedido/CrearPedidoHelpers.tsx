import { useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

export function useDebounced<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

interface ModalCambiarClienteProps {
    open: boolean;
    oldLabel: string;
    newLabel: string;
    onReprice: () => void;
    onClear: () => void;
    onCancel: () => void;
}

export function ModalCambiarCliente({
    open,
    oldLabel,
    newLabel,
    onReprice,
    onClear,
    onCancel,
}: ModalCambiarClienteProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="border-b px-6 py-4">
                    <h3 className="text-base font-semibold">Cambiar cliente</h3>
                </div>
                <div className="space-y-2 px-6 py-4 text-sm">
                    <p>Vas a cambiar el cliente:</p>
                    <p className="text-gray-700">
                        <span className="font-medium">Actual:</span> {oldLabel || "-"}
                    </p>
                    <p className="text-gray-700">
                        <span className="font-medium">Nuevo:</span> {newLabel || "-"}
                    </p>
                    <p className="pt-2 text-gray-600">
                        Este cambio afecta los precios del carrito (lista de precios distinta).
                        Elige como proceder.
                    </p>
                </div>
                <div className="flex flex-col justify-end gap-2 border-t px-6 py-4 sm:flex-row">
                    <ActionButton variant="error" onClick={onClear}>
                        Vaciar carrito
                    </ActionButton>
                    <ActionButton variant="primary" onClick={onReprice}>
                        Recalcular precios
                    </ActionButton>
                    <ActionButton variant="secondary" onClick={onCancel}>
                        Cancelar
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}

interface IconBtnProps {
    title?: string;
    ariaLabel?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    variant?: "danger" | "ghost";
}

export function IconBtn({
    title,
    ariaLabel,
    onClick,
    variant = "danger",
}: IconBtnProps) {
    const styles =
        variant === "danger"
            ? "text-red-600 hover:bg-red-50 focus-visible:ring-red-600"
            : "text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400";

    return (
        <button
            type="button"
            title={title}
            aria-label={ariaLabel || title}
            onClick={onClick}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${styles}`}
        >
            <TrashIcon className="h-5 w-5" />
        </button>
    );
}

interface LineProps {
    label: string;
    value: string;
    bold?: boolean;
}

export function Line({ label, value, bold }: LineProps) {
    return (
        <div className="flex justify-between">
            <span className={bold ? "font-semibold" : ""}>{label}</span>
            <span className={bold ? "font-semibold" : ""}>{value}</span>
        </div>
    );
}
