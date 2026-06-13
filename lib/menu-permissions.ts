// lib\menu-permissions.ts

import { MenuItem, SubMenuItem } from "./menu-items";

export function filterMenuByPermissions(
    menu: MenuItem[],
    allowedRoutes: Set<string>
): MenuItem[] {
    return menu
        .map((item) => {
            // Items especiales (Alertas, Buscador, Logout)
            if (!item.route && !item.subSidebarItems) {
                return item;
            }

            const filteredSubs = filterSubItems(
                item.subSidebarItems,
                allowedRoutes
            );

            const hasRouteAccess =
                item.route && isAllowed(item.route, allowedRoutes);

            if (hasRouteAccess || filteredSubs.length > 0) {
                return {
                    ...item,
                    subSidebarItems: filteredSubs,
                };
            }

            return null;
        })
        .filter(Boolean) as MenuItem[];
}

function filterSubItems(
    items: SubMenuItem[] | undefined,
    allowedRoutes: Set<string>
): SubMenuItem[] {
    if (!items) return [];

    return items
        .map((item) => {
            const filteredChildren = filterSubItems(
                item.subItems,
                allowedRoutes
            );

            const hasAccess =
                item.route && isAllowed(item.route, allowedRoutes);

            if (hasAccess || filteredChildren.length > 0) {
                return {
                    ...item,
                    subItems: filteredChildren,
                };
            }

            return null;
        })
        .filter(Boolean) as SubMenuItem[];
}

function isAllowed(route: string, allowedRoutes: Set<string>) {
    return Array.from(allowedRoutes).some((allowed) =>
        route.startsWith(allowed)
    );
}

