import { UserPendingResumenView } from "@/features/cuenta/pages/UsuariosPendientes/Resumen/UsuariosPendientesResumen";

export default function CustomerResumenPage() {
  return <UserPendingResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
