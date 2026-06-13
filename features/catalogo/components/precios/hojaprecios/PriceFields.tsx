// app/views/Pricing/PriceSheet/components/PriceFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { StoreIcon } from "lucide-react";

export interface PriceSheet {
  id?: string;
  name: string;
  reference: string;
  salesChannels: string[];
  incrementThreshold: string;
  decrementThreshold: string;
}

interface Props {
  record: PriceSheet;
  readOnly?: boolean;
  onChange?: (field: keyof PriceSheet, value: any) => void;
}

export const PriceSheetFields: React.FC<Props> = ({
  record,
  readOnly = true,
  onChange,
}) => {
  const handleString =
    (field: keyof PriceSheet) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange?.(field, e.target.value);
      };

  const mainFields: Array<{
    label: string;
    field: "name" | "reference";
    type: "text";
  }> = [
      { label: "Name", field: "name", type: "text" },
      { label: "Reference", field: "reference", type: "text" },
    ];

  const thresholdFields: Array<{
    label: string;
    field: "incrementThreshold" | "decrementThreshold";
  }> = [
      { label: "Increment threshold", field: "incrementThreshold" },
      { label: "Decrement threshold", field: "decrementThreshold" },
    ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="MAIN"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="space-y-6">
              {mainFields.map(({ label, field, type }) => (
                <div key={field} className="flex items-center">
                  <span className="w-1/6 text-sm text-gray-600">{label}</span>
                  <div className="w-5/6">
                    {readOnly ? (
                      <span className="text-sm text-gray-900">
                        {(record[field] as string) || "—"}
                      </span>
                    ) : (
                      <input
                        type={type}
                        value={(record[field] as string) ?? ""}
                        onChange={handleString(field)}
                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Sales channels */}
              <div className="flex items-center">
                <span className="w-1/6 text-sm text-gray-600">
                  Sales channels
                </span>
                <StoreIcon className="w-5 h-5 mr-2" />
                <div className="w-5/6">
                  {readOnly ? (
                    <span className="text-sm text-gray-900">
                      {record.salesChannels?.length
                        ? record.salesChannels.join(", ")
                        : "—"}
                    </span>
                  ) : (
                    <input
                      type="text"
                      placeholder="(vacío)"
                      value={record.salesChannels?.join(", ") ?? ""}
                      onChange={(e) =>
                        onChange?.(
                          "salesChannels",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="THRESHOLDS"
            icon={AdjustmentsHorizontalIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6 mt-6"
          >
            <div className="space-y-6">
              {thresholdFields.map(({ label, field }) => (
                <div key={field} className="flex items-center">
                  <span className="w-1/6 text-sm text-gray-600">{label}</span>
                  <div className="w-5/6">
                    {readOnly ? (
                      <span className="text-sm text-gray-900">
                        {(record[field] as string) || "—"}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={(record[field] as string) ?? ""}
                        onChange={handleString(field)}
                        placeholder="%"
                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
