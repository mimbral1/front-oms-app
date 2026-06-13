// features/pedidos/hooks/usePedidoReschedule.ts
"use client";

import { useState, useCallback } from "react";
import type { Pedido } from "@/features/pedidos/types/lista-pedidos";

export interface RescheduleForm {
    ubicacion: string;
    inventario: string;
    transportista: string;
    fechaDesde: string;
    fechaHasta: string;
    horario: string;
    motivo: string;
}

const INITIAL_FORM: RescheduleForm = {
    ubicacion: "",
    inventario: "",
    transportista: "",
    fechaDesde: "",
    fechaHasta: "",
    horario: "",
    motivo: "",
};

/** Estados que NO permiten reagendamiento */
const BLOCKED_STATUSES = ["Pendiente Entrega", "Pedido Entregado"];

/**
 * Hook que encapsula el flujo completo del modal de acciones masivas
 * y el formulario de reagendamiento de pedidos.
 */
export function usePedidoReschedule() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRescheduleStep, setIsRescheduleStep] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<RescheduleForm>(INITIAL_FORM);

    const openModal = useCallback(() => {
        setIsModalOpen(true);
        setIsRescheduleStep(false);
        setError(null);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setIsRescheduleStep(false);
        setError(null);
    }, []);

    const goToReschedule = useCallback(() => {
        setError(null);
        setIsRescheduleStep(true);
    }, []);

    const goBackToActions = useCallback(() => {
        setIsRescheduleStep(false);
    }, []);

    const updateField = useCallback(
        <K extends keyof RescheduleForm>(field: K, value: RescheduleForm[K]) => {
            setForm((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    const applyReschedule = useCallback(
        (selectedPedidos: Pedido[]) => {
            if (selectedPedidos.length === 0) {
                setError("Selecciona al menos un pedido para reagendar la entrega.");
                return;
            }

            const permitidos = selectedPedidos.filter(
                (p) => !BLOCKED_STATUSES.includes(p.estado),
            );

            if (permitidos.length === 0) {
                setError(
                    "Ninguno de los pedidos seleccionados se puede modificar (estado Pendiente Entrega o Pedido Entregado).",
                );
                return;
            }

            // TODO: llamada real a API de reagendamiento
            console.log("Reagendar entrega para pedidos:", {
                pedidos: permitidos.map((p) => p.id),
                data: form,
            });

            setError(null);
            setIsModalOpen(false);
            setIsRescheduleStep(false);
            setForm(INITIAL_FORM);
        },
        [form],
    );

    return {
        isModalOpen,
        isRescheduleStep,
        error,
        form,
        openModal,
        closeModal,
        goToReschedule,
        goBackToActions,
        updateField,
        applyReschedule,
    };
}
