import { Suspense } from "react";
import RutasEntregasTabView from "@/features/delivery/pages/Rutas/ListadoRutas/Entregas/RutasEntregasTabView";

function EntregasPageContent({ routeId }: { routeId: string }) {
    return <RutasEntregasTabView routeId={routeId} />;
}

export default async function RutasEntregasViewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <Suspense fallback={<div className="p-6">Cargando entregas…</div>}>
            <EntregasPageContent routeId={String(id || "")} />
        </Suspense>
    );
}
