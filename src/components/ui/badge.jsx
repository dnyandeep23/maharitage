import React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className = "", tone = "neutral", ...props }) {
  const tones = {
    neutral: "border-white/10 bg-white/8 text-stone-200",
    get: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
    post: "border-sky-300/30 bg-sky-300/10 text-sky-200",
    warn: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

