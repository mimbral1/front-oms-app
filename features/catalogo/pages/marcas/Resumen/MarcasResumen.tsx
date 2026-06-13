"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import {
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus, FaClipboardList, FaPen } from "react-icons/fa";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useFetchWithAuth } from "@/lib/http/client";
import { fmtDateTime } from "@/lib/format/date";
import { useAuth } from "@/app/context/auth/AuthContext";

/* -------------------------  Datos y tipos  ------------------------- */

interface Brand {
  id: string;
  name: string;
  reference: string;
  accounts: string[]; // Multiples cuentas, se muestran como chips
  slug: string;
  status: "Active" | "Inactive";
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  creatorUser: string;
  createdAt: string; // ISOo string legible
}

interface BrandItemAPI {
  Id?: string;
  Name?: string;
  Code?: string;
  Reference?: string;
  DateCreated?: string | null;
  UserCreated?: string | null;
  Status?: string | null;
}

interface BrandsAPIResponse {
  data: BrandItemAPI[];
}

const formatDateTimeSafe = fmtDateTime;

function mapAPIToBrand(item: BrandItemAPI): Brand {
  const statusRaw = item.Status ?? "Active";
  const status: Brand["status"] = statusRaw === "Inactive" || statusRaw === "N" ? "Inactive" : "Active";

  return {
    id: item.Id ?? item.Code ?? item.Reference ?? crypto.randomUUID(),
    name: item.Name ?? "",
    reference: String(item.Reference ?? item.Code ?? ""),
    accounts: [],
    slug: (item.Name ?? "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, ""),
    status,
    seoTitle: "",
    seoKeywords: "",
    seoDescription: "",
    creatorUser: item.UserCreated ?? "-",
    createdAt: formatDateTimeSafe(item.DateCreated),
  };
}

const mockBrands: Brand[] = [
  {
    id: "1",
    name: "ZUUM PREMIUM",
    reference: "4899",
    accounts: ["LaTorre"],
    slug: "zuum-premium",
    status: "Active",
    seoTitle: "",
    seoKeywords: "",
    seoDescription: "",
    creatorUser: "CreatorUser",
    createdAt: "2021-08-1711:53:16",
  },
];

/* -------------------------  cono combinado  ------------------------- */
const TypedFaPlus = FaPlus as unknown as React.FC<
  React.SVGProps<SVGSVGElement>
>;
const SaveWithPlusIcon = () => (
  <div className="relative flex h-5 w-5 items-center justify-center">
    <SaveOutlined className="h-4 w-4 text-current" />
    <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
      <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
    </div>
  </div>
);

/* -------------------------  Pgina  ------------------------- */

export function BrandResumenPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { fetchWithAuth } = useFetchWithAuth();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrand = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const url = `catalog/getmarca?code=${encodeURIComponent(String(id))}&page=1&pageSize=1`;
      const resp = await fetchWithAuth<BrandsAPIResponse>(url);
      const item = resp?.data?.[0];
      if (item) {
        setBrand(mapAPIToBrand(item));
      } else {
        setError("Marca no encontrada");
      }
    } catch (err: any) {
      setError(err?.message || "Error al cargar marca");
    } finally {
      setLoading(false);
    }
  }, [token, id, fetchWithAuth]);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  /* Estado editable */
  const [status, setStatus] = useState<Brand["status"]>("Active");

  useEffect(() => {
    if (brand) setStatus(brand.status);
  }, [brand]);

  /* Opciones para selects */
  const statusOptions: Brand["status"][] = ["Active", "Inactive"];

  /* Acciones header */
  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Apply",
        variant: "primary",
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Save",
        variant: "success",
        onClick: () => { },
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Save & Create",
        variant: "primary",
        onClick: () => { },
        icon: <SaveWithPlusIcon />,
      },
      {
        label: "Cancel",
        variant: "secondary",
        onClick: () => router.push("/catalogo/marcas"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    []
  );

  /* Badge de estado */
  const statusVariant =
    status === "Active"
      ? "success"
      : status === "Inactive"
        ? "warning"
        : "info";

  usePageHeader(
    () => ({
      title: brand?.name?.toUpperCase() ?? "Cargando...",
      action: headerActions,
      status: {
        text: brand?.status ?? "-",
        variant: brand?.status === "Active" ? "success" : "warning",
      },
    }),
    [brand?.name, brand?.status, headerActions]
  );

  /* Render */
  if (loading) {
    return (
      <div className="flex-1 bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="flex-1 bg-white p-6">
        <div className="text-red-600 text-sm">{error || "Marca no encontrada"}</div>
      </div>
    );
  }
  return (
    <>
      <div className="flex-1 bg-white p-6 mb-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna izquierda (2/3) */}
          <div className="lg:col-span-2 space-y-1">
            {/* --------------- DETAIL --------------- */}
            <Card
              title="DETAIL"
              icon={FaClipboardList}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="space-y-10">
                {/* Name */}
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium text-gray-900">
                    {brand.name}
                  </span>
                </div>

                {/* Reference */}
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-600">Reference</span>
                  <span className="text-sm font-medium text-gray-900">
                    {brand.reference}
                  </span>
                </div>

                {/* Slug */}
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-600">Slug</span>
                  <span className="text-sm font-medium text-gray-900">
                    {brand.slug}
                  </span>
                </div>

                {/* Status (select) */}
                <CollapsibleField
                  label="Status"
                  value={status}
                  options={statusOptions}
                  onChange={(val) => setStatus(val as Brand["status"])}
                />
              </div>
            </Card>

            {/* --------------- SEO --------------- */}
            <Card
              title="SEO"
              icon={GlobeAltIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="space-y-10">
                <CollapsibleField
                  label="Title"
                  value={brand.seoTitle || ""}
                  options={[]}
                  onChange={(val) => console.log("SEO title:", val)}
                />
                <CollapsibleField
                  label="Keywords"
                  value={brand.seoKeywords || ""}
                  options={[]}
                  onChange={(val) => console.log("SEO keywords:", val)}
                />
                <CollapsibleField
                  label="Description"
                  value={brand.seoDescription || ""}
                  options={[]}
                  onChange={(val) => console.log("SEO description:", val)}
                />
              </div>
            </Card>
          </div>

          {/* Columna derecha (1/3) */}
          <div className="space-y-1">
            {/* CREATOR USER */}
            <Card
              title="CREATOR USER"
              icon={FaPen}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col space-y-4 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>User</span>
                  <span className="font-medium">{brand.creatorUser}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created at</span>
                  <span className="font-medium">{brand.createdAt}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
