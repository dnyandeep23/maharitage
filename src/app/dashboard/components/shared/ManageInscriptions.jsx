"use client";

import React, { useState, useEffect } from "react";
import ModifyInscriptionForm from "./ModifyInscriptionForm";
import ConfirmationModal from "../components/ConfirmationModal";

import LoadingButton from "../components/LoadingButton";
import { api } from "@/lib/api";

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
        const response = await fetch("/api/sites");
        const data = await response.json();
        setSites(data);
      } catch (error) {
        console.error("Error fetching sites:", error);
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
    const updatedInscriptions = updatedSite.Inscriptions.map((i) =>
      i.Inscription_id === updatedInscription.Inscription_id
        ? updatedInscription
        : i
    );
    updatedSite.Inscriptions = updatedInscriptions;
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
      const response = await fetch(
        `/api/inscriptions/${inscriptionToDelete.Inscription_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${api.getToken()}`,
          },
        }
      );

      if (response.ok) {
        const updatedInscriptions = selectedSite.Inscriptions.filter(
          (i) => i.Inscription_id !== inscriptionToDelete.Inscription_id
        );
        const updatedSite = {
          ...selectedSite,
          Inscriptions: updatedInscriptions,
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
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedSite(null)}
          className="mb-4 text-green-800 hover:underline"
        >
          {" "}
          &larr; Back to Sites
        </button>
        <h2 className="text-2xl font-bold mb-6">
          Manage Inscriptions for {selectedSite.site_name}
        </h2>
        <div className="space-y-4">
          {selectedSite.Inscriptions &&
            selectedSite.Inscriptions.map((inscription) => (
              <div
                key={inscription.Inscription_id}
                className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md"
              >
                <div>
                  <p className="font-semibold text-lg">
                    {inscription.Inscription_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    {inscription.description?.substring(0, 100) ||
                      "No description available"}
                    ...
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleModify(inscription)}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Modify
                  </button>
                  {showDelete && (
                    <button
                      onClick={() => handleDeleteClick(inscription)}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
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
            requiredText={`delete inscription ${inscriptionToDelete.Inscription_id}`}
          />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">
        Select a Site to Manage Inscriptions
      </h2>
      <div className="space-y-4">
        {sites.map((site) => (
          <div
            key={site.site_id}
            onClick={() => handleSiteSelect(site)}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-50"
          >
            <div>
              <p className="font-semibold text-lg">{site.site_name}</p>
              <p className="text-sm text-gray-600">
                {site.location.district}, {site.location.state}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageInscriptions;
