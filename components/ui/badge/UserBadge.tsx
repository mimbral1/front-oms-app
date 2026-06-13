"use client";

import React from "react";
import { userBadgeCircle, userBadgeName } from "./badge.styles";
import { getUserInitials } from "@/components/ui/user-avatar";

interface UserBadgeProps {
  name: string;
  open: boolean;
  avatarUrl?: string | null;
}

export default function UserBadge({ name, open, avatarUrl }: UserBadgeProps) {
  const initials = getUserInitials(name);

  return (
    <div
      className={`flex items-center justify-center ${open ? "justify-start" : ""
        } transition-all duration-200 w-full`}
    >
      {/* círculo */}
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className={userBadgeCircle}>
          {initials}
        </div>
      )}

      {/* nombre completo (solo cuando open) */}
      {open && (
        <span className={userBadgeName}>
          {name}
        </span>
      )}
    </div>
  );
}
