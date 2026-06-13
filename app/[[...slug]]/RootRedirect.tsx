"use client";

// Loader mostrado en la raíz mientras el guard de AuthenticatedLayout decide
// el destino (/login o /pedidos) según el estado de sesión.
export default function RootRedirect() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <span className="text-sm">Cargando…</span>
      </div>
    </div>
  );
}
