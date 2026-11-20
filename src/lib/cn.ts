import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the custom radius/shadow tokens from src/index.css
// so e.g. `rounded-card` correctly overrides `rounded-[22px]`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["card", "group"],
      shadow: ["card", "sheet", "device", "modal", "btn", "send", "mic"],
      breakpoint: ["desk"],
    },
  },
});

/** Join class names; later Tailwind utilities override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
