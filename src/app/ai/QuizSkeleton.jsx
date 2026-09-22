"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const QuizSkeleton = ({ variant = "full" }) => {
  const isInline = variant === "inline";

  return (
    <div
      className={`relative overflow-hidden border border-white/5 bg-[#05110d] ${
        isInline ? "mt-4 rounded-2xl p-4" : "rounded-3xl p-8 sm:p-10"
      }`}
      style={{
        boxShadow: "0 0 80px rgba(0,0,0,0.8), inset 0 0 40px rgba(217,193,138,0.02)",
      }}
    >
      {/* Background glow effects matching the screenshot */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#d9c18a]/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Subtle top glare */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Logo Icon */}
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] border border-[#d9c18a]/20 bg-gradient-to-br from-[#d9c18a]/10 to-transparent shadow-[0_0_20px_rgba(217,193,138,0.1)]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              >
                <Sparkles className="h-6 w-6 text-[#d9c18a]" />
              </motion.div>
            </div>
            
            {/* Brand Text */}
            <div className="flex flex-col">
              <h1 className="text-[26px] font-sans font-bold text-white tracking-wide leading-tight">
                HeritageX
              </h1>
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#d9c18a]/80 mt-1">
                Maharitage AI
              </p>
            </div>
          </div>

          {/* Analyzing Badge */}
          <div className="hidden shrink-0 rounded-[2rem] border border-[#d9c18a]/30 bg-transparent px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d9c18a]/80 sm:block shadow-[0_0_15px_rgba(217,193,138,0.1)]">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              Analyzing
            </motion.span>
          </div>
        </div>

        {/* Separator Line with Left Glow */}
        <div className="relative h-[2px] w-full bg-white/5 rounded-full mt-2 mb-2">
          <div className="absolute left-0 top-0 h-full w-[40%] bg-gradient-to-r from-[#d9c18a] via-[#d9c18a]/50 to-transparent rounded-full shadow-[0_0_15px_rgba(217,193,138,0.6)]" />
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-4">
          {/* Main Question Box */}
          <div className="overflow-hidden rounded-2xl bg-[#091b15] border border-white/[0.03] p-6 shadow-inner">
            <motion.div
              className="h-[18px] w-[95%] rounded-lg bg-white/[0.04]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <motion.div
              className="mt-4 h-[18px] w-[70%] rounded-lg bg-white/[0.04]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                repeat: Infinity,
                duration: 2,
                delay: 0.2,
                ease: "easeInOut",
              }}
            />
          </div>
          
          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-[76px] rounded-2xl border border-white/[0.03] bg-[#091b15] shadow-inner"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSkeleton;
