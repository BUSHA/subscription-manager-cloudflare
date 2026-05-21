import { Subscription } from '@/types';
import { addDays, addMonths, addWeeks, addYears } from 'date-fns';

export function computeNextDueDates(subscription: Subscription): Date[] {
  const now = new Date();
  const dueDate = new Date(subscription.dueDate);
  let nextDueDate = dueDate;
  const dueDates: Date[] = [];
  const oneMonthLater = addMonths(now, 1);

  while (nextDueDate <= oneMonthLater) {
    if (nextDueDate >= now) {
      dueDates.push(nextDueDate);
    }

    const interval = subscription.intervalValue || 1;

    switch (subscription.intervalUnit) {
      case 'days':
        nextDueDate = addDays(nextDueDate, interval);
        break;
      case 'weeks':
        nextDueDate = addWeeks(nextDueDate, interval);
        break;
      case 'months':
        nextDueDate = addMonths(nextDueDate, interval);
        break;
      case 'years':
        nextDueDate = addYears(nextDueDate, interval);
        break;
      default:
        return dueDates;
    }
  }

  return dueDates;
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function getRandomColor(): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEEAD', // Yellow
    '#D4A5A5', // Pink
    '#9B59B6', // Purple
    '#3498DB', // Light Blue
    '#E67E22', // Orange
    '#2ECC71', // Emerald
    '#F1C40F', // Sun Yellow
    '#E74C3C', // Dark Red
    '#1ABC9C', // Turquoise
    '#9B59B6', // Amethyst
    '#34495E', // Dark Blue
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

const TAG_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.2)', text: '#818cf8' },
  { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
  { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
  { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
  { bg: 'rgba(139, 92, 246, 0.2)', text: '#a78bfa' },
  { bg: 'rgba(236, 72, 153, 0.2)', text: '#f472b6' },
  { bg: 'rgba(20, 184, 166, 0.2)', text: '#2dd4bf' },
  { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c' },
  { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
  { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' },
  { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc' },
  { bg: 'rgba(244, 63, 94, 0.2)', text: '#fb7185' },
  { bg: 'rgba(14, 165, 233, 0.2)', text: '#38bdf8' },
  { bg: 'rgba(234, 179, 8, 0.2)', text: '#facc15' },
];

export function getTagColor(tag: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i);
    hash |= 0;
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
} 