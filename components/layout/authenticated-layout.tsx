"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth/AuthContext";
import Sidebar from "./sidebar";
import SessionTimeoutModal from "./SessionTimeoutModal";
import { Bars3Icon } from "@heroicons/react/24/outline";

const isPublicPath = (pathname: string | null): boolean =>
  !!pathname && (pathname === "/login" || pathname.startsWith("/login/"));

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, showSessionModal } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Evita redirecciones antes de hidratar el estado de auth desde storage/cookie.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Guard de autenticacion en cliente. En el build de App Store (output: export)
  // no existe middleware de servidor, asi que la proteccion de rutas vive aqui:
  // sin sesion -> /login; con sesion en /login -> /pedidos.
  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated && !isPublicPath(pathname)) {
      router.replace("/login");
    } else if (isAuthenticated && (pathname === "/login" || pathname === "/")) {
      router.replace("/mimbral360");
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth > 640) setMobileSidebarOpen(false);
    };
    closeOnDesktop();
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-hidden sm:flex-row">
      {/* ── Mobile top header bar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-[110] flex items-center gap-3 bg-[#2F2F2F] px-4 shadow-md sm:hidden ${mobileSidebarOpen ? "hidden" : ""
          }`}
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
          paddingBottom: "0.5rem",
        }}
      >
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMobileSidebarOpen(true)}
          className="rounded-lg bg-blue-600 p-2 text-white active:bg-blue-700"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-white select-none">Mimbral 360</span>
      </header>

      <Sidebar
        pinned={pinned}
        onPinnedChange={setPinned}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />
      <main
        className={`ml-0 w-full min-w-0 overflow-x-hidden bg-gray-50 transition-[margin-left,width] duration-300 ${pinned ? "sm:ml-60 sm:w-[calc(100vw-15rem)]" : "sm:ml-[70px] sm:w-[calc(100vw-70px)]"
          }`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {/* Spacer for mobile header */}
        <div className="h-14 sm:hidden" />
        {children}
        {showSessionModal && <SessionTimeoutModal />}
      </main>
    </div>
  );
}
