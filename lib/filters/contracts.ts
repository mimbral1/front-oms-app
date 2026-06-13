import type { FilterOptionItem } from "@/components/layout/page-header";

export type StandardFilterType =
  | "text"
  | "select"
  | "datetime"
  | "select-search"
  | "multi-select-search"
  | "date-range"
  | "single-date";

export type QueryPrimitive = string | number | boolean | null | undefined;

export type QueryMapper<TFilters> = (
  filters: TFilters
) => Record<string, QueryPrimitive>;

export interface EndpointConfig<TFilters> {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  queryMapper?: QueryMapper<TFilters>;
  staticParams?: Record<string, QueryPrimitive>;
  pagination?: {
    page?: number;
    pageSize?: number;
    pageParam?: string;
    pageSizeParam?: string;
  };
}

export type LocalMatchMode = "includes" | "equals" | "gte" | "lte";

export interface FilterConfig<
  TFilters extends Record<string, any>,
  TRow = never
> {
  id: Extract<keyof TFilters, string>;
  label: string;
  type: StandardFilterType;
  placeholder?: string;
  colSpan?: string;
  queryParam?: string;
  omitWhenEmpty?: boolean;
  mapQueryValue?: (
    value: TFilters[Extract<keyof TFilters, string>],
    filters: TFilters
  ) => QueryPrimitive;
  parse?: (
    rawValue: string,
    previousValue: TFilters[Extract<keyof TFilters, string>],
    filters: TFilters
  ) => TFilters[Extract<keyof TFilters, string>];
  options?:
    | FilterOptionItem[]
    | ((context: { filters: TFilters; searchQuery: string }) => FilterOptionItem[]);
  emptyOptionLabel?: string | false;
  searchMode?: "local" | "external";
  externalSearchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  compact?: boolean;
  size?: "sm" | "md";
  rowValue?: TRow extends never
    ? never
    :
        | ((
            row: TRow,
            filters: TFilters
          ) =>
            | string
            | number
            | boolean
            | null
            | undefined
            | Array<string | number | boolean | null | undefined>)
        | undefined;
  matchMode?: LocalMatchMode;
  match?: TRow extends never
    ? never
    : ((
        row: TRow,
        value: TFilters[Extract<keyof TFilters, string>],
        filters: TFilters
      ) => boolean);
}

export function isEmptyFilterValue(value: unknown) {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

export function createQueryMapper<TFilters extends Record<string, any>>(
  configs: FilterConfig<TFilters, any>[]
): QueryMapper<TFilters> {
  return (filters) =>
    configs.reduce<Record<string, QueryPrimitive>>((accumulator, config) => {
      const rawValue = filters[config.id];
      if (config.omitWhenEmpty !== false && isEmptyFilterValue(rawValue)) {
        return accumulator;
      }

      const mappedValue = config.mapQueryValue
        ? config.mapQueryValue(rawValue, filters)
        : defaultMapQueryValue(rawValue);

      if (mappedValue === undefined || mappedValue === null || mappedValue === "") {
        return accumulator;
      }

      accumulator[config.queryParam ?? config.id] = mappedValue;
      return accumulator;
    }, {});
}

export function buildEndpointUrl<TFilters extends Record<string, any>>(
  endpointConfig: EndpointConfig<TFilters>,
  filters: TFilters,
  fallbackMapper?: QueryMapper<TFilters>
) {
  const params = new URLSearchParams();
  const mapper =
    endpointConfig.queryMapper ??
    fallbackMapper ??
    (() => ({} as Record<string, QueryPrimitive>));

  appendQuery(params, endpointConfig.staticParams);
  appendQuery(params, mapper(filters));

  if (endpointConfig.pagination?.page !== undefined) {
    params.set(
      endpointConfig.pagination.pageParam ?? "page",
      String(endpointConfig.pagination.page)
    );
  }

  if (endpointConfig.pagination?.pageSize !== undefined) {
    params.set(
      endpointConfig.pagination.pageSizeParam ?? "pageSize",
      String(endpointConfig.pagination.pageSize)
    );
  }

  const queryString = params.toString();
  return queryString ? `${endpointConfig.path}?${queryString}` : endpointConfig.path;
}

export function applyLocalFilters<
  TRow,
  TFilters extends Record<string, any>
>(
  rows: TRow[],
  filters: TFilters,
  configs: FilterConfig<TFilters, TRow>[]
) {
  return rows.filter((row) =>
    configs.every((config) => {
      const filterValue = filters[config.id];

      if (isEmptyFilterValue(filterValue)) return true;
      if (config.match) return config.match(row, filterValue, filters);
      if (!config.rowValue) return true;

      const rowValue = config.rowValue(row, filters);
      return matchRowValue(
        rowValue,
        filterValue,
        config.matchMode ?? defaultMatchMode(config.type)
      );
    })
  );
}

function defaultMapQueryValue(value: unknown): QueryPrimitive {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(",") : undefined;
  }
  return value as QueryPrimitive;
}

function appendQuery(
  params: URLSearchParams,
  values?: Record<string, QueryPrimitive>
) {
  if (!values) return;

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
}

function defaultMatchMode(type: StandardFilterType): LocalMatchMode {
  switch (type) {
    case "select":
    case "select-search":
    case "multi-select-search":
      return "equals";
    case "datetime":
    case "single-date":
    case "date-range":
      return "equals";
    case "text":
    default:
      return "includes";
  }
}

function matchRowValue(
  rowValue:
    | string
    | number
    | boolean
    | null
    | undefined
    | Array<string | number | boolean | null | undefined>,
  filterValue: unknown,
  matchMode: LocalMatchMode
) {
  const normalizedFilter = normalizeValue(filterValue);
  const normalizedRowValues = Array.isArray(rowValue)
    ? rowValue.map(normalizeValue)
    : [normalizeValue(rowValue)];

  switch (matchMode) {
    case "gte":
      return normalizedRowValues.some((value) => value >= normalizedFilter);
    case "lte":
      return normalizedRowValues.some((value) => value <= normalizedFilter);
    case "equals":
      return normalizedRowValues.some((value) => value === normalizedFilter);
    case "includes":
    default:
      return normalizedRowValues.some((value) => value.includes(normalizedFilter));
  }
}

function normalizeValue(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}
