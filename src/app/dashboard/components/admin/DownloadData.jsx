"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../../lib/api";
import LoadingButton from "../components/LoadingButton";
import { fetchWithInternalToken } from "../../../../lib/fetch";
import { Download, FileDown } from "lucide-react";

const DownloadData = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetchWithInternalToken("/api/sites");
        const data = await response.json();
        if (Array.isArray(data)) {
          setSites(data);
        } else {
          setSites([]);
        }
      } catch (error) {
        console.error("Error fetching sites:", error);
        setSites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const handleDownloadAll = async () => {
    setLoading(true);
    try {
      const response = await fetchWithInternalToken("/api/sites/download", {
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
      const response = await fetchWithInternalToken(
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
    <div className="dashboard-section mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <p className="archive-kicker text-[#8a6a31]">Archive export</p>
        <h2 className="dashboard-section-title mt-2 text-3xl sm:text-4xl">Download Site Data</h2>
        <p className="dashboard-section-copy mt-3 text-sm">
          Export the complete heritage archive or download one selected site as JSON.
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
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="dashboard-panel p-5 sm:p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123327] text-[#fffaf0]">
            <FileDown className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-[#123327]">Download All Sites</h3>
          <p className="mb-5 text-sm leading-6 text-stone-500">Export every site document currently stored in the archive.</p>
          <button
            onClick={handleDownloadAll}
            className="dashboard-primary-button"
          >
            <Download className="h-4 w-4" />
            Download All
          </button>
        </div>
        <div className="dashboard-panel p-5 sm:p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123327] text-[#fffaf0]">
            <Download className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-[#123327]">Download Single Site</h3>
          <p className="mb-5 text-sm leading-6 text-stone-500">Choose one record and export its complete JSON payload.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="archive-input block w-full rounded-2xl p-3 text-sm leading-6"
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
              className="dashboard-primary-button shrink-0"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadData;
