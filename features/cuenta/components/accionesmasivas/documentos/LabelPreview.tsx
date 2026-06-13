"use client";

import React from "react";

export default function LabelPreview({
    html,
    height = 640,
}: {
    html: string;
    height?: number;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200">
            <iframe
                title="label-preview"
                className="w-full bg-white"
                style={{ height }}
                sandbox="allow-same-origin"
                srcDoc={html}
            />
        </div>
    );
}
