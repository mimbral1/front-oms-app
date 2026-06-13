// src/components/StatusPill.tsx
import React from "react";
import {
  statusPillBase,
  STATUS_CLASSES,
  statusPillFallback,
} from "./status-pill.styles";

interface StatusPillProps {
  status: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const extra = STATUS_CLASSES[status] ?? statusPillFallback;
  return (
    <span
      className={`
        ${statusPillBase}
        ${extra}
      `}
    >
      {status}
    </span>
  );
};
