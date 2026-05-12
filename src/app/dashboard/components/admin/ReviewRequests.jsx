import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  RefreshCcw,
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
  Inbox,
} from "lucide-react";
import DiffViewer from "../components/DiffViewer";
import { api } from "../../../../lib/api";
import LoadingButton from "../components/LoadingButton";
import { fetchWithInternalToken } from "../../../../lib/fetch";

const statusIcons = {
  pending: <HelpCircle size={16} className="mr-1" />,
  approved: <CheckCircle size={16} className="mr-1" />,
  rejected: <XCircle size={16} className="mr-1" />,
  needs_update: <Clock size={16} className="mr-1" />,
};

const statusColors = {
  pending: "border-yellow-200 bg-yellow-50/80 text-yellow-800",
  approved: "border-emerald-200 bg-emerald-50/80 text-emerald-800",
  rejected: "border-red-200 bg-red-50/80 text-red-800",
  needs_update: "border-blue-200 bg-blue-50/80 text-blue-800",
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
      const response = await fetchWithInternalToken("/api/research-requests", {
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
      const response = await fetchWithInternalToken(`/api/research-requests/${requestId}`, {
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
      const response = await fetchWithInternalToken(`/api/sites/${siteId}`);
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
    return <div className="dashboard-panel-quiet p-6 text-red-700">Error: {error}</div>;
  }

  return (
    <div className="dashboard-section mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <p className="archive-kicker text-[#8a6a31]">Review queue</p>
        <h2 className="dashboard-section-title mt-2 text-3xl sm:text-4xl">
          Research Expert Requests
        </h2>
        <p className="dashboard-section-copy mt-3 text-sm">
          Compare submitted changes, approve verified data, or request updates with feedback.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="dashboard-panel-quiet py-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-[#8a6a31]" />
          <p className="mt-3 text-lg font-bold text-[#123327]">No pending requests</p>
          <p className="mt-1 text-sm text-stone-500">New research submissions will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="dashboard-list-card p-4 transition sm:p-6"
            >
              <div
                className="flex cursor-pointer flex-col justify-between gap-4 sm:flex-row sm:items-center"
                onClick={() => toggleExpand(request._id)}
              >
                <div>
                  <p className="text-lg font-bold text-[#123327]">
                    {request.site_name}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Request from{" "}
                    <span className="font-semibold">
                      {request.researchExpertId?.username}
                    </span>{" "}
                    to <span className="font-semibold">{request.action}</span> a{" "}
                    <span className="font-semibold">{request.type}</span>
                  </p>
                </div>
                <div
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    statusColors[request.status]
                  }`}
                >
                  {statusIcons[request.status]}
                  {request.status}
                </div>
              </div>

              {expanded === request._id && (
                <div className="mt-6 border-t border-[#123327]/12 pt-6">
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
                    <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50/80 p-4">
                      <p className="text-sm font-bold text-yellow-800">
                        Admin Feedback:
                      </p>
                      <p className="text-sm mt-1">{request.adminFeedback}</p>
                    </div>
                  )}

                  {request.status === "pending" && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleAction(request._id, "approved")}
                        className="dashboard-primary-button"
                      >
                        <Check size={16} className="mr-2" /> Approve
                      </button>
                      <button
                        onClick={() => openFeedbackModal(request, "reject")}
                        className="dashboard-danger-button"
                      >
                        <X size={16} className="mr-2" /> Reject
                      </button>
                      <button
                        onClick={() => openFeedbackModal(request, "update")}
                        className="dashboard-secondary-button"
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
        <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto bg-[#071b15]/45 p-4 backdrop-blur-sm">
          <div className="dashboard-panel w-full max-w-lg p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-[#123327]">
              Provide Feedback
            </h3>
            <textarea
              className="archive-input mt-1 block w-full rounded-2xl p-3 text-sm"
              rows="4"
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              placeholder="Enter your feedback or reason for rejection/update..."
            ></textarea>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeFeedbackModal}
                className="dashboard-secondary-button"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                className="dashboard-primary-button"
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
