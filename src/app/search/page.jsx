"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../component/Header";
import Footer from "../component/Footer";
import { Search, BrainCircuit } from "lucide-react";

const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (initialQuery) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/sites?q=${initialQuery}`);
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error("Error fetching search results:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [initialQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/search?q=${query}`);
  };

  return (
    <div className="min-h-screen flex flex-col text-gray-900  bg-green-50">
      <Header />
      <main className="flex-grow p-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="relative mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for sites, inscriptions, periods..."
              className="w-full p-4 pr-12 text-lg bg-white border-2 border-green-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              className="absolute top-1/2 right-4 -translate-y-1/2 text-green-600 hover:text-green-800"
            >
              <Search size={24} />
            </button>
          </form>

          {initialQuery && (
            <h1 className="text-2xl font-bold mb-6 text-green-900">
              Search Results for "{initialQuery}"
            </h1>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg text-green-800">Loading...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-6">
              {searchResults.map((site) => (
                <div
                  key={site.site_id}
                  className="bg-white p-6 relative rounded-2xl shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-xl font-bold text-emerald-800">
                      {site.site_name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {site.location.district}, {site.location.state}
                    </p>
                    <p className="mt-4 text-gray-700">
                      {site.Site_discription}
                    </p>
                  </div>

                  {/* Button Section */}
                  <div className="mt-6 flex justify-end">
                    <div className="relative group cursor-pointer">
                      <button
                        className="relative rounded-full bg-white hover:bg-green-800 transition-all duration-500 px-5 py-2 text-sm font-semibold "
                        onClick={() => router.push(`/cave/${site.site_id}`)}
                      >
                        <p className="text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-green-900 group-hover:text-white transition-all duration-500">
                          - Read More -
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-green-800">No records found.</p>
            </div>
          )}

          {initialQuery && (
            <div className="mt-12 text-center">
              <button
                onClick={() => router.push(`/ai?q=${initialQuery}`)}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
              >
                <BrainCircuit size={24} className="mr-3" />
                Ask AI about "{initialQuery}"
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const SearchPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <SearchPageContent />
  </Suspense>
);

export default SearchPage;
