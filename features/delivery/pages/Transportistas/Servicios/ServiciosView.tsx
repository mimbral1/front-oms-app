"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/card/Card";
import { TruckIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { StoreIcon, User2Icon } from "lucide-react";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { Action } from "@/components/layout/page-header";
import { SaveWithPlusIcon } from "@/features/catalogo/pages/categorias/Resumen/CategoriasResumen";
import { getCarrierCache } from "@/features/delivery/pages/Transportistas/Transportista/shared/carrier-cache";
import { StyledReactSelect } from "@/components/ui/select/StyledReactSelect";
import { DELIVERY_COMPANY_ENDPOINT } from "@/lib/http/endpoints";

interface TransportistasRow {
    id: string;
    refId: string;
    nombre: string;
    descripcion: string;
    tipoEntrega: string;
    ubicaciones: any;
    diasLaborales: any;
    configuracion: {
        estado: "Active" | "Inactive";
        generarRuta: boolean;
        metodoSegundoFactor: string;
    };
    creador: {
        nombre: string;
        email: string;
        fechaCreacion: string;
    };
    modificador?: {
        nombre: string;
        email: string;
        fechaModificacion: string;
    };
    estado: string;
    max_paquetes: string;
    tipos_paquete: string;
    restricciones?: {
        tiempoMinEntrega?: string;
        tiempoMaxEntrega?: string;
        volumenMinPermitido?: string;
        volumenMaxPermitido?: string;
        pesoMinPermitido?: string;
        pesoMaxPermitido?: string;
    };
    companyId?: string;
    empresas: any;
    idEcommerce: any;
    integrationId?: string;
    Complementos_integracion: string;
}

interface TransportistaServiciosViewProps {
    record?: TransportistasRow;
    readOnly?: boolean;
    onChange?: (field: keyof TransportistasRow, value: any) => void;
}

interface CarrierCachedPayload {
    refId?: string | null;
    name?: string | null;
    description?: string | null;
    shippingType?: string | null;
    locationIds?: string[] | null;
    businessDays?: Array<number | string> | null;
    status?: string | null;
    generateRoute?: boolean | null;
    secondFactor?: string | { method?: string | null } | null;
    companyId?: string | number | null;
    integrationId?: string | number | null;
    ecommerceAccountIds?: Array<string | number> | null;
    userCreated?: string | { name?: string | null; email?: string | null } | null;
    userModified?: string | { name?: string | null; email?: string | null } | null;
    dateCreated?: string | null;
    dateModified?: string | null;
}

interface CompanyApiItem {
    id?: string | number | null;
    name?: string | null;
    refId?: string | null;
}

const idEcommerceOptions = [
    { value: "Fizzmod QA", label: "Fizzmod QA" },
    { value: "Otro id Ecommerce", label: "Otro id Ecommerce" },
];

const MOCK_TRANSPORTISTAS: TransportistasRow[] = [
    {
        id: "1",
        refId: "12345",
        nombre: "Transportadora",
        descripcion: "Transportadora Carrier",
        tipoEntrega: "Express delivery type",
        ubicaciones: "Palermo 201",
        diasLaborales: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        configuracion: {
            estado: "Inactive",
            generarRuta: true,
            metodoSegundoFactor: "Numerical pin",
        },
        creador: {
            nombre: "Ismael Garcia",
            email: "ismael@rizzmod.com",
            fechaCreacion: "19/10/2021 15:28:44",
        },
        estado: "Inactive",
        max_paquetes: "2",
        tipos_paquete: "Cajón plástico",
        restricciones: {
            tiempoMinEntrega: "24h",
            tiempoMaxEntrega: "72h",
            volumenMinPermitido: "0.1",
            volumenMaxPermitido: "10",
            pesoMinPermitido: "1",
            pesoMaxPermitido: "100",
        },
        companyId: "",
        empresas: ["99 minutos company"],
        idEcommerce: ["Fizzmod QA"],
        integrationId: "",
        Complementos_integracion: "",
    },
];

export default function TransportistaServiciosView({
    readOnly = false,
    onChange,
}: TransportistaServiciosViewProps) {
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const cachedCarrier = getCarrierCache<CarrierCachedPayload>(String(recordId || ""));
    const cachedLocationIds = cachedCarrier?.locationIds;
    const cachedBusinessDays = cachedCarrier?.businessDays;
    const cachedEcommerceAccountIds = cachedCarrier?.ecommerceAccountIds;

    const initialRecord: TransportistasRow = {
        ...MOCK_TRANSPORTISTAS[0],
        refId: String(cachedCarrier?.refId ?? MOCK_TRANSPORTISTAS[0].refId),
        nombre: String(cachedCarrier?.name ?? MOCK_TRANSPORTISTAS[0].nombre),
        descripcion: String(cachedCarrier?.description ?? MOCK_TRANSPORTISTAS[0].descripcion),
        tipoEntrega: String(cachedCarrier?.shippingType ?? MOCK_TRANSPORTISTAS[0].tipoEntrega),
        ubicaciones: Array.isArray(cachedLocationIds) ? cachedLocationIds : MOCK_TRANSPORTISTAS[0].ubicaciones,
        diasLaborales: Array.isArray(cachedBusinessDays) ? cachedBusinessDays : MOCK_TRANSPORTISTAS[0].diasLaborales,
        configuracion: {
            estado: String(cachedCarrier?.status || "").toLowerCase() === "active" ? "Active" : MOCK_TRANSPORTISTAS[0].configuracion.estado,
            generarRuta: cachedCarrier?.generateRoute != null ? Boolean(cachedCarrier.generateRoute) : MOCK_TRANSPORTISTAS[0].configuracion.generarRuta,
            metodoSegundoFactor:
                typeof cachedCarrier?.secondFactor === "string"
                    ? cachedCarrier.secondFactor
                    : (cachedCarrier?.secondFactor?.method ?? MOCK_TRANSPORTISTAS[0].configuracion.metodoSegundoFactor),
        },
        creador: {
            nombre:
                typeof cachedCarrier?.userCreated === "string"
                    ? cachedCarrier.userCreated
                    : (cachedCarrier?.userCreated?.name ?? MOCK_TRANSPORTISTAS[0].creador.nombre),
            email:
                typeof cachedCarrier?.userCreated === "object" && cachedCarrier?.userCreated
                    ? (cachedCarrier.userCreated.email ?? MOCK_TRANSPORTISTAS[0].creador.email)
                    : MOCK_TRANSPORTISTAS[0].creador.email,
            fechaCreacion: cachedCarrier?.dateCreated
                ? new Date(cachedCarrier.dateCreated).toLocaleString("es-CL")
                : MOCK_TRANSPORTISTAS[0].creador.fechaCreacion,
        },
        modificador: {
            nombre:
                typeof cachedCarrier?.userModified === "string"
                    ? cachedCarrier.userModified
                    : (cachedCarrier?.userModified?.name ?? "-"),
            email:
                typeof cachedCarrier?.userModified === "object" && cachedCarrier?.userModified
                    ? (cachedCarrier.userModified.email ?? "-")
                    : "-",
            fechaModificacion: cachedCarrier?.dateModified
                ? new Date(cachedCarrier.dateModified).toLocaleString("es-CL")
                : "-",
        },
        companyId: cachedCarrier?.companyId != null ? String(cachedCarrier.companyId) : MOCK_TRANSPORTISTAS[0].companyId,
        integrationId: cachedCarrier?.integrationId != null ? String(cachedCarrier.integrationId) : MOCK_TRANSPORTISTAS[0].integrationId,
        idEcommerce: Array.isArray(cachedEcommerceAccountIds)
            ? cachedEcommerceAccountIds.map((id) => String(id))
            : MOCK_TRANSPORTISTAS[0].idEcommerce,
    };

    const [record, setRecord] = useState<TransportistasRow>(initialRecord);
    const [empresasOptions, setEmpresasOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        const controller = new AbortController();

        const loadCompanies = async () => {
            try {
                const response = await fetch(DELIVERY_COMPANY_ENDPOINT, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) return;

                const payload = await response.json();
                const source = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : [];

                const options = source
                    .map((item: CompanyApiItem) => {
                        const value = String(item?.id ?? "").trim();
                        const label = String(item?.name ?? item?.refId ?? value).trim();
                        if (!value) return null;
                        return { value, label };
                    })
                    .filter(Boolean) as { value: string; label: string }[];

                setEmpresasOptions(options);
            } catch {
                setEmpresasOptions([]);
            }
        };

        void loadCompanies();

        return () => {
            controller.abort();
        };
    }, []);

    const handle =
        (field: keyof TransportistasRow) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                onChange?.(field, e.target.value);
            };

    const handleRestricciones =
        <K extends keyof NonNullable<TransportistasRow["restricciones"]>>(field: K) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const updated = {
                    ...record,
                    restricciones: {
                        ...record.restricciones,
                        [field]: e.target.value || "", // Usa un valor predeterminado de "" si el valor es undefined
                    },
                };
                setRecord(updated);
                onChange?.("restricciones", updated.restricciones);
            };

    // Acciones del header
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Apply",
                variant: "gray",
                onClick: () => { },
                icon: <CheckCircleIcon className="h-5 w-5" />,
            },
            {
                label: "Save",
                variant: "gray",
                onClick: () => { },
                icon: <SaveOutlinedIcon className="h-5 w-5" />,
            },
            {
                label: "Save & Create",
                variant: "gray",
                onClick: () => { },
                icon: <SaveWithPlusIcon />,
            },
            {
                label: "Cancel",
                variant: "secondary",
                onClick: () => window.history.back(),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        []
    );

    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Carrier
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.nombre || "Transportadora"}</div>
                </div>
            ),
            action: headerActions,
            status: {
                text: record?.configuracion?.estado,
                variant: record?.configuracion?.estado === "Active" ? "success" : "warning",
            },
        }),
        [headerActions]
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* columna izquierda */}
                <div className="lg:col-span-2 space-y-6">
                    {/* empresa */}
                    <Card
                        title="EMPRESA"
                        icon={TruckIcon}
                        // noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* empresa */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Empresas</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">
                                        {empresasOptions.find((o) => o.value === String(record.companyId || ""))?.label || "-"}
                                    </div>
                                ) : (
                                    <StyledReactSelect
                                        name="companyId"
                                        options={empresasOptions}
                                        value={empresasOptions.find((o) => o.value === String(record.companyId || "")) ?? null}
                                        onChange={(selected) => {
                                            const selectedOption = selected as { value: string; label: string } | null;
                                            const nextCompanyId = String(selectedOption?.value || "");
                                            setRecord((prev) => ({ ...prev, companyId: nextCompanyId }));
                                            onChange?.("companyId", nextCompanyId);
                                        }}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                    />
                                )}
                            </div>
                            {/* integ */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Integración</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.integrationId || "-"}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.integrationId || ""}
                                        onChange={handle("integrationId")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* complementor de integracion */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Complementos de integración</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.Complementos_integracion}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.Complementos_integracion}
                                        onChange={handle("Complementos_integracion")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>
                    {/** ecommerces */}
                    <Card
                        title="ECOMMERCES"
                        icon={StoreIcon}
                        // noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* id de cuenta de ecommerce */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Id cuenta de Ecommerce</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">
                                        {Array.isArray(record.idEcommerce) ? record.idEcommerce.join(", ") : record.idEcommerce}
                                    </div>
                                ) : (
                                    <StyledReactSelect
                                        isMulti
                                        name="idEcommerce"
                                        options={idEcommerceOptions}
                                        value={
                                            (Array.isArray(record.idEcommerce)
                                                ? record.idEcommerce
                                                : typeof record.idEcommerce === "string"
                                                    ? record.idEcommerce.split(",")
                                                    : []
                                            ).map((val: string) => ({
                                                label: val,
                                                value: val,
                                            }))
                                        }
                                        onChange={(selected) => {
                                            const values = (selected as any[]).map((s) => s.value);
                                            setRecord((prev) => ({ ...prev, idEcommerce: values }));
                                            onChange?.("idEcommerce", values);
                                        }}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
                {/* columna derecha */}
                <div className="space-y-6">
                    {/* usuario creador */}
                    <Card
                        title="USUARIO CREADOR"
                        icon={User2Icon}
                        // noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                            <div className="col-span-3">
                                <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                                    <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                        {record.creador?.nombre
                                            ?.split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-semibold text-blue-600">{record.creador?.nombre}</div>
                                        <div className="text-gray-500 truncate max-w-[200px]">{record.creador?.email}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-3 text-sm text-gray-500 text-right truncate">
                                {record.creador?.fechaCreacion}
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="USUARIO MODIFICADOR"
                        icon={User2Icon}
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                            <div className="col-span-3">
                                <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                        {(record.modificador?.nombre || "-")
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-semibold text-blue-600">{record.modificador?.nombre || "-"}</div>
                                        <div className="text-gray-500 truncate max-w-[200px]">{record.modificador?.email || "-"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-3 text-sm text-gray-500 text-right truncate">
                                {record.modificador?.fechaModificacion || "-"}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div >
    );
}
