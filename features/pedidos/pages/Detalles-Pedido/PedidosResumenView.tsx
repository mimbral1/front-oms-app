// views\PedidosView\Detalles-Pedido\ResumenView.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import {
  UserIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon as CheckCircleOutlineIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon,
  ReceiptRefundIcon,
  QueueListIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useDetallePedidoStore } from "@/features/pedidos/stores/detalle-pedidos";
import Card from "@/features/pedidos/components/detalles-pedido/Card";
import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { ArrowLeftCircleIcon } from "lucide-react";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { fetchIssueResumen } from "@/app/fetchWithAuth/api-pedidos/pedidos";
import { useAuth } from "@/app/context/auth/AuthContext";
import { fetchWithAuthToken } from "@/lib/http/client";
import { getStatusVariant } from "@/features/pedidos/utils/pedido-status";
import type { PedidoStatus } from "@/features/pedidos/types/lista-pedidos";
import { ActionButton } from "@/components/ui/button/action-button";
import { parseDayFirstDateTime } from "@/lib/format/date";
import { formatCurrency } from "@/lib/format/money";
import { extractOrderId } from "@/utils/pedido";

/* ===== Tipos  ===== */
type IssueSummaryResponse = {
  resumen: {
    cliente: {
      nombre: string;
      tipoDocumento: string | null;
      documento: string | null;
      telefono: string | null;
      email: string | null;
      customerType: string | null;
      fechaCreacion: string | null;
      clusters: string[];
    };
    picking: {
      sesiones: number;
      contenedores: number;
      productosPickeados: number;
      itemsPickeados: number;
      faltantes: number;
      tiempoPickingMin: number | null;
      almacenOTienda: string | null;
    };
    totales: {
      items?: {
        original: number | null;
        comision?: number | null;
        total: number | null;
      };
      envio?: {
        original: number | null;
        comision?: number | null;
        total: number | null;
      };
      envios?: {
        original: number | null;
        comision?: number | null;
        total: number | null;
      };
      subtotal: number | null;
      facturado?: number | null;
      status?: string | null;
      total: number | null;
    };
    originalsPostPicking: { itemsPickeados: number; subtotal: number | null; total: number | null };
  };
  datosEntrega?: {
    tipoEntrega: string | null;
    direccion: string | null;
    fechaEntrega: string | null;
    empresaDelivery: string | null;
  };
  datosPedido?: {
    orderId: number;
    seller: string | null;
    folioNum: string | null;
    salesChannelReferenceId: string | null;
    u_ref1: string | null;
    customerCardCode: string | null;
  };
  historial?: Array<{
    fecha: string | null;
    status: string | null;
    usuario: string | null;
  }>;
};

/* ===== Utilidades locales ===== */
const fmtCLP = (n?: number | null) => (typeof n === "number" ? formatCurrency(n) : "-");

