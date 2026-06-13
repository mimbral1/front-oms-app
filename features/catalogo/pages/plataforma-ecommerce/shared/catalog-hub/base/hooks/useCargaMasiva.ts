// hooks/useCargaMasiva.ts
//
// Datos + orquestación de subida para la carga masiva de imágenes.
// Soporta UNO o VARIOS flujos a la vez (modo "Todos los flujos"): carga la unión
// de los SKUs miembros, cada SKU recordando a qué flujo pertenece, y al guardar
// rutea cada set de imágenes a SU flujo (saveItems por flujo). ML se toca solo
// al Sincronizar (otra pieza). es5-safe (loops indexados + forEach, sin for...of
// sobre Map/Set).
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCatalogHubGridApi } from "../api/catalog-hub-grid-api";
import { usePublicarApi } from "../../../publicar/base/api/publicar-api";
import type { UploadedImage } from "../../../publicar/base/types/publicar-types";
import type { MatchedGroup } from "../lib/bulk-image-match";

/** Un SKU del flujo con su nombre, conteo y set actual de imágenes. */
export interface CargaSku {
  code: string;
  name: string;
  fotos: number;
  images: UploadedImage[];
  /** A qué flujo pertenece este SKU (para rutear el guardado en modo multi-flujo). */
  flujoId: number | string;
}

/** Error de subida por archivo (no aborta el lote). */
export interface UploadError {
  name: string;
  message: string;
}

/** Referencia mínima de un flujo: su id + el n3 (para leer __imagenes vía getN3Values). */
export interface CargaMasivaFlujoRef {
  id: number | string;
  n3Id: string;
}

export interface UseCargaMasivaArgs {
  /** Uno o más flujos. Con varios, la lista es la unión y el guardado rutea
   *  cada SKU a SU flujo (modo "Todos los flujos"). */
  flujos: CargaMasivaFlujoRef[];
}

export interface UseCargaMasivaReturn {
  skus: CargaSku[];
  loading: boolean;
  error: string | null;
  conFotos: number;
  sinFotos: number;
  cobertura: number; // 0..100
  progress: { current: number; total: number };
  reload: () => Promise<void>;
  /** Sube y REEMPLAZA las imágenes de cada SKU del lote (masivo). */
  runBulkUpload: (matched: MatchedGroup<File>[]) => Promise<UploadError[]>;
  /** Sube y AGREGA al final las imágenes de un SKU (manual; orden = el del array). */
  runManualUpload: (sku: string, files: File[]) => Promise<UploadError[]>;
}

const CONCURRENCY = 4;

/** Corre `worker` sobre `items` con un pool de tamaño `n` (preserva índices). */
async function runPool<T, R>(items: T[], n: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function lane(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i], i);
    }
  }
  const lanes: Promise<void>[] = [];
  for (let k = 0; k < Math.min(n, items.length); k++) lanes.push(lane());
  await Promise.all(lanes);
  return out;
}

function imagesOf(values: Record<string, unknown> | undefined): UploadedImage[] {
  const v = values ? values["__imagenes"] : undefined;
  return Array.isArray(v) ? (v as UploadedImage[]) : [];
}

