// ─── Modal Styles ────────────────────────────────────────────────────────────

// ActionsModal (named - action.tsx)
export const modalOverlay = "fixed inset-0 bg-black bg-opacity-25";
export const modalPanel =
    "w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all";
export const modalTitle = "text-lg font-medium leading-6 text-gray-900 pr-8";
export const modalCloseButton = "absolute right-6 top-6 text-gray-400 hover:text-gray-500";
export const modalDescription = "text-sm text-gray-500";

export const modalActionButton = "w-full rounded-lg px-4 py-2 text-sm font-medium";
export const modalActionDanger = "bg-red-600 text-white hover:bg-red-700";
export const modalActionWarning = "bg-yellow-500 text-white hover:bg-yellow-600";
export const modalActionDefault = "bg-blue-600 text-white hover:bg-blue-700";

// ActionsModal (default - actions.tsx)
export const modalDefaultOverlay =
    "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity";
export const modalDefaultPanel =
    "relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6";
export const modalDefaultCloseButton =
    "rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";
export const modalDefaultTitle =
    "text-lg font-semibold leading-6 text-gray-900 mb-4";
export const modalDefaultActionButton =
    "flex w-full items-center gap-3 px-3 py-4 hover:bg-gray-50 transition-colors";
export const modalDefaultActionIcon = "h-5 w-5 text-gray-500";
export const modalDefaultActionLabel = "text-sm text-gray-700";
