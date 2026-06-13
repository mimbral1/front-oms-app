// ─── Badge Styles ───────────────────────────────────────────────────────────

export const statusBadgeBase =
    "rounded-full px-4 py-1.5 font-semibold text-center whitespace-nowrap";

export const statusBadgeFixed = "w-[220px] text-[13px] leading-tight";
export const statusBadgeDefault = "text-sm";

export const statusVariants: Record<string, string> = {
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    pending: "bg-orange-500 text-white",
    processing: "bg-blue-400 text-white",
    partial: "bg-yellow-400 text-black",
    review: "bg-orange-400 text-black",
    dispatch: "bg-purple-500 text-white",
    delivered: "bg-green-700 text-white",
    active: "bg-green-600 text-white",
    inactive: "bg-gray-400 text-white",
    default: "bg-gray-200 text-black",
};

// ─── GeneralStatusBadge ─────────────────────────────────────────────────────

export const generalBadgeBase = "rounded-full px-3 py-1 text-sm font-semibold";

export const generalStatusVariants: Record<string, string> = {
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    pending: "bg-orange-500 text-white",
    processing: "bg-blue-400 text-white",
    partial: "bg-yellow-400 text-black",
    review: "bg-orange-400 text-black",
    dispatch: "bg-purple-500 text-white",
    delivered: "bg-green-700 text-white",
    Active: "bg-green-600 text-white",
    Inactive: "bg-gray-400 text-white",
    Activo: "bg-green-600 text-white",
    Inactivo: "bg-gray-400 text-white",
};

export const generalBadgeFallback = "bg-gray-200 text-black";

// ─── UserBadge ──────────────────────────────────────────────────────────────
export const userBadgeCircle =
    "h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold uppercase";

export const userBadgeName =
    "ml-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis";
