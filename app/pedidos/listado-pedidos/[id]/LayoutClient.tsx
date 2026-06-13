"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
// import { mockPedido } from "@/data/mocks/detalle-pedido";
import {
  TruckIcon,
  EnvelopeIcon,
  CubeIcon,
  Square3Stack3DIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import PedidoActions from "@/features/pedidos/components/PedidoActions";
import CancelOrderAlert from "@/features/pedidos/components/CancelOrderAlert";
import type { ChangeStoreFormData } from "@/utils/types";
import { useDetallePedidoStore } from "@/features/pedidos/stores/detalle-pedidos";
import { TabsNav } from "@/components/ui/tabnav/TabNav";
import { MailOpen } from "lucide-react";
import React from "react";
import {
  useWarehouseHeader,
  WarehouseHeaderProvider,
} from "@/app/context/warehouse/warehousecontext";
import { PageHeaderProps } from "@/components/layout/page-header";
import { TextSearch } from "lucide-react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { fetchWithAuthToken } from "@/lib/http/client";
import { fetchIssueResumen, fetchIssueResumenFull } from "@/app/fetchWithAuth/api-pedidos/pedidos";
import { toast } from "react-hot-toast";
import { IssueSummaryResponse } from "@/features/pedidos/types/resumen-pedidos";
import { useEffect } from "react";

interface DetallePedidoLayoutProps {
  children: React.ReactNode;
  headerComponent?: React.ReactNode;
}
interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
}

const TABS: TabItem[] = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "items", label: "ITEMS", icon: ClipboardDocumentListIcon },
  { id: "audit", label: "AUDIT", icon: TextSearch, disabled: true },
  { id: "envios", label: "ENVÍOS", icon: TruckIcon, disabled: false },
  { id: "transacciones", label: "FACTURACIÓN", icon: MailOpen },
  { id: "historial", label: "HISTORIAL", icon: ClockIcon },
  { id: "repack", label: "REPACK", icon: CubeIcon, disabled: true },
  { id: "bultos", label: "BULTOS", icon: CubeIcon, disabled: true },
  { id: "incidencias", label: "INCIDENCIAS", icon: Square3Stack3DIcon, disabled: true },
  { id: "archivos", label: "ARCHIVOS", icon: EnvelopeIcon, disabled: true },
  { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon, disabled: true },
];
type TabId = (typeof TABS)[number]["id"];

