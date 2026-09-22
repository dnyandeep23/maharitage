"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global Server Error (500):", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#071b15] text-[#fbf7ee]">
        <div className="flex min-h-screen flex-col items-center justify-center px-5 py-24 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,193,138,0.08),transparent_70%)]" />

          <section className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#071b15]/80 p-8 text-center sm:p-12 backdrop-blur-xl shadow-2xl">
            <p className="text-xs font-mono font-bold uppercase tracking-[0.24em] text-[#d9c18a]">
              Archive Interruption
            </p>

            <h1 className="mt-4 text-7xl font-extrabold tracking-tight text-[#d9c18a] sm:text-8xl">
              500
            </h1>

            <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white">
              Internal Server Error
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm text-[#fbf7ee]/75 leading-relaxed">
              The heritage archive system encountered an unhandled server error. Please try again or return to the main collection.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {reset && (
                <button
                  type="button"
                  onClick={() => reset()}
                  className="inline-flex items-center justify-center rounded-xl bg-[#d9c18a] px-6 py-3 text-xs font-bold text-[#071b15] shadow-lg shadow-[#d9c18a]/20 transition-all hover:bg-[#e4d1a3]"
                >
                  Try Again
                </button>
              )}

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold text-white transition-all hover:bg-white/10"
              >
                Return Home
              </Link>
            </div>
          </section>
        </div>
      </body>
    </html>
  );
}
