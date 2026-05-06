"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const QuizSkeleton = ({ label, variant = "full" }) => {
  const isInline = variant === "inline";

  return (
    <div
      className={`relative overflow-hidden border border-white/10 bg-white/5 ${
        isInline ? "mt-4 rounded-2xl p-4" : "rounded-[2rem] px-5 py-8 sm:px-7"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_36%)]" />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/15">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
            </motion.div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="mt-1 text-xs text-white/45">AI is thinking through the next quiz step.</p>
          </div>
          <div className="hidden shrink-0 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 sm:block">
            Thinking
          </div>
        </div>

        <div className="overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-1.5 rounded-full bg-[linear-gradient(90deg,#f59e0b,#10b981,#ec4899)]"
            animate={{ x: ["-35%", "125%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        </div>

        <div className="grid gap-3">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/15 p-5">
            <motion.div
              className="h-4 rounded-full bg-white/10"
              animate={{ opacity: [0.45, 0.95, 0.45] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
            <motion.div
              className="mt-3 h-4 w-2/3 rounded-full bg-white/8"
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                delay: 0.15,
                ease: "easeInOut",
              }}
            />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-[68px] rounded-2xl border border-white/8 bg-white/5"
              animate={{ opacity: [0.4, 0.85, 0.4] }}
              transition={{
                repeat: Infinity,
                duration: 1.35,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizSkeleton;
