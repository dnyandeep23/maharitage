"use client";

import React, {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAudience } from "../../contexts/AudienceContext";
import { useRouter, useSearchParams } from "next/navigation";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import ChatSpin from "./ChatSpin";
import StudentGameUI from "./StudentGameUI";
import ProfessionalChatUI from "./ProfessionalChatUI";
import {
  Plus,
  MessageSquare,
  Bot,
  X,
  Trash2,
  ImageIcon,
  PanelLeft,
  PanelRight,
  GraduationCap,
  Sparkles,
  BookOpenCheck,
  RotateCcw,
  Trophy,
  Brain,
  Home,
  Settings2,
  User,
  Gamepad2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Toast from "../component/Toast";
import Image from "next/image";
import Loading from "../loading";
import { fetchWithInternalToken } from "../../lib/fetch";

const getChatStorageKey = (audience, mode) =>
  `currentChatId:${audience}:${mode}`;

const normalizeAudienceParam = (value) =>
  value === "student" ? "student" : "general";

const normalizeModeParam = (value, audience) => {
  if (value === "chat") return "chat";
  if (value === "quiz") return "quiz";
  return audience === "student" ? "quiz" : "chat";
};

const getQuizRoute = (audience) =>
  audience === "student" ? "/quiz/student" : "/quiz/general";


// ─── Main AI Component ───────────────────────────────────────────────────────
const AIComponent = () => {
  const { user, loading: authLoading } = useAuth();
  const { audience, selectAudience, isReady: isAudienceReady } =
    useAudience();
  const abortControllerRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const hasInitializedModeViewRef = useRef(false);
  const suppressModeResetRef = useRef(false);
  const skipStoredChatRestoreRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isChatActive, setIsChatActive] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatMeta, setCurrentChatMeta] = useState(null);
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
  const [isQuizConfigExpanded, setIsQuizConfigExpanded] = useState(false);
  const [studentRequestError, setStudentRequestError] = useState({
    id: 0,
    message: "",
  });
  const audienceType = audience || "general";
  const currentChatStorageKey = getChatStorageKey(audienceType, mode);
  const visibleChats = useMemo(
    () =>
      chats.filter((chat) => (chat.audienceType || "general") === audienceType),
    [audienceType, chats]
  );

  const handleOpenImagePreview = (src) =>
    setImagePreview({ isOpen: true, src });
  const handleCloseImagePreview = () =>
    setImagePreview({ isOpen: false, src: "" });

  const stopActiveRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

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
    if (!isAudienceReady) return;
    setIsAudienceModalOpen(!audience);
  }, [audience, isAudienceReady]);

  const handleNewChat = useCallback(() => {
    stopActiveRequest();
    setCurrentChatId(null);
    setCurrentChatMeta(null);
    setIsChatActive(false);
    setMessages([]);
    setQuizSessionActive(false);
    sessionStorage.removeItem(currentChatStorageKey);
  }, [currentChatStorageKey, stopActiveRequest]);

  const handleStartFreshChat = useCallback(() => {
    stopActiveRequest();
    setCurrentChatId(null);
    setCurrentChatMeta(null);
    setIsChatActive(false);
    setMessages([]);
    setQuizSessionActive(false);
    sessionStorage.removeItem(getChatStorageKey(audienceType, "chat"));
    sessionStorage.removeItem(getChatStorageKey(audienceType, "quiz"));
  }, [audienceType, mode, stopActiveRequest]);

  const redirectToNewQuizPage = useCallback(
    (targetAudience = audienceType) => {
      const normalizedAudience = normalizeAudienceParam(targetAudience);
      router.push(getQuizRoute(normalizedAudience));
    },
    [audienceType, router]
  );

  useEffect(() => {
    if (!isAudienceReady) return;

    const hasAudienceParam = searchParams.has("audience");
    const hasModeParam = searchParams.has("mode");
    const hasNewQuizParam = searchParams.get("newQuiz") === "1";

    if (!hasAudienceParam && !hasModeParam && !hasNewQuizParam) return;

    const requestedAudience = hasAudienceParam
      ? normalizeAudienceParam(searchParams.get("audience"))
      : audienceType;
    if (hasAudienceParam && !audience) {
      selectAudience(requestedAudience);
    }
    const requestedMode = normalizeModeParam(
      searchParams.get("mode"),
      requestedAudience || audienceType
    );

    if (requestedMode !== mode) {
      suppressModeResetRef.current = true;
      setMode(requestedMode);
    }

    if (hasAudienceParam || hasModeParam || hasNewQuizParam) {
      skipStoredChatRestoreRef.current = true;
      const params = new URLSearchParams(searchParams.toString());
      if (hasNewQuizParam) {
        setCurrentChatId(null);
        setCurrentChatMeta(null);
        setIsChatActive(false);
        setMessages([]);
        setQuizSessionActive(false);
        sessionStorage.removeItem(currentChatStorageKey);
        sessionStorage.removeItem(getChatStorageKey(requestedAudience, "chat"));
        sessionStorage.removeItem(getChatStorageKey(requestedAudience, "quiz"));
      }
      params.delete("audience");
      params.delete("mode");
      params.delete("newQuiz");
      router.replace(`/ai${params.toString() ? `?${params}` : ""}`);
    }
  }, [
    audience,
    audienceType,
    currentChatStorageKey,
    isAudienceReady,
    mode,
    router,
    searchParams,
    selectAudience,
  ]);

  useEffect(() => {
    if (!user || !isAudienceReady || !audience) return;
    fetchChats().then(() => {
      if (skipStoredChatRestoreRef.current) {
        skipStoredChatRestoreRef.current = false;
        setIsChatActive(false);
        return;
      }
      const stored = sessionStorage.getItem(currentChatStorageKey);
      if (stored) handleSelectChat(stored);
      else setIsChatActive(false);
    });
  }, [audience, currentChatStorageKey, fetchChats, isAudienceReady, user]);

  useEffect(() => {
    if (!user) setMode("chat");
  }, [user]);

  useEffect(() => {
    if (mode !== "quiz") {
      setIsQuizConfigExpanded(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!user || !audience) return;
    if (!hasInitializedModeViewRef.current) {
      hasInitializedModeViewRef.current = true;
      return;
    }
    if (suppressModeResetRef.current) {
      suppressModeResetRef.current = false;
      return;
    }
    handleNewChat();
  }, [audience, audienceType, mode, user, handleNewChat]);

  const handleSelectChat = async (chatId) => {
    stopActiveRequest();
    setIsChatLoading(true);
    setCurrentChatId(chatId);
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetchWithInternalToken(`/api/ai/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const incomingMode = data.chat?.mode;
        const incomingAudienceType = data.chat?.audienceType;
        if (
          incomingAudienceType &&
          incomingAudienceType !== audienceType
        ) {
          sessionStorage.removeItem(currentChatStorageKey);
          setCurrentChatId(null);
          setCurrentChatMeta(null);
          setIsChatActive(false);
          setMessages([]);
          throw new Error("This conversation belongs to a different audience.");
        }
        if (
          incomingMode && incomingMode !== mode
        ) {
          suppressModeResetRef.current = true;
        }
        setMessages(
          data.messages.map((msg) => ({
            role: msg.sender,
            parts: [{ text: msg.message }],
          }))
        );
        setCurrentChatMeta(data.chat || null);
        if (data.chat?.mode) {
          setMode(data.chat.mode);
        }
        const storageAudience = data.chat?.audienceType || audienceType;
        const storageMode = data.chat?.mode || mode;
        sessionStorage.setItem(
          getChatStorageKey(storageAudience, storageMode),
          chatId
        );
        setIsChatActive(true);
        setQuizSessionActive(data.chat?.mode === "quiz");
      } else throw new Error("Failed to load chat.");
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("error", error.message);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

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
    "Maharashtra inscriptions",
  ];


  const showToast = (type, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ type: "", message: "" });
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const handleDeleteChat = useCallback(
    async (chatId) => {
      try {
        const token = localStorage.getItem("auth-token");
        const res = await fetchWithInternalToken(`/api/ai/chat/${chatId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error("Failed to delete chat.");
        }

        setChats((prev) => prev.filter((chat) => chat._id !== chatId));
        if (currentChatId === chatId) {
          handleNewChat();
        }
      } catch (error) {
        showToast("error", error.message || "Unable to delete chat.");
      }
    },
    [currentChatId, handleNewChat]
  );

  const processImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    if (selectedImages.length + files.length > 4) {
      showToast("error", "You can upload a maximum of 4 images at a time.");
      return;
    }

    const newImages = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        showToast("error", "Only image files are supported.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", `Image ${file.name} is larger than 5MB.`);
        continue;
      }

      await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target.result;
          const base64Data = base64String.split(",")[1];
          newImages.push({
            id: Math.random().toString(36).substring(7),
            file,
            previewUrl: URL.createObjectURL(file),
            base64: base64Data,
            mimeType: file.type
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    if (newImages.length > 0) {
      setSelectedImages((prev) => [...prev, ...newImages]);
      setIsPopoverOpen(false);
    }
  };

  const handleGlobalDragOver = (e) => {
    e.preventDefault();
    if (!isGlobalDragging) setIsGlobalDragging(true);
  };

  const handleGlobalDragLeave = (e) => {
    e.preventDefault();
    if (e.relatedTarget === null || e.relatedTarget?.nodeName === "HTML") {
      setIsGlobalDragging(false);
    }
  };

  const handleGlobalDrop = async (e) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) {
      await processImageFiles(files);
    }
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const handleQuery = async (e, customQuery, startNewChat = false) => {
    e?.preventDefault();
    if (isLoading) return;
    
    let actualQuery = customQuery || query;
    const isSilentQuizAnswer =
      mode === "quiz" && /^[A-D]$/i.test(actualQuery.trim());

    // If quiz mode and (no query text or starting a new quiz), build a meaningful quiz prompt
    if ((!actualQuery.trim() || startNewChat) && mode === "quiz") {
      const topicText = quizTopic.trim() || "diverse Maharashtra Heritage topics spanning monuments, dynasties, culture, and inscriptions";
      actualQuery = `Generate a ${quizDifficulty} ${quizQuestionType} quiz with ${quizQuestionCount} questions on ${topicText}.`;
      setQuery("");
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
    if (audienceType === "student" && mode === "quiz") {
      setStudentRequestError({ id: 0, message: "" });
    }

    if (!isChatActive) setIsChatActive(true);
    if (mode === "quiz" && startNewChat) setQuizSessionActive(true);

    const newMessageParts = [{ text: actualQuery }];
    let inlineDataArray = [];
    let attachedImagesData = [];

    if (selectedImages.length > 0) {
      inlineDataArray = selectedImages.map(img => ({
        mimeType: img.mimeType,
        data: img.base64
      }));
      attachedImagesData = selectedImages.map(img => `data:${img.mimeType};base64,${img.base64}`);
    }

    const newMessage = {
      role: "user",
      parts: newMessageParts,
      attachedImages: attachedImagesData,
      hidden: isSilentQuizAnswer,
    };
    const currentMessages = startNewChat ? [] : messages;
    const currentId = startNewChat ? null : currentChatId;
    const updatedMessages = [...currentMessages, newMessage];

    setMessages(updatedMessages);
    setQuery("");
    
    // Clear images immediately after submitting
    selectedImages.forEach(img => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    setSelectedImages([]);
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
                audienceType,
              },
              imageDatas: inlineDataArray,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            let payload = {};
            try {
              payload = await res.json();
            } catch (_) {}

            const serverMessage = payload?.error || payload?.response || "";
            const isLimited =
              typeof serverMessage === "string" &&
              serverMessage.includes("Query limit exceeded");
            const isQuotaError =
              typeof serverMessage === "string" &&
              /quota|billing|rate limit|exhausted/i.test(serverMessage);
            const isBusy =
              res.status === 429 || res.status === 503 || res.status >= 500;

            if (isLimited) throw new Error("Query limit exceeded");
            if (isQuotaError) throw new Error(serverMessage);
            if (isBusy && attempt < maxAttempts) {
              showToast("warning", "AI is busy. Retrying…");
              await sleep(retryDelays[attempt - 1]);
              continue;
            }
            if (isBusy) throw new Error("Server is busy. Please try again.");
            throw new Error("Unable to process your request right now.");
          }

          // Successful streaming response
          const returnedChatId = res.headers.get("X-Chat-Id");
          if (returnedChatId) {
            setCurrentChatId(returnedChatId);
            if (!chats.some((c) => c._id === returnedChatId)) fetchChats();
          }

          setMessages((prev) => [
            ...prev,
            { role: "ai", parts: [{ text: "" }], isStreaming: true },
          ]);

          const reader = res.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let done = false;
          let text = "";
          let prevDisplayLen = 0;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              text += chunk;
              
              // Strip any incomplete [Image: ...] tags so user never sees raw URLs
              let displayText = text;
              const lastOpenBracket = displayText.lastIndexOf('[Image:');
              if (lastOpenBracket !== -1) {
                const closingBracket = displayText.indexOf(']', lastOpenBracket);
                if (closingBracket === -1) {
                  // Tag not closed yet — hide the partial tag
                  displayText = displayText.substring(0, lastOpenBracket);
                }
              }
              
              // Also strip any still-present [Image needed: ...] partial tags
              const lastNeededTag = displayText.lastIndexOf('[Image needed:');
              if (lastNeededTag !== -1) {
                const closingNeeded = displayText.indexOf(']', lastNeededTag);
                if (closingNeeded === -1) {
                  displayText = displayText.substring(0, lastNeededTag);
                }
              }
              
              const shouldBufferStudentQuizResponse =
                audienceType === "student" && mode === "quiz";

              if (!shouldBufferStudentQuizResponse) {
                const charsPerTick = 2;
                for (
                  let i = prevDisplayLen;
                  i < displayText.length;
                  i += charsPerTick
                ) {
                  const showUpTo = Math.min(i + charsPerTick, displayText.length);
                  const visibleText = displayText.substring(0, showUpTo);

                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === "ai") {
                      lastMsg.parts[0].text = visibleText;
                    }
                    return newMessages;
                  });

                  await new Promise((r) => setTimeout(r, 30));
                }
              }
              prevDisplayLen = displayText.length;
            }
          }

          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === "ai") {
              // Set the complete text with all image tags intact
              lastMsg.parts[0].text = text;
              lastMsg.isStreaming = false;
            }
            return newMessages;
          });

          data = { success: true };
          break;
        } catch (err) {
          if (err.name === "AbortError") throw err;
          if (err.message?.includes("Query limit exceeded")) throw err;
          if (/quota|billing|rate limit|exhausted/i.test(err.message || "")) {
            throw err;
          }
          if (attempt < maxAttempts) {
            showToast("warning", "AI is busy. Retrying…");
            await sleep(retryDelays[attempt - 1]);
            continue;
          }
          throw new Error("Server is busy. Please try again.");
        }
      }

      if (!data) throw new Error("Server is busy. Please try again.");
    } catch (error) {
      if (error.name === "AbortError") {
        showToast("warning", "Request stopped.");
        return;
      }
      if (mode === "quiz" && audienceType === "student" && isSilentQuizAnswer) {
        setMessages(currentMessages);
        setStudentRequestError({
          id: Date.now(),
          message:
            error.message || "We couldn't submit that answer. Please try again.",
        });
      }
      if (error.message?.includes("Query limit exceeded")) {
        setIsAnonymousLimited(true);
        showToast("error", "Free query limit reached. Please log in.");
        return;
      }
      showToast(
        "error",
        /quota|billing|rate limit|exhausted/i.test(error.message || "")
          ? error.message
          : "AI is currently busy. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (text) => {
    if (mode === "quiz") {
      setQuizTopic(text);
      // Auto-start the quiz with the selected topic
      setTimeout(() => handleQuery(null, "", true), 50);
    } else {
      setQuery(text);
      startTransition(() => {
        handleQuery(null, text);
      });
    }
  };

  const handleStop = () => {
    stopActiveRequest();
  };

  if (authLoading || !isAudienceReady) return <Loading to="AI Chat" />;

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
      className="relative flex h-[100dvh] w-full overflow-hidden text-[#fbf7ee]"
      style={{
        background:
          "linear-gradient(135deg, #071b15 0%, #123327 48%, #15120d 100%)",
      }}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Global Drag Overlay */}
      {isGlobalDragging && (
        <div className="pointer-events-none absolute inset-0 z-[100] flex items-center justify-center bg-[#071b15]/86 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[#d9c18a] bg-[#123327]/42 p-16 shadow-2xl">
            <ImageIcon className="mb-6 h-16 w-16 animate-bounce text-[#d9c18a]" />
            <h2 className="text-3xl font-bold tracking-wide text-white">Drop image here</h2>
            <p className="mt-2 text-lg text-[#fbf7ee]/70">to attach to your heritage query</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(217,193,138,0.08),transparent_32%),linear-gradient(290deg,rgba(255,250,240,0.04),transparent_42%)]" />

      {toast.message && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ type: "", message: "" })}
        />
      )}

      {/* Audience Selection Modal */}
      {isAudienceModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[60] flex items-center justify-center bg-[#071b15]/68 p-4 backdrop-blur-sm duration-200">
          <div className="museum-dark-panel relative w-full max-w-lg overflow-hidden">
            <div className="p-8">
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.24em] text-[#d9c18a]">
                AI Archive
              </p>
              <h2 className="mb-2 text-center font-cinzel-decorative text-2xl font-bold text-white">Choose Your Audience</h2>
              <p className="mb-8 text-center text-sm text-[#fbf7ee]/62">Select how the assistant should guide the heritage experience.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    selectAudience("general");
                    setMode("chat");
                    setIsAudienceModalOpen(false);
                  }}
                  className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-200 ${
                    audienceType === "general"
                      ? "border-[#d9c18a]/60 bg-[#d9c18a]/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#d9c18a]/30"
                  }`}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d9c18a]/14 text-[#d9c18a]">
                    <User size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">General</h3>
                  <p className="text-xs text-[#fbf7ee]/58">Professional, standard heritage exploration.</p>
                </button>

                <button
                  onClick={() => {
                    selectAudience("student");
                    setMode("quiz");
                    setIsAudienceModalOpen(false);
                  }}
                  className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-200 ${
                    audienceType === "student"
                      ? "border-[#d9c18a]/60 bg-[#d9c18a]/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#d9c18a]/30"
                  }`}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#b9924a]/18 text-[#d9c18a]">
                    <Gamepad2 size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Student</h3>
                  <p className="text-xs text-[#fbf7ee]/58">Guided learning with quizzes and rewards.</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          background: "rgba(7, 27, 21, 0.94)",
          backdropFilter: "blur(24px)",
          borderColor: "rgba(217,193,138,0.12)",
        }}
      >
        {isSidebarOpen && (
          <>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-6 shrink-0 pt-1">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d9c18a] text-lg font-black text-[#071b15] shadow-lg">
                    H
                  </div>
                  <div className="absolute inset-0 animate-pulse rounded-2xl ring-2 ring-[#d9c18a]/20" />
                </div>
                <div>
                  <h1 className="font-cinzel-decorative text-base font-bold tracking-tight text-white">
                    MahaRitage
                  </h1>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#d9c18a]/74">
                    Heritage AI
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
                                    "linear-gradient(135deg, #b9924a, #123327)",
                                  boxShadow: "0 2px 8px rgba(185,146,74,0.24)",
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

                    {/* Audience Switcher */}
                    <div className="mt-4 flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5">
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Audience</p>
                        <p className="text-[10px] capitalize text-[#d9c18a]">{audienceType} Mode</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAudienceModalOpen(true)}
                        className="rounded-lg border border-[#d9c18a]/24 bg-[#d9c18a]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d9c18a] transition hover:bg-[#d9c18a]/18"
                      >
                        Switch Audience
                      </button>
                    </div>

                    {/* Quiz Config */}
                    {mode === "quiz" && audienceType === "general" && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setIsQuizConfigExpanded((prev) => !prev)
                          }
                          className="w-full flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-left transition hover:bg-white/8"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-200">
                              Quiz Setup
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {quizTopic?.trim() || "All heritage topics"} ·{" "}
                              {quizDifficulty} · {quizQuestionType} ·{" "}
                              {quizQuestionCount} Qs
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isQuizConfigExpanded && (
                              <button
                                disabled={isLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuery(e, "", true);
                                }}
                                className={`px-2 py-1 text-[10px] font-bold rounded transition shadow-sm ${
                                  isLoading
                                    ? "bg-emerald-500/10 text-emerald-400/50 cursor-not-allowed"
                                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                                }`}
                              >
                                {isLoading ? "..." : "START"}
                              </button>
                            )}
                            {isQuizConfigExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                          </div>
                        </button>

                        {isQuizConfigExpanded && (
                          <div className="mt-3 space-y-2.5 max-h-[46vh] overflow-y-auto pr-1 scrollbar-thin">
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
                    )}
                  </div>

                  {/* Chat List */}
                  <div className="px-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (audienceType === "student" && mode === "quiz") {
                          redirectToNewQuizPage("student");
                        } else {
                          mode === "quiz"
                            ? redirectToNewQuizPage(audienceType)
                            : handleStartFreshChat();
                        }
                      }}
                      className="w-full rounded-2xl border border-dashed px-4 py-3 text-left transition-all duration-200 hover:bg-white/6 hover:border-emerald-400/30"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                          <Plus size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {mode === "quiz" ? "New Quiz" : "New Chat"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Start a fresh {audienceType} {mode === "quiz" ? "quiz" : "conversation"}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="flex justify-between items-center px-1 shrink-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Conversations
                    </span>
                    <span className="text-[10px] text-slate-600 capitalize">
                      {audienceType} only
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                    {isChatListLoading ? (
                      <ChatSpin />
                    ) : visibleChats.length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-6">
                        No conversations yet
                      </p>
                    ) : (
                      visibleChats.map((chat) => (
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
                          <div className="min-w-0 flex-1">
                            <span className="text-xs truncate block">{chat.title}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-slate-300 capitalize">
                                {chat.audienceType || "general"}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${
                                  chat.mode === "quiz"
                                    ? "bg-amber-500/15 text-amber-300"
                                    : "bg-emerald-500/15 text-emerald-300"
                                }`}
                              >
                                {chat.mode || "chat"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat._id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                            aria-label="Delete chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                type="button"
                onClick={() => {
                  redirectToNewQuizPage(audienceType);
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

        {/* ── Conditional UI Rendering ─────────────────────── */}
        {audienceType === "student" && mode === "quiz" ? (
          <StudentGameUI
            messages={messages}
            isLoading={isLoading}
            handleQuery={handleQuery}
            handleStop={handleStop}
            chatMeta={currentChatMeta}
            onNewQuiz={() => redirectToNewQuizPage("student")}
            quizConfig={{
              topic: quizTopic,
              difficulty: quizDifficulty,
              questionCount: quizQuestionCount,
              questionType: quizQuestionType,
            }}
            setQuizTopic={setQuizTopic}
            setQuizDifficulty={setQuizDifficulty}
            setQuizQuestionCount={setQuizQuestionCount}
            setQuizQuestionType={setQuizQuestionType}
            requestErrorSignal={studentRequestError}
          />
        ) : (
          <ProfessionalChatUI
            messages={messages}
            isLoading={isLoading}
            isChatActive={isChatActive}
            isChatLoading={isChatLoading}
            isAnonymousLimited={isAnonymousLimited}
            mode={mode}
            query={query}
            setQuery={setQuery}
            handleQuery={handleQuery}
            handleSuggestion={handleSuggestion}
            handleStop={handleStop}
            handleOpenImagePreview={handleOpenImagePreview}
            user={user}
            suggestions={suggestions}
            quizSuggestions={quizSuggestions}
            quizSessionActive={quizSessionActive}
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            processImageFiles={processImageFiles}
            isPopoverOpen={isPopoverOpen}
            setIsPopoverOpen={setIsPopoverOpen}
            audienceType={audienceType}
            quizConfig={{
              topic: quizTopic,
              difficulty: quizDifficulty,
              questionCount: quizQuestionCount,
              questionType: quizQuestionType,
            }}
          />
        )}
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
