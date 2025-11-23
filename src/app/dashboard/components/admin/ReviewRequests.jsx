import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  RefreshCcw,
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import DiffViewer from "../components/DiffViewer";
import { api } from "../../../../lib/api";
import LoadingButton from "../components/LoadingButton";
import { set } from "mongoose";

const statusIcons = {
  pending: <HelpCircle size={16} className="mr-1" />,
  approved: <CheckCircle size={16} className="mr-1" />,
  rejected: <XCircle size={16} className="mr-1" />,
  needs_update: <Clock size={16} className="mr-1" />,
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  needs_update: "bg-blue-100 text-blue-800",
};

const ReviewRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [actionType, setActionType] = useState(""); // 'reject' or 'update'
  const [expanded, setExpanded] = useState(null);
  const [loadingOriginal, setLoadingOriginal] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/research-requests", {
        headers: {
          Authorization: `Bearer ${api.getToken()}`,
        },
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }
      const data = await response.json();

      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, status, feedback = null) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/research-requests/${requestId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${api.getToken()}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ status, adminFeedback: feedback }),
      });

      if (!response.ok) {
        throw new Error("Failed to update request status");
      }
      console.log("Response:", response);
      const data = await response.json();
      console.log("Data:", data);
      fetchRequests(); // Refresh the list
      setFeedbackModalOpen(false);
      setAdminFeedback("");
      setCurrentRequest(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackModal = (request, type) => {
    setCurrentRequest(request);
    setActionType(type);
    setFeedbackModalOpen(true);
  };

  const closeFeedbackModal = () => {
    setFeedbackModalOpen(false);
    setAdminFeedback("");
    setCurrentRequest(null);
  };

  const submitFeedback = () => {
    if (currentRequest && adminFeedback.trim() !== "") {
      handleAction(
        currentRequest._id,
        actionType === "reject" ? "rejected" : "needs_update",
        adminFeedback
      );
    }
  };

  const fetchOriginalSite = async (siteId) => {
    try {
      const response = await fetch(`/api/sites/${siteId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch original site data");
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const toggleExpand = async (id) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      const request = requests.find((r) => r._id === id);
      if (request.action === "modify" && !request.originalSite) {
        setLoadingOriginal(id);
        const originalSite = await fetchOriginalSite(request.site_id);
        if (originalSite) {
          setRequests(
            requests.map((r) => (r._id === id ? { ...r, originalSite } : r))
          );
        }
        setLoadingOriginal(null);
      }
      setExpanded(id);
    }
  };

  if (loading) {
    return <LoadingButton />;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="text-green-950">
      <h2 className="text-3xl font-bold mb-6 text-green-800">
        Review Research Expert Requests
      </h2>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg">No pending requests.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-white p-6 rounded-2xl shadow-lg border border-green-100 transition-shadow hover:shadow-xl"
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpand(request._id)}
              >
                <div>
                  <p className="font-bold text-lg text-green-900">
                    {request.site_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Request from{" "}
                    <span className="font-semibold">
                      {request.researchExpertId?.username}
                    </span>{" "}
                    to <span className="font-semibold">{request.action}</span> a{" "}
                    <span className="font-semibold">{request.type}</span>
                  </p>
                </div>
                <div
                  className={`inline-flex items-center py-1 px-3 rounded-full text-xs font-medium ${
                    statusColors[request.status]
                  }`}
                >
                  {statusIcons[request.status]}
                  {request.status}
                </div>
              </div>

              {expanded === request._id && (
                <div className="mt-6 pt-6 border-t border-green-200">
                  {loadingOriginal === request._id ? (
                    <div className="text-center py-8">
                      Loading original data...
                    </div>
                  ) : (
                    <DiffViewer
                      original={request.originalSite}
                      modified={request}
                      action={request.action}
                      type={request.type}
                    />
                  )}
                  {request.adminFeedback && (
                    <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-800">
                        Admin Feedback:
                      </p>
                      <p className="text-sm mt-1">{request.adminFeedback}</p>
                    </div>
                  )}

                  {request.status === "pending" && (
                    <div className="mt-6 flex space-x-4">
                      <button
                        onClick={() => handleAction(request._id, "approved")}
                        className="inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Check size={16} className="mr-2" /> Approve
                      </button>
                      <button
                        onClick={() => openFeedbackModal(request, "reject")}
                        className="inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <X size={16} className="mr-2" /> Reject
                      </button>
                      <button
                        onClick={() => openFeedbackModal(request, "update")}
                        className="inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-yellow-400 hover:bg-yellow-500"
                      >
                        <RefreshCcw size={16} className="mr-2" /> Request Update
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {feedbackModalOpen && (
        <div className="fixed inset-0 bg-gray-600/10 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-1/3">
            <h3 className="text-xl font-bold mb-4 text-green-800">
              Provide Feedback
            </h3>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
              rows="4"
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              placeholder="Enter your feedback or reason for rejection/update..."
            ></textarea>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={closeFeedbackModal}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewRequests;
