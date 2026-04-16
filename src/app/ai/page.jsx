"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import AIChatLoading from "./AIChatLoading";
import ChatSpin from "./ChatSpin";
import {
  Plus,
  History,
  MessageSquare,
  Loader,
  Bot,
  Square,
  ArrowUp,
  X,
  FileText,
  ImageIcon,
  Paperclip,
  PanelLeft,
  PanelRight,
  GraduationCap,
  Sparkles,
  BookOpenCheck,
  RotateCcw,
  Trophy,
  Brain,
  Zap,
  LightbulbIcon,
  Home,
  ChevronRight,
  Settings2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Toast from "../component/Toast";
import Image from "next/image";
import Loading from "../loading";
import { fetchWithInternalToken } from "../../lib/fetch";

// ─── Shimmer Loading Skeleton ───────────────────────────────────────────────
const ShimmerSkeleton = () => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-700/20 flex items-center justify-center shrink-0 border border-white/10">
      <Bot size={18} className="text-emerald-400/60" />
    </div>
    <div className="flex flex-col gap-2 w-64">
      <div className="h-3 rounded-full bg-white/10 animate-pulse w-full" />
      <div className="h-3 rounded-full bg-white/8 animate-pulse w-4/5" />
      <div className="h-3 rounded-full bg-white/6 animate-pulse w-3/5" />
    </div>
  </div>
);

// ─── Message Renderer ────────────────────────────────────────────────────────
const MessageRenderer = ({ text, onImageClick }) => {
  const contentParts = useMemo(() => {
    if (!text) return [];
    const contentWithoutRefs = text.split("References:")[0].trim();
    const imageRegex = /\[Image: (https?:\/\/[^\]]+)\]/g;
    const parts = contentWithoutRefs.split(imageRegex);
    const result = [];
    let isImage = false;
    for (const part of parts) {
      if (isImage) {
        result.push({ type: "image", url: part });
      } else {
        if (part.trim()) {
          result.push({ type: "text", content: part.trim() });
        }
      }
      isImage = !isImage;
    }
    return result;
  }, [text]);

  return (
    <>
      {contentParts.map((part, index) => {
        if (part.type === "text") {
          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, children }) => (
                  <p className="mb-3 leading-relaxed last:mb-0 text-slate-200">
                    {children}
                  </p>
                ),
                h1: ({ node, children }) => (
                  <h1 className="text-xl font-bold my-4 text-white">{children}</h1>
                ),
                h2: ({ node, children }) => (
                  <h2 className="text-lg font-bold my-3 text-white">{children}</h2>
                ),
                h3: ({ node, children }) => (
                  <h3 className="text-base font-semibold my-2 text-emerald-300">{children}</h3>
                ),
                strong: ({ node, children }) => (
                  <strong className="font-semibold text-emerald-300">{children}</strong>
                ),
                ul: ({ node, children }) => (
                  <ul className="list-disc list-inside mb-3 pl-4 space-y-1 text-slate-300">
                    {children}
                  </ul>
                ),
                ol: ({ node, children }) => (
                  <ol className="list-decimal list-inside mb-3 pl-4 space-y-1 text-slate-300">
                    {children}
                  </ol>
                ),
                li: ({ node, children }) => (
                  <li className="mb-1.5 text-slate-300">{children}</li>
                ),
                table: ({ node, children }) => (
                  <div className="overflow-x-auto my-4 rounded-xl border border-white/10">
                    <table className="w-full text-sm border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ node, children }) => (
                  <thead className="bg-emerald-900/40">{children}</thead>
                ),
                th: ({ node, children }) => (
                  <th className="px-4 py-2.5 text-left font-semibold text-emerald-300 border-b border-white/10 text-xs uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({ node, children }) => (
                  <td className="px-4 py-2.5 border-b border-white/5 text-slate-300">
                    {children}
                  </td>
                ),
                hr: () => <hr className="my-4 border-white/10" />,
                code: ({ node, children }) => (
                  <code className="px-1.5 py-0.5 rounded-md bg-white/10 text-emerald-300 text-sm font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {part.content}
            </ReactMarkdown>
          );
        }
        if (part.type === "image") {
          return (
            <div
              key={index}
              className="my-4 cursor-zoom-in"
              onClick={() => onImageClick(part.url)}
            >
              <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-black/20 max-w-2xl shadow-xl">
                <Image
                  src={part.url}
                  alt="Heritage image"
                  width={1200}
                  height={800}
                  className="rounded-2xl object-cover w-full h-auto max-h-[420px] transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 group-hover:from-black/70 transition-all duration-300 flex items-end justify-end p-3">
                  <div className="text-white text-xs font-medium px-3 py-1.5 rounded-full bg-black/50 backdrop-blur border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    🔍 Click to Enlarge
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })}
    </>
  );
};

