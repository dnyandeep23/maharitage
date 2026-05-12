"use client";

import React, { useState, useEffect } from "react";
import ModifyInscriptionForm from "./ModifyInscriptionForm";
import ConfirmationModal from "../components/ConfirmationModal";

import LoadingButton from "../components/LoadingButton";
import { api } from "@/lib/api";
import { fetchWithInternalToken } from "../../../../lib/fetch";
import { ArrowLeft, FileText, MapPin, Pencil, Trash2 } from "lucide-react";

const ManageInscriptions = ({ showDelete = false, handleSubmit }) => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [editingInscription, setEditingInscription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inscriptionToDelete, setInscriptionToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetchWithInternalToken("/api/sites");
        const data = await response.json();
        console.log(data);
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

  const handleSiteSelect = (site) => {
    setSelectedSite(site);
    setEditingInscription(null);
  };

  const handleModify = (inscription) => {
    setEditingInscription(inscription);
  };

  const handleUpdate = (updatedInscription) => {
    const updatedSite = { ...selectedSite };
    const updatedinscriptions = updatedSite.inscriptions.map((i) =>
      i.inscription_id === updatedInscription.inscription_id
        ? updatedInscription
        : i
    );
    updatedSite.inscriptions = updatedinscriptions;
    setSelectedSite(updatedSite);

    const updatedSites = sites.map((s) =>
      s.site_id === updatedSite.site_id ? updatedSite : s
    );
    setSites(updatedSites);
    setEditingInscription(null);
  };

  const handleCancel = () => {
    setEditingInscription(null);
  };

  const handleDeleteClick = (inscription) => {
    setInscriptionToDelete(inscription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setInscriptionToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!inscriptionToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetchWithInternalToken(
        `/api/inscriptions/${inscriptionToDelete.inscription_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${api.getToken()}`,
          },
        }
      );

      if (response.ok) {
        const updatedinscriptions = selectedSite.inscriptions.filter(
          (i) => i.inscription_id !== inscriptionToDelete.inscription_id
        );
        const updatedSite = {
          ...selectedSite,
          inscriptions: updatedinscriptions,
        };
        setSelectedSite(updatedSite);

        const updatedSites = sites.map((s) =>
          s.site_id === selectedSite.site_id ? updatedSite : s
        );
        setSites(updatedSites);
      }
    } catch (error) {
      console.error("Error deleting inscription:", error);
    } finally {
      setIsDeleting(false);
      handleCloseModal();
    }
  };

  if (isLoading || isDeleting) {
    return <LoadingButton />;
  }

  if (editingInscription) {
    return (
      <ModifyInscriptionForm
        inscription={editingInscription}
        onUpdate={handleUpdate}
        onCancel={handleCancel}
        siteId={selectedSite.site_id}
        handleSubmit={handleSubmit}
      />
    );
  }

  if (selectedSite) {
    return (
      <div className="dashboard-section mx-auto w-full max-w-6xl">
        <button
          onClick={() => setSelectedSite(null)}
          className="dashboard-secondary-button mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </button>
        <div className="mb-6">
          <p className="archive-kicker text-[#8a6a31]">Epigraphy records</p>
          <h2 className="dashboard-section-title mt-2 text-3xl sm:text-4xl">
            {selectedSite.site_name}
          </h2>
          <p className="dashboard-section-copy mt-3 text-sm">
            Review, suggest changes, or manage inscriptions linked to this heritage site.
          </p>
        </div>
        <div className="grid gap-4">
          {selectedSite.inscriptions &&
            selectedSite.inscriptions.map((inscription) => (
              <div
                key={inscription.inscription_id || inscription.Inscription_id}
                className="dashboard-list-card flex flex-col justify-between gap-4 p-4 transition lg:flex-row lg:items-center"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-lg font-bold text-[#123327]">
                    <FileText className="h-5 w-5 text-[#8a6a31]" />
                    {inscription.inscription_id || inscription.Inscription_id}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                    {(inscription.description || inscription.discription)?.substring(0, 160) ||
                      "No description available"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleModify(inscription)}
                    className="dashboard-primary-button"
                  >
                    <Pencil className="h-4 w-4" />
                    Suggest Changes
                  </button>
                  {showDelete && (
                    <button
                      onClick={() => handleDeleteClick(inscription)}
                      className="dashboard-danger-button"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
        {inscriptionToDelete && (
          <ConfirmationModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onConfirm={handleConfirmDelete}
            requiredText={`delete inscription ${inscriptionToDelete.inscription_id}`}
          />
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-section mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <p className="archive-kicker text-[#8a6a31]">Inscription workflow</p>
        <h2 className="dashboard-section-title mt-2 text-3xl sm:text-4xl">
          Select a Site
        </h2>
        <p className="dashboard-section-copy mt-3 text-sm">
          Choose a heritage record to view and manage its inscription data.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sites.map((site) => (
          <button
            key={site.site_id}
            onClick={() => handleSiteSelect(site)}
            className="dashboard-list-card flex items-center justify-between p-4 text-left transition"
          >
            <div>
              <p className="text-lg font-bold text-[#123327]">{site.site_name}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-stone-500">
                <MapPin className="h-4 w-4 text-[#8a6a31]" />
                {site.location?.district}, {site.location?.state}
              </p>
            </div>
            <span className="dashboard-badge">{site.inscriptions?.length || 0} inscriptions</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ManageInscriptions;
