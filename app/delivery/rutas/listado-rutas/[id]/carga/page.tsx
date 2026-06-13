import { Suspense } from "react";
import RutasCargaTabView from "@/features/delivery/pages/Rutas/ListadoRutas/Carga/RutasCargaTabView";

function CargaPageContent({ routeId }: { routeId: string }) {
  return <RutasCargaTabView routeId={routeId} />;
}

export default async function RutasCargaViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="p-6">Cargando carga…</div>}>
      <CargaPageContent routeId={String(id || "")} />
    </Suspense>
  );
}
