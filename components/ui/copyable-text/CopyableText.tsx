"use client";

import { useState, useCallback } from "react";
import { DocumentDuplicateIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CopyableTextProps {
    /** The text to copy to clipboard */
    text: string;
    /** Optional display content (defaults to the text value) */
    children?: React.ReactNode;
    /** Extra classes for the wrapper */
    className?: string;
}

export function CopyableText({ text, children, className = "" }: CopyableTextProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(
        (e: React.MouseEvent | React.KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard?.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        },
        [text],
    );

    return (
        <span className={`inline-flex items-center gap-1.5 ${className}`}>
            <span className="truncate">{children ?? text}</span>
            <button
                type="button"
                title="Copiar"
                className="inline-flex items-center justify-center flex-shrink-0 rounded p-0.5 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
                onClick={handleCopy}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleCopy(e);
                }}
            >
                {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                    <DocumentDuplicateIcon className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                )}
            </button>
        </span>
    );
}
