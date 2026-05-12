"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { ShieldCheck, Trash2, UserCog } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import { api } from "../../../../lib/api";
import LoadingButton from "../components/LoadingButton";
import { fetchWithInternalToken } from "../../../../lib/fetch";

const ManageAdmins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetchWithInternalToken("/api/admins", {
          headers: {
            Authorization: `Bearer ${api.getToken()}`,
          },
        });
        const data = await response.json();
        setAdmins(data);
      } catch (error) {
        console.error("Error fetching admins:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
      fetchAdmins();
    }
  }, [user]);

  const handleDeleteClick = (admin) => {
    if (admin._id === "68f89e38ca0c300f586e70fd") {
      setMessage({ type: "error", text: "Cannot delete superadmin." });
      return;
    }
    setAdminToDelete(admin);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAdminToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetchWithInternalToken(`/api/admins/${adminToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${api.getToken()}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setAdmins(admins.filter((admin) => admin._id !== adminToDelete._id));
        setMessage({
          type: "success",
          text: "Admin role removed successfully.",
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to remove admin role.",
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
      setIsDeleting(false);
      handleCloseModal();
    }
  };

  if (isLoading || isDeleting) {
    return <LoadingButton />;
  }

  return (
    <div className="dashboard-section mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <p className="archive-kicker text-[#8a6a31]">Access control</p>
        <h2 className="dashboard-section-title mt-2 text-3xl sm:text-4xl">Manage Admins</h2>
        <p className="dashboard-section-copy mt-3 text-sm">
          Review administrative accounts and remove elevated access when required.
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
      <div className="grid gap-4">
        {Array.isArray(admins) && admins.length > 0 ? (
          admins.map((admin) => (
            <div
              key={admin._id}
              className="dashboard-list-card flex items-center justify-between gap-4 p-4 transition"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#123327] text-[#fffaf0]">
                  <UserCog className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-[#123327]">{admin.username}</p>
                  <p className="truncate text-sm text-stone-500">{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="dashboard-badge hidden sm:inline-flex">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  admin
                </span>
              <button
                onClick={() => handleDeleteClick(admin)}
                disabled={admin._id === "68f89e38ca0c300f586e70fd"}
                className="dashboard-danger-button min-h-10 px-3 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label={`Remove ${admin.username} admin access`}
              >
                <Trash2 size={20} />
              </button>
              </div>
            </div>
          ))
        ) : (
          <div className="dashboard-panel-quiet p-8 text-center text-stone-500">No admins found.</div>
        )}
      </div>

      {adminToDelete && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
          requiredText={`delete admin ${adminToDelete.username}`}
        />
      )}
    </div>
  );
};

export default ManageAdmins;
