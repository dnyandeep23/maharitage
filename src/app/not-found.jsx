"use client";

import React from "react";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1
          className="text-9xl font-bold text-green-600"
          style={{ fontFamily: "Cinzel Decorative" }}
        >
          404
        </h1>
        <h2 className="text-3xl font-semibold mt-4 text-gray-800">
          Page Not Found
        </h2>
        <p className="text-lg mt-2 text-gray-600">
          The page you are looking for does not exist.
        </p>
        <Link href="/">
          <div className="mt-8 inline-block bg-green-600 text-white px-6 py-3 rounded-md text-lg hover:bg-green-700 transition-colors cursor-pointer">
            Go Back Home
          </div>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
