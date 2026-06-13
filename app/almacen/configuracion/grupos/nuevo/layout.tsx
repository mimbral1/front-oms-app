"use client";

import React from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  WarehouseHeaderProvider,
  useWarehouseHeader,
} from "@/app/context/warehouse/warehousecontext";

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { header } = useWarehouseHeader();

  return (
    <div className="min-h-screen bg-[#F0F2F8]">
      <div className="fixed top-0 left-[70px] right-0 z-20 bg-white shadow-sm">
        {header}
      </div>
      <div className="pt-[100px]">{children}</div>
    </div>
  );
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WarehouseHeaderProvider>
      <InnerLayout>{children}</InnerLayout>
    </WarehouseHeaderProvider>
  );
}
