"use client";
import React from "react";
import ProgressBar from "./ProgressBar";

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <ProgressBar />
      <p className="text-emerald-500 mt-4">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
