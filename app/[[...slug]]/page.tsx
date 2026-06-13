import RootRedirect from "./RootRedirect";

// Catch-all que cubre la raíz "/" en el static export. La protección de rutas
// (AuthenticatedLayout) redirige a /login o /pedidos según la sesión; mientras
// tanto se muestra un loader.
export function generateStaticParams() {
  return [{ slug: [""] }];
}

export default function Page() {
  return <RootRedirect />;
}
