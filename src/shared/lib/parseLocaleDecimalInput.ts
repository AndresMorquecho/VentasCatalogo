/**
 * Interpreta texto con coma o punto como separador decimal (p. ej. "10,5" / "10.5").
 * Si hay ambos, el último separador suele ser el decimal.
 */
export function parseLocaleDecimalInput(raw: string): number {
    const t = raw.trim();
    if (!t) return 0;
    const cleaned = t.replace(/[^\d.,]/g, '');
    if (!cleaned) return 0;
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    let norm: string;
    if (lastComma > lastDot) {
        norm = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
        norm = cleaned.replace(/,/g, '');
    } else {
        norm = cleaned.includes(',') ? cleaned.replace(',', '.') : cleaned;
    }
    const n = parseFloat(norm);
    return Number.isFinite(n) ? n : 0;
}

/** Muestra número con coma decimal (sin miles) para inputs de factura. */
export function formatDecimalForInvoiceInput(n: number): string {
    if (!Number.isFinite(n) || n === 0) return '';
    const s = String(n);
    return s.replace('.', ',');
}
