import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function handleEdgeError(error: any) {
  if (!error) return;
  let msg = error.message;
  if (error.context && typeof error.context.json === 'function') {
    try {
      const body = await error.context.json();
      if (body?.error) msg = body.error;
    } catch (e) {}
  }
  throw new Error(msg);
}
