// features/pedidos/components/PedidosTable.tsx
"use client";

import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

interface PedidosTableProps {
  /** Order list to display */
  data: any[];
  /** Column definitions from usePedidoColumns */
  columns: any[];
  /** Is the data currently loading? */
  isLoading: boolean;
  /** Error message to display, if any */
  errorMessage: string | null;
  /** Called when the user clicks "Retry" after an error */
  onRetry: () => void;
  /** Called when a row is clicked */
  onRowClick: (row: any) => void;
  /** Pagination */
  currentPage: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * Renders the orders table with loading, error, and empty states,
 * plus pagination below.
 */
export default function PedidosTable({
  data,
  columns,
  isLoading,
  errorMessage,
  onRetry,
  onRowClick,
  currentPage,
  totalRecords,
  pageSize,
  onPageChange,
}: PedidosTableProps) {
  return (
    <div>
      <div className="rounded-xl shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="bg-white">
            <table className="min-w-full text-sm">
              <tbody>
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                    Cargando pedidos…
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : errorMessage ? (
          <div
            className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
            role="alert"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Error al cargar datos de pedidos</h3>
                <p className="mt-2 text-sm">{errorMessage}</p>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      onClick={onRetry}
                      className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm py-5">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700">No hay pedidos para mostrar</p>
            <p className="mt-1 text-sm text-gray-500">
              Prueba ajustando los filtros o intenta nuevamente más tarde.
            </p>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            layout="adaptive"
            onRowClick={onRowClick}
            statusKey="estado"
            dataType="Pedidos"
            rowGap={4}
            rowBgClass="bg-white shadow-sm"
            rowPaddingY={6}
          />
        )}
      </div>

      {/* Pagination */}
      {!errorMessage && (
        <Pagination
          currentPage={currentPage}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
