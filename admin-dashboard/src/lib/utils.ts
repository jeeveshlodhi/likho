import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function getFeedbackTypeColor(type: string): string {
  const colors: Record<string, string> = {
    bug: 'bg-red-100 text-red-800 border-red-200',
    feature: 'bg-blue-100 text-blue-800 border-blue-200',
    praise: 'bg-green-100 text-green-800 border-green-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[type] || colors.other;
}

export function getFeedbackStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[status] || colors.new;
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    ios: '🍎',
    android: '🤖',
    desktop: '💻',
    web: '🌐',
  };
  return icons[platform] || '❓';
}
