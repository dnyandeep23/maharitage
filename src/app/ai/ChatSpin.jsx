export default function ChatSpin() {
  return (
    <div className="flex w-full h-full flex-col justify-center items-center gap-3 py-4">
      {/* Smaller Apple-style spinner */}
      <div className="relative w-4 h-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-emerald-500 rounded-full"
            style={{
              width: "2px",
              height: "6px",
              left: "50%",
              top: "50%",
              transformOrigin: "0 10px", // smaller radius
              transform: `rotate(${i * 30}deg) translate(-50%, -50%)`,
              opacity: 1 - i * 0.08,
              animation: `spinFade 1.2s linear infinite`,
              animationDelay: `${-i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Smaller text for sidebar */}
      <p className="font-medium text-sm mt-5 text-center tracking-wide bg-clip-text text-transparent bg-[radial-gradient(circle,theme(colors.emerald.600),theme(colors.emerald.900))]">
        Hang on a sec,
        <br /> loading your chats.
      </p>

      <style>{`
        @keyframes spinFade {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
