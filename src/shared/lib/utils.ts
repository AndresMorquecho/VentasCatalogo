import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function incrementOrderNumber(num: string | null | undefined): string {
  if (!num) return "";
  const parts = num.split('-');
  if (parts.length < 3) return num;
  
  // PD-2026-001 -> ["PD", "2026", "001"]
  const prefix = parts[0];
  const year = parts[1];
  const sequenceStr = parts[2];
  
  const seq = parseInt(sequenceStr);
  if (isNaN(seq)) return num;
  
  const nextSeq = seq + 1;
  return `${prefix}-${year}-${String(nextSeq).padStart(3, '0')}`;
}
