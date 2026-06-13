// src/app/pedidos/configuraciones/dom/fulfillment/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@headlessui/react";
import { FlagIcon, ArrowDownOnSquareIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import Card from "@/components/ui/card/Card";

export default function DomFulfillmentConfigView() {
  const router = useRouter();
  const [nuevoDms, setNuevoDms] = useState(false);

  const headerActions: Action[] = useMemo(
    () => [
      { label: "Aplicar", variant: "success", onClick: () => { }, icon: <CheckCircleIcon className="h-5 w-5" /> },
      { label: "Guardar", variant: "success", onClick: () => { }, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Guardar & Crear nuevo", variant: "success", onClick: () => { }, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Volver al listado", variant: "secondary", onClick: () => router.push("/pedidos/configuraciones/dom"), icon: <XCircleIcon className="h-5 w-5" /> },
    ],
    [router]
  );

  usePageHeader(
    () => ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Configuración</div>
          <div className="text-2xl font-semibold text-gray-900">DOM</div>
        </div>
      ),
      // description: "CONFIGURACIÓN",
      action: headerActions,
    }),
    [headerActions]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5] pt-[80px]">
      <div className="p-6">
        <Card
          title="Opciones"
          icon={FlagIcon}
          hasTitleDivider
          className="mt-2"
          borderClass="border-gray-200"
          roundedClass="rounded-2xl"
          titleClassName="text-base font-semibold tracking-wide text-gray-800"
        >
          <div className="space-y-8">
            {/* Nuevo DMS */}
            <div className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-x-8">
              <span className="text-sm font-bold text-gray-700">Nuevo DMS</span>
              <div className="flex items-center gap-3">
                <Switch
                  checked={nuevoDms}
                  onChange={setNuevoDms}
                  className={`${nuevoDms ? "bg-blue-600" : "bg-gray-300"
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${nuevoDms ? "translate-x-6" : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
                {nuevoDms && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    Activo
                  </span>
                )}
              </div>
            </div>

            {/* Perfiles */}
            <div className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-x-8">
              <span className="text-sm font-bold text-gray-700">Perfiles</span>
              <a
                href="/dom/fulfillment-profile/browse"
                className="text-sm text-blue-600 hover:underline"
              >
                /dom/fulfillment-profile/browse
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
