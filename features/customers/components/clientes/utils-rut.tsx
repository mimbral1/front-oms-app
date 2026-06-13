// views\Customers\Clientes\components\utils-rut.tsx
export function cleanRut(input: string): { base: string; dv: string } {
    const upper = String(input).toUpperCase().replace(/\./g, "").replace(/\s/g, "");
    const match = upper.match(/^(\d+)(?:-?([0-9K]))?$/);
    if (!match) return { base: "", dv: "" };
    const base = match[1];
    const dv = match[2] ?? "";
    return { base, dv };
}

// Módulo 11 (Chile)
export function computeDV(base: string): string {
    let sum = 0, mul = 2;
    for (let i = base.length - 1; i >= 0; i--) {
        sum += parseInt(base[i], 10) * mul;
        mul = mul === 7 ? 2 : mul + 1;
    }
    const rest = 11 - (sum % 11);
    if (rest === 11) return "0";
    if (rest === 10) return "K";
    return String(rest);
}

export function formatRut(input: string): string {
    const { base, dv } = cleanRut(input);
    if (!base) return "";
    const dvc = dv || computeDV(base);
    return `${base}-${dvc}`;
}

export function isRutValid(input: string): boolean {
    const { base, dv } = cleanRut(input);
    if (!base || !dv) return false;
    return computeDV(base) === dv;
}


// formatear rut
export function estandarizarRut(input: string): string {
    // 1) limpiar: solo dígitos y K/k; forzar mayúscula
    let clean = (input ?? "").replace(/[^\dkK]/g, "").toUpperCase();

    // 2) límite absoluto: 8 dígitos de cuerpo + 1 DV = 9
    if (clean.length > 9) clean = clean.slice(0, 9);

    // 3) si hay 0/1 char, devolver tal cual (no forzar "-")
    if (clean.length <= 1) return clean;

    // 4) separar cuerpo y DV
    const dv = clean.slice(-1); // 0-9 o K
    let cuerpo = clean.slice(0, -1).replace(/\D/g, "");

    // 5) reforzar límite del cuerpo a 8 dígitos (por si acaso)
    if (cuerpo.length > 8) cuerpo = cuerpo.slice(0, 8);

    // 6) agrupar miles desde la derecha -> puntos
    const rev = cuerpo.split("").reverse().join("");
    const grupos = rev.match(/.{1,3}/g) ?? [];
    const cuerpoFormateado = grupos
        .map(g => g.split("").reverse().join(""))
        .reverse()
        .join(".");

    // 7) unir con guion
    return `${cuerpoFormateado}-${dv}`;
}
