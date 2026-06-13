// features/picking/components/cells/UserAvatarCell.tsx
// Celda reutilizable que muestra avatar + nombre de usuario.

import React from "react";
import { Avatar } from "@/components/ui/user-avatar";

export interface UserAvatarCellProps {
    username: string;
    avatar?: string;
    fallback?: string;
}

/**
 * Muestra avatar (img o iniciales) + nombre.
 * Si username es "—" o vacío, muestra el fallback.
 */
export function UserAvatarCell({
    username,
    avatar,
    fallback = "—",
}: UserAvatarCellProps) {
    if (!username || username === "—") {
        return <span className="text-gray-400">{fallback}</span>;
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            <Avatar
                name={username}
                src={avatar}
                className="h-7 w-7 bg-gray-200 text-xs text-gray-600"
            />
            <span>{username}</span>
        </div>
    );
}
