// ─── UI Components – Public API ────────────────────────────────────────────
// Barrel exports for all UI primitives

// Alert
export { Alert } from "./alert";
export type { AlertProps } from "./alert";

// Badge
export { GeneralStatusBadge, StatusBadge, UserBadge } from "./badge";

// Card
export { Card } from "./card";
export type { CardProps } from "./card";

// Clear Filters
export { ClearFiltersButton } from "./clear-filters";

// Button
export { ActionButton, PrimaryButton } from "./button";

// Code Block
export { CodeBlock } from "./code";

// Collapsible
export { CollapsibleField, MultiSelectSearchInline, SelectSearchInline } from "./collapsible";

// Copyable Text
export { CopyableText } from "./copyable-text";

// Date Range Picker
export { DateRangeField } from "./date-range-picker";

// Field Rows
export { FieldRows } from "./fieldrows";

// Icon Button
export { IconButton } from "./icon-button";
export type { IconButtonProps } from "./icon-button";

// Input
export { Input } from "./input";
export { Textarea } from "./input/textarea";

// Loader
export { Loader } from "./loader";

// Modal
export { ActionsModal } from "./modal";

// Multiselect
export { MultiSelect } from "./multiselect";

// Pagination
export { Pagination } from "./pagination";

// Popover
export { Popover, PopoverTrigger, PopoverContent } from "./popover";

// Scroll Button
export { ScrollButton } from "./scroll-button";

// Select
export { default as Select } from "./select";

// Status Pill
export { StatusPill } from "./status-pill";

// Table
export { DataTable } from "./table";
export { AdaptiveDataTable } from "./table/AdaptiveDataTable";
export { DataTableExpandable } from "./table/DataTableExpandable";
export { DataFilters } from "./table/filters";
export { TableHeader } from "./table/header";
export { Pagination as TablePagination } from "./table/pagination";

// Tab Navigation
export { TabsNav } from "./tabnav";

// Tabbed Layout (genérico: header + tabs + navegación)
export { TabbedLayout } from "./tabbed-layout";
export type { TabbedLayoutProps, TabItem } from "./tabbed-layout";

// Tabs (standalone, no routing)
export { Tabs } from "./tabs";
export type { TabsProps } from "./tabs";

// Toolbar
export { Toolbar } from "./toolbar";
export type { ToolbarProps } from "./toolbar";

// Toast
export { ToastProvider } from "./toast";

// Toggle
export { Toggle } from "./togle";
export { ActiveStatusToggle } from "./togle";

// User Avatar
export { Avatar } from "./user-avatar";
