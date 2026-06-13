import LayoutClient from "./LayoutClient";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutClient>{children}</LayoutClient>;
}

// Static export (App Store): render en cliente; sin pre-generación por id.
export function generateStaticParams() {
  return [{ envioId: "_" }];
}
