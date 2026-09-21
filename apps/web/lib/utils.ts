import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type React from "react";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function handleSpotlightMouseMove(e: React.MouseEvent<HTMLElement>): void {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
}
