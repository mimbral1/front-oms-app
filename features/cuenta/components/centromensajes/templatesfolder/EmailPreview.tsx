// app/cuenta/centro-mensajes/templates-page/components/EmailPreview.tsx
"use client";

import React, { useEffect, useRef } from "react";

/**
 * Renderiza el HTML del template dentro de un <iframe> aislado
 * para que los <style> del correo NO afecten a tu app.
 */
export default function EmailPreview({ html }: { html: string }) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    // auto-ajustar alto del iframe según contenido
    const resize = () => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) return;
            const height = doc.documentElement.scrollHeight || doc.body.scrollHeight || 600;
            iframe.style.height = Math.max(400, height) + "px";
        } catch {
            // noop (cross-origin no aplica porque usamos srcDoc)
        }
    };

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        // Usamos srcDoc para inyectar el HTML completo del template
        iframe.srcdoc = html;
        const onLoad = () => resize();
        iframe.addEventListener("load", onLoad);
        // En caso de cambios rápidos, reintenta ajustar
        const id = setTimeout(resize, 50);
        return () => {
            iframe.removeEventListener("load", onLoad);
            clearTimeout(id);
        };
    }, [html]);

    return (
        <iframe
            ref={iframeRef}
            title="Vista previa del correo"
            className="w-full h-[520px] rounded-lg border border-gray-200 bg-white"
            // sandbox: sin scripts, pero permite inline estilos
            sandbox="allow-popups allow-popups-to-escape-sandbox"
        />
    );
}
