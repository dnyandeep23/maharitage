import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { Plus, Trash2, Copy, Check, Key, Clock, BarChart2, ShieldCheck } from "lucide-react";
import { api } from "../../../../lib/api";
import ProgressBar from "../../../component/ProgressBar";
import LoadingButton from "../components/LoadingButton";
import { fetchWithInternalToken } from "../../../../lib/fetch";

const ApiKeyManagement = ({ showToast }) => {
  const { user } = useAuth();
  const token = api.getToken();
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const notify = (message, type = "success") => {
    if (showToast) {
      showToast(message, type);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchApiKeys();
    }
  }, [user, token]);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const response = await fetchWithInternalToken("/api/api-keys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok) {
        setApiKeys(data.apiKeys);
      } else {
        notify(data.message || "Failed to fetch API keys", "error");
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      notify("Error fetching API keys", "error");
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      notify("API key name cannot be empty", "error");
      return;
    }
    setCreating(true);
    try {
      const response = await fetchWithInternalToken("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await response.json();
      if (response.ok) {
        notify("API key created successfully!", "success");
        setNewKeyName("");
        fetchApiKeys();
      } else {
        notify(data.message || "Failed to create API key", "error");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      notify("Error creating API key", "error");
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id) => {
    setDeleting(id);
    try {
      const response = await fetchWithInternalToken(`/api/api-keys/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        notify("API key deleted successfully!", "success");
        fetchApiKeys();
      } else {
        notify(data.message || "Failed to delete API key", "error");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      notify("Error deleting API key", "error");
    } finally {
      setDeleting(null);
    }
  };

  const copyText = async (value) => {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (!copied) {
      throw new Error("Copy failed");
    }
  };

  const copyToClipboard = async (key) => {
    try {
      await copyText(key);
      setCopiedKey(key);
      notify("API key copied to clipboard!", "success");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error("Error copying API key:", error);
      notify("Could not copy API key. Please copy it manually.", "error");
    }
  };

  return (
    <div className="dashboard-section mx-auto w-full max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="archive-kicker text-[#8a6a31]">Developer access</p>
          <h2 className="dashboard-section-title mt-2 text-3xl sm:text-4xl">
            API Key Management
          </h2>
          <p className="dashboard-section-copy mt-3 max-w-2xl text-sm">
            Create scoped keys for the public archive API. Keep keys private and rotate them when they are no longer needed.
          </p>
        </div>
        <div className="dashboard-badge">
          {apiKeys.length}/3 keys active
        </div>
      </div>

      <div className="dashboard-panel-quiet mb-8 p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#123327] text-[#fffaf0]">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#123327]">Create New API Key</h3>
            <p className="text-sm text-stone-500">Use a descriptive name like "Research app" or "Portfolio demo".</p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            type="text"
            className="archive-input min-h-12 w-full rounded-2xl px-4 py-3 text-base"
            placeholder="Enter a name for your API key"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            disabled={creating || apiKeys.length >= 3}
          />
          <button
            onClick={createApiKey}
            className={`dashboard-primary-button px-5 ${
              apiKeys.length >= 3
                ? "cursor-not-allowed opacity-45"
                : ""
            }`}
            disabled={creating || apiKeys.length >= 3}
          >
            <Plus className="h-5 w-5" />
            {creating ? "Creating..." : "Create Key"}
          </button>
        </div>
        {apiKeys.length >= 3 && (
          <p className="mt-3 text-sm font-medium text-red-700">
            You have reached the maximum of 3 API keys.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-4 text-2xl font-bold text-[#123327]">Your API Keys</h3>
        {loading && <LoadingButton />}
        {!loading && apiKeys.length === 0 && (
          <div className="dashboard-panel-quiet py-12 text-center">
            <Key className="mx-auto h-12 w-12 text-[#8a6a31]" />
            <h3 className="mt-3 text-lg font-bold text-[#123327]">
              No API keys
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Get started by creating a new API key.
            </p>
          </div>
        )}
        {!loading && apiKeys.length > 0 && (
          <ul className="space-y-6">
            {apiKeys.map((key) => (
              <li
                key={key._id}
                className="dashboard-list-card p-4 transition sm:p-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#8a6a31]" />
                      <p className="font-bold text-xl text-[#123327]">
                        {key.name}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center rounded-2xl border border-[#123327]/10 bg-[#fffaf0]/62 px-3 py-2">
                      <p className="break-all font-mono text-sm text-stone-700">
                        {key.key}
                      </p>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="ml-3 rounded-full p-2 text-[#123327] transition hover:bg-[#123327]/8"
                        aria-label="Copy API key"
                      >
                        {copiedKey === key.key ? (
                          <Check className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteApiKey(key._id)}
                    disabled={deleting === key._id}
                    className="dashboard-danger-button disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting === key._id ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 className="h-5 w-5" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#123327]/12 pt-4 text-sm text-stone-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Last Used:{" "}
                      {key.lastUsed
                        ? new Date(key.lastUsed).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    <span>Usage: {key.usage}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ApiKeyManagement;
