// views\Customers\Clientes\hooks\useCustomer.ts

"use client";
import useSWR from "swr";
import { customerGet, type CustomerDTO } from "@/app/fetchWithAuth/api-clientes/clientes/customers";

const fetcher = (id: string) => customerGet(id);

export function useCustomer(id?: string, opts?: Parameters<typeof useSWR<CustomerDTO>>[2]) {
    const key = id ? `customers/${id}` : null;
    return useSWR<CustomerDTO>(key, () => fetcher(id as string), {
        // si Resumen ya tiene el dato, Direcciones lo usa sin refetch
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
        ...opts,
    });
}