"use client";

import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    UserIcon,
    BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { CalendarDaysIcon } from "lucide-react";

interface Props {
    data: any;
    customerRecord?: any;
    onCustomerChange?: (field: string, value: any) => void;
    inputRefs?: {
        firstName?: React.RefObject<HTMLInputElement>;
        lastName?: React.RefObject<HTMLInputElement>;
        email?: React.RefObject<HTMLInputElement>;
        document?: React.RefObject<HTMLInputElement>;
    };
    readOnly?: boolean;
}

export default function MonitoreoIntegracionesFields({
    data,
    customerRecord,
    onCustomerChange,
    inputRefs,
    readOnly = false,
}: Props) {
    if (!data) return null;

    const { order, error, link, payload } = data;

    const isCustomerError = error?.errorCode === "customer_error";

    const handleCustomer =
        (field: string) => (value: any) =>
            onCustomerChange?.(field, value);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">

                {/* ===================== IZQUIERDA ===================== */}
                <div className="lg:col-span-4 space-y-6">

                    {/* ===== DETALLE ===== */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Order ID</span>
                            <div className="col-span-5">
                                <input className="w-full border-b bg-transparent text-sm outline-none"
                                    value={order?.orderID ?? ""} readOnly />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">URef</span>
                            <div className="col-span-5">
                                <input className="w-full border-b bg-transparent text-sm outline-none"
                                    value={order?.u_ref1 ?? ""} readOnly />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Canal</span>
                            <div className="col-span-5">
                                <input className="w-full border-b bg-transparent text-sm outline-none"
                                    value={order?.salesChannelReferenceId ?? ""} readOnly />
                            </div>
                        </div>
                    </Card>

                    {/* ===== ERROR ===== */}
                    <Card
                        title="ERROR"
                        icon={ExclamationTriangleIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Código</span>
                            <div className="col-span-5">
                                <input className="w-full border-b bg-transparent text-sm outline-none"
                                    value={error?.errorCode ?? ""} readOnly />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Descripción</span>
                            <div className="col-span-5">
                                <input className="w-full border-b bg-transparent text-sm outline-none"
                                    value={error?.errorDescription ?? ""} readOnly />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Mensaje</span>
                            <div className="col-span-5">
                                <textarea
                                    rows={3}
                                    className="w-full border-b bg-transparent text-sm outline-none"
                                    value={link?.message ?? ""}
                                    readOnly
                                />
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="PAYLOAD"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="space-y-4 text-sm text-gray-700">

                            <div>
                                <div className="font-bold mb-1">Raw</div>
                                <textarea
                                    className="w-full border rounded-md p-2 text-xs font-mono bg-gray-50"
                                    rows={6}
                                    value={payload?.raw ?? ""}
                                    readOnly
                                />
                            </div>

                            <div>
                                <div className="font-bold mb-1">Parsed</div>
                                <pre className="w-full rounded-md p-2 text-xs bg-gray-50 overflow-auto">
                                    {payload?.parsed
                                        ? JSON.stringify(payload.parsed, null, 2)
                                        : "—"}
                                </pre>
                            </div>

                        </div>
                    </Card>

                    {/* ===== CLIENTE (solo customer_error) ===== */}
                    {isCustomerError && customerRecord && (
                        <Card
                            title="CLIENTE"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                                <div className="col-span-5">
                                    <input
                                        ref={inputRefs?.firstName}
                                        className="w-full border-b bg-transparent text-sm outline-none"
                                        value={customerRecord.firstName ?? ""}
                                        onChange={(e) => handleCustomer("firstName")(e.target.value)}
                                        readOnly={readOnly}
                                    />
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Apellido</span>
                                <div className="col-span-5">
                                    <input
                                        ref={inputRefs?.lastName}
                                        className="w-full border-b bg-transparent text-sm outline-none"
                                        value={customerRecord.lastName ?? ""}
                                        onChange={(e) => handleCustomer("lastName")(e.target.value)}
                                        readOnly={readOnly}
                                    />
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Documento</span>
                                <div className="col-span-5">
                                    <input
                                        ref={inputRefs?.document}
                                        className="w-full border-b bg-transparent text-sm outline-none"
                                        value={customerRecord.document ?? ""}
                                        onChange={(e) =>
                                            handleCustomer("document")(e.target.value)
                                        }
                                        readOnly={readOnly}
                                    />
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Email</span>
                                <div className="col-span-5">
                                    <input
                                        ref={inputRefs?.email}
                                        className="w-full border-b bg-transparent text-sm outline-none"
                                        value={customerRecord.email ?? ""}
                                        onChange={(e) => handleCustomer("email")(e.target.value)}
                                        readOnly={readOnly}
                                    />
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* ===================== DERECHA ===================== */}
                <div className="lg:col-span-3 space-y-6">

                    <Card
                        title="ORIGEN"
                        icon={BuildingStorefrontIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="text-sm text-gray-700">
                            {link?.source || "—"}
                        </div>
                    </Card>

                    <Card
                        title="ESTADO"
                        icon={ExclamationTriangleIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="text-sm text-gray-700">
                            {link?.stateCode || "—"}
                        </div>
                    </Card>

                    <Card
                        title="FECHAS"
                        icon={CalendarDaysIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="space-y-2 text-sm text-gray-700">
                            <div><b>Primera:</b> {link?.firstSeenAtUtc || "—"}</div>
                            <div><b>Última:</b> {link?.lastSeenAtUtc || "—"}</div>
                        </div>
                    </Card>

                    <Card
                        title="METADATA DEL ERROR"
                        icon={ExclamationTriangleIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="space-y-2 text-sm text-gray-700">
                            <div><b>ID Error Link:</b> {link?.orderErrorLinkID ?? "—"}</div>
                            <div><b>Código técnico:</b> {link?.code ?? "—"}</div>
                            <div><b>Secuencia:</b> {link?.seq ?? "—"}</div>
                            <div><b>Activo:</b> {link?.isActive ? "Sí" : "No"}</div>
                            <div><b>Resuelto en:</b> {link?.resolvedAtUtc ?? "—"}</div>
                            <div><b>Nota resolución:</b> {link?.resolutionNote ?? "—"}</div>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
