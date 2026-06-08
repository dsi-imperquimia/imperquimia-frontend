import { clsx, type ClassArray } from "clsx";
import { twMerge } from "tailwind-merge";

type ArgumentArray = ClassArray;

export function cn(...inputs: ArgumentArray) {
  return twMerge(clsx(inputs));
}
