import TiposContenedorResumenView from "@/features/delivery/pages/ContenedoresEtiquetas/TiposContenedor/Resumen/TiposContenedorResumenView";

export const metadata = {
    title: "Resumen de tipo de contenedor",
    description: "Detalle de tipo de contenedor",
};

export default function TiposContenedorResumenPage() {
    return <TiposContenedorResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
