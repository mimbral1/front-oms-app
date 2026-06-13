/* ------------------------------------------------------------------
    app/customers/new/page.tsx · CustomerCreateView
-------------------------------------------------------------------*/
"use client";

import {
  ArrowDownOnSquareIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { Action } from "@/components/layout/page-header";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import Select from "@/components/ui/select";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { ID_SERVICE_USERS_API, WAREHOUSE_API } from "@/lib/http/endpoints";
import { defaultAvatar, DriverRow } from "../ConductoresView";

type DriverCreateMode = "with-user" | "without-user";

type DriverCreateDraft = DriverRow & {
  employeeId?: string;
};

const initialState: DriverRow = {
  refId: "",
  name: "",
  firstName: "",
  lastName: "",
  email: "",
  idFuncionario: "",
  documento: "",
  userCreated: {
    name: "",
    email: "",
    avatar: defaultAvatar,
  },
  user: "",
  dateCreated: "",
  status: "Active",
  activeWarehouse: "",
};

export function NewDriverView() {
  const router = useRouter();
  const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();
  const [draft, setDraft] = useState<DriverCreateDraft>(initialState);
  const [createMode, setCreateMode] = useState<DriverCreateMode>("with-user");
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [usersOptions, setUsersOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [usersById, setUsersById] = useState<
    Record<
      string,
      {
        firstName: string;
        lastName: string;
        email: string;
        documentNumber: string;
        status: "active" | "inactive";
      }
    >
  >({});

  useEffect(() => {
    let mounted = true;

    type ApiUser = {
      ID?: number | string;
      DOCUMENT?: string | null;
      FIRSTNAME?: string | null;
      LASTNAME?: string | null;
      EMAIL?: string | null;
      ACTIVE?: boolean | null;
    };

    type ApiUsersResponse = {
      data?: ApiUser[];
    };

    type ApiWarehouse = {
      id?: string;
      referenceId?: string | null;
      name?: string | null;
    };

    const fetchLookups = async () => {
      setIsLoadingLookups(true);
      try {
        const [usersRes, warehousesRes] = await Promise.all([
          fetchWithAuthDelivery<ApiUsersResponse>(ID_SERVICE_USERS_API),
          fetchWithAuthDelivery<ApiWarehouse[]>(`${WAREHOUSE_API}?sortBy=referenceId&sortDirection=asc`),
        ]);

        if (!mounted) return;

        const nextUsers = (usersRes?.data ?? [])
          .filter(
            (user) =>
              user?.ID !== undefined &&
              user?.ID !== null &&
              user?.ACTIVE === true
          )
          .map((user) => {
            const id = String(user.ID);
            const fullName = `${user.FIRSTNAME ?? ""} ${user.LASTNAME ?? ""}`.trim();
            const fallback = user.EMAIL?.trim() || id;

            return {
              value: id,
              label: fullName ? `${fullName} - ${user.EMAIL ?? id}` : fallback,
            };
          });

        const nextUsersById = (usersRes?.data ?? []).reduce<
          Record<
            string,
            {
              firstName: string;
              lastName: string;
              email: string;
              documentNumber: string;
              status: "active" | "inactive";
            }
          >
        >((accumulator, user) => {
          if (user?.ID === undefined || user?.ID === null || user?.ACTIVE !== true) {
            return accumulator;
          }

          const id = String(user.ID);
          accumulator[id] = {
            firstName: String(user.FIRSTNAME ?? "").trim(),
            lastName: String(user.LASTNAME ?? "").trim(),
            email: String(user.EMAIL ?? "").trim(),
            documentNumber: String(user.DOCUMENT ?? "").trim(),
            status: user.ACTIVE ? "active" : "inactive",
          };

          return accumulator;
        }, {});

        const nextWarehouses = (warehousesRes ?? [])
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

        setUsersOptions(nextUsers);
        setUsersById(nextUsersById);
        setWarehouseOptions(nextWarehouses);
      } catch (error) {
        if (!mounted) return;
        console.error("Error cargando usuarios/bodegas:", error);
        setSubmitError(
          error instanceof Error ? error.message : "No se pudieron cargar usuarios y bodegas"
        );
      } finally {
        if (mounted) {
          setIsLoadingLookups(false);
        }
      }
    };

    void fetchLookups();

    return () => {
      mounted = false;
    };
  }, [fetchWithAuthDelivery]);

  const handleModeChange = useCallback((nextMode: DriverCreateMode) => {
    setCreateMode(nextMode);
    setSubmitError(null);
    setDraft((current) => ({
      ...current,
      user: nextMode === "with-user" ? current.user : "",
      firstName: nextMode === "without-user" ? current.firstName : "",
      lastName: nextMode === "without-user" ? current.lastName : "",
      email: nextMode === "without-user" ? current.email : "",
      documento: nextMode === "without-user" ? current.documento : "",
      idFuncionario: nextMode === "without-user" ? current.idFuncionario : "",
    }));
  }, []);

  const update = <K extends keyof DriverCreateDraft>(field: K, value: DriverCreateDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const selectedUser = useMemo(() => {
    const userId = String(draft.user ?? "").trim();
    return userId ? usersById[userId] : undefined;
  }, [draft.user, usersById]);

  const saveDriver = useCallback(async () => {
    setSubmitError(null);

    const activeWarehouseId = String(draft.activeWarehouse ?? "").trim();

    const payload =
      createMode === "with-user"
        ? {
          userId: String(draft.user ?? "").trim(),
          userStatus: selectedUser?.status ?? "active",
          firstname: selectedUser?.firstName ?? "",
          lastname: selectedUser?.lastName ?? "",
          email: selectedUser?.email ?? "",
          documentNumber: selectedUser?.documentNumber ?? "",
          employeeId: String(draft.user ?? "").trim(),
          activeWarehouseId,
        }
        : {
          firstname: String(draft.firstName ?? "").trim(),
          lastname: String(draft.lastName ?? "").trim(),
          email: String(draft.email ?? "").trim(),
          documentNumber: String(draft.documento ?? "").trim(),
          employeeId: String(draft.idFuncionario ?? draft.employeeId ?? "").trim(),
          activeWarehouseId,
        };

    if (createMode === "with-user") {
      if (!payload.userId || !payload.activeWarehouseId || !selectedUser) {
        setSubmitError("Completa Usuario y Warehouse con un usuario válido para guardar.");
        return;
      }
    } else {
      if (
        !payload.firstname ||
        !payload.lastname ||
        !payload.email ||
        !payload.documentNumber ||
        !payload.employeeId ||
        !payload.activeWarehouseId
      ) {
        setSubmitError(
          "Completa Nombre, Apellido, Email, Documento, ID Funcionario y Warehouse para guardar."
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      await fetchWithAuthDelivery("driver", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push("/delivery/flota/conductores");
    } catch (error) {
      console.error("Error creando conductor:", error);
      setSubmitError(error instanceof Error ? error.message : "No se pudo crear el conductor");
    } finally {
      setIsSaving(false);
    }
  }, [
    createMode,
    draft.activeWarehouse,
    draft.documento,
    draft.email,
    draft.firstName,
    draft.idFuncionario,
    draft.lastName,
    draft.user,
    draft.employeeId,
    fetchWithAuthDelivery,
    router,
    selectedUser,
  ]);

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
    [router, isSaving, saveDriver]
  );

  usePageHeader(
    () => ({
      title: "Nuevo",
      description: "CONDUCTOR",
      action: headerActions,
      tabs: undefined,
    }),
    [headerActions]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-8 bg-white">
        <Card
          title="DETALLES"
          icon={ClipboardDocumentListIcon}
          hasTitleDivider
          noDefaultStyles
          className="bg-white rounded-xl p-6"
        >
          <div className="space-y-10">
            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <FieldRows label="Modo">
              <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange("with-user")}
                    disabled={isSaving}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${createMode === "with-user"
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-200"
                      : "text-gray-600 hover:bg-white"
                      } ${isSaving ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <UserCircleIcon className="h-4 w-4" />
                    Con usuario
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("without-user")}
                    disabled={isSaving}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${createMode === "without-user"
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-200"
                      : "text-gray-600 hover:bg-white"
                      } ${isSaving ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    Sin usuario
                  </button>
                </div>
              </div>
            </FieldRows>

            {createMode === "with-user" ? (
              <FieldRows label="Usuario">
                <Select
                  value={draft.user || ""}
                  onValueChange={(value) => update("user", value as DriverRow["user"])}
                  options={usersOptions}
                  placeholder={isLoadingLookups ? "Cargando usuarios..." : "Selecciona un usuario"}
                  disabled={isLoadingLookups}
                />
              </FieldRows>
            ) : (
              <>
                <FieldRows label="Nombre">
                  <Input
                    value={draft.firstName || ""}
                    onChange={(event) => update("firstName", event.target.value)}
                    fullWidth
                  />
                </FieldRows>

                <FieldRows label="Apellido">
                  <Input
                    value={draft.lastName || ""}
                    onChange={(event) => update("lastName", event.target.value)}
                    fullWidth
                  />
                </FieldRows>

                <FieldRows label="Email">
                  <Input
                    value={draft.email || ""}
                    onChange={(event) => update("email", event.target.value)}
                    fullWidth
                  />
                </FieldRows>

                <FieldRows label="Documento">
                  <Input
                    value={draft.documento || ""}
                    onChange={(event) => update("documento", event.target.value)}
                    fullWidth
                  />
                </FieldRows>

                <FieldRows label="ID Funcionario">
                  <Input
                    value={draft.idFuncionario || ""}
                    onChange={(event) => update("idFuncionario", event.target.value)}
                    fullWidth
                  />
                </FieldRows>
              </>
            )}

            <FieldRows label="Warehouse">
              <Select
                value={draft.activeWarehouse || ""}
                onValueChange={(value) =>
                  update("activeWarehouse", value as DriverRow["activeWarehouse"])
                }
                options={warehouseOptions}
                placeholder={isLoadingLookups ? "Cargando bodegas..." : "Selecciona una bodega"}
                disabled={isLoadingLookups}
              />
            </FieldRows>
          </div>
        </Card>
      </div>
    </div>
  );
}
