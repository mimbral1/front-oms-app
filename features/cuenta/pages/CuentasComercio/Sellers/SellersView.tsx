"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";

export default function SellersView() {
    const router = useRouter();

    return (
        <div className="space-y-4">
            <PageHeader
                title="Sellers"
                description="Vista de sellers"
                action={[
                    {
                        label: "Ir a cuentas comercio",
                        onClick: () => router.push("/cuenta/cuentas-comercio/cuentas"),
                        variant: "secondary",
                    },
                ]}
            />

            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
                No hay una vista de listado implementada para sellers en este módulo. Puedes acceder al detalle
                desde rutas con ID.
            </div>
        </div>
    );
}
