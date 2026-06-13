// features/pedidos/pages/Listado-Pedidos/ListadoPedidosView.tsx
// Pure composition view — all logic lives in usePedidosListController.

"use client";

import { usePedidosListController } from "@/features/pedidos/hooks/usePedidosListController";
import PedidosHeader from "@/features/pedidos/components/PedidosHeader";
import PedidosTable from "@/features/pedidos/components/PedidosTable";
import BulkActionsModal from "@/features/pedidos/components/BulkActionsModal";

export default function ListadoPedidosView() {
    const ctrl = usePedidosListController();

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PedidosHeader
                headerFilters={ctrl.filters.headerFilters}
                onFilterChange={ctrl.filters.handleFilterChange}
                advancedFiltersState={ctrl.filters.advancedFiltersState}
                onAdvancedFieldChange={ctrl.filters.handleAdvancedFieldChange}
                onClearAll={ctrl.filters.clearAll}
                activeCount={ctrl.filters.activeCount}
                hasAnyActive={ctrl.filters.hasAnyActive}
                statusOptions={ctrl.statusOptions}
                salesChannelOptions={ctrl.salesChannelOptions}
                onRefresh={ctrl.handleRefresh}
                onNewPedido={ctrl.handleNewOrder}
                onExport={ctrl.handleExport}
                onOpenActions={ctrl.reschedule.openModal}
            />

            <div className="flex-1 p-3 px-6">
                <div className="space-y-6">
                    <PedidosTable
                        data={ctrl.pedidos}
                        columns={ctrl.columns}
                        isLoading={ctrl.isLoading}
                        errorMessage={ctrl.errorMessage}
                        onRetry={ctrl.handleRetry}
                        onRowClick={ctrl.handleRowClick}
                        currentPage={ctrl.currentPage}
                        totalRecords={ctrl.total}
                        pageSize={ctrl.pageSize}
                        onPageChange={ctrl.onPageChange}
                    />
                </div>
            </div>

            <BulkActionsModal
                open={ctrl.reschedule.isModalOpen}
                onClose={ctrl.reschedule.closeModal}
                selectedCount={ctrl.selection.selectedList.length}
                hasSelection={ctrl.selection.hasSelection}
                isRescheduleStep={ctrl.reschedule.isRescheduleStep}
                onGoToReschedule={ctrl.reschedule.goToReschedule}
                onGoBackToActions={ctrl.reschedule.goBackToActions}
                onApplyReschedule={() => ctrl.reschedule.applyReschedule(ctrl.selection.selectedList)}
                rescheduleForm={ctrl.reschedule.form}
                onRescheduleFieldChange={ctrl.reschedule.updateField}
                rescheduleError={ctrl.reschedule.error}
            />
        </div>
    );
}

