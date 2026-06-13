import React from "react";
import {
  PencilIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Card from "@/components/ui/card/Card";

interface Props {
  created: { username: string; email: string; date: string };
  modified?: { username: string; email: string; date: string };
  readOnly?: boolean;
}
export const OrderMetaSection: React.FC<Props> = ({
  created,
  modified,
  readOnly = true,
}) => (
  <>
    <Card title="CREACIÓN" icon={UserIcon} hasTitleDivider>
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Usuario</span>
          <span>{created.username}</span>
        </div>
        <div className="flex justify-between">
          <span>Email</span>
          <span>{created.email}</span>
        </div>
        <div className="flex justify-between">
          <span>Fecha</span>
          <span>{created.date}</span>
        </div>
      </div>
    </Card>
    {!readOnly && !modified && null}
    {modified && (
      <Card title="ÚLTIMA MODIFICACIÓN" icon={PencilIcon} hasTitleDivider>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Usuario</span>
            <span>{modified.username}</span>
          </div>
          <div className="flex justify-between">
            <span>Email</span>
            <span>{modified.email}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha</span>
            <span>{modified.date}</span>
          </div>
        </div>
      </Card>
    )}
  </>
);
