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
  LightbulbIcon,
  Bot,
  Square,
  ArrowUp,
  X,
  FileText,
  ImageIcon,
  Paperclip,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Toast from "../component/Toast";
import Image from "next/image";
import Loading from "../loading";
import { fetchWithInternalToken } from "../../lib/fetch";

// ✅ Loading animation
const LoadingAnimation = () => (
  <div className="flex items-center space-x-1">
    <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce"></div>
  </div>
);

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
        const cleanedPart = part.replace(/\*\*/g, "").trim();
        if (cleanedPart) {
          result.push({ type: "text", content: cleanedPart });
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
                  <p className="mb-4 last:mb-0">{children}</p>
                ),
                h1: ({ node, children }) => (
                  <h1 className="text-2xl font-bold my-4">{children}</h1>
                ),
                h2: ({ node, children }) => (
                  <h2 className="text-xl font-bold my-3">{children}</h2>
                ),
                h3: ({ node, children }) => (
                  <h3 className="text-lg font-bold my-2">{children}</h3>
                ),
                ul: ({ node, children }) => (
                  <ul className="list-disc list-inside mb-4 pl-4">
                    {children}
                  </ul>
                ),
                ol: ({ node, children }) => (
                  <ol className="list-decimal list-inside mb-4 pl-4">
                    {children}
                  </ol>
                ),
                li: ({ node, children }) => (
                  <li className="mb-2">{children}</li>
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
              className="my-4 cursor-pointer"
              onClick={() => onImageClick(part.url)}
            >
              <div className="relative group overflow-hidden rounded-lg max-w-xl ">
                <Image
                  src={part.url}
                  alt={"Heritage image"}
                  width={500}
                  height={200}
                  className="rounded-lg object-contain w-full h-full shadow-lg transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white font-bold px-4 py-2 rounded-full bg-black/25 bg-opacity-50 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Click to Enlarge
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

const AIComponent = () => {
  const { user, loading: authLoading } = useAuth();
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isChatActive, setIsChatActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isAnonymousLimited, setIsAnonymousLimited] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [imagePreview, setImagePreview] = useState({ isOpen: false, src: "" });
  const [initialMessage, setInitialMessage] = useState(``);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatListLoading, setIsChatListLoading] = useState(false);

  if (authLoading) {
    return <Loading to="AI Chat" />;
  }

  const handleOpenImagePreview = (src) => {
    setImagePreview({ isOpen: true, src });
  };

  const handleCloseImagePreview = () => {
    setImagePreview({ isOpen: false, src: "" });
  };

  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const { visitorId } = await fp.get();
      setFingerprint(visitorId);
    };
    getFingerprint();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsSidebarOpen(width >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchChats = useCallback(async () => {
    if (user) {
      setIsChatListLoading(true);
      try {
        const headers = {
          "Content-Type": "application/json",
        };

        if (user) {
          const token = localStorage.getItem("auth-token");
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
        }
        const res = await fetchWithInternalToken("/api/ai/chats", {
          headers,
          method: "GET",
        });

        if (res.ok) {
          const data = await res.json();

          setChats(data.chats);
        }
      } catch (error) {
      } finally {
        // setIsChatListLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    const queryFromUrl = searchParams.get("q");
    if (queryFromUrl) {
      setQuery(queryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchAndSetChats = async () => {
      if (user) {
        await fetchChats();
        const storedChatId = sessionStorage.getItem("currentChatId");
        if (storedChatId) {
          handleSelectChat(storedChatId);
        } else {
          setIsChatActive(false);
        }
      }
    };
    fetchAndSetChats();
  }, [user, fetchChats]);

  const handleSelectChat = async (chatId) => {
    setIsChatLoading(true);
    setCurrentChatId(chatId);
    sessionStorage.setItem("currentChatId", chatId);
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetchWithInternalToken(`/api/ai/chat/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      } else {
        throw new Error("Failed to load chat.");
      }
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setIsChatActive(false);
    setMessages([]);
    sessionStorage.removeItem("currentChatId");
  };

  const suggestions = [
    "Tell me about Ajanta Caves.",
    "What is the history of Ellora Caves?",
    "Tell me about Elephanta Caves.",
    "What are the UNESCO Heritage sites in Maharashtra?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isAtBottom, isLoading]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 1;
    setIsAtBottom(isBottom);
  };

  const showToast = (type, message) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ type, message });

    // Set new timeout to clear toast after 3 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ type: "", message: "" });
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const handleFileUpload = (e, type) => {
    // console.log("File upload attempted");
    showToast("warning", "File upload coming soon!");
  };

  const handleQuery = async (e, customQuery) => {
    e?.preventDefault();

    const actualQuery = customQuery || query;

    if (!actualQuery.trim()) {
      showToast("warning", "Please type a question!");
      return;
    }

    if (!isChatActive) setIsChatActive(true);

    const newMessage = { role: "user", parts: [{ text: actualQuery }] };
    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    setQuery("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (user) {
        const token = localStorage.getItem("auth-token");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
      const res = await fetchWithInternalToken("/api/ai", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: actualQuery,
          messages: messages,
          chatId: user ? currentChatId : null,
          fingerprint,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Something went wrong");
      }
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "ai", parts: [{ text: data.response }] },
      ]);

      if (data.chatId) {
        setCurrentChatId(data.chatId);
        if (!chats.some((chat) => chat._id === data.chatId)) {
          fetchChats();
        }
      }
    } catch (error) {
      if (error.message.includes("Query limit exceeded")) {
        setIsAnonymousLimited(true);
      }
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (text) => {
    setQuery(text);
    handleQuery(null, text);
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const FileUploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Files</h2>
          <button onClick={() => setIsModalOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="w-full flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
            <FileText className="w-6 h-6 text-blue-500" />
            <span>Upload a Document</span>
            <input
              type="file"
              accept=".doc,.docx,.txt"
              onChange={(e) => handleFileUpload(e, "document")}
              className="hidden"
            />
          </label>
          <label className="w-full flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
            <ImageIcon className="w-6 h-6 text-green-500" />
            <span>Upload an Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "image")}
              className="hidden"
            />
          </label>
          <label className="w-full flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
            <Paperclip className="w-6 h-6 text-red-500" />
            <span>Upload a PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileUpload(e)}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const ImagePreviewModal = ({ src, onClose }) => (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-[95vw] w-auto h-full max-h-[95vh] p-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt="Preview"
          width={2400}
          height={2000}
          className="object-contain rounded-xl shadow-xl"
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-2 text-black bg-white/49 hover:bg-white/80 rounded-full transition"
        >
          <X size={22} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden">
      {toast.message && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ type: "", message: "" })}
        />
      )}

      {imagePreview.isOpen && (
        <ImagePreviewModal
          src={imagePreview.src}
          onClose={handleCloseImagePreview}
        />
      )}

      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between p-4 border-r border-green-100 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen
            ? "w-72 bg-green-50 translate-x-0"
            : "w-72 -translate-x-full bg-white lg:w-0"
        }`}
      >
        {isSidebarOpen && (
          <>
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-linear-to-br from-green-600 to-green-950 rounded-2xl flex items-center justify-center text-white font-bold text-lg mr-3">
                  H
                </div>
                <h1 className="text-xl font-semibold bg-linear-to-br text-transparent from-green-600 to-green-950 bg-clip-text">
                  HeritageX
                </h1>
              </div>
              {user ? (
                <div className="h-full">
                  <div className="flex justify-between items-center px-2 mb-2">
                    <span className="text-sm font-semibold text-gray-600">
                      Chats
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleNewChat}
                        className="p-1 hover:bg-green-200 rounded-full"
                      >
                        <Plus size={16} />
                      </button>
                      <span className="relative group cursor-pointer">
                        <History className="w-4" />
                        <span className="absolute left-[110%] top-1/2 -translate-y-1/2 w-28 bg-green-800 text-white text-xs text-center rounded-md py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300">
                          Only 30 days backup
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 overflow-y-scroll h-[calc(100vh-250px)]">
                    {isChatListLoading ? (
                      <ChatSpin />
                    ) : (
                      chats.map((chat) => (
                        <div
                          key={chat._id}
                          onClick={() => handleSelectChat(chat._id)}
                          className={`flex items-center gap-3 text-gray-700 hover:bg-green-100 rounded-lg px-3 py-2 cursor-pointer transition ${
                            currentChatId === chat._id ? "bg-green-100" : ""
                          }`}
                        >
                          <MessageSquare className="w-5 h-5 text-gray-600" />
                          <span className="text-sm truncate">{chat.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 font-bold text-black/40 h-[calc(100vh-250px)] justify-center items-center text-center">
                  <Loader size={30} />
                  <p className="px-2 flex flex-col gap-2">
                    <span>
                      Login to{" "}
                      <span className="text-transparent bg-linear-to-br from-green-500 to-green-900 bg-clip-text ">
                        store your chats
                      </span>{" "}
                    </span>
                    <span className="  text-sm font-normal text-black/50">
                      Your chat history stays safe - continue from where you
                      left off!
                    </span>
                  </p>
                  <div
                    className="mt-4 px-5 py-2 bg-linear-to-br from-green-500 to-green-900 hover:bg-linear-to-tl text-white rounded-full transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg"
                    onClick={() => {
                      router.push("/login");
                    }}
                  >
                    Go to Login
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="pt-4 mt-3 text-sm font-semibold text-gray-600 ">
                Profile
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="py-1 px-3 border-2 border-green-700 rounded-full text-green-700 font-bold text-lg">
                  {user?.username?.[0]?.toUpperCase() || "A"}
                </div>
                <div>
                  <p className="font-semibold text-green-800">
                    {user?.username || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || "Anonymous@maharitage.in"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Overlay for small screens when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* ===== Main Chat Section ===== */}
      <main className="flex-1 grid grid-rows-[auto_1fr_auto] bg-white relative">
        {/* Top bar */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-full lg:hidden"
          >
            {isSidebarOpen ? <PanelLeft /> : <PanelRight />}
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="border border-gray-300 rounded-full px-5 py-1 text-gray-700 hover:bg-green-50 transition text-sm font-medium"
          >
            Home
          </button>
        </div>

        {/* Middle Section */}
        {!isChatActive ? (
          <div className="flex flex-col items-center justify-center text-center bg-gray-50">
            <h1 className="text-4xl font-bold mb-4">
              Hello,{" "}
              <span className="text-green-700">{user?.username || "User"}</span>
            </h1>
            <p className="text-lg text-gray-500 mb-12">
              How can I help you today?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-10 w-full max-w-4xl">
              {suggestions.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(text)}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-100 transition text-left"
                >
                  <LightbulbIcon className="text-green-600 w-6 h-6" />
                  <span className="font-medium text-gray-700">{text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto px-4 sm:px-10 py-6 space-y-6"
          >
            {isChatLoading ? (
              <div className="flex justify-center items-center h-full">
                <AIChatLoading />
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <div className="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center text-white shrink-0">
                        <Bot size={24} />
                      </div>
                    )}
                    <div
                      className={`px-5 py-3 rounded-2xl max-w-[75%] shadow-sm prose ${
                        msg.role === "user"
                          ? "bg-green-800 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-800 rounded-bl-none"
                      }`}
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
                    {msg.role === "user" && (
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                        {user?.username?.[0]?.toUpperCase() || "A"}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl p-4">
                  <LoadingAnimation />
                </div>
              </div>
            )}
            {isAnonymousLimited && (
              <div className="text-center text-sm text-red-600 p-4 border border-red-300 rounded-lg bg-red-100 shadow-md">
                You have reached your message limit. Please{" "}
                <a href="/login" className="font-bold underline">
                  log in
                </a>{" "}
                to continue chatting.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Bottom Section */}
        <div className="px-4 sm:px-10 pb-6 pt-4 bg-white border-t border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isAnonymousLimited
                  ? "Please log in to continue"
                  : "Ask me anything about Maharashtra Heritage..."
              }
              className="w-full bg-gray-100 border-2 border-gray-200 rounded-full pl-12 pr-20 py-3 outline-none text-gray-800 placeholder-gray-500 transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
              onKeyDown={(e) => e.key === "Enter" && handleQuery(e)}
              disabled={isAnonymousLimited}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <button
                type="button"
                className="cursor-pointer"
                onClick={() => {
                  showToast("warning", "File upload is coming soon!");
                }}
                disabled={isAnonymousLimited}
              >
                <Plus
                  className={`w-6 h-6 ${
                    isAnonymousLimited ? "text-gray-400" : "text-gray-600"
                  }`}
                />
              </button>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="bg-red-500 hover:bg-red-600 rounded-full p-2 text-white transition"
                >
                  <Square className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleQuery}
                  disabled={!query.trim() || isAnonymousLimited}
                  className="bg-linear-to-br from-green-600 to-green-800 disabled:from-gray-300 disabled:to-gray-400 rounded-full text-white p-2 transition hover:scale-105 active:scale-95"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
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
