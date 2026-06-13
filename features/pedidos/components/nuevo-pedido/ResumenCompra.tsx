// components/ResumenCompra.tsx
import React from "react";

type CartLine = {
    sku: string;
    name: string;
    img?: string;
    cantidad: number;
    price: number;     // unitario SIN IVA
    priceIVA: number;  // unitario CON IVA
    priceError?: string | null;
};

export default function ResumenCompra({
    productos,
    subtotalSinIVA,
    impuestos,
    subtotalConIVA,
    descuentos = 0,
    envios = 0,
    intereses = 0,
    totalPagos = 0,
    clpFormat,
    onIrAPagar,
    className,
}: {
    productos: CartLine[];
    subtotalSinIVA: number;
    impuestos: number;
    subtotalConIVA: number;
    descuentos?: number;
    envios?: number;
    intereses?: number;
    totalPagos?: number;
    clpFormat: (n: number) => string;
    onIrAPagar?: () => void;
    className?: string;
}) {
    const total = Math.max(0, subtotalConIVA - descuentos + envios + intereses);

    return (
        <aside
            className={`${className ?? ""}`} // aplica clases extra
        >
            <div className="rounded-2xl border bg-white shadow-sm w-full">
                <div className="px-5 py-4 border-b">
                    <div className="font-semibold">Resumen de la compra</div>
                </div>

                <div className="px-5 py-4 space-y-4">
                    <div>
                        <div className="flex items-center justify-between text-sm font-medium">
                            <span>Productos ({productos.length})</span>
                            <span className="text-gray-500">{clpFormat(subtotalSinIVA)}</span>
                        </div>
                        {productos.length > 0 ? (
                            <div className="mt-3 grid grid-cols-1 gap-3">
                                {productos.slice(0, 4).map((p) => (
                                    <div key={p.sku} className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {p.img ? (
                                                <img src={p.img} alt={p.name} className="h-full w-full object-contain" />
                                            ) : (
                                                <span className="text-[10px] text-gray-500">Sin imagen</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm">{p.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {p.cantidad} Un. · {clpFormat(p.priceIVA)}
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium">{clpFormat(p.priceIVA * p.cantidad)}</div>
                                    </div>
                                ))}
                                {productos.length > 4 && (
                                    <div className="text-xs text-gray-500">+ {productos.length - 4} más…</div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-2 text-sm text-gray-500">Aún no hay ítems agregados.</div>
                        )}
                    </div>

                    <div className="space-y-1 text-sm">
                        <Line label="Ítems (sin IVA)" value={clpFormat(subtotalSinIVA)} />
                        <Line label="Descuentos" value={clpFormat(descuentos)} />
                        <Line label="Envío" value={clpFormat(envios)} />
                        <Line label="Impuestos" value={clpFormat(impuestos)} />
                        <Line label="Intereses de financiación" value={clpFormat(intereses)} />
                        <Line label="Ítems (con IVA)" value={clpFormat(subtotalConIVA)} />
                    </div>

                    <hr className="border-gray-200" />

                    <div className="space-y-1 text-sm">
                        <Line label="TOTAL (con IVA)" value={clpFormat(total)} bold />
                        <Line label="Pagos agregados" value={clpFormat(totalPagos)} />
                        <hr className="border-gray-200" />
                        <Line label="Saldo pendiente" value={clpFormat(Math.max(0, total - totalPagos))} bold />
                    </div>

                    <button
                        type="button"
                        className="w-full rounded-lg bg-primary-600 text-white py-2 font-medium hover:bg-primary-700 transition-colors"
                        onClick={onIrAPagar}
                    >
                        Ir a pagar
                    </button>
                </div>
            </div>
        </aside>
    );
}

function Line({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className={`flex items-center justify-between ${bold ? "font-semibold" : ""}`}>
            <span className="text-gray-600">{label}</span>
            <span>{value}</span>
        </div>
    );
}
