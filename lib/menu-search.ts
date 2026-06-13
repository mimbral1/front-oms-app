// lib\menu-search.ts

import type { MenuItem, SubMenuItem } from "@/lib/menu-items";

export interface SearchItem {
    id: string;
    label: string;
    route: string;
    icon?: JSX.Element;
}

export function flattenMenuForSearch(
    items: MenuItem[],
    parentLabel = ""
): SearchItem[] {
    const results: SearchItem[] = [];

    items.forEach((item, idx) => {
        const baseLabel = parentLabel
            ? `${parentLabel} > ${item.text}`
            : item.text;

        if (item.route) {
            results.push({
                id: `${baseLabel}::${item.route}::${idx}`,
                label: baseLabel,
                route: item.route,
                icon: item.icon,
            });
        }

        item.subSidebarItems?.forEach((sub, subIdx) => {
            results.push(
                ...flattenSubItems(sub, baseLabel, item.icon, `${idx}-${subIdx}`)
            );
        });
    });

    return results;
}

function flattenSubItems(
    item: SubMenuItem,
    parentLabel: string,
    icon?: JSX.Element,
    path = ""
): SearchItem[] {
    const label = `${parentLabel} > ${item.text}`;
    const acc: SearchItem[] = [];

    if (item.route) {
        acc.push({
            id: `${label}::${item.route}::${path}`,
            label,
            route: item.route,
            icon,
        });
    }

    item.subItems?.forEach((child, i) => {
        acc.push(
            ...flattenSubItems(
                child,
                label,
                icon,
                `${path}-${i}`
            )
        );
    });

    return acc;
}
