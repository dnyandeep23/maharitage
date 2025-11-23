export default function ChatSpin() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-6">
      {/* Apple-style spinner */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-emerald-500 rounded-full"
            style={{
              width: "clamp(3px, 0.5vw, 6px)",
              height: "clamp(12px, 2vw, 20px)",
              left: "50%",
              top: "50%",
              transformOrigin: `0 ${
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "32px"
                  : typeof window !== "undefined" && window.innerWidth < 768
                  ? "40px"
                  : "48px"
              }`,
              transform: `rotate(${i * 30}deg) translate(-50%, -50%)`,
              opacity: 1 - i * 0.1,
              animation: `spinFade 1.2s linear infinite`,
              animationDelay: `${-i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <p className="text-emerald-600 mt-2 font-medium text-base sm:text-lg md:text-xl tracking-wide">
        Loading...
      </p>

      <style>{`
        @keyframes spinFade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0.15;
          }
        }
      `}</style>
    </div>
  );
}
