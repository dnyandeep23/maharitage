"use client";
import React, { useState } from "react";
import { Play, Loader, AlertTriangle, CheckCircle } from "lucide-react";

const ApiPlayground = ({ endpoint }) => {
  const [apiKey, setApiKey] = useState("MAHARITAGE_TEST_KEY");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTryIt = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch(endpoint.path, {
        method: endpoint.method,
        headers: {
          Authorization: `ApiKey ${apiKey}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t border-[#263a2d]/12 pt-6">
      <h4 className="mb-3 font-cinzel-decorative text-xl font-bold text-[#123327]">API Playground</h4>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="api-key-input"
            className="archive-label mb-1 block"
          >
            Your API Key
          </label>
          <input
            id="api-key-input"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="archive-input w-full rounded-2xl px-4 py-3 shadow-sm"
            placeholder="Enter your API key"
          />
        </div>
        <button
          onClick={handleTryIt}
          disabled={loading}
          className="archive-button px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Try It Out</span>
            </>
          )}
        </button>
      </div>

      {response && (
        <div className="mt-4">
          <h5 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#566044]" />
            Response
          </h5>
          <pre className="overflow-x-auto rounded-2xl bg-[#101b15] p-4 text-sm text-[#f7f0e4] shadow-inner">
            <code>{JSON.stringify(response, null, 2)}</code>
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <h5 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Error
          </h5>
          <pre className="overflow-x-auto rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <code>{error}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiPlayground;
