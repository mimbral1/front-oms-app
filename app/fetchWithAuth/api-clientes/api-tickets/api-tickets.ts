// app\fetchWithAuth\api-clientes\api-tickets\api-tickets.ts

import { useFetchWithAuthQA } from "@/lib/http/client";

export function useApiTickets() {
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const getTickets = (params: {
        page: number;
        pageSize: number;
        idCustomer?: string;
        idOrder?: string;
        idTicket?: string;
        isDetails?: boolean;
        isItemlist?: boolean;
    }) => {
        const query = new URLSearchParams();

        query.set("page", String(params.page));
        query.set("pageSize", String(params.pageSize));

        if (params.idCustomer) query.set("idCustomer", params.idCustomer);
        if (params.idOrder) query.set("idOrder", params.idOrder);
        if (params.idTicket) query.set("idTicket", params.idTicket);
        if (params.isDetails) query.set("isDetails", "true");
        if (params.isItemlist) query.set("isItemlist", "true");

        return fetchWithAuthQA(
            `sac-service/tickets/all?${query.toString()}`,
            { method: "GET" }
        );
    };

    return {
        getTickets,
    };
}
