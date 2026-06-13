"use client";

import React from "react";
import {
    WarehouseHeaderProvider,
    useWarehouseHeader,
} from "@/app/context/warehouse/warehousecontext";

function InnerLayout({ children }: { children: React.ReactNode }) {
    const { header } = useWarehouseHeader();

    return (
        <div className="min-h-screen bg-page-bg">
            <div className="fixed left-[70px] right-0 top-0 z-20 bg-white shadow-sm">
                {header}
            </div>
            <div className="pt-[100px]">{children}</div>
        </div>
    );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <WarehouseHeaderProvider>
            <InnerLayout>{children}</InnerLayout>
        </WarehouseHeaderProvider>
    );
}
