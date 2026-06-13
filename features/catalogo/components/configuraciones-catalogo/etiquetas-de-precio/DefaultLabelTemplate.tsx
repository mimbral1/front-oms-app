
export const DEFAULT_LABEL_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }
    .page { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
    .badge { background:#e11d48; color:#fff; padding:10px 16px; font-weight:700; display:inline-block; }
    .price { font-size: 48px; font-weight:700; color:#374151; margin: 24px 0; }
    .before { border:1px solid #e5e7eb; padding:8px 10px; color:#6b7280; width: 60%; margin: 0 auto; }
    .footer { display:flex; justify-content:space-between; align-items:center; margin-top: 28px; color:#6b7280; font-size:12px; }
    .barcode { font-size:20px; font-family: 'Libre Barcode 39', cursive; margin-top: 16px; }
    .qr img { width: 160px; height: 160px; display:block; margin:0 auto; }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
</head>
<body>
  <div class="page">
    <div class="badge">{{headline}}</div>
    <div class="price">{{price}}</div>
    <div class="before">Antes {{previous_price}} / Ahorro {{saving}}</div>
    <div class="barcode">*{{code}}*</div>
    <div class="footer">
      <div>SKU: {{sku}} • EAN: {{ean}}</div>
      <div>Válido hasta {{expires_at}}</div>
    </div>
  </div>
</body>
</html>`;

export const LABEL_SAMPLE_JSON = JSON.stringify({
    headline: "Precio Rebajado",
    price: "$ 9.990",
    previous_price: "$12.990",
    saving: "$3.000",
    expires_at: "18-08-2025",
    sku: "SKU-12345",
    ean: "1234567890123",
    code: "SKU-12345"
}, null, 2);

