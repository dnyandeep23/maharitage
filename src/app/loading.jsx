"use client";
import React from "react";

const Loading = ({ to }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-green-200 z-[9999] overflow-hidden">
      {/* Ripple Circles */}
      <div className="relative">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-[300px] h-[300px] border-2 border-emerald-500 rounded-full animate-[ripple_2.5s_ease-out_infinite]"
            style={{
              transform: "translate(-50%, -50%)",
              animationDelay: `${i * 0.6}s`,
            }}
          ></div>
        ))}

        {/* Central Circle Container */}
        <div className="relative w-[300px] h-[300px] flex flex-col items-center justify-center rounded-full border-2 border-emerald-500 bg-green-50 shadow-[0_10px_40px_rgba(16,185,129,0.1)] animate-fadeInUp">
          {/* Wave Animation */}
          <div className="flex items-center justify-center gap-1.5 h-10 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full animate-[wave_1.2s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>

          {/* Title */}
          <h1
            className="text-4xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: "Cinzel Decorative" }}
          >
            MahaRitage
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 font-medium mb-2">
            {to ? `Taking you to ${to}...` : "Setting things up for you"}
          </p>

          {/* Dots */}
          <div className="flex gap-2 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-emerald-500 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Keyframes via Tailwind */}
      <style>
        {`
          @keyframes wave {
            0%, 100% { transform: scaleY(0.5); }
            50% { transform: scaleY(1); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
          @keyframes ripple {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default Loading;
