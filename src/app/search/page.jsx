"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../component/Header";
import Footer from "../component/Footer";
import { ArrowUpRight, BrainCircuit, MapPin, Search } from "lucide-react";
import { fetchWithInternalToken } from "../../lib/fetch";

const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!initialQuery) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetchWithInternalToken(`/api/sites?q=${initialQuery}`);
        const data = await response.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [initialQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  return (
    <div className="heritage-surface heritage-texture flex min-h-screen flex-col text-stone-900">
      <Header currentPath="/search" theme="light" />

      <main className="grow px-4 pb-28 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:px-14">
        <section className="mx-auto max-w-6xl">
          <p className="archive-kicker">
            Archive Search
          </p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-cinzel-decorative text-4xl font-bold leading-tight text-[#263a2d] md:text-6xl">
                Discover records
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-700 md:text-base">
                Search across heritage sites, periods, districts, inscriptions, and archival descriptions.
              </p>
            </div>

            {initialQuery && (
              <button
                onClick={() => router.push(`/ai?q=${encodeURIComponent(initialQuery)}`)}
                className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-[#263a2d]/15 bg-[#263a2d] px-5 py-3 text-sm font-bold text-[#f7f0e4] shadow-[0_18px_40px_rgba(18,51,39,0.18)] transition hover:bg-[#101b15]"
              >
                <BrainCircuit className="h-5 w-5" />
                Ask AI about this
              </button>
            )}
          </div>

          <form onSubmit={handleSearch} className="museum-card mt-8 flex flex-col items-stretch gap-2 p-2 sm:mt-9 sm:flex-row sm:items-center sm:rounded-full">
            <div className="flex min-h-12 flex-1 items-center">
            <Search className="ml-3 h-5 w-5 shrink-0 text-[#8f7244] sm:ml-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search forts, caves, inscriptions, periods..."
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-stone-900 placeholder-stone-500 outline-none"
            />
            </div>
            <button
              type="submit"
              className="min-h-11 rounded-full bg-[#263a2d] px-5 py-3 text-sm font-bold text-[#f7f0e4] transition hover:bg-[#101b15]"
            >
              Search
            </button>
          </form>

          {initialQuery && (
            <div className="mt-8 flex flex-col gap-3 border-b border-[#263a2d]/12 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-cinzel-decorative text-2xl font-bold leading-tight text-[#263a2d]">
                Results for “{initialQuery}”
              </h2>
              {!isLoading && (
                <span className="w-fit rounded-full border border-[#263a2d]/12 bg-[#f7f0e4]/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                  {searchResults.length} records
                </span>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="museum-card h-56 animate-pulse" />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {searchResults.map((site) => (
                <article
                  key={site.site_id}
                  className="museum-card group flex min-h-64 flex-col justify-between p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(21,18,13,0.14)] sm:p-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#263a2d]/8 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#263a2d]">
                        {site.heritage_type || site.h_type || "Record"}
                      </span>
                      {site.period && (
                        <span className="rounded-full bg-[#8f7244]/12 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#8f7244]">
                          {site.period}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 font-cinzel-decorative text-2xl font-bold text-[#263a2d]">
                      {site.site_name}
                    </h3>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-stone-500">
                      <MapPin className="h-4 w-4 text-[#8f7244]" />
                      {site.location?.district}, {site.location?.state}
                    </p>
                    <p className="mt-4 line-clamp-4 text-sm leading-7 text-stone-700">
                      {site.site_discription || site.site_description || site.description}
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#263a2d]/14 bg-[#f7f0e4]/70 px-4 py-2 text-sm font-bold text-[#263a2d] transition group-hover:bg-[#263a2d] group-hover:text-[#f7f0e4]"
                      onClick={() => router.push(`/heritage/${site.site_id}`)}
                    >
                      Open Record
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="museum-card mt-10 px-6 py-14 text-center">
              <p className="font-cinzel-decorative text-2xl font-bold text-[#263a2d]">
                No records found
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-600">
                Try a fort name, district, dynasty, period, or inscription keyword.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

const SearchPage = () => (
  <Suspense fallback={<div className="min-h-screen bg-[#f7f3ea]" />}>
    <SearchPageContent />
  </Suspense>
);

export default SearchPage;
