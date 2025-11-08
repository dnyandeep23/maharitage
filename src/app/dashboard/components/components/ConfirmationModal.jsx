"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, requiredText }) => {
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
    }
  }, [isOpen]);

  const isConfirmed = confirmationText === requiredText;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl border border-red-200 text-gray-200 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-12 h-12 text-yellow-400" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
              <p className="text-gray-400 text-sm mb-4">
                To confirm, type the following text exactly:
              </p>

              {/* Required Text */}
              <p className="font-mono bg-zinc-800 text-gray-100 p-2 rounded mb-4 border border-zinc-700">
                {requiredText}
              </p>

              {/* Input */}
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100 mb-6"
                placeholder="Type confirmation text..."
              />

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={!isConfirmed}
                  className={`px-4 py-2 rounded-full text-white font-semibold transition-all ${
                    isConfirmed
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-red-400 cursor-not-allowed"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
