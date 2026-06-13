import ContenedoresResumenView from "@/features/delivery/pages/ContenedoresEtiquetas/Contenedores/Resumen/ContenedoresResumenView";

export const metadata = {
    title: "Resumen de contenedor",
    description: "Detalle editable de contenedor",
};

export default function ContenedoresResumenPage() {
    return <ContenedoresResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
