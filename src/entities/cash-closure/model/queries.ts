import type { CashClosure } from './types';

/**
 * Pure function to get closures by date (exact match on createdAt/closedAt).
 */
export function getClosuresByDate(closures: CashClosure[], date: string): CashClosure[] {
    const targetDate = new Date(date).toDateString();
    return closures.filter(c => new Date(c.closedAt).toDateString() === targetDate);
}

/**
 * Pure function to get the most recent closure.
 */
export function getLastClosure(closures: CashClosure[]): CashClosure | undefined {
    if (!closures.length) return undefined;
    
    // Sort by closedAt descending
    return [...closures].sort(
        (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
    )[0];
}

/**
 * Pure function to sort closures by date (descending default).
 */
export function sortClosuresByDate(closures: CashClosure[], direction: 'asc' | 'desc' = 'desc'): CashClosure[] {
    return [...closures].sort((a, b) => {
        const diff = new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime();
        return direction === 'asc' ? diff : -diff;
    });
}
