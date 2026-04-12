/**
 * Formato monetario unificado para PDFs (@react-pdf/renderer).
 * Miles con punto, decimales con coma (es-EC), símbolo $.
 */
export function formatPdfCurrency(value: number | string | null | undefined): string {
    const raw = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(raw)) return '$ 0,00';
    const neg = raw < 0;
    const x = Math.round(Math.abs(raw) * 100) / 100;
    const [i, d = '00'] = x.toFixed(2).split('.');
    const intFmt = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${neg ? '-' : ''}$ ${intFmt},${d}`;
}
