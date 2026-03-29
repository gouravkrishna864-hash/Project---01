import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  if (!amount) return '₹0';
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatArea(sqft: number): string {
  return `${sqft.toLocaleString('en-IN')} sq.ft`;
}

export function bhkLabel(bedrooms: number | undefined): string {
  if (!bedrooms) return 'Studio';
  return `${bedrooms} BHK`;
}

export function getLeadPriorityColor(priority: string): string {
  switch (priority) {
    case 'hot': return 'text-red-600 bg-red-50 border-red-200';
    case 'warm': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'cold': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-600';
  if (score >= 45) return 'text-amber-500';
  return 'text-red-500';
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN');
}
