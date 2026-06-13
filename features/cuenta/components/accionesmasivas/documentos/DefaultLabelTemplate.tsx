// DefaultLabelTemplate.tsx
// Plantilla por defecto para la etiqueta + datos de ejemplo.
// Exporta: DEFAULT_LABEL_TEMPLATE y LABEL_SAMPLE_JSON

export const DEFAULT_LABEL_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body{margin:0;font-family:ui-sans-serif,system-ui,Arial}
    .label{width:640px; border:1px solid #e5e7eb; border-radius:12px; padding:24px}
    .badge{background:#ef4444;color:#fff;font-weight:700;padding:10px 16px;border-radius:8px;display:inline-block}
    .price{font-size:48px;font-weight:800;color:#374151;margin:24px 0}
    .bar{height:36px;background:
      repeating-linear-gradient(90deg,#111 0,#111 2px,transparent 2px,transparent 4px);}
    .muted{color:#6b7280;font-size:12px}
    .footer{display:flex;justify-content:space-between;margin-top:12px;color:#6b7280;font-size:12px}
  </style>
</head>
<body>
  <div class="label">
    <div class="badge">{{badge}}</div>
    <div class="price">$ {{price}}</div>
    <div class="bar"></div>
    <div class="muted">Antes {{was}} / Ahorro {{save}}</div>
    <div class="footer">
      <span>Código de Barras</span>
      <span>Válido hasta {{validUntil}}</span>
    </div>
  </div>
</body>
</html>`;

export const LABEL_SAMPLE = {
    badge: "Precio Rebajado",
    price: "9.990",
    was: "12.990",      // ↍ valor explícito, sin shorthand
    save: "3.000",
    validUntil: "18-08-2025",
    sku: "SKU-987654",
    ean: "1234567890123",
    code: "1-A1-01-01-1",
};

export const LABEL_SAMPLE_JSON = JSON.stringify(LABEL_SAMPLE, null, 2);
