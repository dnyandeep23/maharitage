"use client";

import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";

const Toast = ({ message, type, onClose }) => {
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "warning"
      ? "bg-yellow-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-gray-700";

  return (
    <div
      className={`fixed top-1 right-[10%] left-[10%] text-white w-fit mx-auto px-6 py-3 rounded-lg shadow-lg animate-fade-in flex items-center gap-4 z-[999] ${bgColor}`}
      role="alert"
    >
      {type === "success" && <CircleCheck />}
      {type === "warning" && <TriangleAlert />}
      {type === "error" && <CircleX />}
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-xl font-bold leading-none hover:text-gray-200"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Toast;
