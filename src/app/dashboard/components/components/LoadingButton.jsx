import { Landmark } from "lucide-react";

export default function LoadingButton() {
  return (
    <div className="flex min-h-[18rem] w-full items-center justify-center p-4">
      <div className="museum-card-premium w-full max-w-xl p-6 text-center sm:p-8">
        <div className="relative z-10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c18a]/40 bg-[#fffaf0]/80 text-[#8a6a31] shadow-[0_16px_34px_rgba(21,18,13,0.08)]">
          <Landmark className="h-7 w-7" />
        </div>

        <p className="relative z-10 archive-kicker">Archive workspace</p>
        <h2 className="relative z-10 mt-2 font-cinzel-decorative text-2xl font-bold text-[#123327]">
          Loading dashboard
        </h2>
        <p className="relative z-10 mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-600">
          Preparing records, permissions, and workspace controls.
        </p>

        <div className="relative z-10 mt-6 space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-3 overflow-hidden rounded-full bg-[#123327]/10"
            >
              <div
                className="h-full w-1/3 animate-[dashboardLoad_1.35s_var(--ease-archive)_infinite] rounded-full bg-[#b9924a]/80"
                style={{ animationDelay: `${item * 120}ms` }}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes dashboardLoad {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(340%); }
        }
      `}</style>
    </div>
  );
}
