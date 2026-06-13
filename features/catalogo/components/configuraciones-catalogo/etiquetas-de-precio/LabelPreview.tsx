
"use client";
import React, { useEffect, useRef } from "react";

export default function LabelPreview({ html }: { html: string }) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const resize = () => {
        const iframe = iframeRef.current; if (!iframe) return;
        try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document; if (!doc) return;
            const height = doc.documentElement.scrollHeight || doc.body.scrollHeight || 600;
            iframe.style.height = Math.max(400, height) + "px";
        } catch { }
    };
    useEffect(() => {
        const iframe = iframeRef.current; if (!iframe) return;
        iframe.srcdoc = html; const onLoad = () => resize();
        iframe.addEventListener("load", onLoad);
        const id = setTimeout(resize, 50);
        return () => { iframe.removeEventListener("load", onLoad); clearTimeout(id); };
    }, [html]);
    return <iframe ref={iframeRef} title="Vista previa etiqueta" className="w-full h-[520px] rounded-lg border border-gray-200 bg-white" sandbox="allow-popups allow-popups-to-escape-sandbox" />;
}