function InnerPedidoLayout({ children }: { children: React.ReactNode }) {
  const { header } = useWarehouseHeader();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id;

  const last = pathname.split("/").filter(Boolean).at(-1)!;
  const current: TabId = TABS.some((t) => t.id === last)
    ? (last as TabId)
    : "resumen";

  // ir a tab 
  const goTo = (tab: TabId) => {
    const tabConfig = TABS.find((t) => t.id === tab);
    if (tabConfig?.disabled) return;

    router.push(
      tab === "resumen"
        ? `/pedidos/listado-pedidos/${id}`
        : `/pedidos/listado-pedidos/${id}/${tab}`
    );
  };

  const { pedido, issue, setIssue: setIssueInStore } = useDetallePedidoStore();
  const { user, token } = useAuth();

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // hook de inicializacion del resumen 
  useEffect(() => {
    // Inicializa el resumen del pedido si aún no existe en el store
    if (!issue && token && id) {
      const extractedId =
        typeof id === "string" && /^\d+$/.test(id) ? Number(id) : null;

      if (!extractedId) return;

      fetchIssueResumenFull<IssueSummaryResponse>(token, extractedId)

        .then((res) => {
          setIssueInStore(res);
        })
        .catch((err) => {
          console.error("Error cargando resumen del pedido:", err);
        });
    }
  }, [issue, token, id, setIssueInStore]);


  const handleRequestCancel = () => {
    if (!issue?.datosPedido?.u_ref1) {
      console.warn("El resumen del pedido aún no está disponible");
      return;
    }

    setIsCancelAlertOpen(true);
  };

  const handleConfirmCancel = async (comment: string) => {
    const uRef1 = issue?.datosPedido?.u_ref1;

    //  Cerrar modal inmediatamente
    setIsCancelAlertOpen(false);

    if (!uRef1) {
      console.error("No se encontró u_ref1 para cancelar el pedido");
      return;
    }

    if (!token || !user) {
      console.error("Usuario no autenticado");
      return;
    }

    try {
      setIsCancelling(true);

      const res = await fetchWithAuthToken<{
        ok?: boolean;
        message?: string;
      }>(
        token,
        `oms-service/credit-notes/${uRef1}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: Number(user.id),
            name: user.nombre,
            comment,
          }),
        }
      );

      //  Toast según respuesta (igual que Sales Channels)
      if (res?.ok) {
        toast.success(
          res.message || "La cancelación fue solicitada correctamente"
        );
      } else {
        toast.error(res?.message || "No fue posible solicitar la cancelación");
      }

      // refrescar resumen / store
      const extractedId =
        typeof params?.id === "string" && /^\d+$/.test(params.id)
          ? Number(params.id)
          : null;

      if (extractedId) {
        const updatedIssue = await fetchIssueResumen<IssueSummaryResponse>(
          token,
          extractedId
        );

        setIssueInStore(updatedIssue);

      }
    } catch (err: any) {
      console.error("Error al cancelar el pedido:", err);
      toast.error(
        err?.message || "Ocurrió un error al solicitar la cancelación"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    // Implementar lógica de impresión
    console.log("Imprimir ficha");
  };

  const handleFulfillmentPlan = () => {
    // Implementar lógica de plan de fulfillment
    console.log("Plan de fulfillment");
  };

  const handleChangeStore = (data: ChangeStoreFormData) => {
    // Implementar lógica de cambio de tienda
    // console.log("Cambiar tienda", data);
  };

  const currentSection = pathname?.includes("/items")
    ? "items"
    : pathname?.includes("/envios")
      ? "envios"
      : pathname?.includes("/historial")
        ? "historial"
        : pathname?.includes("/bultos")
          ? "bultos"
          : pathname?.includes("/incidencias")
            ? "incidencias"
            : pathname?.includes("/archivos")
              ? "archivos"
              : pathname?.includes("/transacciones")
                ? "transacciones"
                : pathname?.includes("/comentarios")
                  ? "comentarios"
                  : "resumen";

  const handleSelectSection = (section: string) => {
    switch (section) {
      case "items":
        router.push(`/pedidos/listado-pedidos/${id}/items`);
        break;
      case "envios":
        router.push(`/pedidos/listado-pedidos/${id}/envios`);
        break;
      case "transacciones":
        router.push(`/pedidos/listado-pedidos/${id}/transacciones`);
        break;
      case "historial":
        router.push(`/pedidos/listado-pedidos/${id}/historial`);
        break;
      case "bultos":
        router.push(`/pedidos/listado-pedidos/${id}/bultos`);
        break;
      case "incidencias":
        router.push(`/pedidos/listado-pedidos/${id}/incidencias`);
        break;
      case "archivos":
        router.push(`/pedidos/listado-pedidos/${id}/archivos`);
        break;
      case "comentarios":
        router.push(`/pedidos/listado-pedidos/${id}/comentarios`);
        break;
      default:
        router.push(`/pedidos/listado-pedidos/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg">
      {/* TopBar */}
      <div className="sticky top-0 left-[70px] right-0 bg-white shadow-sm z-20 mb-4 lg:mb-6">
        {header && (
          <div className="bg-white shadow-sm">
            {React.isValidElement(header)
              ? React.cloneElement<PageHeaderProps>(
                header as React.ReactElement<PageHeaderProps>,
                { onMoreOptions: () => setIsActionsOpen(true) }
              )
              : header}
          </div>
        )}
        <TabsNav
          tabs={TABS} // array de pestañas
          currentTab={current}
          onSelectTab={goTo}
        />
      </div>

      {/* Contenido */}
      <div className="px-4 md:px-6 min-w-0 overflow-x-hidden">
        {children}
      </div>

      {/* Modal de acciones */}
      <PedidoActions
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        onRequestCancel={handleRequestCancel}
        onPrint={handlePrint}
        onFulfillmentPlan={handleFulfillmentPlan}
      />

      {/* Alerta de confirmación de cancelación */}
      <CancelOrderAlert
        isOpen={isCancelAlertOpen}
        onClose={() => setIsCancelAlertOpen(false)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}

export default function DetallePedidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WarehouseHeaderProvider>
      <InnerPedidoLayout>{children}</InnerPedidoLayout>
    </WarehouseHeaderProvider>
  );
}
