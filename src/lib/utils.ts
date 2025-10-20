import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidIsoDate(str: string): boolean {
  return /^\\d{4}-\\d{2}-\\d{2}$/.test(str);
}
