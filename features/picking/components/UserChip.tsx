"use client";

import { FC } from "react";

interface UserChipProps {
    name?: string;
    email?: string;
    avatarColor?: string;
}

export const UserChip: FC<UserChipProps> = ({
    name,
    email,
    avatarColor = "bg-blue-500",
}) => {
    if (!name && !email) return <div className="h-10" />;
    const cleanName = (name ?? "").trim();
    const nameParts = cleanName.split(/\s+/).filter(Boolean);

    const initials = nameParts.length === 0
        ? (email?.trim?.()?.[0] ?? "U").toUpperCase()
        : nameParts.length === 1
            ? nameParts[0].slice(0, 2).toUpperCase()
            : `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();

    return (
        <div className="inline-flex h-10 max-w-[240px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2">
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor}`}
            >
                {initials}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
                <span className="truncate text-sm font-medium">{name ?? "—"}</span>
                <span className="truncate text-xs text-gray-500">{email ?? "—"}</span>
            </div>
        </div>
    );
};
