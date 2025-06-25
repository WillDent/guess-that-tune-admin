// ABOUTME: Utility functions for class names and general helpers
// ABOUTME: Includes cn() function for merging Tailwind classes
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}