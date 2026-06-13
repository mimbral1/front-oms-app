import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import "../styles/globals.css";
import { AuthProvider } from "@/app/context/auth/AuthContext";
import ToastProvider from "@/components/ui/toast/provider";

// Registrar todos los dominios de status al inicio de la app
import "@/components/ui/badge/status-domains";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Gestion de Pedidos",
  description: "Sistema integral para la gestión de pedidos y entregas",
};

// viewport-fit=cover habilita env(safe-area-inset-*) en iOS (notch / barra de
// estado), necesario para el shell mobile-nativo.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* <Titlebar /> */}
        <AuthProvider>
          <AuthenticatedLayout>{children}</AuthenticatedLayout>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
