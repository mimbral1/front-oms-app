// features/catalogo/pages/plataforma-ecommerce/shared/feeds/base/feed-status.ts
//
// Port del legacy pim-service/Plataforma_Marketplace/src/features/feeds/
// {feedStatus.ts, parseFalabellaErrorCsv.ts}. Lógica del estado ASÍNCRONO de
// feeds Falabella Sellercenter.
//
// Falabella publica/edita de forma async: cada ProductCreate/ProductUpdate
// devuelve un `feed_id` (RequestId). El worker `feed-status.job` de fcom-catalog
// pollea Sellercenter (FeedStatus) y mantiene fresca la fila `fal_feeds` (status,
// FailedRecords, FeedErrors). El front pollea
// `GET /api/pim/canales/falabella/feeds/:id` hasta que el feed se resuelve.

export type FeedStatusKey =
  | "Queued"
  | "Processing"
  | "SuccessClean"
  | "SuccessPartial"
  | "Error";

export interface FalabellaFeed {
  feed_id?: string;
  action?: string;
  /** Estado normalizado por el worker: Queued | Processing | Success | Error. */
  status?: string;
  failed_records?: number;
  total_records?: number;
  processed_records?: number;
  progress_pct?: number;
  is_resolved?: boolean;
  submitted_at?: string;
  resolved_at?: string;
  /** CSV con columnas SellerSku,Description,Severity,Code (errores por-SKU). */
  error_detail?: string;
}

export const FEED_POLL_MS = 5000;
export const FEED_TIMEOUT_WARN_SEC = 180;

export function feedEndpoint(id: string): string {
  return `/api/pim/canales/falabella/feeds/${encodeURIComponent(id)}`;
}

/**
 * ¿El feed llegó a un estado terminal? (deja de pollear). Robusto aunque el
 * backend no mande `is_resolved`: cae a `resolved_at` o a un status terminal
 * (Success/Error). Doc Falabella: el feed pasa Queued → Processing → Finished
 * (normalizado a Success por el worker) | Error | Canceled.
 */
export function isFeedResolved(feed: FalabellaFeed | null | undefined): boolean {
  if (!feed) return false;
  if (feed.is_resolved === true) return true;
  if (feed.resolved_at) return true;
  const s = String(feed.status || "");
  return s === "Success" || s === "Error";
}

/**
 * Deriva la "key" de UI a partir del status + failed_records.
 * Clave: un feed `Success` con `failed_records > 0` es ÉXITO PARCIAL — la doc
 * (FeedStatus) confirma que un feed Finished puede traer FailedRecords.
 */
export function deriveStatusKey(feed: FalabellaFeed): FeedStatusKey {
  if (feed.status === "Success" && (feed.failed_records || 0) > 0) return "SuccessPartial";
  if (feed.status === "Success") return "SuccessClean";
  if (feed.status === "Processing") return "Processing";
  if (feed.status === "Error") return "Error";
  return "Queued";
}

// ── Parser CSV de errores por-SKU (port verbatim del legacy) ──────────────────
// El `error_detail` viene del worker ya decodificado (base64 → CSV plano) con
// headers SellerSku,Description,Severity,Code.

export interface FalabellaErrorRow {
  sku: string;
  desc: string;
  sev: string;
  code: string;
}

function parseCsvRow(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current);
  return out;
}

export function parseFalabellaErrorCsv(csv: string | null | undefined): FalabellaErrorRow[] {
  if (!csv || typeof csv !== "string") return [];
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvRow(lines[0]).map((header) => header.trim().toLowerCase());
  const indexes = {
    sku: headers.indexOf("sellersku"),
    desc: headers.indexOf("description"),
    sev: headers.indexOf("severity"),
    code: headers.indexOf("code"),
  };

  return lines.slice(1).map((line) => {
    const cols = parseCsvRow(line);
    return {
      sku: (indexes.sku >= 0 ? cols[indexes.sku] : null) || "-",
      desc: (indexes.desc >= 0 ? cols[indexes.desc] : null) || "",
      sev: (indexes.sev >= 0 ? cols[indexes.sev] : null) || "Error",
      code: (indexes.code >= 0 ? cols[indexes.code] : null) || "-",
    };
  });
}

/** Tiempo relativo legible ("hace 2 min 5 seg"). */
export function relTime(iso?: string | null): string {
  if (!iso) return "—";
  const sec = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (!Number.isFinite(sec)) return "—";
  if (sec < 60) return `hace ${sec} seg`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min < 60) return rem ? `hace ${min} min ${rem} seg` : `hace ${min} min`;
  const hr = Math.floor(min / 60);
  return `hace ${hr} h ${min % 60} min`;
}
