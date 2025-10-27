"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../component/Header";
import Footer from "../component/Footer";

const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (query) {
        // In a real application, you would fetch search results from an API
        // For now, we'll just simulate a delay and display the query
        setTimeout(() => {
          setSearchResults([`Results for "${query}"`]);
          setIsLoading(false);
        }, 1000);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleNavigation = (path) => {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="full" handleNavigation={handleNavigation} />
      <main className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Search Results</h1>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {searchResults.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer handleNavigation={handleNavigation} />
    </div>
  );
};

const SearchPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <SearchPageContent />
  </Suspense>
);

export default SearchPage;
