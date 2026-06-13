import { useEffect, useMemo, useState } from "react";
import {
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    EllipsisHorizontalIcon,
    EyeIcon,
    ListBulletIcon,
    PaperClipIcon,
    PencilSquareIcon,
    UserIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import {
    ConciliationRow,
    DIFF_STATUS_META,
    DIFF_TYPE_LABEL,
    WeekDifference,
} from "../conciliation.types";

type WeekDifferencesSplitViewProps = {
    selectedWeek: ConciliationRow;
    differences: WeekDifference[];
    selectedDifference: WeekDifference | null;
    selectedDifferenceId: string | null;
    onSelectDifference: (id: string) => void;
    onBack: () => void;
    formatDateTime: (value: string) => string;
};

const DIFFS_PER_PAGE = 6;

export function WeekDifferencesSplitView({
    selectedWeek,
    differences,
    selectedDifference,
    selectedDifferenceId,
    onSelectDifference,
    onBack,
    formatDateTime,
}: WeekDifferencesSplitViewProps) {
    const [differencesPage, setDifferencesPage] = useState(1);

    useEffect(() => {
        setDifferencesPage(1);
    }, [selectedWeek.id]);

    const totalDifferencesPages = Math.max(1, Math.ceil(differences.length / DIFFS_PER_PAGE));

    useEffect(() => {
        if (differencesPage > totalDifferencesPages) {
            setDifferencesPage(totalDifferencesPages);
        }
    }, [differencesPage, totalDifferencesPages]);

    const pagedDifferences = useMemo(() => {
        const startIndex = (differencesPage - 1) * DIFFS_PER_PAGE;
        return differences.slice(startIndex, startIndex + DIFFS_PER_PAGE);
    }, [differences, differencesPage]);

    const pendingCount = differences.filter((d) => d.status === "pendiente").length;
    const reviewingCount = differences.filter((d) => d.status === "revisando").length;
    const resolvedCount = differences.filter((d) => d.status === "resuelta").length;
    const justifiedCount = differences.filter((d) => d.status === "justificada").length;

    const detailData = useMemo(() => buildDetailData(selectedDifference), [selectedDifference]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <section className="xl:col-span-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 px-4 py-2.5 text-sm font-semibold">
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            {pendingCount} pendientes
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700">
                            <ClockIcon className="h-4 w-4" />
                            {reviewingCount} revisando
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                            <CheckCircleIcon className="h-4 w-4" />
                            {resolvedCount} resueltas
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-700">
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                            {justifiedCount} justificadas
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Orden ML / OMS</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo diferencia</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Monto diferencia</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedDifferences.map((difference) => {
                                    const statusMeta = DIFF_STATUS_META[difference.status];
                                    const isActive = difference.id === selectedDifferenceId;
                                    const amountClass = difference.amountValue && difference.amountValue > 0 ? "text-red-500" : "text-slate-400";

                                    return (
                                        <tr
                                            key={difference.id}
                                            className={`${isActive ? "bg-blue-50" : "bg-white hover:bg-slate-50"} border-t border-slate-100`}
                                            style={isActive ? { boxShadow: "inset 3px 0 0 0 #3b82f6" } : undefined}
                                        >
                                            <td className="px-4 py-3 align-top">
                                                <p className="text-xl font-semibold leading-tight text-slate-900">{difference.id}</p>
                                                <p className="mt-1 text-xs text-slate-600">
                                                    {difference.orderOms} / {difference.orderMl}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-600">{difference.sku}</p>
                                            </td>
                                            <td className="px-3 py-3 align-middle text-sm font-medium text-slate-700">
                                                {DIFF_TYPE_LABEL[difference.differenceType]}
                                            </td>
                                            <td className="px-3 py-3 align-middle text-sm font-semibold">
                                                <div className="space-y-0.5">
                                                    <p className={amountClass}>{difference.amountLabel}</p>
                                                    {difference.amountValue && difference.amountValue > 0 ? (
                                                        <p className="text-xs font-semibold text-red-500">
                                                            ({estimateDiffPercent(difference.amountValue)})
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.classes}`}>
                                                    {statusMeta.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 align-middle">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectDifference(difference.id)}
                                                    className="rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                                                    aria-label="Ver diferencia"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {pagedDifferences.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                                            No hay diferencias para esta semana.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-200 px-2 pb-1">
                        <Pagination
                            currentPage={differencesPage}
                            totalRecords={differences.length}
                            pageSize={DIFFS_PER_PAGE}
                            onPageChange={setDifferencesPage}
                            barClassName="bg-transparent"
                            infoClassName="text-sm"
                        />
                    </div>
                </section>

                <section className="xl:col-span-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {!selectedDifference ? (
                        <div className="px-4 py-6 text-sm text-slate-500">Selecciona una diferencia para ver su detalle.</div>
                    ) : (
                        <>
                            <header className="border-b border-slate-200 px-3 py-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-2xl font-semibold leading-none text-slate-900">{selectedDifference.id}</h3>
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${DIFF_STATUS_META[selectedDifference.status].classes}`}
                                            >
                                                {DIFF_STATUS_META[selectedDifference.status].label}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-base text-slate-700">
                                            {DIFF_TYPE_LABEL[selectedDifference.differenceType]} en orden {selectedDifference.orderOms} ({selectedDifference.sku})
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onBack}
                                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                                        aria-label="Cerrar detalle"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                                    <ActionPill
                                        label="Justificar"
                                        className="border-amber-200 bg-amber-50 text-amber-700"
                                        icon={<PencilSquareIcon className="h-4 w-4" />}
                                    />
                                    <ActionPill
                                        label="Escalar"
                                        className="border-blue-200 bg-blue-600 text-white"
                                        icon={<ArrowTrendingUpIcon className="h-4 w-4" />}
                                    />
                                    <ActionPill label="Asignar" className="border-slate-200 bg-white text-slate-700" icon={<UserIcon className="h-4 w-4" />} />
                                    <ActionPill label="Resolver" className="border-emerald-200 bg-emerald-500 text-white" icon={<CheckCircleIcon className="h-4 w-4" />} />
                                    <ActionPill label="Mas acciones" className="border-slate-200 bg-white text-slate-700" icon={<EllipsisHorizontalIcon className="h-4 w-4" />} />
                                </div>

                                <div className="mt-3 grid grid-cols-2 border-b border-slate-200 text-xs font-semibold text-slate-500 sm:grid-cols-3 lg:grid-cols-5">
                                    <DetailTab label="Resumen" active icon={<ClipboardDocumentListIcon className="h-4 w-4" />} />
                                    <DetailTab label={`Comentarios (${selectedDifference.comments})`} icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />} />
                                    <DetailTab label={`Archivos (${selectedDifference.files})`} icon={<PaperClipIcon className="h-4 w-4" />} />
                                    <DetailTab label="Logs" icon={<ClockIcon className="h-4 w-4" />} />
                                    <DetailTab label="Historial" icon={<ListBulletIcon className="h-4 w-4" />} />
                                </div>
                            </header>

                            <div className="space-y-2.5 px-3 py-3">
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <PanelCard title="Pedido OMS">
                                        <DetailField label="Orden OMS" value={selectedDifference.orderOms} />
                                        <DetailField label="Fecha venta" value={detailData.omsDate} />
                                        <DetailField label="SKU" value={selectedDifference.sku} compact />
                                        <DetailField label="Producto" value={detailData.productName} />
                                        <DetailField label="Cantidad" value={detailData.omsQty} />
                                        <DetailField label="Precio unitario" value={detailData.omsUnit} />
                                        <DetailField label="Monto total" value={detailData.omsTotal} />
                                    </PanelCard>

                                    <PanelCard title="Pedido Mercado Libre">
                                        <DetailField label="Orden ML" value={selectedDifference.orderMl} />
                                        <DetailField label="Fecha venta" value={detailData.mlDate} />
                                        <DetailField label="SKU" value={selectedDifference.sku} compact />
                                        <DetailField label="Producto" value={detailData.productName} />
                                        <DetailField label="Cantidad" value={detailData.mlQty} />
                                        <DetailField label="Precio unitario" value={detailData.mlUnit} />
                                        <DetailField label="Monto total" value={detailData.mlTotal} />
                                    </PanelCard>
                                </div>

                                <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3">
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Diferencia detectada</h4>
                                    <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)_56px_minmax(0,1fr)] md:items-start">
                                        <div>
                                            <p className="text-xs font-medium text-slate-600">Monto OMS</p>
                                            <p className="mt-1 text-2xl font-semibold leading-none text-slate-900">{detailData.omsTotal}</p>
                                        </div>

                                        <div className="flex items-center justify-center pt-7 text-2xl font-semibold leading-none text-slate-500">-</div>

                                        <div>
                                            <p className="text-xs font-medium text-slate-600">Monto ML</p>
                                            <p className="mt-1 text-2xl font-semibold leading-none text-slate-900">{detailData.mlTotal}</p>
                                        </div>

                                        <div className="flex items-center justify-center pt-7 text-2xl font-semibold leading-none text-slate-500">=</div>

                                        <div>
                                            <p className="text-xs font-medium text-slate-600">Diferencia</p>
                                            <p className="mt-1 text-2xl font-semibold leading-none text-red-600">{selectedDifference.amountLabel}</p>
                                            <p className="mt-1 text-lg font-semibold leading-none text-red-600">{detailData.variation}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <PanelCard title="Informacion">
                                        <DetailField label="Conciliacion" value={`MLFULL-${selectedWeek.periodStart.slice(0, 4)}-${selectedWeek.id.toUpperCase()}`} />
                                        <DetailField label="Semana" value={selectedWeek.weekLabel} />
                                        <DetailField label="Tipo diferencia" value={DIFF_TYPE_LABEL[selectedDifference.differenceType]} />
                                        <DetailField label="Creacion" value={formatDateTime(selectedDifference.detectedAt)} />
                                        <DetailField label="Detectada por" value="Sistema" />
                                        <DetailField label="Responsable actual" value={selectedDifference.escalatedBy} />
                                        <DetailField label="Area" value="Finanzas" />
                                    </PanelCard>

                                    <PanelCard title="Escalamiento">
                                        <DetailField label="Estado" value={DIFF_STATUS_META[selectedDifference.status].label} />
                                        <DetailField label="Motivo" value="Revision financiera requerida" />
                                        <DetailField label="Escalado por" value={selectedDifference.escalatedBy} />
                                        <DetailField label="Escalado a" value="Finanzas" />
                                        <DetailField label="Prioridad" value="Media" />
                                        <DetailField label="Fecha escalamiento" value={formatDateTime(selectedDifference.detectedAt)} />
                                    </PanelCard>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

type DetailFieldProps = {
    label: string;
    value: string;
    compact?: boolean;
};

function DetailField({ label, value, compact = false }: DetailFieldProps) {
    return (
        <div className="grid grid-cols-[120px_1fr] gap-2 py-0.5">
            <p className="text-xs text-slate-600">{label}</p>
            <p className={`text-xs font-semibold text-slate-800 ${compact ? "inline-flex w-fit rounded-full bg-blue-50 px-2 py-0.5" : ""}`}>
                {value}
            </p>
        </div>
    );
}

type PanelCardProps = {
    title: string;
    children: React.ReactNode;
};

function PanelCard({ title, children }: PanelCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            <div className="mt-1.5 space-y-1">{children}</div>
        </div>
    );
}

type ActionPillProps = {
    label: string;
    className: string;
    icon?: React.ReactNode;
};

function ActionPill({ label, className, icon }: ActionPillProps) {
    return (
        <button type="button" className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${className}`}>
            {icon}
            {label}
        </button>
    );
}

type DetailTabProps = {
    label: string;
    icon: React.ReactNode;
    active?: boolean;
};

function DetailTab({ label, icon, active = false }: DetailTabProps) {
    return (
        <button
            type="button"
            title={label}
            className={`inline-flex w-full min-w-0 items-center justify-center gap-1.5 border-b-2 px-2 py-2 text-xs font-semibold ${active ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"
                }`}
        >
            {icon}
            <span className="truncate">{label}</span>
        </button>
    );
}

const formatMoney = (value: number) => `$${value.toLocaleString("es-CL")}`;

const formatPercent = (value: number) => `${value.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const estimateDiffPercent = (amount: number) => {
    const base = Math.max(70000, amount * 4.2);
    return formatPercent((amount / base) * 100);
};

function buildDetailData(selectedDifference: WeekDifference | null) {
    if (!selectedDifference) {
        return {
            productName: "Producto",
            omsDate: "-",
            mlDate: "-",
            omsQty: "-",
            mlQty: "-",
            omsUnit: "-",
            mlUnit: "-",
            omsTotal: "-",
            mlTotal: "-",
            variation: "-",
        };
    }

    const hash = Number.parseInt(selectedDifference.id.replace(/\D/g, ""), 10) || 1;
    const amount = selectedDifference.amountValue ?? 0;

    const mlBase = 90000 + (hash % 6) * 5000;
    let mlTotal = mlBase;
    let omsTotal = mlBase;
    let mlQty = 2;
    let omsQty = 2;

    if (selectedDifference.differenceType === "monto" || selectedDifference.differenceType === "comision") {
        omsTotal = mlBase + Math.max(amount, 5000);
    }

    if (selectedDifference.differenceType === "cantidad") {
        mlQty = 1;
        omsQty = 2;
    }

    if (selectedDifference.differenceType === "no_en_ml") {
        mlTotal = 0;
        mlQty = 0;
    }

    const differenceNumeric = Math.max(omsTotal - mlTotal, 0);
    const variation = mlTotal > 0 ? (differenceNumeric / mlTotal) * 100 : 0;

    return {
        productName: `Producto ${selectedDifference.sku.replace("SKU-", "")}`,
        omsDate: "10/07/2026 14:32",
        mlDate: "10/07/2026 14:33",
        omsQty: String(omsQty),
        mlQty: mlQty === 0 ? "-" : String(mlQty),
        omsUnit: omsQty > 0 ? formatMoney(Math.round(omsTotal / omsQty)) : "-",
        mlUnit: mlQty > 0 ? formatMoney(Math.round(mlTotal / mlQty)) : "-",
        omsTotal: formatMoney(omsTotal),
        mlTotal: mlTotal === 0 ? "-" : formatMoney(mlTotal),
        variation: variation > 0 ? `(${formatPercent(variation)})` : "-",
    };
}
