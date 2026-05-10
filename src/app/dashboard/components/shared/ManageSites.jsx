"use client";

import React, { useState, useEffect } from "react";
import {
  Castle,
  Landmark,
  MapPin,
  PencilLine,
  Search,
  Trash2,
} from "lucide-react";
import ModifySiteForm from "./ModifySiteForm";
import ConfirmationModal from "../components/ConfirmationModal";

import LoadingButton from "../components/LoadingButton";
import { api } from "@/lib/api";
import { fetchWithInternalToken } from "../../../../lib/fetch";

const ManageSites = ({ showDelete = false, handleSubmit }) => {
  const [sites, setSites] = useState([]);
  const [editingSite, setEditingSite] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
        setIsLoading(false);
      }
    };
    fetchSites();
  }, []);

  const handleModify = (site) => {
    setEditingSite(site);
  };

  const handleUpdate = (updatedSite) => {
    setSites(
      sites.map((s) => (s.site_id === updatedSite.site_id ? updatedSite : s))
    );
    setEditingSite(null);
  };

  const handleCancel = () => {
    setEditingSite(null);
  };

  const handleDeleteClick = (site) => {
    setSiteToDelete(site);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSiteToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!siteToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetchWithInternalToken(`/api/sites/${siteToDelete.site_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${api.getToken()}`,
        },
      });

      if (response.ok) {
        setSites(sites.filter((s) => s.site_id !== siteToDelete.site_id));
      }
    } catch (error) {
      console.error("Error deleting site:", error);
    } finally {
      setIsDeleting(false);
      handleCloseModal();
    }
  };

  if (isLoading || isDeleting) {
    return <LoadingButton />;
  }

  if (editingSite) {
    return (
      <ModifySiteForm
        site={editingSite}
        onUpdate={handleUpdate}
        onCancel={handleCancel}
        handleSubmit={handleSubmit}
      />
    );
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSites = normalizedSearch
    ? sites.filter((site) => {
        const locationParts = [
          site.location?.district,
          site.location?.state,
          site.location?.country,
        ]
          .filter(Boolean)
          .join(" ");
        return `${site.site_name || ""} ${locationParts}`
          .toLowerCase()
          .includes(normalizedSearch);
      })
    : sites;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 text-stone-900 sm:px-6">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="archive-kicker">Archive Workspace</p>
          <h2 className="archive-title mt-2 text-3xl sm:text-4xl">
            Suggest Changes to Sites
          </h2>
          <p className="archive-copy mt-3 max-w-2xl text-sm">
            Review registered heritage records and open a structured change
            request for the site that needs attention.
          </p>
        </div>

        <div className="archive-stat-card flex min-w-full items-center gap-4 p-4 sm:min-w-[16rem]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#123327] text-[#fffaf0] shadow-lg shadow-emerald-950/10">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <p className="archive-label">Available Sites</p>
            <p className="mt-1 text-2xl font-bold text-[#123327]">
              {sites.length}
            </p>
          </div>
        </div>
      </div>

      <div className="museum-card-premium mb-6 p-4 sm:p-5">
        <div className="relative z-10">
          <label htmlFor="site-search" className="archive-label mb-2 block">
            Find a site
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a6a31]" />
            <input
              id="site-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, district, state, or country"
              className="archive-input w-full rounded-2xl py-3 pl-12 pr-4 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSites.map((site) => {
          const district = site.location?.district;
          const state = site.location?.state;
          const country = site.location?.country;
          const locationLabel =
            [district, state].filter(Boolean).join(", ") ||
            country ||
            "Location not specified";

          return (
            <article
              key={site.site_id}
              className="archive-stat-card group flex min-h-[12.5rem] flex-col justify-between overflow-hidden p-4 sm:p-5"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d9c18a]/40 bg-[#fffaf0]/80 text-[#8a6a31] shadow-sm">
                    <Castle className="h-5 w-5" />
                  </div>
                  {site.site_id && (
                    <span className="rounded-full border border-[#8a6a31]/20 bg-[#fffaf0]/70 px-2.5 py-1 text-[0.68rem] font-bold leading-none text-[#8a6a31]">
                      {site.site_id}
                    </span>
                  )}
                </div>

                <h3 className="font-cinzel-decorative text-lg font-bold leading-tight text-[#123327] sm:text-xl">
                  {site.site_name}
                </h3>
                <p className="mt-2.5 flex items-start gap-2 text-sm leading-6 text-stone-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6a31]" />
                  <span>{locationLabel}</span>
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleModify(site)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#123327]/12 bg-[#123327] px-4 text-xs font-bold text-[#fffaf0] shadow-[0_12px_28px_rgba(18,51,39,0.18)] transition hover:-translate-y-0.5 hover:bg-[#071b15] hover:shadow-[0_16px_34px_rgba(18,51,39,0.22)]"
                >
                  <PencilLine className="h-4 w-4" />
                  <span className="whitespace-nowrap">Suggest</span>
                </button>
                {showDelete && (
                  <button
                    onClick={() => handleDeleteClick(site)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-red-200/80 bg-[#fffaf0]/76 px-3.5 text-xs font-bold text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="whitespace-nowrap">Delete</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {filteredSites.length === 0 && (
        <div className="museum-card-premium mt-6 p-8 text-center">
          <div className="relative z-10 mx-auto flex max-w-md flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#123327] text-[#fffaf0]">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-cinzel-decorative text-xl font-bold text-[#123327]">
              No matching sites
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Try a different site name, district, state, or country.
            </p>
          </div>
        </div>
      )}
      {siteToDelete && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
          requiredText={`delete site ${siteToDelete.site_name}`}
        />
      )}
    </div>
  );
};

export default ManageSites;
