import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseDateInput(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(date)) {
    const parts = date.split(":").map(Number);
    const d = new Date();
    d.setHours(parts[0], parts[1], parts[2] || 0, 0);
    return d;
  }
  return parseISO(date);
}

export function formatDate(date: string | Date, pattern: string = "yyyy-MM-dd") {
  try {
    const d = parseDateInput(date);
    return format(d, pattern);
  } catch {
    return typeof date === "string" ? date : "";
  }
}

export function formatDateTime(date: string | Date, pattern: string = "yyyy-MM-dd HH:mm") {
  try {
    const d = parseDateInput(date);
    return format(d, pattern);
  } catch {
    return typeof date === "string" ? date : "";
  }
}

export function formatTime(date: string | Date, pattern: string = "HH:mm") {
  try {
    const d = parseDateInput(date);
    return format(d, pattern);
  } catch {
    return typeof date === "string" ? date : "";
  }
}

export function formatRelativeDate(date: string | Date) {
  try {
    const d = parseDateInput(date);
    if (isToday(d)) {
      return "今天";
    }
    if (isYesterday(d)) {
      return "昨天";
    }
    return formatDate(d);
  } catch {
    return typeof date === "string" ? date : "";
  }
}

export function formatRelativeTime(date: string | Date) {
  try {
    const d = parseDateInput(date);
    return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
  } catch {
    return typeof date === "string" ? date : "";
  }
}

export function formatCurrency(amount: number, currency: string = "CNY") {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`;
  }
  if (hours > 0) {
    return `${hours}小时`;
  }
  return `${mins}分钟`;
}

export function generateId(prefix: string = "") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function getWeekDay(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  return `周${days[d.getDay()]}`;
}
