import PageClient from "./PageClient";

export default function Page() {
  return <PageClient />;
}

// Static export (App Store): render en cliente; sin pre-generación por id.
export function generateStaticParams() {
  return [{ batchId: "_" }];
}
