"use client";

import { createContext, useContext } from "react";

export interface EcommercePlatformConfig {
    name: string;
    basePath: string;
    channelKeywords: string[];
    exportPrefix: string;
}

export const EcommercePlatformContext =
    createContext<EcommercePlatformConfig | null>(null);

export function useEcommercePlatform(): EcommercePlatformConfig {
    const ctx = useContext(EcommercePlatformContext);
    if (!ctx)
        throw new Error(
            "useEcommercePlatform must be used within an EcommercePlatformProvider"
        );
    return ctx;
}
