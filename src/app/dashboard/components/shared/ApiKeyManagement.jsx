import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { Plus, Trash2, Copy, Check, Key, Clock, BarChart2 } from "lucide-react";
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
      });
      const data = await response.json();
      if (response.ok) {
        setApiKeys(data.apiKeys);
      } else {
        showToast(data.message || "Failed to fetch API keys", "error");
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      showToast("Error fetching API keys", "error");
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      showToast("API key name cannot be empty", "error");
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
        showToast("API key created successfully!", "success");
        setNewKeyName("");
        fetchApiKeys();
      } else {
        showToast(data.message || "Failed to create API key", "error");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      showToast("Error creating API key", "error");
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
        showToast("API key deleted successfully!", "success");
        fetchApiKeys();
      } else {
        showToast(data.message || "Failed to delete API key", "error");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      showToast("Error deleting API key", "error");
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast("API key copied to clipboard!", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-6 rounded-lg text-green-800">
      <h2 className="text-3xl font-bold text-emerald-800 mb-6">
        API Key Management
      </h2>

      <div className="mb-8 p-6 border border-dashed">
        <h3 className="text-xl font-semibold text-emerald-800 mb-4">
          Create New API Key
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            className="flex-grow p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-200 ease-in-out text-green-900"
            placeholder="Enter a name for your API key"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            disabled={creating || apiKeys.length >= 3}
          />
          <button
            onClick={createApiKey}
            className={`flex items-center justify-center px-5 py-3 rounded-md font-medium transition duration-200 ease-in-out ${
              apiKeys.length >= 3
                ? "bg-emerald-500/20 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-white"
            }`}
            disabled={creating || apiKeys.length >= 3}
          >
            <Plus className="mr-2 h-5 w-5" />
            {creating ? "Creating..." : "Create Key"}
          </button>
        </div>
        {apiKeys.length >= 3 && (
          <p className="text-red-500 text-sm mt-3">
            You have reached the maximum of 3 API keys.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-emerald-800 mb-4">
          Your API Keys
        </h3>
        {loading && <LoadingButton />}
        {!loading && apiKeys.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
            <Key className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-400">
              No API keys
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new API key.
            </p>
          </div>
        )}
        {!loading && apiKeys.length > 0 && (
          <ul className="space-y-6">
            {apiKeys.map((key) => (
              <li
                key={key._id}
                className=" p-6 rounded-lg bg-lime-50/40 shadow-md"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-grow">
                    <p className="font-semibold text-xl text-emerald-800">
                      {key.name}
                    </p>
                    <div className="flex items-center mt-2">
                      <p className="text-sm text-gray-700 break-all font-mono">
                        {key.key}
                      </p>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="ml-4 p-2 text-gray-700 hover:text-white transition"
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
                    className="group relative flex items-center justify-center rounded-md bg-red-600/50 px-4 py-2 text-sm font-medium text-white transition-all duration-1000 ease-in-out hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2  focus:ring-offset-gray-900 disabled:opacity-70"
                  >
                    {deleting === key._id ? (
                      "Deleting..."
                    ) : (
                      <>
                        <span className="flex items-center justify-center transition-transform duration-500 ease-in group-hover:-translate-x-2">
                          <Trash2 className="h-5 w-5 text-red-200 transition-colors duration-500 ease-in-out group-hover:text-white" />
                        </span>
                        <span className="absolute opacity-0 translate-x-2 transition-all duration-500 ease-in group-hover:static group-hover:opacity-100 group-hover:translate-x-0 ml-2">
                          Delete
                        </span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
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
