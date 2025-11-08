"use client";
import React from "react";

const ProgressBar = ({ size = "md", theme = "emerald" }) => {
  const sizes = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const themes = {
    emerald: "bg-emerald-500",
    green: "bg-green-500",
  };

  return (
    <div className={`w-full bg-gray-700 rounded-full ${sizes[size]}`}>
      <div
        className={`h-full rounded-full ${themes[theme]} animate-progress`}
      ></div>
    </div>
  );
};

export default ProgressBar;
