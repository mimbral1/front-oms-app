// ─── StatusPill Styles ───────────────────────────────────────────────────────
export const statusPillBase =
    "inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium";

export const STATUS_CLASSES: Record<string, string> = {
    Creada: "bg-[#F66E0A] text-white",
    Programada: "bg-[#F9BA0D] text-white",
    Iniciado: "bg-[#2A79FF] text-white",
    Arribado: "bg-[#74C655] text-white",
    Entregado: "bg-[#339D5A] text-white",
    Delivered: "bg-green-500 text-white",
    Created: "bg-orange-500 text-white",
    Pending: "bg-orange-500 text-white",
};

export const statusPillFallback = "bg-gray-100 text-white";
