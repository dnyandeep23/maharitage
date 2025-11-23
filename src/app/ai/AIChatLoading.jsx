import { MessageSquare, Zap, Bot } from "lucide-react";

export default function AIChatLoading() {
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="relative inline-flex items-center justify-center">
        {/* Glowing background effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-green-500/30 rounded-full blur-3xl w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80"
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        ></div>

        {/* Main chat bubble with bot icon */}
        <div className="relative z-10">
          <div className="relative">
            <MessageSquare
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-emerald-500 drop-shadow-2xl"
              strokeWidth={1.5}
            />
            <Bot
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse drop-shadow-xl"
              strokeWidth={2}
              style={{ animationDuration: "1.5s" }}
            />

            {/* Lightning effects */}
            <Zap
              className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-900 absolute -top-2 -right-2 sm:-top-3 sm:-right-3 md:-top-4 md:-right-4 drop-shadow-lg"
              style={{ animation: "zap 1.5s ease-in-out infinite" }}
            />
            <Zap
              className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-emerald-400 absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 md:-bottom-4 md:-left-4 drop-shadow-lg"
              style={{
                animation: "zap 1.5s ease-in-out infinite",
                animationDelay: "0.5s",
              }}
            />
            <Zap
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-teal-400 absolute top-0 -left-4 sm:-left-6 md:-left-8 drop-shadow-lg"
              style={{
                animation: "zap 1.5s ease-in-out infinite",
                animationDelay: "1s",
              }}
            />
          </div>

          {/* Expanding rings from chat bubble */}
          <span
            className="absolute inset-0 rounded-lg border-2 border-emerald-400"
            style={{
              animation: "expandRing 2.5s ease-out infinite",
            }}
          ></span>
          <span
            className="absolute inset-0 rounded-lg border-2 border-teal-400"
            style={{
              animation: "expandRing 2.5s ease-out 0.8s infinite",
            }}
          ></span>
          <span
            className="absolute inset-0 rounded-lg border-2 border-green-400"
            style={{
              animation: "expandRing 2.5s ease-out 1.6s infinite",
            }}
          ></span>
        </div>

        {/* Orbiting particles - responsive sizes */}
        <span
          className="absolute w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-emerald-400 rounded-full shadow-xl shadow-emerald-400/70"
          style={{
            animation: "orbit1 4s linear infinite",
          }}
        ></span>
        <span
          className="absolute w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-teal-400 rounded-full shadow-xl shadow-teal-400/70"
          style={{
            animation: "orbit2 4s linear infinite",
          }}
        ></span>
        <span
          className="absolute w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-green-400 rounded-full shadow-xl shadow-green-400/70"
          style={{
            animation: "orbit3 4s linear infinite",
          }}
        ></span>
        <span
          className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full shadow-xl shadow-yellow-400/70"
          style={{
            animation: "orbit4 4s linear infinite",
          }}
        ></span>
        <span
          className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-emerald-300 rounded-full shadow-xl shadow-emerald-300/70"
          style={{
            animation: "orbit5 4s linear infinite",
          }}
        ></span>

        {/* Additional floating particles */}
        <span
          className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-teal-300 rounded-full shadow-lg"
          style={{
            animation: "float1 3s ease-in-out infinite",
          }}
        ></span>
        <span
          className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-green-300 rounded-full shadow-lg"
          style={{
            animation: "float2 3.5s ease-in-out infinite",
          }}
        ></span>
        <span
          className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-emerald-300 rounded-full shadow-lg"
          style={{
            animation: "float3 4s ease-in-out infinite",
          }}
        ></span>
      </div>

      <style>{`
        @keyframes expandRing {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes zap {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(10deg);
          }
        }

        @keyframes orbit1 {
          0% {
            transform: rotate(0deg) translateX(80px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(80px) rotate(-360deg);
          }
        }

        @keyframes orbit2 {
          0% {
            transform: rotate(72deg) translateX(80px) rotate(-72deg);
          }
          100% {
            transform: rotate(432deg) translateX(80px) rotate(-432deg);
          }
        }

        @keyframes orbit3 {
          0% {
            transform: rotate(144deg) translateX(80px) rotate(-144deg);
          }
          100% {
            transform: rotate(504deg) translateX(80px) rotate(-504deg);
          }
        }

        @keyframes orbit4 {
          0% {
            transform: rotate(216deg) translateX(80px) rotate(-216deg);
          }
          100% {
            transform: rotate(576deg) translateX(80px) rotate(-576deg);
          }
        }

        @keyframes orbit5 {
          0% {
            transform: rotate(288deg) translateX(80px) rotate(-288deg);
          }
          100% {
            transform: rotate(648deg) translateX(80px) rotate(-648deg);
          }
        }

        @keyframes float1 {
          0%, 100% {
            transform: translate(60px, -40px);
            opacity: 0.3;
          }
          50% {
            transform: translate(80px, -60px);
            opacity: 0.8;
          }
        }

        @keyframes float2 {
          0%, 100% {
            transform: translate(-60px, 40px);
            opacity: 0.3;
          }
          50% {
            transform: translate(-80px, 60px);
            opacity: 0.8;
          }
        }

        @keyframes float3 {
          0%, 100% {
            transform: translate(40px, 60px);
            opacity: 0.3;
          }
          50% {
            transform: translate(60px, 80px);
            opacity: 0.8;
          }
        }

        @media (min-width: 640px) {
          @keyframes orbit1, @keyframes orbit2, @keyframes orbit3, @keyframes orbit4, @keyframes orbit5 {
            0% { transform: rotate(var(--start)) translateX(100px) rotate(calc(-1 * var(--start))); }
            100% { transform: rotate(calc(var(--start) + 360deg)) translateX(100px) rotate(calc(-1 * (var(--start) + 360deg))); }
          }
        }

        @media (min-width: 768px) {
          @keyframes orbit1, @keyframes orbit2, @keyframes orbit3, @keyframes orbit4, @keyframes orbit5 {
            0% { transform: rotate(var(--start)) translateX(120px) rotate(calc(-1 * var(--start))); }
            100% { transform: rotate(calc(var(--start) + 360deg)) translateX(120px) rotate(calc(-1 * (var(--start) + 360deg))); }
          }
        }
      `}</style>
    </div>
  );
}
