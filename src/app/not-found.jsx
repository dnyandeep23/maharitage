"use client";

import React from "react";
import Link from "next/link";
import Header from "./component/Header";

const NotFound = () => {
  return (
    <div className="archive-page flex min-h-screen flex-col">
      <Header theme="light" />
      <main className="flex grow items-center justify-center px-5 py-28">
        <section className="museum-card max-w-2xl p-8 text-center sm:p-12">
          <p className="archive-kicker">Archive gap</p>
          <h1 className="archive-title mt-4 text-7xl sm:text-8xl">404</h1>
          <h2 className="mt-5 font-cinzel-decorative text-3xl font-bold text-[#123327]">
            Record Not Found
          </h2>
          <p className="archive-copy mx-auto mt-4 max-w-md">
            This page is not part of the current MahaRitage collection. Search
            the archive or return to the main collection.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="archive-button">
              Go Home
            </Link>
            <Link href="/search" className="archive-button archive-button-secondary">
              Search Archive
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NotFound;
