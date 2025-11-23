"use client";

import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";

const Notification = ({ message, type }) => {
  if (!message) return null;

  const bgColor =
    type === "success"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  return (
    <div
      className={`p-4 mb-4 text-sm rounded-lg ${bgColor}`}
      role="alert"
    >
      <span className="font-medium">{type === "success" ? "Success!" : "Error!"}</span> {message}
    </div>
  );
};

export default Notification;
