export default function DynamicSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

// Static export (App Store): render en cliente; sin pre-generación por id.
export function generateStaticParams() {
  return [{ id: "_" }];
}
