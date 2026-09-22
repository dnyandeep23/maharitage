"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Header from "./component/Header";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to console or error reporting service
    console.error("Internal Server Error (500):", error);
  }, [error]);

  return (
    <div className="archive-page flex min-h-screen flex-col bg-[#071b15] text-[#fbf7ee]">
      <Header theme="light" />
      
      <main className="flex grow items-center justify-center px-5 py-24 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,193,138,0.08),transparent_70%)]" />

        <section className="museum-card relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#071b15]/80 p-8 text-center sm:p-12 backdrop-blur-xl shadow-2xl">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.24em] text-[#d9c18a]">
            Archive Interruption
          </p>

          <h1 className="mt-4 font-cinzel text-7xl font-extrabold tracking-tight text-[#d9c18a] sm:text-8xl">
            500
          </h1>

          <h2 className="mt-4 font-cinzel-decorative text-2xl sm:text-3xl font-bold text-white">
            Server Disturbance Detected
          </h2>

          <p className="mx-auto mt-4 max-w-md text-sm text-[#fbf7ee]/75 leading-relaxed">
            The heritage archive encountered an unexpected internal error while retrieving records. Please try refreshing or return to the main collection.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {reset && (
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center justify-center rounded-xl bg-[#d9c18a] px-6 py-3 text-xs font-bold text-[#071b15] shadow-lg shadow-[#d9c18a]/20 transition-all hover:bg-[#e4d1a3] active:scale-[0.98]"
              >
                Try Again
              </button>
            )}

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-white/25 active:scale-[0.98]"
            >
              Return Home
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-xl border border-[#d9c18a]/30 bg-[#d9c18a]/10 px-6 py-3 text-xs font-bold text-[#d9c18a] transition-all hover:bg-[#d9c18a]/20 active:scale-[0.98]"
            >
              Search Archive
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
