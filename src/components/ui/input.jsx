import React from "react";
import { cn } from "@/lib/utils";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none transition placeholder:text-stone-500 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/15",
        className
      )}
      {...props}
    />
  );
}

