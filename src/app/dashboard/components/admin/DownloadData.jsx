"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../../lib/api";
import LoadingButton from "../components/LoadingButton";

const DownloadData = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch("/api/sites");
        const data = await response.json();
        setSites(data);
      } catch (error) {
        console.error("Error fetching sites:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const handleDownloadAll = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sites/download", {
        headers: {
          Authorization: `Bearer ${api.getToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to download all sites");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "all_sites.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSingle = async () => {
    if (!selectedSite) {
      setMessage({ type: "error", text: "Please select a site." });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/sites/download?site_id=${selectedSite}`,
        {
          headers: {
            Authorization: `Bearer ${api.getToken()}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to download site");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const site = sites.find((s) => s.site_id === selectedSite);
      a.download = `${site.site_name}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingButton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Download Site Data</h2>
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
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Download All Sites</h3>
          <button
            onClick={handleDownloadAll}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Download All
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Download Single Site</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
            >
              <option value="" disabled>
                Select a site
              </option>
              {sites.map((site) => (
                <option key={site.site_id} value={site.site_id}>
                  {site.site_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleDownloadSingle}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadData;
