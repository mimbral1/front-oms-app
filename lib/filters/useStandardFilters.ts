"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  FilterOptionItem,
  PageHeaderProps,
} from "@/components/layout/page-header";
import {
  applyLocalFilters,
  buildEndpointUrl,
  createQueryMapper,
  type EndpointConfig,
  type FilterConfig,
  type QueryMapper,
} from "./contracts";

interface UseStandardFiltersOptions<
  TFilters extends Record<string, any>,
  TRow = never
> {
  initialFilters: TFilters;
  configs: FilterConfig<TFilters, TRow>[];
}

interface BuildHeaderFiltersOptions<
  TFilters extends Record<string, any>,
  TRow = never
> {
  configs: FilterConfig<TFilters, TRow>[];
  filters: TFilters;
  searchQueries?: Record<string, string>;
  onSearchQueryChange?: (id: string, query: string) => void;
}

type HeaderFilter = NonNullable<PageHeaderProps["filters"]>[number];

export function useStandardFilters<
  TFilters extends Record<string, any>,
  TRow = never
>({ initialFilters, configs }: UseStandardFiltersOptions<TFilters, TRow>) {
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const configMap = useMemo(
    () =>
      configs.reduce<Record<string, FilterConfig<TFilters, TRow>>>(
        (accumulator, config) => {
          accumulator[config.id] = config;
          return accumulator;
        },
        {}
      ),
    [configs]
  );

  const handleFilterChange = useCallback(
    (id: string, value: string) => {
      setFilters((previousFilters) => {
        const config = configMap[id];
        if (!config) return previousFilters;

        const previousValue = previousFilters[id];
        const parsedValue = parseFilterValue(config, value, previousValue, previousFilters);

        return {
          ...previousFilters,
          [id]: parsedValue,
        };
      });
    },
    [configMap]
  );

  const handleSearchQueryChange = useCallback(
    (id: string, query: string) => {
      const config = configMap[id];
      if (!config) return;

      if (config.searchMode !== "external") {
        setSearchQueries((previousQueries) => ({
          ...previousQueries,
          [id]: query,
        }));
      }

      config.onSearchQueryChange?.(query);
    },
    [configMap]
  );

  const headerFilters = useMemo<NonNullable<PageHeaderProps["filters"]>>(
    () =>
      buildHeaderFilters({
        configs,
        filters,
        searchQueries,
        onSearchQueryChange: handleSearchQueryChange,
      }),
    [configs, filters, handleSearchQueryChange, searchQueries]
  );

  const queryMapper = useMemo<QueryMapper<TFilters>>(
    () => createQueryMapper(configs),
    [configs]
  );

  const queryObject = useMemo(() => queryMapper(filters), [filters, queryMapper]);

  const buildUrl = useCallback(
    (endpointConfig: EndpointConfig<TFilters>) =>
      buildEndpointUrl(endpointConfig, filters, queryMapper),
    [filters, queryMapper]
  );

  const applyFilters = useCallback(
    (rows: TRow[]) => applyLocalFilters(rows, filters, configs),
    [configs, filters]
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchQueries({});
  }, [initialFilters]);

  return {
    filters,
    setFilters,
    headerFilters,
    handleFilterChange,
    queryMapper,
    queryObject,
    buildUrl,
    applyFilters,
    resetFilters,
    searchQueries,
  };
}

export function buildHeaderFilters<
  TFilters extends Record<string, any>,
  TRow = never
>({
  configs,
  filters,
  searchQueries = {},
  onSearchQueryChange,
}: BuildHeaderFiltersOptions<TFilters, TRow>): NonNullable<PageHeaderProps["filters"]> {
  return configs.map<HeaderFilter>((config) => {
    const rawValue = filters[config.id];
    const stringValue = Array.isArray(rawValue)
      ? rawValue.join(",")
      : String(rawValue ?? "");
    const searchQuery =
      config.searchMode === "external"
        ? config.externalSearchQuery ?? ""
        : searchQueries[config.id] ?? "";
    const options = resolveOptions(config, filters, searchQuery);

    const baseFilter = {
      id: config.id,
      label: config.label,
      value: stringValue,
      colSpan: config.colSpan,
      placeholder: config.placeholder,
    };

    switch (config.type) {
      case "select":
        return {
          ...baseFilter,
          type: "select",
          options: options ?? prependEmptyOption([], config.emptyOptionLabel),
        };
      case "select-search":
        return {
          ...baseFilter,
          type: "select-search",
          options: options ?? [],
          onSearch: onSearchQueryChange
            ? (query: string) => onSearchQueryChange(config.id, query)
            : undefined,
          searchQuery,
        };
      case "multi-select-search":
        return {
          ...baseFilter,
          type: "multi-select-search",
          options: options ?? [],
          values: Array.isArray(rawValue)
            ? rawValue.map((value: unknown) => String(value))
            : stringValue
              ? stringValue.split(",").filter(Boolean)
              : [],
          onSearch: onSearchQueryChange
            ? (query: string) => onSearchQueryChange(config.id, query)
            : undefined,
          searchQuery,
          compact: config.compact,
          size: config.size,
        };
      case "datetime":
        return {
          ...baseFilter,
          type: "datetime",
        };
      case "date-range":
        return {
          ...baseFilter,
          type: "date-range",
        };
      case "single-date":
        return {
          ...baseFilter,
          type: "single-date",
        };
      case "text":
      default:
        return {
          ...baseFilter,
          type: "text",
        };
    }
  });
}

function parseFilterValue<
  TFilters extends Record<string, any>,
  TRow = never
>(
  config: FilterConfig<TFilters, TRow>,
  rawValue: string,
  previousValue: unknown,
  filters: TFilters
) {
  if (config.parse) {
    return config.parse(rawValue, previousValue as never, filters);
  }

  if (config.type === "multi-select-search") {
    return rawValue ? rawValue.split(",").filter(Boolean) : [];
  }

  return rawValue;
}

function resolveOptions<
  TFilters extends Record<string, any>,
  TRow = never
>(
  config: FilterConfig<TFilters, TRow>,
  filters: TFilters,
  searchQuery: string
): FilterOptionItem[] | undefined {
  if (!config.options) return undefined;

  const resolvedOptions =
    typeof config.options === "function"
      ? config.options({ filters, searchQuery })
      : config.options;

  const locallyFilteredOptions =
    (config.type === "select-search" || config.type === "multi-select-search") &&
    config.searchMode !== "external" &&
    searchQuery
      ? resolvedOptions.filter((option) =>
          `${option.label} ${option.value}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      : resolvedOptions;

  if (config.type === "multi-select-search") {
    return locallyFilteredOptions;
  }

  return prependEmptyOption(locallyFilteredOptions, config.emptyOptionLabel);
}

function prependEmptyOption(
  options: FilterOptionItem[],
  emptyOptionLabel?: string | false
) {
  if (emptyOptionLabel === false) return options;
  if (options.some((option) => option.value === "")) return options;

  return [{ label: emptyOptionLabel ?? "Todos", value: "" }, ...options];
}