export default function DetallePedido() {

  // usuario y token del estado de autenticacion 
  const { user, token } = useAuth();
  // cancelar pedido  
  const [isCancelling, setIsCancelling] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);


  const [selectedSection, setSelectedSection] = useState<"resumen" | "items">("resumen");
  const router = useRouter();
  const params = useParams();
  const pedidoId = params?.id as string; // viene de router.push(`/pedidos/listado-pedidos/${encodeURIComponent(pedido.folionum)}`)
  const { pedido, setIssue: setIssueInStore } = useDetallePedidoStore();

  // ===== Estado remoto: issue-summary  =====
  const [issue, setIssue] = useState<IssueSummaryResponse | null>(null);
  const [isIssueLoading, setIsIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // === Estado actual desde historial (sin sort inestable)
  const currentStatusFromHistory = useMemo(() => {
    const arr = issue?.historial ?? [];
    if (!arr.length) return null;

    // elegimos el más reciente por timestamp; si empatan, gana el que aparece más tarde en el array (pagado suele venir al final)
    let bestIdx = 0;
    let bestTime = parseDayFirstDateTime(arr[0]?.fecha).getTime();

    for (let i = 1; i < arr.length; i++) {
      const t = parseDayFirstDateTime(arr[i]?.fecha).getTime();
      if (t > bestTime || (t === bestTime && i > bestIdx)) {
        bestIdx = i;
        bestTime = t;
      }
    }
    return arr[bestIdx]?.status ?? null;
  }, [issue?.historial]);

  const statusVariant = useMemo(() => {
    const raw = currentStatusFromHistory || pedido?.status || "Pendiente";
    return getStatusVariant(raw as PedidoStatus);
  }, [currentStatusFromHistory, pedido?.status]);

  // llamada a la api 
  useEffect(() => {

    const id = extractOrderId(pedidoId);
    if (!id) return;

    // Previene fetch antes de que AuthContext hidrate el token
    if (!token) return;

    let cancelled = false;
    setIsIssueLoading(true);
    setIssueError(null);

    fetchIssueResumen<IssueSummaryResponse>(token, id)
      .then((data) => {
        if (!cancelled) {
          setIssue(data);          // estado local (UI)
          setIssueInStore(data);   // estado global (layout)
        }
      })
      .catch((err: any) => {
        if (!cancelled) setIssueError(String(err?.message || err || "Error desconocido"));
      })
      .finally(() => {
        if (!cancelled) setIsIssueLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pedidoId, token]);

  // cancelar orden 
  const handleCancelOrder = async () => {
    if (!issue?.datosPedido?.u_ref1) {
      console.error("No se encontró u_ref1 para cancelar el pedido");
      return;
    }

    if (!token || !user) {
      console.error("Usuario no autenticado");
      return;
    }

    try {
      setIsCancelling(true);

      await fetchWithAuthToken(
        token,
        `oms-service/credit-notes/${issue.datosPedido.u_ref1}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: Number(user.id),
            name: user.nombre,
          }),
        }
      );

      //  Refresca el resumen para ver el nuevo estado en historial
      const extracted = extractOrderId(pedidoId);
      if (extracted) {
        const data = await fetchIssueResumen<IssueSummaryResponse>(token, extracted);
        setIssue(data);
        setIssueInStore(data);
      }

    } catch (err: any) {
      console.error("Error al cancelar el pedido:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const closeActions = () => setIsActionsOpen(false);

  const actionMenuItems = useMemo(
    () => [
      {
        id: "request-cancel",
        label: "Solicitar cancelación",
        icon: XCircleIcon,
        onClick: async () => {
          closeActions();
          await handleCancelOrder();
        },
      },
      {
        id: "print",
        label: "Imprimir ficha",
        icon: PrinterIcon,
        onClick: () => {
          closeActions();
          window.print();
        },
      },
      {
        id: "refund-amount",
        label: "Reembolsar importe",
        icon: ReceiptRefundIcon,
        onClick: closeActions,
      },
      {
        id: "refund-items",
        label: "Reembolsar ítems",
        icon: ReceiptRefundIcon,
        onClick: closeActions,
      },
      {
        id: "fulfillment-plan",
        label: "Plan de Fulfillment",
        icon: QueueListIcon,
        onClick: closeActions,
      },
    ],
    [handleCancelOrder]
  );

  // Header Actions
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => { },
        icon: <SaveOutlined className="h-5 w-5" />,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/pedidos/listado-pedidos"),
        icon: <ArrowLeftCircleIcon className="h-5 w-5" />,
      },
    ],
    [router]
  );

  usePageHeader(
    () => ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">PEDIDOS</div>
          <div className="text-2xl font-semibold text-gray-900">
            {`PEDIDO #${pedidoId ?? ""}`}
          </div>
        </div>
      ),
      action: headerActions,
      status: { text: currentStatusFromHistory ?? "Pendiente", variant: statusVariant },
      onMoreOptions: () => setIsActionsOpen(true),
    }),
    [pedidoId, headerActions, currentStatusFromHistory, statusVariant]
  );

  // ===== Mapeo a la UI (SIN tocar estructura/estilos) =====
  const c = issue?.resumen?.cliente;
  const p = issue?.resumen?.picking;
  const t = issue?.resumen?.totales;
  const op = issue?.resumen?.originalsPostPicking;

  // Items para el timeline de HISTORIAL (ordenados, con flags de estado)
  const historyItems = useMemo(() => {
    const arr = (issue?.historial ?? [])
      .map((h) => {
        const when = parseDayFirstDateTime(h.fecha);
        return {
          status: h.status,
          dateLabel: h.fecha || when.toLocaleString("es-CL"),
          when,
        };
      })
      .sort((a, b) => a.when.getTime() - b.when.getTime());

    if (!arr.length) return [];

    const last = arr[arr.length - 1];
    return arr.map((it, idx) => ({
      ...it,
      isCurrent:
        (it.when.getTime() === last.when.getTime() && it.status === last.status) ||
        idx === arr.length - 1,
      isCompleted: idx < arr.length - 1,
    }));
  }, [issue]);

  return (
    <>
      <Transition appear show={isActionsOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeActions}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-transparent" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-end p-4 pt-20 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 translate-y-2"
              >
                <Dialog.Panel className="relative w-full max-w-2xl rounded-sm bg-white px-8 py-7 text-left shadow-xl ring-1 ring-gray-100">
                  <div className="mb-9 flex items-start justify-between">
                    <Dialog.Title className="text-base font-bold uppercase tracking-wide text-gray-700">
                      ACCIONES
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-full p-1 text-gray-700 transition hover:bg-gray-100"
                      onClick={closeActions}
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="h-8 w-8" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-x-12 gap-y-7 sm:grid-cols-2">
                    {actionMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="flex items-center gap-4 text-left text-lg font-semibold text-[#6f99ff] transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={item.onClick}
                          disabled={item.id === "request-cancel" && isCancelling}
                        >
                          <Icon className="h-8 w-8 shrink-0 stroke-[1.7]" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {!isIssueLoading && !issue && issueError && (
        <div className="flex flex-col items-center justify-center h-[300px] gap-4">
          <DocumentTextIcon className="w-16 h-16 text-gray-400" />
          <p className="text-xl text-gray-600">No se ha encontrado el pedido.</p>
          {/* <PrimaryButton
            onClick={() => router.push("/pedidos")}
            icon={ArrowLeftIcon}
            variant="outline"
          >
            Volver a pedidos
          </PrimaryButton> */}
        </div>
      )}

      {!(!isIssueLoading && !issue && issueError) && (
        <div className="min-h-screen flex flex-col bg-page-bg pb-6">
          {selectedSection === "resumen" && (isIssueLoading ? (
            <div className="overflow-x-auto border rounded-md bg-white">
              <table className="min-w-full text-sm">
                <tbody>
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                      Cargando…
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
              {/* 1. COLUMNA - CLIENTE */}
              <Card
                title="CLIENTE"
                icon={UserIcon}
                hasOptions
                hasTitleDivider
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col"
              >
                {issueError && <div className="mb-3 text-sm text-red-600">Error al cargar resumen: {issueError}</div>}
                {isIssueLoading && <div className="mb-3 text-sm text-gray-500">Cargando…</div>}

                <div className="space-y-3 text-gray-700 flex-1">
                  {[
                    {
                      label: "Nombre",
                      value: (
                        <span className=" font-medium cursor-pointer hover:underline">
                          {c?.nombre ?? "-"}
                        </span>
                      ),
                    },
                    { label: "Tipo de documento", value: c?.tipoDocumento ?? "-" },
                    { label: "Documento", value: c?.documento ?? "-" },
                    { label: "Teléfono", value: c?.telefono ?? "-" },
                    { label: "Email", value: c?.email ?? "-" },
                    { label: "Tipo de cliente", value: c?.customerType ?? "-" },
                    { label: "Fecha de creación", value: c?.fechaCreacion ?? "-" },
                    {
                      label: "Clusters",
                      value:
                        c?.clusters && c.clusters.length > 0 ? (
                          <span className="px-3 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded-full">
                            {c.clusters[0]}
                          </span>
                        ) : (
                          "-"
                        ),
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex flex-wrap items-start gap-x-2 gap-y-1">
                      <span className="text-gray-900 font-medium text-sm flex-shrink-0 w-full sm:w-1/3">
                        {item.label}:
                      </span>
                      <span className="text-gray-600 font-medium flex-1 break-words w-full sm:w-2/3">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 2. COLUMNA - PICKING y ENTREGA (vertical) */}
              <div className="flex flex-col gap-6 h-full">
                {/* PICKING */}
                <Card
                  title="PICKING"
                  icon={ClipboardDocumentListIcon}
                  hasOptions
                  hasTitleDivider
                  className="bg-white border border-gray-200 rounded-xl p-6 flex-1"
                >
                  <div className="space-y-3 text-gray-700">
                    {[
                      { label: "Sesiones", value: String(p?.sesiones ?? 0) },
                      { label: "Contenedores", value: String(p?.contenedores ?? 0) },
                      { label: "Productos pickeados", value: String(p?.productosPickeados ?? 0) },
                      { label: "Items pickeados", value: String(p?.itemsPickeados ?? 0) },
                      { label: "Faltantes", value: String(p?.faltantes ?? 0) },
                      {
                        label: "Tiempo de picking",
                        value: p?.tiempoPickingMin ? `${p.tiempoPickingMin}m` : "-",
                      },
                      { label: "Almacén/Tienda", value: p?.almacenOTienda ?? "-" },
                    ].map((item, index) => (
                      <div key={index} className="flex flex-wrap items-start gap-x-2 gap-y-1">
                        <span className="text-gray-900 font-medium text-sm flex-shrink-0 w-full sm:w-1/3">
                          {item.label}:
                        </span>
                        <span className="text-gray-600 font-medium flex-1 break-words w-full sm:w-2/3">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* ENTREGA */}
                <Card
                  title="ENTREGA"
                  icon={TruckIcon}
                  hasOptions
                  hasTitleDivider
                  className="bg-white border border-gray-200 rounded-xl p-6 flex-1"
                >
                  {(() => {
                    const de = issue?.datosEntrega;
                    const val = (s?: string | null) => (s && String(s).trim() !== "" ? String(s).trim() : "-");

                    const rows = [
                      { label: "Tipo de entrega", value: val(de?.tipoEntrega) },
                      { label: "Dirección", value: val(de?.direccion) },
                      { label: "Fecha de entrega", value: val(de?.fechaEntrega) },
                      { label: "Empresa", value: val(de?.empresaDelivery) },
                      // Si quieres seguir mostrando "Tienda", puedes derivarla desde picking:
                      // { label: "Tienda", value: val(issue?.resumen?.picking?.almacenOTienda) },
                    ];

                    return (
                      <div className="space-y-3 text-gray-700">
                        {rows.map((item, index) => (
                          <div key={index} className="flex flex-wrap items-start gap-x-2 gap-y-1">
                            <span className="text-gray-900 font-medium text-sm flex-shrink-0 w-full sm:w-1/3">
                              {item.label}:
                            </span>
                            <span className="text-gray-600 font-medium flex-1 break-words w-full sm:w-2/3">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </Card>
              </div>

              {/* 3. COLUMNA - TOTALES + HISTORIAL (vertical) */}
              <div className="flex flex-col gap-6 h-full">
                {/* TOTALES */}
                <Card
                  title="TOTALES"
                  icon={CurrencyDollarIcon}
                  hasOptions
                  hasTitleDivider
                  className="bg-white border border-gray-200 rounded-xl p-6"
                >
                  <div className="space-y-4 text-gray-700">

                    {/* Encabezado */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 font-medium text-sm">TOTALES</span>
                      <ActionButton variant="primary" size="sm">
                        {String(t?.status || "-")}
                      </ActionButton>
                    </div>

                    {/* Tabla principal: Items / Envíos */}
                    <div className="border-t border-gray-300 pt-3">

                      {/* ENCABEZADOS DE COLUMNAS */}
                      <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                        <span className="w-1/4"></span>
                        <span className="w-1/4 text-right">Original</span>
                        <span className="w-1/4 text-right">Comisión</span>
                        <span className="w-1/4 text-right">Total</span>
                      </div>

                      {/* ITEMS */}
                      <div className="flex justify-between text-sm mb-1">
                        <span className="w-1/4 text-gray-700">Items</span>
                        <span className="w-1/4 text-right">{fmtCLP(issue?.resumen?.totales?.items?.original)}</span>
                        <span className="w-1/4 text-right">{fmtCLP(issue?.resumen?.totales?.items?.comision)}</span>
                        <span className="w-1/4 text-right">{fmtCLP(issue?.resumen?.totales?.items?.total)}</span>
                      </div>

                      {/* ENVIOS */}
                      <div className="flex justify-between text-sm mb-3">
                        <span className="w-1/4 text-gray-700">Envío</span>
                        <span className="w-1/4 text-right">
                          {fmtCLP(issue?.resumen?.totales?.envios?.original ?? issue?.resumen?.totales?.envio?.original)}
                        </span>
                        <span className="w-1/4 text-right">
                          {fmtCLP(issue?.resumen?.totales?.envios?.comision ?? issue?.resumen?.totales?.envio?.comision)}
                        </span>
                        <span className="w-1/4 text-right">
                          {fmtCLP(issue?.resumen?.totales?.envios?.total ?? issue?.resumen?.totales?.envio?.total)}
                        </span>
                      </div>

                      {/* SUBTOTAL */}
                      <div className="flex justify-between text-sm font-semibold text-gray-900 mb-1">
                        <span className="w-3/4">SUBTOTAL</span>
                        <span className="w-1/4 text-right">
                          {fmtCLP(issue?.resumen?.totales?.subtotal)}
                        </span>
                      </div>

                      {/* FACTURADO */}
                      <div className="flex justify-between text-sm font-semibold text-gray-900 mb-1">
                        <span className="w-3/4">FACTURADO</span>
                        <span className="w-1/4 text-right">
                          {fmtCLP(issue?.resumen?.totales?.facturado)}
                        </span>
                      </div>

                      {/* TOTAL */}
                      <div className="flex justify-between text-sm font-semibold text-gray-900">
                        <span className="w-3/4">TOTAL</span>
                        <span className="w-1/4 text-right">
                          {fmtCLP(issue?.resumen?.totales?.total)}
                        </span>
                      </div>

                    </div>
                  </div>

                </Card>

                {/* HISTORIAL (timeline) */}
                <Card
                  title="HISTORIAL"
                  icon={DocumentTextIcon}
                  hasOptions
                  hasTitleDivider
                  className="bg-white border border-gray-200 rounded-xl p-6"
                >
                  {issueError && (
                    <div className="mb-3 text-sm text-red-600">
                      Error al cargar historial: {issueError}
                    </div>
                  )}
                  {isIssueLoading && <div className="mb-3 text-sm text-gray-500">Cargando…</div>}

                  {(historyItems ?? []).length === 0 ? (
                    <div className="text-sm text-gray-500">Sin eventos de historial.</div>
                  ) : (
                    <div className="relative space-y-8">
                      {historyItems.map((item, index) => {
                        const isLast = index === historyItems.length - 1;

                        // Estilo del punto
                        const nodeClasses = item.isCurrent
                          ? "bg-blue-100 text-blue-600"
                          : item.isCompleted
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400";

                        const LineIcon = item.isCurrent
                          ? ClockIcon
                          : item.isCompleted
                            ? CheckCircleOutlineIcon
                            : ClipboardDocumentCheckIcon;

                        return (
                          <div key={`${item.status}-${index}`} className="grid grid-cols-[300px_1fr] gap-x-12 relative">
                            {/* Punto + texto */}
                            <div className="col-span-1 flex items-start gap-4">
                              <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full ${nodeClasses}`}>
                                <LineIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900">{item.status}</div>
                                <div className="text-sm text-gray-500">{item.dateLabel}</div>
                              </div>
                            </div>

                            {/* Línea vertical hacia el siguiente ítem */}
                            {!isLast && (
                              <div
                                className={`absolute left-4 top-8 -bottom-6 w-0.5 ${item.isCompleted
                                  ? "bg-green-600"
                                  : item.isCurrent
                                    ? "bg-blue-300"
                                    : "bg-gray-200"
                                  }`}
                              />
                            )}

                            {/* Panel derecho (reservado para detalles futuros) */}
                            <div className="col-span-1" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

            </div>
          ))}
        </div>
      )}
    </>
  );
}

