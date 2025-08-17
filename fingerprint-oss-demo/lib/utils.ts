import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges class name inputs into a single Tailwind-safe class string.
 *
 * Accepts the same variety of inputs as `clsx` (strings, arrays, objects, etc.), then resolves them into a single class string and applies Tailwind-specific merging to remove/resolve conflicting utility classes.
 *
 * @param inputs - Class values (strings, arrays, objects, etc.) accepted by `clsx`
 * @returns A merged className string with Tailwind utilities resolved and duplicates/conflicts merged
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
