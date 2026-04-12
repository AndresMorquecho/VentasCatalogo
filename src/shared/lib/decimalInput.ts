/** Permite solo dígitos y un punto decimal. */
export function sanitizeDecimalInput(raw: string): string {
    let s = raw.replace(/[^\d.]/g, '');
    const dot = s.indexOf('.');
    if (dot !== -1) {
        s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
    }
    return s;
}

/** Para cálculos: cadena vacía o solo "." → 0; respeta "12." como 12. */
export function decimalInputToNumber(sanitized: string): number {
    if (sanitized === '' || sanitized === '.') return 0;
    const n = parseFloat(sanitized);
    return Number.isFinite(n) ? n : 0;
}
