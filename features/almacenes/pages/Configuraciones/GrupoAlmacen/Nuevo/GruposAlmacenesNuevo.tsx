// app/views/WarehouseGroup/NewWarehouseGroupPage.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  XCircleIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { BASE_WAREHOUSES, COMMERCE_SERVICE_LOCATIONS_SIMPLE } from "@/lib/http/endpoints";


import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
/* ---------------------------------------------- */
/*  Modelo y estado inicial                       */
/* ---------------------------------------------- */
interface WarehouseGroup {
  name: string;
  location: string;
  status: "Active" | "Inactive";
}

interface LocationOption {
  id: string;
  name: string;
  display: string;
}

const EMPTY_GROUP: WarehouseGroup = {
  name: "",
  location: "",
  status: "Active",
};

const LOCATIONS_URL = COMMERCE_SERVICE_LOCATIONS_SIMPLE;
const WAREHOUSE_GROUP_URL = `${BASE_WAREHOUSES}/warehouse-group`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
  "janis-api-key": "test-key",
  "janis-api-secret": "test-secret",
  "janis-client": "test-client",
});

type ApiLocation = {
  id?: string | number | null;
  name?: string | null;
  referenceId?: string | null;
};

type ApiLocationsResponse = {
  total?: number;
  items?: ApiLocation[];
};

/* ---------------------------------------------- */
/*  Pagina                                        */
/* ---------------------------------------------- */
export function NewGroup() {
  const router = useRouter();
  const [group, setGroup] = useState<WarehouseGroup>(EMPTY_GROUP);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadLocations = async () => {
      try {
        const response = await fetch(LOCATIONS_URL, {
          method: "GET",
          headers: JANIS_HEADERS,
        });
        if (!response.ok) return;

        const data = (await response.json()) as ApiLocationsResponse;
        const options = (Array.isArray(data.items) ? data.items : [])
          .map((item) => {
            const id = String(item?.id ?? "").trim();
            const name = String(item?.name ?? "").trim();
            return {
              id,
              name,
              display: id && name ? `${id} - ${name}` : name,
            };
          })
          .filter((item) => item.id && item.name);

        if (mounted) {
          setLocationOptions(options);
        }
      } catch {
        if (mounted) {
          setLocationOptions([]);
        }
      }
    };

    loadLocations();
    return () => {
      mounted = false;
    };
  }, []);

  const createWarehouseGroup = useCallback(
    async (resetAfterSave: boolean) => {
      const name = group.name.trim();
      const location = group.location.trim();

      if (!name) {
        alert("Debes ingresar el nombre del grupo.");
        return;
      }

      if (!location) {
        alert("Debes seleccionar una ubicación.");
        return;
      }

      try {
        setSaving(true);

        const response = await fetch(WAREHOUSE_GROUP_URL, {
          method: "POST",
          headers: {
            ...JANIS_HEADERS,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, location }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(text || `HTTP ${response.status}`);
        }

        if (resetAfterSave) {
          setGroup(EMPTY_GROUP);
        } else {
          router.push("/almacen/configuracion/grupos");
        }
      } catch (error: any) {
        alert(`No se pudo crear el grupo: ${error?.message || "Error desconocido"}`);
      } finally {
        setSaving(false);
      }
    },
    [group, router]
  );

  /*  Header dinmico (Apply  Save  Save & new  Cancel) */
  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "primary",
        onClick: () => createWarehouseGroup(false),
        icon: <CheckCircleIcon className="h-5 w-5" />,
        disabled: saving,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => createWarehouseGroup(false),
        icon: <SaveOutlined className="h-4 w-4" />,
        disabled: saving,
      },
      {
        label: "Guardar y crear",
        variant: "primary",
        onClick: () => createWarehouseGroup(true),
        icon: (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <SaveOutlined className="h-4 w-4 text-current" />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
              <FaPlus className="h-2.5 w-2.5 text-blue-500" />
            </div>
          </div>
        ),
        disabled: saving,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/almacen/configuracion/grupos"),
        icon: <XCircleIcon className="h-5 w-5" />,
        disabled: saving,
      },
    ],
    [createWarehouseGroup, router, saving]
  );

  usePageHeader(
    () => ({
      title: "WAREHOUSE GROUP  Nuevo",
      action: headerActions,
    }),
    [headerActions]
  );

  /* helpers */
  const handle =
    <K extends keyof WarehouseGroup>(field: K) =>
      (value: WarehouseGroup[K]) =>
        setGroup((g) => ({ ...g, [field]: value }));

  /* ------------------------------------------- */
  /*  UI                                         */
  /* ------------------------------------------- */
  return (
    <div className="flex min-h-screen flex-col bg-[#eff0f8]">
      <div className="flex-1 m-6">
        <div className="space-y-6">
          <Card
            title="WAREHOUSE GROUP"
            icon={<BuildingOffice2Icon className="h-5 w-5 text-gray-500" />}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4">
              {/* Name */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Name</span>
                <div className="w-1/2">
                  <input
                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                    value={group.name}
                    onChange={(e) => handle("name")(e.target.value)}
                    placeholder="Nombre del grupo"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Location</span>
                <div className="w-1/2">
                  <CollapsibleField
                    inline
                    label=""
                    value={locationOptions.find((o) => o.id === group.location)?.display || ""}
                    options={locationOptions.map((o) => o.display)}
                    onChange={(value) => {
                      const selected = locationOptions.find((o) => o.display === String(value));
                      handle("location")(selected?.id || "");
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
