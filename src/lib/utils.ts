import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GRID_SIZE } from "@/types/domain";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function snapToGrid(value: number, grid = GRID_SIZE): number {
  return Math.round(value / grid) * grid;
}

export function snapPosition(
  p: { x: number; y: number },
  grid = GRID_SIZE,
): { x: number; y: number } {
  return { x: snapToGrid(p.x, grid), y: snapToGrid(p.y, grid) };
}

export function clampText(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max);
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): ((...args: Args) => void) & { cancel: () => void; flush: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Args | null = null;
  const wrapped = (...args: Args) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (lastArgs) fn(...lastArgs);
    }, delayMs);
  };
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };
  wrapped.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      if (lastArgs) fn(...lastArgs);
    }
  };
  return wrapped;
}

export function isoNow(): string {
  return new Date().toISOString();
}
