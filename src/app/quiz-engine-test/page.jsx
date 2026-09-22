"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Database, AlertCircle, Layers, Play, ShieldCheck, Lock, BarChart3, FileText, Image, BookOpen } from "lucide-react";

function safe(val, fallback = "") {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(v => safe(v)).filter(Boolean).join(", ") || fallback;
  if (typeof val === "object") {
    if (Array.isArray(val.curated_by)) return val.curated_by.join(", ");
    return Object.values(val).map(v => typeof v === "object" ? "" : String(v)).filter(Boolean).join(", ") || fallback;
  }
  return String(val);
}

export default function QuizEngineTestPage() {
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [globalStats, setGlobalStats] = useState(null);

  useEffect(() => { fetchSiteList(); fetchGlobalStats(); }, []);
  useEffect(() => { if (selectedSiteId) loadAnnotations(selectedSiteId); }, [selectedSiteId]);

  const fetchSiteList = async () => {
    setSitesLoading(true);
    try {
      const res = await fetch("/api/quiz-engine?action=list_sites");
      const result = await res.json();
      if (result.success && result.sites?.length > 0) {
        setSites(result.sites);
        setSelectedSiteId(p => p || result.sites[0].site_id);
      }
    } catch (err) { console.error(err); }
    finally { setSitesLoading(false); }
  };

  const fetchGlobalStats = async () => {
    try {
      const res = await fetch("/api/quiz-engine?action=global_stats");
      const result = await res.json();
      if (result.success) setGlobalStats(result);
    } catch {}
  };

  const loadAnnotations = async (siteId) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/quiz-engine?action=get_annotations&site_id=${siteId}`);
      const result = await res.json();
      if (result.success) setData(result);
      else setError(result.error || "Failed to load annotations");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const filtered = (data?.annotations || []).filter(a => typeFilter === "all" || a.question_type === typeFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Quiz Engine <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">NEW V1</span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1 ml-11">Site-Agnostic Annotation Architecture • MongoDB + Cloudinary Source of Truth</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" /> {sites.length} sites</span>
            {globalStats && <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {(globalStats.text?.total_annotations || 0) + (globalStats.image?.total_annotations || 0) + (globalStats.inscription?.total_annotations || 0)} annotations</span>}
          </div>
        </div>

        {/* Global Stats */}
        {globalStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase"><FileText className="w-3.5 h-3.5" /> Text MCQs</div>
              <p className="text-2xl font-bold text-amber-400 mt-1">{globalStats.text?.total_annotations || 0}</p>
              <p className="text-xs text-slate-500 mt-1">{globalStats.text?.files || 0} site files</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase"><Image className="w-3.5 h-3.5" /> Image MCQs</div>
              <p className="text-2xl font-bold text-sky-400 mt-1">{globalStats.image?.total_annotations || 0}</p>
              <p className="text-xs text-slate-500 mt-1">{globalStats.image?.files || 0} site files</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase"><BookOpen className="w-3.5 h-3.5" /> Inscription MCQs</div>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{globalStats.inscription?.total_annotations || 0}</p>
              <p className="text-xs text-slate-500 mt-1">{globalStats.inscription?.files || 0} site files</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase"><BarChart3 className="w-3.5 h-3.5" /> Total</div>
              <p className="text-2xl font-bold text-purple-400 mt-1">{(globalStats.text?.total_annotations || 0) + (globalStats.image?.total_annotations || 0) + (globalStats.inscription?.total_annotations || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">Across all sites</p>
            </div>
          </div>
        )}

        {/* Site Selector + Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Heritage Site
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                disabled={sitesLoading || loading}
                className="w-full md:w-80 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {sites.map(s => (
                  <option key={safe(s.site_id)} value={safe(s.site_id)}>
                    {safe(s.site_name)} ({safe(s.site_id)}) — {safe(s.district)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              {["all", "text", "image", "inscription"].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase transition-colors ${typeFilter === t ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
                >{t}</button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800 pt-4">
            <span>CLI: <code className="text-amber-400/70">node src/ai/quiz-engine/v1/pipeline/process_site.js {selectedSiteId || "SITE_ID"}</code></span>
            <span>All: <code className="text-amber-400/70">node src/ai/quiz-engine/v1/pipeline/process_all_sites.js</code></span>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="p-12 text-center bg-slate-900/50 rounded-xl border border-slate-800">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-medium">Loading annotations for {selectedSiteId}...</p>
          </div>
        )}
        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Site Stats + Annotations */}
        {data && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs text-slate-400 font-semibold uppercase">Text</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{data.stats?.text?.count || 0}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs text-slate-400 font-semibold uppercase">Image</p>
                <p className="text-2xl font-bold text-sky-400 mt-1">{data.stats?.image?.count || 0}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs text-slate-400 font-semibold uppercase">Inscription</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{data.stats?.inscription?.count || 0}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs text-slate-400 font-semibold uppercase">Site Total</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{data.stats?.total || 0}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" /> Annotations ({filtered.length})
              </h3>
              <div className="space-y-3">
                {filtered.slice(0, 30).map((ann, idx) => (
                  <div key={safe(ann.annotation_id, idx)} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {safe(ann.annotation_id)}
                      </span>
                      <span className="text-xs font-semibold uppercase text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                        {safe(ann.question_type)} — {safe(ann.category)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{safe(ann.question)}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {ann.options?.map((opt, oIdx) => (
                        <div key={oIdx}
                          className={`p-2 rounded-lg border ${oIdx === ann.correct_option_index ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                        >{["A", "B", "C", "D"][oIdx]}. {safe(opt)}</div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-2.5">
                      <span>Source: <code className="text-slate-400">{safe(ann.source?.field)}</code></span>
                      <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-3.5 h-3.5" /> Ground Truth</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
