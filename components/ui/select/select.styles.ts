// ─── Select Styles ───────────────────────────────────────────────────────────
export const selectBase =
    "w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm text-gray-900";
export const selectFocus =
    "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
export const selectError = "border-red-500";
export const selectLabel = "block text-sm font-medium text-gray-700";
export const selectErrorText = "mt-1 text-sm text-red-500";

export const selectSizeClasses = {
    sm: "px-3 py-1.5 pr-9 text-xs",
    md: "px-4 py-2 pr-10 text-sm",
    lg: "px-4 py-2.5 pr-10 text-base",
} as const;

export const selectVariantClasses = {
    default: "border-gray-300 bg-white text-gray-900",
    subtle: "border-gray-200 bg-gray-50 text-gray-900",
} as const;
