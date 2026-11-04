import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Story 1.79: tailwind-merge reads an unknown `text-<word>` as a colour, so without this
// cn('text-label', 'text-muted-foreground') would drop the size. The design's custom sizes,
// heights and corners from tailwind.config.ts are declared here.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["page-title", "page-title-sm", "card-title", "body", "label"] }],
      "min-h": [{ "min-h": ["touch"] }],
      h: [{ h: ["touch"] }],
      rounded: [{ rounded: ["card", "button"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