// ─── Premium Quiz Option Buttons ────────────────────────────────────────────
const QuizOptionButtons = ({ text, onSelect, disabled }) => {
  const [selected, setSelected] = useState(null);

  const options = useMemo(() => {
    if (!text) return [];
    const optionRegex = /^\s*([A-D])\s*[).:\-]\s*(.+)$/gm;
    const found = [];
    let match;
    while ((match = optionRegex.exec(text)) !== null) {
      found.push({ letter: match[1], text: match[2].trim() });
    }
    return found.length >= 2 && found.length <= 6 ? found : [];
  }, [text]);

  // Reset selection when text changes (new question)
  useEffect(() => {
    setSelected(null);
  }, [text]);

  if (options.length === 0) return null;

  const letterColors = {
    A: "from-blue-500 to-blue-600",
    B: "from-violet-500 to-purple-600",
    C: "from-amber-500 to-orange-500",
    D: "from-rose-500 to-pink-600",
  };

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {options.map((opt) => (
        <button
          key={opt.letter}
          onClick={() => {
            if (!disabled && !selected) {
              setSelected(opt.letter);
              onSelect(opt.letter);
            }
          }}
          disabled={disabled || !!selected}
          className={`
            group flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left
            transition-all duration-200 relative overflow-hidden
            ${
              selected === opt.letter
                ? "border-emerald-400/60 bg-emerald-500/20 shadow-lg shadow-emerald-500/20 scale-[0.98]"
                : selected
                ? "border-white/5 bg-white/3 opacity-40 cursor-not-allowed"
                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            }
          `}
        >
          {/* Subtle shimmer on hover */}
          {!selected && !disabled && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/3 to-transparent" />
          )}
          <span
            className={`w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br ${letterColors[opt.letter] || "from-slate-500 to-slate-600"} flex items-center justify-center font-bold text-white text-sm shadow-sm`}
          >
            {opt.letter}
          </span>
          <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors leading-snug">
            {opt.text}
          </span>
          {!selected && !disabled && (
            <ChevronRight className="ml-auto w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
};

// ─── Main AI Component ───────────────────────────────────────────────────────
const AIComponent = () => {
  const { user, loading: authLoading } = useAuth();
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAtBottomRef = useRef(true);

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isChatActive, setIsChatActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isAnonymousLimited, setIsAnonymousLimited] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [imagePreview, setImagePreview] = useState({ isOpen: false, src: "" });
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatListLoading, setIsChatListLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [quizTopic, setQuizTopic] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState("Easy");
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [quizQuestionType, setQuizQuestionType] = useState("MCQ");
  const [quizSessionActive, setQuizSessionActive] = useState(false);

  const handleOpenImagePreview = (src) =>
    setImagePreview({ isOpen: true, src });
  const handleCloseImagePreview = () =>
    setImagePreview({ isOpen: false, src: "" });

  useEffect(() => {
    FingerprintJS.load().then((fp) =>
      fp.get().then(({ visitorId }) => setFingerprint(visitorId))
    );
  }, []);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    setIsChatListLoading(true);
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetchWithInternalToken("/api/ai/chats", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        method: "GET",
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats);
      }
    } catch (_) {
    } finally {
      setIsChatListLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    fetchChats().then(() => {
      const stored = sessionStorage.getItem("currentChatId");
      if (stored) handleSelectChat(stored);
      else setIsChatActive(false);
    });
  }, [user, fetchChats]);

  useEffect(() => {
    if (!user) setMode("chat");
  }, [user]);

  const handleSelectChat = async (chatId) => {
    setIsChatLoading(true);
    setCurrentChatId(chatId);
    sessionStorage.setItem("currentChatId", chatId);
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetchWithInternalToken(`/api/ai/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.messages.map((msg) => ({
            role: msg.sender,
            parts: [{ text: msg.message }],
          }))
        );
        setIsChatActive(true);
        setQuizSessionActive(false);
      } else throw new Error("Failed to load chat.");
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleNewChat = useCallback(() => {
    setCurrentChatId(null);
    setIsChatActive(false);
    setMessages([]);
    setQuizSessionActive(false);
    sessionStorage.removeItem("currentChatId");
  }, []);

  const suggestions = [
    "Tell me about Ajanta Caves.",
    "What is the history of Ellora Caves?",
    "Describe Elephanta Caves.",
    "UNESCO Heritage sites in Maharashtra?",
  ];

  const quizSuggestions = [
    "Ajanta Caves",
    "Maratha Empire",
    "Raigad Fort",
    "Maharashtra Inscriptions",
  ];

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    });
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 80;
    isAtBottomRef.current = isBottom;
  }, []);

  const showToast = (type, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ type: "", message: "" });
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const handleFileUpload = () => showToast("warning", "File upload coming soon!");

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const handleQuery = async (e, customQuery, startNewChat = false) => {
    e?.preventDefault();
    let actualQuery = customQuery || query;

    // If quiz mode and no query text, build a meaningful quiz prompt
    if (!actualQuery.trim() && mode === "quiz") {
      const topicText = quizTopic.trim() || "diverse Maharashtra Heritage topics spanning monuments, dynasties, culture, and inscriptions";
      actualQuery = `Generate a ${quizDifficulty} ${quizQuestionType} quiz with ${quizQuestionCount} questions on ${topicText}.`;
    }

    if (!actualQuery.trim()) {
      showToast("warning", "Please type a question!");
      return;
    }

    if (mode === "quiz" && !user) {
      showToast("warning", "Please log in to access the quiz feature.");
      return;
    }

    if (startNewChat) handleNewChat();

    if (!isChatActive) setIsChatActive(true);
    if (mode === "quiz" && startNewChat) setQuizSessionActive(true);

    const newMessage = { role: "user", parts: [{ text: actualQuery }] };
    const currentMessages = startNewChat ? [] : messages;
    const currentId = startNewChat ? null : currentChatId;
    const updatedMessages = [...currentMessages, newMessage];

    setMessages(updatedMessages);
    setQuery("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const retryDelays = [1000, 2000, 4000];
    const maxAttempts = retryDelays.length + 1;

    try {
      const headers = { "Content-Type": "application/json" };
      if (user) {
        const token = localStorage.getItem("auth-token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      let data = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetchWithInternalToken("/api/ai", {
            method: "POST",
            headers,
            body: JSON.stringify({
              query: actualQuery,
              messages: currentMessages,
              chatId: user ? currentId : null,
              fingerprint,
              quizMode: mode === "quiz",
              quizConfig: {
                topic: quizTopic.trim(),
                difficulty: quizDifficulty,
                questionCount: quizQuestionCount,
                questionType: quizQuestionType,
              },
            }),
            signal: controller.signal,
          });

          let payload = {};
          try {
            payload = await res.json();
          } catch (_) {}

          if (res.ok) {
            data = payload;
            break;
          }

          const serverMessage = payload?.error || payload?.response || "";
          const isLimited =
            typeof serverMessage === "string" &&
            serverMessage.includes("Query limit exceeded");
          const isBusy =
            res.status === 429 || res.status === 503 || res.status >= 500;

          if (isLimited) throw new Error("Query limit exceeded");
          if (isBusy && attempt < maxAttempts) {
            showToast("warning", "AI is busy. Retrying…");
            await sleep(retryDelays[attempt - 1]);
            continue;
          }
          if (isBusy) throw new Error("Server is busy. Please try again.");
          throw new Error("Unable to process your request right now.");
        } catch (err) {
          if (err.name === "AbortError") throw err;
          if (err.message?.includes("Query limit exceeded")) throw err;
          if (attempt < maxAttempts) {
            showToast("warning", "AI is busy. Retrying…");
            await sleep(retryDelays[attempt - 1]);
            continue;
          }
          throw new Error("Server is busy. Please try again.");
        }
      }

      if (!data) throw new Error("Server is busy. Please try again.");

      setMessages((prev) => [
        ...prev,
        { role: "ai", parts: [{ text: data.response }] },
      ]);

      if (data.chatId) {
        setCurrentChatId(data.chatId);
        if (!chats.some((c) => c._id === data.chatId)) fetchChats();
      }
    } catch (error) {
      if (error.name === "AbortError") {
        showToast("warning", "Request stopped.");
        return;
      }
      if (error.message?.includes("Query limit exceeded")) {
        setIsAnonymousLimited(true);
        showToast("error", "Free query limit reached. Please log in.");
        return;
      }
      showToast("error", "Server is busy. Please try again in a few seconds.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (text) => {
    if (mode === "quiz") {
      setQuizTopic(text);
    } else {
      setQuery(text);
      handleQuery(null, text);
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (authLoading) return <Loading to="AI Chat" />;

  // ─── Modals ───────────────────────────────────────────────────────────────
  const FileUploadModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div
        className="bg-[#1a2332] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Attach Files</h2>
            <p className="text-sm text-slate-400 mt-1">
              Add context to improve responses.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            { icon: <FileText className="w-5 h-5 text-blue-400" />, label: "Upload a Document", accept: ".doc,.docx,.txt" },
            { icon: <ImageIcon className="w-5 h-5 text-emerald-400" />, label: "Upload an Image", accept: "image/*" },
            { icon: <Paperclip className="w-5 h-5 text-rose-400" />, label: "Upload a PDF", accept: "application/pdf" },
          ].map(({ icon, label, accept }) => (
            <label
              key={label}
              className="w-full flex items-center gap-4 p-4 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-white/20 transition"
            >
              {icon}
              <span className="font-medium text-slate-300">{label}</span>
              <input
                type="file"
                accept={accept}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const ImagePreviewModal = ({ src, onClose }) => (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] rounded-2xl border border-white/10 bg-black/40 p-3 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt="Preview"
          width={2400}
          height={2000}
          className="object-contain w-full h-auto max-h-[82vh] rounded-xl shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white bg-black/60 hover:bg-black/80 rounded-full transition border border-white/20"
        >
          <X size={22} />
        </button>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-[100dvh] w-full text-slate-100 overflow-hidden relative"
      style={{
        background:
          "radial-gradient(ellipse at 20% 50%, #0d2818 0%, #0f1117 40%, #1a1a2e 70%, #0f1117 100%)",
      }}
    >
      {/* Background mesh decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #10b981, transparent)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
        />
      </div>

      {toast.message && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ type: "", message: "" })}
        />
      )}
      {isModalOpen && <FileUploadModal />}
      {imagePreview.isOpen && (
        <ImagePreviewModal
          src={imagePreview.src}
          onClose={handleCloseImagePreview}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen
            ? "w-72 translate-x-0"
            : "w-72 -translate-x-full lg:w-0"
        }`}
        style={{
          background: "rgba(15, 17, 23, 0.95)",
          backdropFilter: "blur(24px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {isSidebarOpen && (
          <>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-6 shrink-0 pt-1">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-900/40">
                    H
                  </div>
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400/20 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white tracking-tight">
                    HeritageX
                  </h1>
                  <p className="text-[10px] text-emerald-400/70 font-medium tracking-widest uppercase">
                    Maha-Heritage AI
                  </p>
                </div>
              </div>

              {user ? (
                <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
                  {/* Mode Switcher */}
                  <div
                    className="rounded-2xl p-3 border shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                      <Settings2 className="w-3 h-3" /> Mode
                    </p>
                    <div
                      className="flex p-1 rounded-xl relative"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      {["chat", "quiz"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 capitalize flex items-center justify-center gap-1.5 z-10 ${
                            mode === m
                              ? "text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          style={
                            mode === m
                              ? {
                                  background:
                                    "linear-gradient(135deg, #059669, #0d9488)",
                                  boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
                                }
                              : {}
                          }
                        >
                          {m === "chat" ? (
                            <Bot className="w-3.5 h-3.5" />
                          ) : (
                            <GraduationCap className="w-3.5 h-3.5" />
                          )}
                          {m}
                        </button>
                      ))}
                    </div>

                    {/* Quiz Config */}
                    {mode === "quiz" && (
                      <div className="mt-3 space-y-2.5">
                        <p className="text-xs text-slate-500">
                          Leave topic blank for a full-dataset quiz.
                        </p>
                        <div className="relative">
                          <input
                            type="text"
                            value={quizTopic}
                            onChange={(e) => setQuizTopic(e.target.value)}
                            placeholder="Topic (optional)"
                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-slate-200 placeholder-slate-500"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor =
                                "rgba(16,185,129,0.5)")
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor =
                                "rgba(255,255,255,0.1)")
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={quizDifficulty}
                            onChange={(e) => setQuizDifficulty(e.target.value)}
                            className="px-3 py-2.5 rounded-xl text-sm outline-none text-slate-200"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                          <select
                            value={quizQuestionType}
                            onChange={(e) => setQuizQuestionType(e.target.value)}
                            className="px-3 py-2.5 rounded-xl text-sm outline-none text-slate-200"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <option value="MCQ">MCQ</option>
                            <option value="Short Answer">Short Ans.</option>
                            <option value="Mixed">Mixed</option>
                          </select>
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={quizQuestionCount}
                          onChange={(e) => {
                            const v = parseInt(e.target.value || "1", 10);
                            setQuizQuestionCount(
                              Number.isFinite(v)
                                ? Math.min(Math.max(v, 1), 20)
                                : 5
                            );
                          }}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-slate-200 placeholder-slate-500"
                          placeholder="Questions (1-20)"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleQuery(e, "", true)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl font-semibold text-white transition-all duration-200 active:scale-[0.97] shadow-lg"
                          style={{
                            background:
                              "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                            boxShadow: "0 4px 15px rgba(5,150,105,0.35)",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.boxShadow =
                              "0 6px 20px rgba(5,150,105,0.5)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.boxShadow =
                              "0 4px 15px rgba(5,150,105,0.35)")
                          }
                        >
                          <BookOpenCheck className="w-4 h-4" />
                          Start New Quiz
                        </button>

                        {/* Quick topic suggestions */}
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">
                            Quick topics
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {quizSuggestions.map((s) => (
                              <button
                                key={s}
                                onClick={() => setQuizTopic(s)}
                                className="text-xs px-2.5 py-1 rounded-lg text-emerald-400 transition-all"
                                style={{
                                  background: "rgba(16,185,129,0.1)",
                                  border: "1px solid rgba(16,185,129,0.2)",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(16,185,129,0.2)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(16,185,129,0.1)")
                                }
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat List */}
                  <div className="flex justify-between items-center px-1 shrink-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Conversations
                    </span>
                    <button
                      onClick={handleNewChat}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                    {isChatListLoading ? (
                      <ChatSpin />
                    ) : chats.length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-6">
                        No conversations yet
                      </p>
                    ) : (
                      chats.map((chat) => (
                        <div
                          key={chat._id}
                          onClick={() => handleSelectChat(chat._id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group ${
                            currentChatId === chat._id
                              ? "text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                          style={
                            currentChatId === chat._id
                              ? {
                                  background: "rgba(16,185,129,0.12)",
                                  border: "1px solid rgba(16,185,129,0.2)",
                                }
                              : {
                                  border: "1px solid transparent",
                                }
                          }
                          onMouseEnter={(e) => {
                            if (currentChatId !== chat._id)
                              e.currentTarget.style.background =
                                "rgba(255,255,255,0.04)";
                          }}
                          onMouseLeave={(e) => {
                            if (currentChatId !== chat._id)
                              e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-emerald-500/60" />
                          <span className="text-xs truncate">{chat.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                // Not logged in
                <div className="flex flex-col gap-4 flex-1 min-h-0 justify-center items-center text-center px-2">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.1)" }}
                  >
                    <Brain className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm mb-1">
                      Save your chats
                    </p>
                    <p className="text-xs text-slate-500">
                      Log in to keep your conversation history and access quiz
                      mode.
                    </p>
                  </div>
                  <button
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                      boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                    }}
                    onClick={() => router.push("/login")}
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>

            {/* Profile footer */}
            <div
              className="shrink-0 p-4 border-t"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                  }}
                >
                  {user?.username?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.username || "Anonymous"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email || "Browse as guest"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Sidebar overlay (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col relative">
        {/* Top bar */}
        <div
          className="shrink-0 flex justify-between items-center px-4 py-3 z-10 border-b"
          style={{
            background: "rgba(15,17,23,0.8)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-white/8 transition text-slate-400 hover:text-white"
            >
              {isSidebarOpen ? <PanelLeft size={18} /> : <PanelRight size={18} />}
            </button>
            {quizSessionActive && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  color: "#34d399",
                }}
              >
                <Trophy className="w-3.5 h-3.5" />
                Quiz in progress
              </div>
            )}
            {mode === "quiz" && quizSessionActive && (
              <button
                onClick={() => {
                  handleNewChat();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-white transition"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <RotateCcw className="w-3 h-3" /> New Quiz
              </button>
            )}
          </div>

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Home className="w-4 h-4" /> Home
          </button>
        </div>

        {/* Chat / Welcome area */}
        {!isChatActive ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-4 py-10 overflow-y-auto">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#34d399",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {mode === "quiz" ? "Quiz Master" : "AI Heritage Assistant"}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white">
              {mode === "quiz" ? (
                <>
                  Ready to{" "}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #10b981, #0d9488)",
                    }}
                  >
                    test your knowledge?
                  </span>
                </>
              ) : (
                <>
                  Hello,{" "}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #10b981, #0d9488)",
                    }}
                  >
                    {user?.username || "Explorer"}
                  </span>
                </>
              )}
            </h1>
            <p className="text-slate-400 mb-10 max-w-xl text-sm sm:text-base leading-relaxed">
              {mode === "quiz"
                ? "Configure your quiz from the sidebar and click 'Start New Quiz', or pick a quick topic below."
                : "Ask anything about Maharashtra's history, monuments, inscriptions, and rich cultural heritage."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {(mode === "quiz" ? quizSuggestions : suggestions).map(
                (text, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(text)}
                    className="group flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(16,185,129,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)")
                    }
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(16,185,129,0.15)" }}
                    >
                      <LightbulbIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      {text}
                    </span>
                    <ChevronRight className="ml-auto w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5"
          >
            <div className="mx-auto w-full max-w-4xl space-y-5">
              {isChatLoading ? (
                <div className="flex justify-center items-center h-40">
                  <AIChatLoading />
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isLastAiMsg =
                    msg.role === "ai" && i === messages.length - 1;
                  const showQuizButtons =
                    isLastAiMsg && mode === "quiz" && !isLoading;

                  return (
                    <div
                      key={i}
                      className={`flex items-end gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg mb-1"
                          style={{
                            background:
                              "linear-gradient(135deg, #059669, #0d9488)",
                            boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                          }}
                        >
                          <Bot size={16} className="text-white" />
                        </div>
                      )}
                      <div
                        className={`flex flex-col ${
                          msg.role === "user" ? "items-end" : "items-start"
                        } max-w-[88%] sm:max-w-[78%] lg:max-w-[72%]`}
                      >
                        <div
                          className={`px-5 py-4 rounded-3xl text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "rounded-br-lg text-white"
                              : "rounded-bl-lg text-slate-200"
                          }`}
                          style={
                            msg.role === "user"
                              ? {
                                  background:
                                    "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                                  boxShadow:
                                    "0 4px 20px rgba(5,150,105,0.25)",
                                }
                              : {
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  backdropFilter: "blur(8px)",
                                  boxShadow:
                                    "0 4px 20px rgba(0,0,0,0.2)",
                                }
                          }
                        >
                          {msg.role === "ai" ? (
                            <MessageRenderer
                              text={msg.parts[0].text}
                              onImageClick={handleOpenImagePreview}
                            />
                          ) : (
                            <p>{msg.parts[0].text}</p>
                          )}
                        </div>
                        {showQuizButtons && (
                          <QuizOptionButtons
                            text={msg.parts[0].text}
                            disabled={isLoading}
                            onSelect={(letter) => handleQuery(null, letter)}
                          />
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm text-white mb-1"
                          style={{
                            background:
                              "linear-gradient(135deg, #065f46, #0f766e)",
                          }}
                        >
                          {user?.username?.[0]?.toUpperCase() || "A"}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Loading shimmer */}
              {isLoading && (
                <div className="flex justify-start">
                  <ShimmerSkeleton />
                </div>
              )}

              {/* Anonymous limit */}
              {isAnonymousLimited && (
                <div
                  className="text-center text-sm p-4 rounded-2xl"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  You have reached your message limit.{" "}
                  <a href="/login" className="font-bold underline text-rose-300">
                    Log in
                  </a>{" "}
                  to continue chatting.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* ── Input Bar ─────────────────────────────────────────────── */}
        <div
          className="shrink-0 px-4 sm:px-6 lg:px-10 py-4 border-t"
          style={{
            background: "rgba(15,17,23,0.8)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="relative mx-auto max-w-4xl rounded-2xl transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isAnonymousLimited
                  ? "Please log in to continue…"
                  : mode === "quiz"
                  ? "Type your answer (A, B, C or D)…"
                  : "Ask anything about Maharashtra Heritage…"
              }
              className="w-full bg-transparent border-0 rounded-2xl pl-12 pr-14 py-4 outline-none text-slate-100 placeholder-slate-500 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleQuery(e)}
              disabled={isAnonymousLimited}
              onFocus={(e) => {
                e.currentTarget.parentElement.style.borderColor =
                  "rgba(16,185,129,0.4)";
                e.currentTarget.parentElement.style.boxShadow =
                  "0 8px 32px rgba(0,0,0,0.3), 0 0 0 3px rgba(16,185,129,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.parentElement.style.borderColor =
                  "rgba(255,255,255,0.1)";
                e.currentTarget.parentElement.style.boxShadow =
                  "0 8px 32px rgba(0,0,0,0.3)";
              }}
            />
            {/* Left button */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={isAnonymousLimited}
                className="p-1.5 rounded-xl hover:bg-white/10 transition text-slate-500 hover:text-slate-300"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {/* Right button */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="rounded-xl p-2.5 text-white transition active:scale-95"
                  style={{ background: "rgba(239,68,68,0.8)" }}
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleQuery}
                  disabled={
                    isAnonymousLimited ||
                    (!query.trim() && !(mode === "quiz"))
                  }
                  className="rounded-xl p-2.5 text-white transition hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                    boxShadow: "0 4px 12px rgba(5,150,105,0.35)",
                  }}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-2.5">
            HeritageX is focused on Maharashtra heritage. Responses may not be
            perfect.
          </p>
        </div>
      </main>
    </div>
  );
};

const AIPage = () => (
  <Suspense fallback={<Loading />}>
    <AIComponent />
  </Suspense>
);

export default AIPage;
