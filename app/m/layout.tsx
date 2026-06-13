import MobileTabBar from "@/components/mobile/MobileTabBar";

// Shell mobile-nativo (estilo App Store): contenido centrado en ancho de
// teléfono + barra de tabs inferior fija. La protección de auth la maneja el
// guard global; en /m/* no se renderiza el sidebar/header de escritorio.
export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md pb-24">{children}</div>
      <MobileTabBar />
    </div>
  );
}
