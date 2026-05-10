"use client";
import React from "react";
import { ArrowUpRight, FileText } from "lucide-react";

const ApiDocs = ({ handleNavigation }) => {
  return (
    <section className="cinematic-section py-20 md:py-28">
      <div className="relative z-10 mx-auto max-w-7xl px-5 text-center sm:px-8 lg:px-14">
        <div className="museum-card-premium mx-auto max-w-4xl px-6 py-12 sm:px-10 sm:py-16">
          <div className="relative z-10 mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#263a2d]/12 bg-[#263a2d]/8 text-[#263a2d] shadow-inner">
            <FileText className="h-8 w-8" />
          </div>
          <h2
            className="relative z-10 mb-5 font-cinzel-decorative text-3xl font-bold leading-tight text-[#123327] sm:text-5xl"
            style={{
              letterSpacing: "0.02em",
            }}
          >
            Access API Documentation
          </h2>
          <p
            className="relative z-10 mx-auto mb-9 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg"
            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
          >
            Integrate Maharashtra's heritage data into your applications with
            our comprehensive API.
          </p>
          <button
            onClick={() => handleNavigation("/docs")}
            className="archive-button relative z-10 px-8 py-4 text-base"
            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
          >
            Visit Docs
            <ArrowUpRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ApiDocs;
