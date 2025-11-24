"use client";

import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { api } from "../../../../lib/api";
import LoadingButton from "../components/LoadingButton";
import { fetchWithInternalToken } from "../../../../lib/fetch";

const AddAdmin = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetchWithInternalToken("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ email, username }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Admin created successfully!" });
        setEmail("");
        setUsername("");
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to create admin.",
        });
      }
    } catch (error) {
      if (error instanceof Response) {
        const result = await error.json();
        setMessage({
          type: "error",
          text: result.message || "An error occurred. Please try again.",
        });
      } else {
        setMessage({
          type: "error",
          text: "An error occurred. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingButton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Add New Admin</h2>
      {message && (
        <div
          className={`p-4 mb-4 text-sm rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
          />
        </div>
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Admin
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddAdmin;