export function useCargaMasiva({ flujos }: UseCargaMasivaArgs): UseCargaMasivaReturn {
  const api = useCatalogHubGridApi();
  const pub = usePublicarApi();

  const [skus, setSkus] = useState<CargaSku[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Espejo de imágenes actuales por SKU (para append en manual sin re-leer).
  const imagesBySku = useRef<Record<string, UploadedImage[]>>({});
  // Mapa SKU → flujoId (para rutear el guardado al flujo correcto en modo unión).
  const flujoBySku = useRef<Record<string, number | string>>({});

  // Clave estable de la lista de flujos: evita recargas por cambio de identidad
  // del array (el caller puede pasar un array nuevo en cada render).
  const flujosKey = useMemo(() => flujos.map((f) => `${f.id}:${f.n3Id}`).join("|"), [flujos]);
  const flujosRef = useRef(flujos);
  flujosRef.current = flujos;

  const load = useCallback(async () => {
    const list = flujosRef.current;
    if (!list.length) {
      setSkus([]); imagesBySku.current = {}; flujoBySku.current = {}; setError(null); setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    try {
      // Por cada flujo: productos DEL FLUJO (el backend respeta `origen`:
      // seleccion → solo miembros; legacy n3 → toda la N3) + sus __imagenes.
      // Unimos todo en una sola lista, tagueando cada SKU con su flujoId.
      const imgMap: Record<string, UploadedImage[]> = {};
      const flujoMap: Record<string, number | string> = {};
      const all: CargaSku[] = [];
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        const prod = await api.getFlujoProducts(f.id, { pageSize: 500 });
        const products = prod.products ?? [];
        const codes = products.map((p) => p.sku);
        const valuesRes = codes.length > 0 && f.n3Id ? await api.getN3Values(f.n3Id, codes) : { valuesBySku: {} };
        const valuesBySku = valuesRes.valuesBySku ?? {};
        products.forEach((p) => {
          // Overlay del flujo (lo guardado con saveItems) ENCIMA del N3 maestro,
          // para que las fotos persistan al recargar (antes el overlay no se leía).
          const merged = { ...(valuesBySku[p.sku]?.values ?? {}), ...(p.overlay ?? {}) };
          const imgs = imagesOf(merged);
          imgMap[p.sku] = imgs;
          flujoMap[p.sku] = f.id;
          all.push({ code: p.sku, name: p.nombre, fotos: imgs.length, images: imgs, flujoId: f.id });
        });
      }
      imagesBySku.current = imgMap;
      flujoBySku.current = flujoMap;
      setSkus(all);
    } catch (e) {
      setError((e as Error)?.message ?? "No se pudo cargar la lista.");
    } finally {
      setLoading(false);
    }
    // flujosKey en deps: recarga cuando cambia el conjunto de flujos (la lista
    // real se lee de flujosRef para no recrear el callback por identidad).
  }, [api, flujosKey]);

  useEffect(() => { void load(); }, [load]);

  // Actualización optimista del estado local tras guardar. getN3Values es
  // n3-keyed y puede NO reflejar el overlay de items del flujo, así que tras
  // subir+saveItems el estado local es la fuente autoritativa (no auto-reload).
  const setLocalImages = useCallback((map: Record<string, UploadedImage[]>) => {
    setSkus((prev) => prev.map((s) => {
      const incoming = map[s.code];
      if (!incoming) return s;
      imagesBySku.current[s.code] = incoming;
      return { ...s, fotos: incoming.length, images: incoming };
    }));
  }, []);

  const conFotos = useMemo(() => skus.filter((s) => s.fotos > 0).length, [skus]);
  const sinFotos = skus.length - conFotos;
  const cobertura = skus.length === 0 ? 0 : Math.round((conFotos / skus.length) * 100);

  // Sube un archivo; devuelve la imagen o null + acumula el error.
  const uploadOne = useCallback(async (file: File, errors: UploadError[]): Promise<UploadedImage | null> => {
    try {
      return await pub.uploadImagen(file); // canal ML por defecto → /api/pim/imagenes (Cloudinary)
    } catch (e) {
      errors.push({ name: file.name, message: (e as Error)?.message ?? "error al subir" });
      return null;
    }
  }, [pub]);

  const runBulkUpload = useCallback(async (matched: MatchedGroup<File>[]): Promise<UploadError[]> => {
    const errors: UploadError[] = [];
    const total = matched.reduce((n, g) => n + g.items.length, 0);
    setProgress({ current: 0, total });
    let done = 0;

    // Por SKU, subir sus archivos EN ORDEN (concurrencia interna), construir el set.
    const perSku: Array<{ sku: string; images: UploadedImage[] }> = [];
    for (let g = 0; g < matched.length; g++) {
      const group = matched[g];
      const ups = await runPool(group.items, CONCURRENCY, async (it) => {
        const img = await uploadOne(it.file, errors);
        done += 1;
        setProgress({ current: done, total });
        return img;
      });
      const images = ups.filter((x): x is UploadedImage => x != null); // mantiene el orden del grupo
      perSku.push({ sku: group.sku, images });
    }

    // Persistir: masivo REEMPLAZA el set de cada SKU. Agrupamos por flujo (cada
    // SKU a SU flujo) → un saveItems por flujo. En modo un-solo-flujo es 1 grupo.
    const byFlujo: Record<string, { fid: number | string; items: Array<{ sku: string; values: Record<string, unknown> }> }> = {};
    perSku.forEach((p) => {
      if (p.images.length === 0) return;
      const fid = flujoBySku.current[p.sku];
      if (fid == null) return; // SKU sin flujo conocido (no debería ocurrir)
      const key = String(fid);
      if (!byFlujo[key]) byFlujo[key] = { fid, items: [] };
      byFlujo[key].items.push({ sku: p.sku, values: { __imagenes: p.images } });
    });
    const groups = Object.keys(byFlujo).map((k) => byFlujo[k]);
    for (let i = 0; i < groups.length; i++) {
      try {
        await api.saveItems(groups[i].fid, groups[i].items);
      } catch (e) {
        errors.push({ name: "(guardado)", message: (e as Error)?.message ?? "no se pudo guardar" });
      }
    }

    // Optimista: reflejar lo subido en el estado local (ver setLocalImages).
    const finalMap: Record<string, UploadedImage[]> = {};
    for (let i = 0; i < perSku.length; i++) {
      if (perSku[i].images.length > 0) finalMap[perSku[i].sku] = perSku[i].images;
    }
    setLocalImages(finalMap);
    return errors;
  }, [api, uploadOne, setLocalImages]);

  const runManualUpload = useCallback(async (sku: string, files: File[]): Promise<UploadError[]> => {
    const errors: UploadError[] = [];
    setProgress({ current: 0, total: files.length });
    let done = 0;
    const ups = await runPool(files, CONCURRENCY, async (f) => {
      const img = await uploadOne(f, errors);
      done += 1;
      setProgress({ current: done, total: files.length });
      return img;
    });
    const nuevas = ups.filter((x): x is UploadedImage => x != null);
    if (nuevas.length > 0) {
      const actuales = imagesBySku.current[sku] ?? [];
      const merged = actuales.concat(nuevas); // AGREGA al final
      const fid = flujoBySku.current[sku];
      if (fid == null) {
        errors.push({ name: "(guardado)", message: "no se pudo determinar el flujo del SKU" });
      } else {
        try {
          await api.saveItems(fid, [{ sku, values: { __imagenes: merged } }]);
        } catch (e) {
          errors.push({ name: "(guardado)", message: (e as Error)?.message ?? "no se pudo guardar" });
        }
        setLocalImages({ [sku]: merged }); // optimista (ver setLocalImages)
      }
    }
    return errors;
  }, [api, uploadOne, setLocalImages]);

  return {
    skus, loading, error, conFotos, sinFotos, cobertura, progress,
    reload: load, runBulkUpload, runManualUpload,
  };
}
