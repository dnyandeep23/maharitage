"use client";

import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { api } from "../../../../lib/api";
import LoadingButton from "../components/LoadingButton";
import { fetchWithInternalToken } from "../../../../lib/fetch";
import { UserPlus } from "lucide-react";

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
    <div className="dashboard-section mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <p className="archive-kicker text-[#8a6a31]">Access control</p>
        <h2 className="dashboard-section-title mt-2 text-3xl sm:text-4xl">Add New Admin</h2>
        <p className="dashboard-section-copy mt-3 text-sm">
          Create an administrative account with a temporary password workflow.
        </p>
      </div>
      {message && (
        <div
          className={`mb-4 rounded-2xl border p-4 text-sm font-medium ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
              : "border-red-200 bg-red-50/80 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="dashboard-panel space-y-5 p-5 sm:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123327] text-[#fffaf0]">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <label
            htmlFor="username"
            className="archive-label mb-1 block"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="archive-input mt-1 block w-full rounded-2xl p-3 text-sm leading-6"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="archive-label mb-1 block"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="archive-input mt-1 block w-full rounded-2xl p-3 text-sm leading-6"
          />
        </div>
        <div className="pt-2">
          <div className="flex justify-end">
            <button
              type="submit"
              className="dashboard-primary-button"
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
