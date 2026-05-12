import React from "react";
import { cn } from "@/lib/utils";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-[#111815]/88 shadow-[0_24px_80px_rgba(0,0,0,0.24)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
}

