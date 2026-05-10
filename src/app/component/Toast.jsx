"use client";

import { CircleCheck, CircleX, TriangleAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Toast = ({ message, type, onClose }) => {
  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-500/90",
          border: "border-emerald-400/50",
          icon: <CircleCheck className="h-5 w-5 text-white" />,
        };
      case "warning":
        return {
          bg: "bg-amber-500/90",
          border: "border-amber-400/50",
          icon: <TriangleAlert className="h-5 w-5 text-white" />,
        };
      case "error":
        return {
          bg: "bg-red-500/90",
          border: "border-red-400/50",
          icon: <CircleX className="h-5 w-5 text-white" />,
        };
      default:
        return {
          bg: "bg-stone-800/90",
          border: "border-stone-700/50",
          icon: null,
        };
    }
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-6 left-1/2 z-[9999] flex w-max max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
        role="alert"
      >
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${styles.bg} ${styles.border} shadow-inner`}>
          {styles.icon}
        </div>
        <span className="text-sm font-medium tracking-wide text-white pr-4">
          {message}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close toast"
            className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default Toast;

