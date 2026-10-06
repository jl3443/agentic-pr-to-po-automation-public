import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCountdown(hours: number): string {
  if (hours <= 0) return '0h 0m';
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function getCutoffColor(hours: number): string {
  if (hours > 24) return 'text-green-600';
  if (hours > 4) return 'text-amber-600';
  if (hours > 1) return 'text-orange-600';
  return 'text-red-600';
}