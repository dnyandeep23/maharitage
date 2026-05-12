import React from "react";
import { cn } from "@/lib/utils";

export function Button({ className = "", variant = "default", ...props }) {
  const variants = {
    default:
      "bg-emerald-400 text-emerald-950 hover:bg-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.22)]",
    secondary:
      "border border-white/10 bg-white/7 text-stone-100 hover:bg-white/12",
    ghost: "text-stone-300 hover:bg-white/8 hover:text-white",
    outline:
      "border border-emerald-300/30 bg-emerald-300/5 text-emerald-100 hover:bg-emerald-300/10",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

