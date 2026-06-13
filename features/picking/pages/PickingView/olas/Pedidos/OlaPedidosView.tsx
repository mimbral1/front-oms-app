"use client";

import React from "react";
import { ShoppingCartIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

import { Card } from "@/components/ui/card";
import { useOlaPedidosController } from "@/features/picking/hooks/useOlaPedidosController";
import OlaPedidosToolbar from "@/features/picking/components/ola-pedidos/OlaPedidosToolbar";
import OlaPedidosAccordion from "@/features/picking/components/ola-pedidos/OlaPedidosAccordion";
import BlockWaveModal from "@/features/picking/components/ola-pedidos/BlockWaveModal";
import CreateSessionModal from "@/features/picking/components/ola-pedidos/CreateSessionModal";

/**
 * Wave orders view — displays orders belonging to a picking wave,
 * allows item selection, session creation and wave blocking.
 *
 * All state logic lives in useOlaPedidosController; UI is composed
 * from reusable sub-components: Toolbar, Accordion, BlockWaveModal,
 */
export default function OlaPedidosView() {
    const ctrl = useOlaPedidosController();

    if (ctrl.loading) {
        return (
            <div className="flex items-center justify-center p-12 text-gray-500">
                <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                Cargando pedidos...
            </div>
        );
    }

    return (
        <div className="pb-6">
            <Card
                title="PEDIDOS DE LA OLA"
                icon={ShoppingCartIcon}
                hasTitleDivider
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md"
            >
                <OlaPedidosToolbar
                    selectedCount={ctrl.selectedItemsCount}
                    isCreating={ctrl.creatingSession}
                    isBlocked={ctrl.waveIsBlocked}
                    isBlocking={ctrl.blockingWave}
                    onCreateSession={ctrl.handleOpenCreateSessionModal}
                    onBlockWave={() => ctrl.setBlockModalOpen(true)}
                />

                <OlaPedidosAccordion
                    orders={ctrl.orders}
                    expandedOrders={ctrl.expandedOrders}
                    selectedItemKeys={ctrl.selectedItemKeys}
                    onToggleExpand={ctrl.toggleOrderExpansion}
                    onToggleItem={ctrl.toggleItemSelection}
                    onToggleAllInOrder={ctrl.toggleSelectAllInOrder}
                />
            </Card>

            <BlockWaveModal
                open={ctrl.blockModalOpen}
                blocking={ctrl.blockingWave}
                onClose={() => ctrl.setBlockModalOpen(false)}
                onConfirm={ctrl.handleConfirmBlockWave}
            />

            <CreateSessionModal
                open={ctrl.pickerModalOpen}
                creating={ctrl.creatingSession}
                validateSession={ctrl.validateSession}
                onValidateSessionChange={ctrl.setValidateSession}
                selectedPickerId={ctrl.selectedPickerId}
                onPickerChange={ctrl.setSelectedPickerId}
                pickerOptions={ctrl.pickerOptions}
                pickersLoading={ctrl.pickersLoading}
                pickersError={ctrl.pickersError}
                onClose={() => ctrl.setPickerModalOpen(false)}
                onConfirm={ctrl.handlePrepareSelected}
            />
        </div>
    );
}
