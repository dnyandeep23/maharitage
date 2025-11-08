"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { Trash2 } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";

const ManageAdmins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch("/api/admins", {
          headers: {
            Authorization: `Bearer ${user.token}`,
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

    try {
      const response = await fetch(`/api/admins/${adminToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
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
    }
    handleCloseModal();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Manage Admins</h2>
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
      <div className="space-y-4">
        {Array.isArray(admins) && admins.length > 0 ? (
          admins.map((admin) => (
            <div
              key={admin._id}
              className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md"
            >
              <div>
                <p className="font-semibold text-lg">{admin.username}</p>
                <p className="text-sm text-gray-600">{admin.email}</p>
              </div>
              <button
                onClick={() => handleDeleteClick(admin)}
                disabled={admin._id === "68f89e38ca0c300f586e70fd"}
                className="p-2 rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center">No admins found.</div>
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
