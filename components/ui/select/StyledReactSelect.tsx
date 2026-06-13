"use client";

import React from "react";
import Select from "react-select";
import type { Props as ReactSelectProps, StylesConfig } from "react-select";

export type StyledSelectOption = { value: string | number; label: string };

const sharedSelectStyles: StylesConfig<StyledSelectOption, boolean> = {
    control: (base, state) => ({
        ...base,
        minHeight: 40,
        borderRadius: 8,
        borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 1px #6366f1" : "none",
        backgroundColor: "#ffffff",
        ":hover": {
            borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
        },
    }),
    valueContainer: (base) => ({
        ...base,
        padding: "0 12px",
    }),
    placeholder: (base) => ({
        ...base,
        color: "#9ca3af",
    }),
    indicatorSeparator: () => ({
        display: "none",
    }),
    dropdownIndicator: (base) => ({
        ...base,
        color: "#9ca3af",
        ":hover": { color: "#6b7280" },
    }),
    menu: (base) => ({
        ...base,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        overflow: "hidden",
        zIndex: 50,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "#eff6ff" : "#ffffff",
        color: "#111827",
        cursor: "pointer",
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: "#f3f4f6",
        borderRadius: 8,
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: "#374151",
    }),
};

type StyledReactSelectProps = ReactSelectProps<StyledSelectOption, boolean>;

export function StyledReactSelect(props: StyledReactSelectProps) {
    return <Select<StyledSelectOption, boolean> styles={sharedSelectStyles} {...props} />;
}

export { sharedSelectStyles };
