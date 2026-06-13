import React from "react";
import { TagIcon } from "@heroicons/react/24/outline";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

interface Props {
  sku: string;
  quantity: string;
  batch?: string;
  elabDate?: string;
  expDate?: string;
  readOnly?: boolean;
  onChange?: {
    sku?: (v: string) => void;
    quantity?: (v: string) => void;
    batch?: (v: string) => void;
    elabDate?: (v: string) => void;
    expDate?: (v: string) => void;
  };
}

export const OrderItemsSection: React.FC<Props> = ({
  sku,
  quantity,
  batch,
  elabDate,
  expDate,
  readOnly = true,
  onChange = {},
}) => (
  <Card title="iTEMS" icon={TagIcon} hasTitleDivider>
    <div className="space-y-4">
      {/* SKU + cantidad */}
      <div className="flex items-center border-b border-gray-300 pb-2">
        <span className="w-20 text-sm text-gray-600">SKU</span>
        <CollapsibleField
          label=""
          value={sku}
          options={readOnly ? [] : [""]}
          onChange={onChange.sku || (() => {})}
        />
        <span className="mx-6 text-sm text-gray-600"># Cantidad</span>
        {readOnly ? (
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
            {quantity}
          </span>
        ) : (
          <input
            type="number"
            className="w-20 text-sm"
            value={quantity}
            onChange={(e) => onChange.quantity?.(e.target.value)}
          />
        )}
      </div>
      {/* batch / fe} */}
      <div className="grid grid-cols-3 gap-6 border-b border-gray-300 pb-2">
        <div className="flex items-center">
          <TagIcon className="h-5 w-5 text-gray-400 mr-2" />
          {readOnly ? (
            <span className="text-sm">{batch}</span>
          ) : (
            <input
              className="flex-1 text-sm"
              value={batch}
              onChange={(e) => onChange.batch?.(e.target.value)}
            />
          )}
        </div>
        <CollapsibleField
          label=""
          value={elabDate || ""}
          options={readOnly ? [] : [""]}
          onChange={onChange.elabDate || (() => {})}
        />
        <CollapsibleField
          label=""
          value={expDate || ""}
          options={readOnly ? [] : [""]}
          onChange={onChange.expDate || (() => {})}
        />
      </div>
    </div>
  </Card>
);
