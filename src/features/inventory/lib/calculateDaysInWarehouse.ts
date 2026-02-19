/**
 * calculateDaysInWarehouse - Pure Function
 * Calculates operational days in warehouse.
 * 
 * Rules:
 * - If not delivered -> days from entry until today
 * - If delivered -> days between entry and delivery
 * - Only date diff, no time diff considered (Operational days)
 */
export const calculateDaysInWarehouse = (entryDate: string, deliveryDate?: string): number => {
    const entry = new Date(entryDate);
    const end = deliveryDate ? new Date(deliveryDate) : new Date();

    // Normalize to start of day to count full operational days
    entry.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - entry.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays); // Ensure non-negative
}
