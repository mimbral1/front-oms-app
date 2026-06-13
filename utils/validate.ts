// utils/validation.ts

/** Comprueba formato básico de e‑mail */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidRUT(raw: string): boolean {
  const rut = raw.replace(/[\.\-]/g, "").toUpperCase();
  if (!/^[0-9]+[0-9K]$/.test(rut)) return false;

  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body.charAt(i)) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const mod = 11 - (sum % 11);
  const dvCalc = mod === 11 ? "0" : mod === 10 ? "K" : String(mod);

  return dvCalc === dv;
}
