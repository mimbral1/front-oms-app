// features/catalogo/pages/plataforma-ecommerce/shared/dashboard/base/views/DashboardView.tsx
//
// Vista principal de dashboard. Patrón visual: `Mimbral Mercadolibre/dashboard.html`.
// Consumimos `GET /api/pim/dashboard` (real). Cuando el backend exponga
// series temporales reales (Spark), las inyectamos en `data?.series`.

"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, Plus, Rocket, Upload, AlertTriangle, TrendingUp } from "lucide-react";
import { Sec } from "../../../../_shared/janis";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { MetricCard } from "../../../../_shared/ui/MetricCard";
import { ActionButton } from "@/components/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useDashboard } from "../hooks/useDashboard";
import { BatchesList } from "../components/BatchesList";
import { RecentProductsList } from "../components/RecentProductsList";
import { PublishActivityWidget } from "../../../bitacora";

export function DashboardView() {
    const platform = useEcommercePlatform();
    const router = useRouter();
    const { data, loading, error, refresh } = useDashboard();

    const publishedForChannel =
        platform.exportPrefix === "mercadolibre"
            ? data?.kpis.published_ml
            : platform.exportPrefix === "falabella"
              ? data?.kpis.published_fala
              : data?.kpis.published;

    const canalFilter: "ml" | "fala" | "vtex" =
        platform.exportPrefix === "mercadolibre"
            ? "ml"
            : platform.exportPrefix === "falabella"
              ? "fala"
              : "vtex";

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Marketplace`}
                title="Dashboard"
                badge={loading ? undefined : { label: "En vivo", tone: "live" }}
                actions={
                    <>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={refresh}
                            disabled={loading}
                        >
                            <RefreshCw className="w-4 h-4" />
                            {loading ? "Cargando…" : "Refrescar"}
                        </ActionButton>
                        <ActionButton
                            variant="primary"
                            size="sm"
                            onClick={() => router.push(`${platform.basePath}/publicar`)}
                        >
                            <Plus className="w-4 h-4" />
                            Nueva publicación
                        </ActionButton>
                    </>
                }
            />

            {error && (
                <div className="mx-6 mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-[12.5px] text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="flex-1 bg-[#f3f4f6] px-6 py-6 space-y-6">
                {/* KPIs principales */}
                <section>
                    <Sec icon={<TrendingUp className="w-[18px] h-[18px]" />}>Resumen</Sec>
                    {loading ? (
                        <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                                >
                                    <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                                    <div className="mt-3 h-7 w-16 bg-gray-100 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            <MetricCard
                                label={`Publicaciones ${platform.name}`}
                                value={(publishedForChannel ?? 0).toLocaleString("es-CL")}
                                icon={<Rocket className="w-4 h-4" />}
                                delta={
                                    data?.kpis.published
                                        ? {
                                              text: `total agregado ${data.kpis.published.toLocaleString("es-CL")}`,
                                              direction: "flat",
                                          }
                                        : undefined
                                }
                            />
                            <MetricCard
                                label="Lotes en proceso"
                                value={(data?.kpis.batches ?? 0).toString()}
                                icon={<Upload className="w-4 h-4" />}
                            />
                            <MetricCard
                                label="Errores"
                                value={(data?.kpis.errors ?? 0).toString()}
                                valueAccent={
                                    (data?.kpis.errors ?? 0) > 0 ? "text-rose-600" : undefined
                                }
                                icon={<AlertTriangle className="w-4 h-4" />}
                            />
                        </div>
                    )}
                </section>

                {/* Actividad de publicación — solo Falabella (bitácora fal_product_audit). */}
                {canalFilter === "fala" && (
                    <section>
                        <Sec icon={<TrendingUp className="w-[18px] h-[18px]" />}>
                            Actividad de publicación
                        </Sec>
                        <PublishActivityWidget
                            enabled
                            onOpenSku={(sku) =>
                                router.push(
                                    `${platform.basePath}/editor/${encodeURIComponent(sku)}`,
                                )
                            }
                        />
                    </section>
                )}

                {/* Grids principales */}
                <section className="grid grid-cols-2 gap-3">
                    <BatchesList
                        batches={data?.batches ?? []}
                        loading={loading}
                        onOpen={(b) =>
                            router.push(`${platform.basePath}/carga-masiva?batchId=${b.id}`)
                        }
                    />
                    <RecentProductsList
                        products={data?.products ?? []}
                        filterCanal={canalFilter}
                        loading={loading}
                        onOpen={(p) => {
                            router.push(`${platform.basePath}/editor/${encodeURIComponent(p.sku)}`);
                        }}
                    />
                </section>


                {data?.generated_at && (
                    <div className="text-right text-[11px] text-gray-400 tabular-nums">
                        Generado {new Date(data.generated_at).toLocaleString("es-CL")}
                    </div>
                )}
            </div>
        </div>
    );
}
