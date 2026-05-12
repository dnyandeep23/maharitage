import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import DiffViewer from "../components/DiffViewer";
import { Clock, CheckCircle, XCircle, HelpCircle, FileText } from "lucide-react";
import { api } from "@/lib/api";
import LoadingButton from "../components/LoadingButton";
import { fetchWithInternalToken } from "../../../../lib/fetch";

const statusIcons = {
  pending: <HelpCircle size={16} className="mr-1" />,
  approved: <CheckCircle size={16} className="mr-1" />,
  rejected: <XCircle size={16} className="mr-1" />,
  needs_update: <Clock size={16} className="mr-1" />,
};

const statusColors = {
  pending: "border-amber-200 bg-amber-50/80 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50/80 text-emerald-800",
  rejected: "border-red-200 bg-red-50/80 text-red-800",
  needs_update: "border-blue-200 bg-blue-50/80 text-blue-800",
};

const MySubmissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loadingOriginal, setLoadingOriginal] = useState(null);
  useEffect(() => {
    if (user && user._id) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      console.log("Fetching submissions for user ID:", user._id);
      console.log("user:", api.getToken());
      const response = await fetchWithInternalToken(
        `/api/research-requests?researchExpertId=${user._id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${api.getToken()}`,
          },
        }
      );
      console.log("Response status:", response);
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }
      const data = await response.json();
      console.log("new: " + data);
      setSubmissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (id) => {
    console.log("Toggling expand for ID:", id);
    console.log("submissions:", submissions);
    if (expanded === id) {
      setExpanded(null);
    } else {
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
        <p className="archive-kicker text-[#8a6a31]">Research workflow</p>
        <h2 className="dashboard-section-title mt-2 text-3xl sm:text-4xl">My Submissions</h2>
        <p className="dashboard-section-copy mt-3 text-sm">
          Track your suggested additions and modifications as they move through review.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="dashboard-panel-quiet py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#8a6a31]" />
          <p className="mt-3 text-lg font-bold text-[#123327]">No submissions yet</p>
          <p className="mt-1 text-sm text-stone-500">Suggested changes will appear here after you submit them.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <div
              key={submission._id}
              className="dashboard-list-card p-4 transition sm:p-6"
            >
              <div
                className="flex cursor-pointer flex-col justify-between gap-4 sm:flex-row sm:items-center"
                onClick={() => toggleExpand(submission._id)}
              >
                <div>
                  <p
                    className={`${
                      submission.action === "modify"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : submission.action === "add"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-blue-200 bg-blue-50 text-blue-800"
                    } mb-2 inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide`}
                  >
                    {submission.action}
                  </p>
                  <p className="text-lg font-bold text-[#123327]">
                    {submission.site_name}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Request to{" "}
                    <span className="font-semibold">{submission.action}</span> a{" "}
                    <span className="font-semibold">{submission.type}</span>
                  </p>
                </div>
                <div
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    statusColors[submission.status]
                  }`}
                >
                  {statusIcons[submission.status]}
                  {submission.status}
                </div>
              </div>

              {expanded === submission._id && (
                <div className="mt-6 border-t border-[#123327]/12 pt-6">
                  {loadingOriginal === submission._id ? (
                    <div className="text-center py-8">
                      Loading original data...
                    </div>
                  ) : (
                    <DiffViewer
                      original={submission.originalSite}
                      modified={submission}
                      action={submission.action}
                      type={submission.type}
                    />
                  )}
                  {submission.adminFeedback && (
                    <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50/80 p-4">
                      <p className="text-sm font-bold text-yellow-800">
                        Admin Feedback:
                      </p>
                      <p className="text-sm mt-1">{submission.adminFeedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-8 text-center text-xs text-stone-500">
        Rejected records older than 30 days are automatically removed. You can
        find more information in your registered email.
      </p>
    </div>
  );
};

export default MySubmissions;
