"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  KeyRound,
  Loader2,
  Play,
  Search,
  Terminal,
} from "lucide-react";

function copyText(value) {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText &&
    window.isSecureContext
  ) {
    return navigator.clipboard.writeText(value);
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

  return Promise.resolve();
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-[#123327]/12 bg-[#fffaf0]/78 text-[#263a2d]",
    get: "border-[#123327]/18 bg-[#123327]/8 text-[#123327]",
    warn: "border-[#8a6a31]/22 bg-[#d9c18a]/24 text-[#765a25]",
  };

  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

function CopyButton({ value, label = "Copy" }) {
  const [state, setState] = useState("idle");

  const handleCopy = async () => {
    try {
      await copyText(value);
      setState("copied");
      setTimeout(() => setState("idle"), 1400);
    } catch (error) {
      setState("error");
      setTimeout(() => setState("idle"), 1800);
    }
  };

  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#123327]/14 bg-[#fffaf0]/80 px-3 py-2 text-sm font-semibold text-[#123327] transition hover:bg-white disabled:opacity-60"
      onClick={handleCopy}
      disabled={state === "copied"}
      aria-label={label}
    >
      {state === "copied" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {state === "error" ? "Failed" : state === "copied" ? "Copied" : label}
    </button>
  );
}

function CodeBlock({ value }) {
  return (
    <pre className="archive-scroll max-h-80 overflow-auto rounded-md border border-[#123327]/12 bg-[#101b15] p-4 text-xs leading-6 text-[#f7f0e4] shadow-inner">
      <code>{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}

function EndpointPlayground({ endpoint }) {
  const [apiKey, setApiKey] = useState("");
  const [path, setPath] = useState(endpoint.examplePath);
  const [state, setState] = useState({
    loading: false,
    status: null,
    timing: null,
    data: null,
    error: null,
  });

  const runRequest = async () => {
    setState({ loading: true, status: null, timing: null, data: null, error: null });
    const startedAt = performance.now();

    try {
      const response = await fetch(path, {
        headers: apiKey ? { Authorization: `ApiKey ${apiKey}` } : {},
      });
      const data = await response.json();

      setState({
        loading: false,
        status: response.status,
        timing: Math.round(performance.now() - startedAt),
        data,
        error: response.ok ? null : data?.message || "Request failed",
      });
    } catch (error) {
      setState({
        loading: false,
        status: null,
        timing: Math.round(performance.now() - startedAt),
        data: null,
        error: error.message,
      });
    }
  };

  return (
    <div className="rounded-lg border border-[#123327]/12 bg-[#fffaf0]/72 p-4 shadow-[0_16px_48px_rgba(25,22,17,0.08)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-[#123327]">
            <Play className="h-4 w-4" />
            Try request
          </h3>
          <p className="mt-1 text-sm text-[#5f574a]">
            Uses the selected route and your dashboard API key.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f574a]">
          {state.status && <Badge tone={state.status < 400 ? "get" : "warn"}>{state.status}</Badge>}
          {state.timing !== null && (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {state.timing} ms
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_0.75fr_auto]">
        <input
          value={path}
          onChange={(event) => setPath(event.target.value)}
          className="archive-input min-h-11 rounded-md px-3 py-2 text-sm"
          aria-label="Endpoint path"
        />
        <input
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          className="archive-input min-h-11 rounded-md px-3 py-2 text-sm"
          placeholder="YOUR_API_KEY"
          aria-label="API key"
        />
        <button
          type="button"
          onClick={runRequest}
          disabled={state.loading}
          className="dashboard-primary-button min-h-11 rounded-md px-4 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Send
        </button>
      </div>

      {state.loading && (
        <div className="mt-4 rounded-md border border-[#123327]/12 bg-white/60 p-4 text-sm text-[#5f574a]">
          Requesting archive data...
        </div>
      )}
      {state.error && (
        <div className="mt-4 rounded-md border border-[#8a6a31]/24 bg-[#d9c18a]/20 p-4 text-sm font-medium text-[#765a25]">
          {state.error}
        </div>
      )}
      {state.data && (
        <div className="mt-4">
          <CodeBlock value={state.data} />
        </div>
      )}
    </div>
  );
}

function EndpointDetail({ endpoint }) {
  const parameters = [...(endpoint.params || []), ...(endpoint.query || [])];

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[#123327]/12 bg-[#fffaf0]/84 p-5 shadow-[0_18px_60px_rgba(25,22,17,0.09)] sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="get">{endpoint.method}</Badge>
          <Badge>{endpoint.category}</Badge>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-[#123327] sm:text-3xl">
          {endpoint.title}
        </h2>
        <code className="mt-3 block break-all rounded-md border border-[#123327]/12 bg-[#123327]/6 px-3 py-2 text-sm text-[#123327]">
          {endpoint.path}
        </code>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5f574a]">
          {endpoint.description}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-lg border border-[#123327]/12 bg-[#fffaf0]/72 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#5f574a]">
              Request
            </h3>
            <CopyButton value={endpoint.curl} label="Copy curl" />
          </div>
          <CodeBlock value={endpoint.curl} />
        </div>

        <div className="rounded-lg border border-[#123327]/12 bg-[#fffaf0]/72 p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#5f574a]">
            Parameters
          </h3>
          {parameters.length ? (
            <div className="overflow-hidden rounded-md border border-[#123327]/12">
              {parameters.map(([name, type, description]) => (
                <div
                  key={`${endpoint.id}-${name}`}
                  className="grid gap-2 border-b border-[#123327]/10 bg-white/52 p-3 text-sm last:border-b-0 sm:grid-cols-[7rem_5rem_1fr]"
                >
                  <code className="text-[#123327]">{name}</code>
                  <span className="text-[#817866]">{type}</span>
                  <span className="text-[#5f574a]">{description}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-[#123327]/12 bg-white/52 p-4 text-sm text-[#5f574a]">
              No parameters required.
            </div>
          )}
        </div>
      </div>

      <EndpointPlayground key={endpoint.id} endpoint={endpoint} />
    </section>
  );
}

export default function DocsPortal({ docsData }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState(docsData.endpoints[0]?.id);

  const filteredEndpoints = useMemo(() => {
    return docsData.endpoints.filter((endpoint) => {
      const matchesCategory = category === "All" || endpoint.category === category;
      const searchable = `${endpoint.title} ${endpoint.path} ${endpoint.description} ${endpoint.category}`.toLowerCase();
      return matchesCategory && searchable.includes(query.toLowerCase());
    });
  }, [category, docsData.endpoints, query]);

  const selectedEndpoint =
    filteredEndpoints.find((endpoint) => endpoint.id === selectedId) ||
    filteredEndpoints[0] ||
    docsData.endpoints[0];

  return (
    <main className="heritage-surface heritage-texture min-h-screen">
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-5 border-b border-[#123327]/12 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="archive-kicker text-[#8a6a31]">Developer archive</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold text-[#123327] sm:text-5xl">
              Maharitage API docs
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#5f574a]">
              A simple reference for the available public GET routes. These endpoints are discovered from the current App Router handlers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="get">{docsData.endpoints.length} endpoints</Badge>
            <Badge>
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              ApiKey auth
            </Badge>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-[#123327]/12 bg-[#fffaf0]/82 p-4 shadow-[0_18px_60px_rgba(25,22,17,0.08)]">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#123327]">
                <Terminal className="h-4 w-4" />
                Available routes
              </div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817866]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search endpoints"
                  className="archive-input min-h-11 w-full rounded-md py-2 pl-9 pr-3 text-sm"
                  aria-label="Search endpoints"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                {["All", ...docsData.categories].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`rounded-md border px-3 py-2 text-xs font-bold transition ${
                      category === item
                        ? "border-[#123327]/20 bg-[#123327] text-[#fffaf0]"
                        : "border-[#123327]/12 bg-white/42 text-[#5f574a] hover:bg-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <nav className="archive-scroll mt-5 max-h-[34rem] space-y-2 overflow-auto" aria-label="API endpoints">
                {filteredEndpoints.length ? (
                  filteredEndpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      type="button"
                      onClick={() => setSelectedId(endpoint.id)}
                      className={`w-full rounded-md border p-3 text-left transition ${
                        selectedEndpoint?.id === endpoint.id
                          ? "border-[#123327]/24 bg-[#123327]/8"
                          : "border-[#123327]/10 bg-white/38 hover:bg-white/70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-[#123327]">{endpoint.title}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#8a6a31]" />
                      </div>
                      <code className="mt-2 block truncate text-xs text-[#5f574a]">
                        {endpoint.path}
                      </code>
                    </button>
                  ))
                ) : (
                  <div className="rounded-md border border-[#123327]/12 bg-white/52 p-4 text-sm text-[#5f574a]">
                    No endpoints match your search.
                  </div>
                )}
              </nav>
            </div>
          </aside>

          {selectedEndpoint ? (
            <EndpointDetail endpoint={selectedEndpoint} />
          ) : (
            <div className="rounded-lg border border-[#123327]/12 bg-[#fffaf0]/82 p-6 text-[#5f574a]">
              No API routes are available right now.
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-[#817866]">
          Last discovered at {new Date(docsData.generatedAt).toLocaleString()}.
        </p>
      </section>
    </main>
  );
}
