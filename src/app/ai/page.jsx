"use client";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  Plus,
  X,
  FileText,
  Image as ImageIcon,
  Paperclip,
  LightbulbIcon,
  MessageSquare,
  History,
  AlertCircle,
  Bot,
  Square,
  Icon,
  HomeIcon,
  Loader,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

// ✅ Simple toast component
const Toast = ({ type, message, onClose }) => {
  if (!message) return null;
  const bgColor =
    type === "error"
      ? "bg-red-600"
      : type === "warning"
      ? "bg-yellow-500"
      : "bg-green-600";
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[2000] animate-fade-in">
      <div
        className={`flex items-center gap-3 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg`}
      >
        <AlertCircle className="w-5 h-5 text-white" />
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ✅ Loading animation
const LoadingDots = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
    <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
    <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce" />
  </div>
);

const AIPage = () => {
  const { user } = useAuth();
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const router = useRouter();
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

  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const { visitorId } = await fp.get();
      setFingerprint(visitorId);
    };
    getFingerprint();
  }, []);

  const fetchChats = useCallback(async () => {
    if (user) {
      console.log("Fetching chats...");
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
        const res = await fetch("/api/ai/chats", {
          headers,
          method: "GET",
        });
        console.log("Fetched chats response:", res);
        if (res.ok) {
          const data = await res.json();
          // console.log("Fetched chats:", res);

          console.log("Fetched chats:", data);
          setChats(data.chats);
        }
      } catch (error) {
        console.error("Failed to fetch chats", error);
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchAndSetChats = async () => {
      if (user) {
        await fetchChats();
        const storedChatId = sessionStorage.getItem('currentChatId');
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
    setCurrentChatId(chatId);
    sessionStorage.setItem('currentChatId', chatId);
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetch(`/api/ai/chat/${chatId}`, {
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
      }
    } catch (error) {
      console.error("Failed to fetch chat messages", error);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    sessionStorage.removeItem('currentChatId');
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
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (uploads.length >= 5) {
      showToast("error", "You can upload a maximum of 5 files!");
      return;
    }
    const newUpload = {
      name: file.name,
      type,
      preview: type === "image" ? URL.createObjectURL(file) : null,
    };
    setUploads((prev) => [...prev, newUpload]);
    setIsModalOpen(false);
    showToast("success", `${file.name} uploaded successfully!`);
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
      const res = await fetch("/api/ai", {
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
      console.error("Error during AI query:", error);
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
              onChange={(e) => handleFileUpload(e, "pdf")}
              className="hidden"
            />
          </label>
        </div>
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
      {/* {isModalOpen && <FileUploadModal />} */}

      {/* ===== Sidebar ===== */}
      <aside className="w-72 bg-green-50 flex flex-col justify-between p-4 border-r border-green-100">
        <div>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-800 to-green-950 rounded-2xl flex items-center justify-center text-white font-bold text-lg mr-3">
              H
            </div>
            <h1 className="text-xl font-semibold bg-gradient-to-br text-transparent from-green-600 to-green-950 bg-clip-text">
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
              <div className="space-y-2 overflow-y-scroll h-[75vh]">
                {chats.map((chat) => (
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
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 font-bold text-black/40 h-[75vh] justify-center items-center text-center">
              <Loader size={30} />
              <p className="px-2 flex flex-col gap-2">
                <span>
                  Login to{" "}
                  <span className="text-transparent bg-gradient-to-br from-green-500 to-green-900 bg-clip-text ">
                    store your chats
                  </span>{" "}
                </span>
                <span className="  text-sm font-normal text-black/50">
                  Your chat history stays safe - continue from where you left
                  off!
                </span>
              </p>
              <div
                className="mt-4 px-5 py-2 bg-gradient-to-br from-green-500 to-green-900 hover:bg-gradient-to-tl text-white rounded-full transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg"
                onClick={() => {
                  router.push("/login");
                }}
              >
                Go to Login
              </div>
            </div>
          )}
        </div>
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
      </aside>

      {/* ===== Main Chat Section ===== */}
      <main className="flex-1 grid grid-rows-[auto_1fr_auto]">
        {/* Top bar */}
        <div className="flex justify-end p-4 border-b border-gray-200 bg-white z-10">
          <button
            onClick={() => (window.location.href = "/")}
            className="border border-gray-300 rounded-full px-5 py-1 text-gray-700 hover:bg-green-50 transition text-sm font-medium"
          >
            Home
          </button>
        </div>

        {/* Middle Section */}
        {!isChatActive ? (
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold mb-10">
              Good to see you,{" "}
              <span className="text-green-700">{user?.username || "User"}</span>
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-20">
              {suggestions.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(text)}
                  className="flex gap-2 items-center justify-between border-2 border-dashed border-gray-300 rounded-3xl py-5 px-4 hover:bg-green-50 transition"
                >
                  <LightbulbIcon className="text-green-700 w-[20%] " />
                  <span className="font-medium text-center text-gray-700">
                    {text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto px-10 py-6 space-y-4"
          >
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`flex items-end gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center text-white">
                      <Bot size={20} />
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[75%] ${
                      msg.role === "user"
                        ? "bg-green-800 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.parts[0].text}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user?.username?.[0]?.toUpperCase() || "A"}
                    </div>
                  )}
                </div>
                <div
                  className={`text-xs text-gray-400 mt-1 ${
                    msg.role === "user" ? "text-right" : "text-left ml-12"
                  }`}
                >
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl p-3">
                  <LoadingDots />
                </div>
              </div>
            )}
            {isAnonymousLimited && (
              <div className="text-center text-sm text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
                You have reached your message limit. Please log in to continue
                chatting.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Bottom Section */}
        <div className="px-10 pb-6 bg-transparent">
          {uploads.length > 0 && (
            <div className="flex flex-wrap gap-3 pb-2 justify-center">
              {uploads.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2 text-sm shadow-sm"
                >
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt="upload"
                      className="w-10 h-10 object-cover rounded-md"
                    />
                  ) : (
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="truncate w-24">{file.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex  items-center justify-between gap-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-full pl-4 pr-1 py-1 w-full shadow-md">
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => {
                // setIsModalOpen(true);
                showToast("warning", "File upload coming soon!");
              }}
              disabled={isAnonymousLimited}
            >
              <Plus
                className={`w-5 h-5 ${
                  isAnonymousLimited ? "text-gray-400" : "text-gray-700"
                }`}
              />
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isAnonymousLimited
                  ? "Please log in to continue"
                  : "Ask me anything about Maharashtra Heritage..."
              }
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
              onKeyDown={(e) => e.key === "Enter" && handleQuery(e)}
              disabled={isAnonymousLimited}
            />
            {isLoading ? (
              <button
                type="button"
                onClick={handleStop}
                className="bg-red-500 rounded-full p-3 text-white"
              >
                <Square className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleQuery}
                disabled={!query.trim() || isAnonymousLimited}
                className="bg-gradient-to-bl from-green-700 to-green-950 disabled:bg-green-950/5 rounded-full text-white disabled:opacity-60 p-3"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIPage;
