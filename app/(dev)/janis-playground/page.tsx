// app/(dev)/janis-playground/page.tsx
//
// Galería visual de TODOS los átomos Janis montados con datos de ejemplo.
// Sirve como Storybook-like para QA pixel-perfect contra los mockups
// `Mimbral Mercadolibre/*.html`.
//
// Esta página NO debe llegar a PROD. Vive bajo el route group `(dev)` y
// debería filtrarse en `middleware.ts` antes del release final.

"use client";

import { useState } from "react";
import {
    JanisTopBar,
    JanisTabs,
    JanisStepsHeader,
    PillBtn,
    Sec,
    Field,
    UnderlineInput,
    Sel,
    Chip,
    Card,
    StatusBadge,
    ProgressItem,
    Kpi,
    JanisIcon,
} from "@/features/catalogo/pages/plataforma-ecommerce/_shared/janis";

type DemoTab = "summary" | "platforms" | "comments" | "logs";
type DemoStep = "sku" | "obligatorios" | "recomendados" | "revisar";

export default function JanisPlaygroundPage() {
    const [tab, setTab] = useState<DemoTab>("summary");
    const [step, setStep] = useState<DemoStep>("obligatorios");
    const [chips, setChips] = useState(["Color · Rojo", "Material · Acero", "Largo · 25cm"]);

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-gray-900" style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 13 }}>
            <header className="bg-white border-b border-gray-200 px-8 py-6">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-blue-700 uppercase">
                    Dev · Plataforma de ecommerce
                </p>
                <h1 className="text-[26px] font-semibold mt-1">Janis playground</h1>
                <p className="mt-1 text-gray-500">
                    Galería visual de los átomos de{" "}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11.5px]">
                        features/catalogo/pages/plataforma-ecommerce/_shared/janis/
                    </code>
                    . QA contra los mockups en{" "}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11.5px]">
                        Mimbral Mercadolibre/*.html
                    </code>
                    .
                </p>
            </header>

            <main className="px-8 py-8 space-y-10 max-w-[1400px] mx-auto">
                {/* ── Chrome ───────────────────────────────────── */}
                <Section title="01 · Chrome" subtitle="Cabecera estándar de cada feature">
                    <Card padding="none">
                        <JanisTopBar
                            eyebrow="Mimbral · Marketplace"
                            title="Dashboard"
                            badge={{ label: "En vivo", tone: "live" }}
                            actions={
                                <>
                                    <PillBtn
                                        variant="ghost"
                                        icon={<JanisIcon name="refresh" size={16} />}
                                    >
                                        Últimas 24h
                                    </PillBtn>
                                    <PillBtn
                                        variant="primary"
                                        icon={<JanisIcon name="plus" size={16} />}
                                    >
                                        Nueva publicación
                                    </PillBtn>
                                </>
                            }
                        />
                    </Card>
                </Section>

                <Section title="02 · Tabs" subtitle="Para vistas con sub-secciones (RESUMEN · IMAGEN · ...)">
                    <Card padding="none">
                        <JanisTabs
                            active={tab}
                            onChange={setTab}
                            items={[
                                {
                                    id: "summary",
                                    label: "SUMMARY",
                                    icon: <JanisIcon name="table" size={16} />,
                                },
                                {
                                    id: "platforms",
                                    label: "PLATFORMS",
                                    icon: <JanisIcon name="platforms" size={16} />,
                                },
                                {
                                    id: "comments",
                                    label: "COMMENTS",
                                    icon: <JanisIcon name="comment" size={16} />,
                                },
                                {
                                    id: "logs",
                                    label: "LOGS",
                                    icon: <JanisIcon name="clock" size={16} />,
                                },
                            ]}
                        />
                        <div className="p-8 text-gray-500">
                            Tab activo: <code className="text-gray-700">{tab}</code>
                        </div>
                    </Card>
                </Section>

                <Section title="03 · Steps header" subtitle="Variante para wizards (Publicar)">
                    <Card padding="none">
                        <JanisStepsHeader
                            active={step}
                            onChange={setStep}
                            steps={[
                                {
                                    id: "sku",
                                    label: "SKU Y CATEGORÍA",
                                    icon: <JanisIcon name="table" size={16} />,
                                },
                                {
                                    id: "obligatorios",
                                    label: "OBLIGATORIOS",
                                    icon: <JanisIcon name="info" size={16} />,
                                },
                                {
                                    id: "recomendados",
                                    label: "RECOMENDADOS",
                                    icon: <JanisIcon name="star" size={16} />,
                                },
                                {
                                    id: "revisar",
                                    label: "REVISAR",
                                    icon: <JanisIcon name="checkCircle" size={16} />,
                                },
                            ]}
                        />
                        <div className="p-8 text-gray-500">
                            Step activo: <code className="text-gray-700">{step}</code>
                        </div>
                    </Card>
                </Section>

                {/* ── PillBtn variants ─────────────────────────── */}
                <Section title="04 · PillBtn" subtitle="Variantes de botón pill">
                    <Card>
                        <div className="flex flex-wrap items-center gap-2">
                            <PillBtn variant="primary" icon={<JanisIcon name="flag" size={16} />}>
                                Primary
                            </PillBtn>
                            <PillBtn variant="success" icon={<JanisIcon name="save" size={16} />}>
                                Success
                            </PillBtn>
                            <PillBtn
                                variant="success-outline"
                                icon={<JanisIcon name="checkCircle" size={16} />}
                            >
                                Success outline
                            </PillBtn>
                            <PillBtn variant="ghost" icon={<JanisIcon name="close" size={16} />}>
                                Ghost
                            </PillBtn>
                            <PillBtn variant="danger" icon={<JanisIcon name="trash" size={16} />}>
                                Danger
                            </PillBtn>
                            <PillBtn variant="primary" disabled>
                                Disabled
                            </PillBtn>
                        </div>
                    </Card>
                </Section>

                {/* ── Form atoms ───────────────────────────────── */}
                <Section title="05 · Form atoms" subtitle="Sec · Field · UnderlineInput · Sel · Chip">
                    <Card>
                        <div className="grid grid-cols-[1fr_360px] gap-12">
                            <div className="min-w-0">
                                <Sec icon={<JanisIcon name="list" size={18} />}>SKU base</Sec>
                                <Field
                                    label="SKU interno"
                                    hint="Si ya existe en tu catálogo se autocompletan los demás campos."
                                >
                                    <UnderlineInput tabular placeholder="MIM-XXXX" />
                                </Field>
                                <Field label="Producto">
                                    <Sel placeholder="Buscar producto en catálogo…" />
                                </Field>
                                <Field label="Categoría sugerida">
                                    <Sel
                                        value={
                                            <span className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                                                    SUGERIDA
                                                </span>
                                                Hogar &gt; Herramientas &gt; Taladros
                                            </span>
                                        }
                                    />
                                </Field>
                                <Field label="Tipo de listado">
                                    <Sel value="Gold Special" clearable onClear={() => null} />
                                </Field>

                                <div className="h-3" />
                                <Sec icon={<JanisIcon name="star" size={18} />}>Atributos</Sec>
                                <Field label="Etiquetas" align="top">
                                    <div className="flex flex-wrap gap-1.5 py-1.5">
                                        {chips.map((c) => (
                                            <Chip
                                                key={c}
                                                onRemove={() =>
                                                    setChips((prev) => prev.filter((x) => x !== c))
                                                }
                                            >
                                                {c}
                                            </Chip>
                                        ))}
                                        <Chip tone="primary">+ Agregar</Chip>
                                    </div>
                                </Field>
                            </div>

                            <div className="border-l border-gray-200 pl-10">
                                <Sec icon={<JanisIcon name="user" size={18} />}>Progreso</Sec>
                                <div className="space-y-3">
                                    <ProgressItem n="1" label="SKU y categoría" state="done" />
                                    <ProgressItem n="2" label="Atributos obligatorios" state="active" />
                                    <ProgressItem n="3" label="Atributos recomendados" state="pending" />
                                    <ProgressItem n="4" label="Revisión y publicación" state="pending" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </Section>

                {/* ── KPIs ─────────────────────────────────────── */}
                <Section title="06 · Kpi" subtitle="Tarjetas KPI del dashboard">
                    <div className="grid grid-cols-4 gap-3">
                        <Kpi
                            label="Ventas hoy"
                            value="$8.420.500"
                            delta={{ text: "+18,4% vs ayer", direction: "up" }}
                        />
                        <Kpi
                            label="Órdenes"
                            value="142"
                            delta={{ text: "+12 vs ayer", direction: "up" }}
                        />
                        <Kpi
                            label="Visitas ML"
                            value="14.820"
                            delta={{ text: "+6,2%", direction: "up" }}
                        />
                        <Kpi
                            label="Conv. rate"
                            value="2,8%"
                            delta={{ text: "−0,3 pp", direction: "down" }}
                        />
                    </div>
                </Section>

                {/* ── Status badges ────────────────────────────── */}
                <Section title="07 · StatusBadge" subtitle="Solid (default) y soft variants">
                    <Card>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] uppercase tracking-wider text-gray-500 w-20">
                                    Solid
                                </span>
                                <StatusBadge tone="live">En vivo</StatusBadge>
                                <StatusBadge tone="active">Activo</StatusBadge>
                                <StatusBadge tone="draft">Borrador</StatusBadge>
                                <StatusBadge tone="paused">Pausado</StatusBadge>
                                <StatusBadge tone="error">Error</StatusBadge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] uppercase tracking-wider text-gray-500 w-20">
                                    Soft
                                </span>
                                <StatusBadge tone="live" soft>
                                    En vivo
                                </StatusBadge>
                                <StatusBadge tone="active" soft>
                                    Activo
                                </StatusBadge>
                                <StatusBadge tone="draft" soft>
                                    Borrador
                                </StatusBadge>
                                <StatusBadge tone="paused" soft>
                                    Pausado
                                </StatusBadge>
                                <StatusBadge tone="error" soft>
                                    Error
                                </StatusBadge>
                            </div>
                        </div>
                    </Card>
                </Section>

                {/* ── Icon set ─────────────────────────────────── */}
                <Section title="08 · JanisIcon" subtitle="Set completo de iconos SVG inline">
                    <Card>
                        <IconGrid />
                    </Card>
                </Section>

                {/* ── Combinación final: una "feature" entera renderizada ─ */}
                <Section
                    title="09 · Composición completa"
                    subtitle="Simulación de cómo se ve una feature montada (Atributos)"
                >
                    <Card padding="none" className="overflow-hidden">
                        <JanisTopBar
                            eyebrow="Attribute Set"
                            title="Dimensiones"
                            badge={{ label: "Activo", tone: "active" }}
                            actions={
                                <>
                                    <PillBtn
                                        variant="success-outline"
                                        icon={<JanisIcon name="checkCircle" size={16} />}
                                    >
                                        Aplicar
                                    </PillBtn>
                                    <PillBtn variant="success">Guardar</PillBtn>
                                    <PillBtn variant="primary">Guardar & Crear nuevo</PillBtn>
                                    <PillBtn variant="ghost">Cancelar</PillBtn>
                                </>
                            }
                        />
                        <JanisTabs
                            active={tab}
                            onChange={setTab}
                            items={[
                                {
                                    id: "summary",
                                    label: "SUMMARY",
                                    icon: <JanisIcon name="table" size={16} />,
                                },
                                {
                                    id: "platforms",
                                    label: "PLATFORMS",
                                    icon: <JanisIcon name="platforms" size={16} />,
                                },
                                {
                                    id: "comments",
                                    label: "COMMENTS",
                                    icon: <JanisIcon name="comment" size={16} />,
                                },
                                {
                                    id: "logs",
                                    label: "LOGS",
                                    icon: <JanisIcon name="clock" size={16} />,
                                },
                            ]}
                        />
                        <div className="bg-[#f3f4f6] p-6">
                            <Card>
                                <Sec icon={<JanisIcon name="list" size={18} />}>Detail</Sec>
                                <Field label="Ref ID">
                                    <UnderlineInput tabular defaultValue="atr-set" />
                                </Field>
                                <Field label="Name">
                                    <UnderlineInput defaultValue="Dimensiones" />
                                </Field>
                            </Card>
                        </div>
                    </Card>
                </Section>

                <footer className="pt-8 text-xs text-gray-400">
                    Fase 1 del{" "}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5">
                        docs/MIGRATION_PLAN.md
                    </code>
                    . Pixel-checking pendiente contra los HTML originales:{" "}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5">
                        Mimbral Mercadolibre/dashboard.html
                    </code>{" "}
                    y{" "}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5">
                        Mimbral Mercadolibre/atributos.html
                    </code>
                    .
                </footer>
            </main>
        </div>
    );
}

function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <header className="mb-3">
                <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
                {subtitle && <p className="text-[12px] text-gray-500">{subtitle}</p>}
            </header>
            {children}
        </section>
    );
}

const ICON_NAMES = [
    "home",
    "cart",
    "list",
    "image",
    "pin",
    "clock",
    "flag",
    "sparkle",
    "bolt",
    "grid",
    "upload",
    "refresh",
    "plus",
    "check",
    "checkCircle",
    "close",
    "chevronDown",
    "chevronRight",
    "search",
    "user",
    "trash",
    "save",
    "comment",
    "platforms",
    "table",
    "star",
    "money",
    "box",
    "calendar",
    "chartUp",
    "info",
] as const;

function IconGrid() {
    return (
        <div className="grid grid-cols-6 gap-2">
            {ICON_NAMES.map((name) => (
                <div
                    key={name}
                    className="flex flex-col items-center gap-1.5 rounded-md border border-gray-200 p-3 hover:bg-gray-50"
                >
                    <span className="text-gray-700">
                        <JanisIcon name={name} size={20} />
                    </span>
                    <code className="text-[10.5px] text-gray-500">{name}</code>
                </div>
            ))}
        </div>
    );
}
