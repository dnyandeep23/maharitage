"use client";

import React, { useState, useEffect } from "react";
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Suggest Changes to Sites</h2>
      <div className="space-y-4">
        {sites.map((site) => (
          <div
            key={site.site_id}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md"
          >
            <div>
              <p className="font-semibold text-lg">{site.site_name}</p>
              <p className="text-sm text-gray-600">
                {site.location.district}, {site.location.state}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleModify(site)}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Suggest Changes
              </button>
              {showDelete && (
                <button
                  onClick={() => handleDeleteClick(site)}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
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
