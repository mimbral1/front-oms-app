"use client";

import { ArrowDownOnSquareIcon, CheckCircleIcon, ClipboardDocumentListIcon, MapPinIcon, PhotoIcon, UserIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Input } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import Select from "@/components/ui/select";
import { ActiveStatusToggle } from "@/components/ui/togle";
import { Avatar } from "@/components/ui/user-avatar/initials";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { DELIVERY_DRIVER_ENDPOINT, WAREHOUSE_API } from "@/lib/http/endpoints";
import { defaultAvatar, type DriverRow as Driver } from "../ConductoresView";

type DriverDetail = Driver & {
  totalAcces?: boolean;
  imageProfile?: string;
  userModified: {
    name: string;
    email: string;
    avatar?: string;
  };
  dateModified?: string;
};

type ApiDriverDetailItem = {
  id?: string;
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  imageProfile?: string | null;
  documentNumber?: string | null;
  employeeId?: string | null;
  dateCreated?: string | null;
  status?: string | null;
  userCreated?: string | null;
  userModified?: string | null;
  activeWarehouseId?: string | null;
  dateModified?: string | null;
};

type ApiWarehouse = {
  id?: string;
  referenceId?: string | null;
  name?: string | null;
};

export function UserResumenView() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const router = useRouter();
  const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();
  const [user, setUser] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [warehouseOptions, setWarehouseOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    if (!id || !token) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadDriverById = async () => {
      setLoading(true);
      try {
        const [item, warehousesRes] = await Promise.all([
          fetchWithAuthDelivery<ApiDriverDetailItem>(`driver/${id}`, {
            method: "GET",
          }),
          fetchWithAuthDelivery<ApiWarehouse[]>(
            `${WAREHOUSE_API}?sortBy=referenceId&sortDirection=asc`
          ),
        ]);

        const statusRaw = String(item?.status || "").trim().toLowerCase();
        const mapped: DriverDetail | null = item
          ? {
            refId: String(item.id ?? ""),
            name: String(item.firstname ?? "-"),
            firstName: String(item.firstname ?? "-"),
            lastName: String(item.lastname ?? "-"),
            email: String(item.email ?? "-"),
            imageProfile: String(item.imageProfile ?? ""),
            documento: String(item.documentNumber ?? ""),
            idFuncionario: String(item.employeeId ?? ""),
            userCreated: {
              name: String(item.userCreated ?? "-"),
              email: "-",
              avatar: defaultAvatar,
            },
            userModified: {
              name: String(item.userModified ?? "-"),
              email: "-",
              avatar: defaultAvatar,
            },
            dateCreated: String(item.dateCreated ?? ""),
            dateModified: String(item.dateModified ?? ""),
            status: statusRaw === "inactive" ? "Inactive" : "Active",
            activeWarehouse: String(item.activeWarehouseId ?? ""),
            totalAcces: true,
          }
          : null;

        const mappedWarehouses = (warehousesRes ?? [])
          .filter((warehouse) => !!warehouse?.id)
          .map((warehouse) => {
            const value = String(warehouse.id);
            const referenceId = String(warehouse.referenceId ?? "").trim();
            const name = String(warehouse.name ?? "Sin nombre").trim();

            const nameStartsWithReference = referenceId
              ? new RegExp(`^${referenceId}(\\b|\\s|[-_])`, "i").test(name)
              : false;

            return {
              value,
              label: !referenceId || nameStartsWithReference ? name : `${referenceId} - ${name}`,
            };
          });

        if (mounted) {
          setUser(mapped);
          setWarehouseOptions(mappedWarehouses);
        }
      } catch (error) {
        console.error("Error cargando conductor:", error);
        if (mounted) {
          setUser(null);
          setWarehouseOptions([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDriverById();

    return () => {
      mounted = false;
    };
  }, [id, fetchWithAuthDelivery, token]);

  const update = <K extends keyof DriverDetail>(key: K, value: DriverDetail[K]) => {
    setUser((current) => (current ? { ...current, [key]: value } : current));
  };

  const saveDriver = useCallback(async () => {
    if (!id || !user) return;

    setSubmitError(null);

    const payload = {
      activeWarehouseId: String(user.activeWarehouse ?? "").trim(),
      status: user.status === "Active" ? "active" : "inactive",
    };

    if (!payload.activeWarehouseId) {
      setSubmitError("Selecciona un warehouse activo antes de guardar.");
      return;
    }

    setIsSaving(true);
    try {
      await fetchWithAuthDelivery(`${DELIVERY_DRIVER_ENDPOINT}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      router.push("/delivery/flota/conductores");
    } catch (error) {
      console.error("Error actualizando conductor:", error);
      setSubmitError(error instanceof Error ? error.message : "No se pudo actualizar el conductor");
    } finally {
      setIsSaving(false);
    }
  }, [fetchWithAuthDelivery, id, router, user]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        disabled: true,
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        disabled: isSaving,
        onClick: () => {
          void saveDriver();
        },
        icon: <ArrowDownOnSquareIcon className="h-5 w-5" />,
      },
      {
        label: "Cancelar",
        variant: "secondary",
        onClick: () => router.push("/delivery/flota/conductores"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [isSaving, router, saveDriver]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Conductor
          </div>
          <div className="text-2xl font-semibold text-gray-900">{`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "-"}</div>
        </div>
      ),
      description: id ? `Conductor #${id}` : "Conductor",
      action: headerActions,
      status: user
        ? {
          text: user.status,
          variant: user.status === "Active" ? "success" : "warning",
        }
        : undefined,
    } as PageHeaderProps),
    [id, user?.firstName, user?.lastName, user?.status, headerActions]
  );

  if (loading) return <p className="p-4">Cargando conductor...</p>;
  if (!user) return <p className="p-4 text-red-500">Registro no encontrado</p>;

  return (
    <div className="p-6 space-y-6 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card
          title="DETALLES"
          icon={ClipboardDocumentListIcon}
          hasTitleDivider
          noDefaultStyles
          className="bg-white rounded-xl p-6"
        >
          <div className="space-y-6">
            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <FieldRows label="Nombre">
              <Input value={user.firstName} onChange={(e) => update("firstName", e.target.value)} fullWidth />
            </FieldRows>

            <FieldRows label="Apellido">
              <Input value={user.lastName} onChange={(e) => update("lastName", e.target.value)} fullWidth />
            </FieldRows>

            <FieldRows label="Email">
              <Input type="email" value={user.email} onChange={(e) => update("email", e.target.value)} fullWidth />
            </FieldRows>

            <FieldRows label="Rut">
              <Input
                value={user.documento ?? ""}
                onChange={(e) => update("documento", e.target.value)}
                fullWidth
              />
            </FieldRows>

            <FieldRows label="ID Funcionario">
              <Input
                value={user.idFuncionario ?? ""}
                onChange={(e) => update("idFuncionario", e.target.value)}
                fullWidth
              />
            </FieldRows>

            <FieldRows label="Warehouse activo">
              <Select
                value={user.activeWarehouse ?? ""}
                onValueChange={(value) => update("activeWarehouse", value)}
                options={warehouseOptions}
                placeholder="Selecciona una bodega"
              />
            </FieldRows>
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            title="AVATAR"
            icon={PhotoIcon}
            hasTitleDivider
            noDefaultStyles
            className="bg-white rounded-xl p-6"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                {user.imageProfile ? (
                  <img
                    src={user.imageProfile}
                    alt="Imagen de perfil"
                    className="h-20 w-20 object-cover"
                  />
                ) : (
                  <PhotoIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>
            </div>
          </Card>

          <Card
            title="OTROS"
            icon={MapPinIcon}
            hasTitleDivider
            noDefaultStyles
            className="bg-white rounded-xl p-6"
          >
            <div className="space-y-6">
              <FieldRows label="Estado">
                <ActiveStatusToggle
                  active={user.status === "Active"}
                  onActiveChange={(active) => update("status", active ? "Active" : "Inactive")}
                  showStateLabel={false}
                />
              </FieldRows>
            </div>
          </Card>

          <Card
            title="USUARIO CREADOR"
            icon={UserIcon}
            hasTitleDivider
            noDefaultStyles
            className="bg-white rounded-xl p-6"
          >
            <div className="flex items-center gap-3">
              <Avatar name={user.userCreated.avatar ?? user.userCreated.name} />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-gray-900">{user.userCreated.name}</span>
                <span className="text-xs text-gray-500">{user.userCreated.email}</span>
              </div>
              <span className="text-xs text-gray-500">{user.dateCreated || "-"}</span>
            </div>
          </Card>

          <Card
            title="USUARIO MODIFICADOR"
            icon={UserIcon}
            hasTitleDivider
            noDefaultStyles
            className="bg-white rounded-xl p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={user.userModified.avatar ?? user.userModified.name} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{user.userModified.name}</span>
                  <span className="text-xs text-gray-500">{user.userModified.email}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500">{user.dateModified || "-"}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
