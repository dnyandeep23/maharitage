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
    <div className="mt-6 border-t pt-6">
      <h4 className="font-semibold mb-3 text-lg">API Playground</h4>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="api-key-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your API Key
          </label>
          <input
            id="api-key-input"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            placeholder="Enter your API key"
          />
        </div>
        <button
          onClick={handleTryIt}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
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
            <CheckCircle className="w-5 h-5 text-green-500" />
            Response
          </h5>
          <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto">
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
          <pre className="bg-red-50 p-4 rounded-md text-sm text-red-800 overflow-x-auto">
            <code>{error}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiPlayground;
