"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, ClipboardList, Truck, Warehouse } from "lucide-react";

const TABS = [
  { href: "/m/pedidos", label: "Pedidos", Icon: ShoppingCart },
  { href: "/m/picking", label: "Picking", Icon: ClipboardList },
  { href: "/m/delivery", label: "Delivery", Icon: Truck },
  { href: "/m/almacen", label: "Almacén", Icon: Warehouse },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "text-blue-600" : "text-gray-400"}`}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.9} />
                <span className={active ? "font-semibold" : ""}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
