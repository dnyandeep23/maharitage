import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import DiffViewer from "../components/DiffViewer";
import { Clock, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";

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
      const response = await fetch(
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
    return <div className="text-green-950">Loading your submissions...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="text-green-950">
      <h2 className="text-3xl font-bold mb-6 text-green-800">My Submissions</h2>

      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg">You have not submitted any requests yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <div
              key={submission._id}
              className="bg-white p-6 rounded-2xl shadow-lg border border-green-100 transition-shadow hover:shadow-xl"
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpand(submission._id)}
              >
                <div>
                  <p
                    className={`${
                      submission.action === "modify"
                        ? "bg-amber-400"
                        : submission.action === "add"
                        ? "bg-green-400"
                        : "bg-blue-400"
                    } inline-block px-3 py-1 rounded-full text-white text-sm font-semibold mb-1`}
                  >
                    {submission.action}
                  </p>
                  <p className="font-bold text-lg text-green-900">
                    {submission.site_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Request to{" "}
                    <span className="font-semibold">{submission.action}</span> a{" "}
                    <span className="font-semibold">{submission.type}</span>
                  </p>
                </div>
                <div
                  className={`inline-flex items-center py-1 px-3 rounded-full text-xs font-medium ${
                    statusColors[submission.status]
                  }`}
                >
                  {statusIcons[submission.status]}
                  {submission.status}
                </div>
              </div>

              {expanded === submission._id && (
                <div className="mt-6 pt-6 border-t border-green-200">
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
                    <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-800">
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
      <p className="text-xs text-gray-500 mt-8 text-center">
        Rejected records older than 30 days are automatically removed. You can
        find more information in your registered email.
      </p>
    </div>
  );
};

export default MySubmissions;
