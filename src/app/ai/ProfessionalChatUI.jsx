"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Bot,
  Plus,
  Square,
  ArrowUp,
  X,
  FileText,
  ImageIcon,
  Sparkles,
  RotateCcw,
  LightbulbIcon,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import AIChatLoading from "./AIChatLoading";
import { fetchWithInternalToken } from "../../lib/fetch";

const createStudyLinks = (topic, question, site) => {
  if (site?.href) {
    return [{ label: `Open ${site.site_name}`, href: site.href }];
  }
  const focus = encodeURIComponent(question || topic || "Maharashtra heritage");
  return [
    { label: "Search this topic", href: `/search?q=${focus}` },
    { label: "Read docs", href: "/docs" },
  ];
};

const isHiddenQuizAnswerMessage = (msg, mode) =>
  mode === "quiz" &&
  msg?.role === "user" &&
  (msg?.hidden === true || /^[A-D]$/i.test(msg?.parts?.[0]?.text?.trim?.() || ""));

const parseQuestionBlock = (text) => {
  const match = text.match(/\*\*Question\s+(\d+)\s+of\s+(\d+):\*\*\s*([\s\S]*?)(?=\n\s*A\)|\nA\))/i);
  if (!match) return null;
  return {
    questionNumber: Number(match[1]),
    totalQuestions: Number(match[2]),
    question: match[3].trim(),
  };
};

const parseFeedbackBlock = (text) => {
  const correctMatch = text.match(/Correct Answer:\s*\**([A-D])\**/i);
  if (!correctMatch) return null;
  const isCorrect = /✅\s*\**Correct/i.test(text);
  const explanationMatch = text.match(/💡\s*Explanation:\s*([\s\S]*?)(?=\n---|\n\*\*Question|\n🏆|$)/i);
  return {
    isCorrect,
    correctAnswer: correctMatch[1].toUpperCase(),
    explanation: explanationMatch?.[1]?.trim() || "",
  };
};

const parseCompletionBlock = (text) => {
  if (
    !/Quiz Complete!/i.test(text) &&
    !/Final Score:/i.test(text) &&
    !/Your Score:/i.test(text)
  ) {
    return null;
  }
  const scoreMatch = text.match(/Final Score:\s*([0-9]+)\s*\/\s*([0-9]+)/i) || text.match(/Your Score:\s*([0-9]+)\s*\/\s*([0-9]+)/i);
  return {
    finalScore: scoreMatch ? Number(scoreMatch[1]) : null,
    totalQuestions: scoreMatch ? Number(scoreMatch[2]) : null,
  };
};

const buildProfessionalQuizReport = (messages, topic) => {
  const reportItems = [];
  let activeQuestion = null;
  let pendingAnswer = null;
  let completion = null;

  for (const msg of messages) {
    const text = msg?.parts?.[0]?.text || "";
    if (!text) continue;

    if (msg.role === "ai") {
      const feedback = parseFeedbackBlock(text);
      if (feedback && activeQuestion) {
        reportItems.push({
          questionNumber: activeQuestion.questionNumber,
          question: activeQuestion.question,
          selectedAnswer: pendingAnswer,
          correctAnswer: feedback.correctAnswer,
          explanation: feedback.explanation,
          isCorrect: feedback.isCorrect,
        });
        pendingAnswer = null;
      }

      const nextQuestion = parseQuestionBlock(text);
      if (nextQuestion) {
        activeQuestion = nextQuestion;
      }

      const finalBlock = parseCompletionBlock(text);
      if (finalBlock) {
        completion = finalBlock;
      }
    } else if (msg.role === "user") {
      const answer = text.trim().toUpperCase();
      if (/^[A-D]$/.test(answer)) {
        pendingAnswer = answer;
      }
    }
  }

  if (!completion) return null;

  const correctCount = reportItems.filter((item) => item.isCorrect).length;
  const finalScore = completion.finalScore ?? correctCount;
  const totalQuestions = completion.totalQuestions ?? reportItems.length;
  const accuracy = totalQuestions ? Math.round((finalScore / totalQuestions) * 100) : 0;

  return {
    topic,
    finalScore,
    totalQuestions,
    accuracy,
    reportItems,
  };
};

const ProfessionalQuizReport = ({ report }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 mb-8">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Quiz Report</p>
        <h3 className="text-2xl font-bold text-white mt-1">
          {report.finalScore}/{report.totalQuestions} correct
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Accuracy: {report.accuracy}%{report.topic ? ` · Topic: ${report.topic}` : ""}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 px-4 py-3 text-center">
          <div className="text-xl font-black text-emerald-300">
            {report.reportItems.filter((item) => item.isCorrect).length}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/45">Correct</div>
        </div>
        <div className="rounded-2xl bg-amber-500/10 border border-amber-400/20 px-4 py-3 text-center">
          <div className="text-xl font-black text-amber-300">
            {report.reportItems.filter((item) => !item.isCorrect).length}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/45">Incorrect</div>
        </div>
        <div className="rounded-2xl bg-sky-500/10 border border-sky-400/20 px-4 py-3 text-center">
          <div className="text-xl font-black text-sky-300">{report.accuracy}%</div>
          <div className="text-[10px] uppercase tracking-widest text-white/45">Accuracy</div>
        </div>
      </div>
    </div>

    {report.reportItems.length > 0 && (
      <div className="mt-5 space-y-3">
        {report.reportItems.map((item) => (
          <div
            key={`${item.questionNumber}-${item.question}`}
            className="rounded-2xl border border-white/10 bg-black/15 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                Question {item.questionNumber}
              </p>
              <span className={`text-xs font-semibold ${item.isCorrect ? "text-emerald-400" : "text-amber-300"}`}>
                {item.isCorrect ? "Correct" : "Needs review"}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{item.question}</p>
            <p className="mt-2 text-xs text-slate-400">
              Your answer: <span className="text-white font-semibold">{item.selectedAnswer || "Not captured"}</span>
              {" · "}
              Correct answer: <span className="text-white font-semibold">{item.correctAnswer || "N/A"}</span>
            </p>
            {item.explanation && <p className="mt-2 text-xs text-slate-300">{item.explanation}</p>}
            {!item.isCorrect && (
              <div className="mt-3 flex flex-wrap gap-2">
                {createStudyLinks(report.topic, item.question, item.site).map((link) => (
                  <a
                    key={`${item.questionNumber}-${link.href}`}
                    href={link.href}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-400/20 bg-emerald-500/10 hover:bg-emerald-500/15 transition"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
    {report.reportItems.length === 0 && (
      <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
        <p className="text-sm text-white/70">
          Detailed question-by-question review was not available in this completion message.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {createStudyLinks(report.topic, report.topic, null).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-400/20 bg-emerald-500/10 hover:bg-emerald-500/15 transition"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    )}
  </div>
);

const QuizFeedbackCard = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div
      className="rounded-2xl border p-4 mb-6"
      style={{
        background: feedback.isCorrect
          ? "rgba(16,185,129,0.12)"
          : "rgba(239,68,68,0.12)",
        borderColor: feedback.isCorrect
          ? "rgba(16,185,129,0.25)"
          : "rgba(239,68,68,0.25)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm font-bold ${feedback.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
          {feedback.isCorrect ? "Correct answer" : "Incorrect answer"}
        </p>
        <span className="text-xs font-semibold text-white/60">
          Your answer: {feedback.selectedAnswer || "N/A"}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/85">
        Correct answer: <span className="font-semibold text-white">{feedback.correctAnswer}</span>
      </p>
      {feedback.explanation && (
        <p className="mt-2 text-xs text-white/65">{feedback.explanation}</p>
      )}
    </div>
  );
};

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
            <div
              key={index}
              className="prose prose-invert prose-sm max-w-none prose-headings:text-emerald-300 prose-headings:font-bold prose-p:text-slate-200 prose-li:text-slate-300 prose-strong:text-emerald-300 prose-a:text-emerald-400 prose-a:no-underline prose-a:hover:underline"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, children }) => (
                    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  ul: ({ node, children }) => (
                    <ul className="mb-3 pl-4 space-y-1">{children}</ul>
                  ),
                  ol: ({ node, children }) => (
                    <ol className="mb-3 pl-4 space-y-1 list-decimal">{children}</ol>
                  ),
                  li: ({ node, children }) => (
                    <li className="leading-relaxed pl-1">{children}</li>
                  ),
                  h1: ({ node, children }) => (
                    <h1 className="text-xl font-bold text-emerald-300 mt-5 mb-3">{children}</h1>
                  ),
                  h2: ({ node, children }) => (
                    <h2 className="text-lg font-bold text-emerald-300 mt-4 mb-2">{children}</h2>
                  ),
                  h3: ({ node, children }) => (
                    <h3 className="text-base font-semibold text-emerald-200 mt-3 mb-2">{children}</h3>
                  ),
                  blockquote: ({ node, children }) => (
                    <blockquote className="border-l-4 border-emerald-500/40 pl-4 my-3 italic text-slate-300/90">
                      {children}
                    </blockquote>
                  ),
                  table: ({ node, children }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
                      <table className="w-full text-sm border-collapse">{children}</table>
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
            </div>
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

// ─── Professional Quiz Option Buttons ────────────────────────────────────────
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

  useEffect(() => {
    setSelected(null);
  }, [text]);

  if (options.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-3">
      {options.map((opt) => {
        const isSelected = selected === opt.letter;
        return (
          <label
            key={opt.letter}
            onClick={(e) => {
              if (disabled || selected) {
                e.preventDefault();
                return;
              }
              setSelected(opt.letter);
              onSelect(opt.letter);
            }}
            className="group relative flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all"
            style={{
              background: isSelected
                ? "rgba(16,185,129,0.15)"
                : "rgba(255,255,255,0.04)",
              border: isSelected
                ? "1px solid rgba(16,185,129,0.4)"
                : "1px solid rgba(255,255,255,0.08)",
              cursor: disabled || selected ? (isSelected ? "default" : "not-allowed") : "pointer",
              opacity: selected && !isSelected ? 0.5 : 1,
            }}
          >
            <input
              type="radio"
              name="quiz-option"
              value={opt.letter}
              checked={isSelected}
              readOnly
              className="sr-only peer"
            />
            <div
              className="w-5 h-5 mt-0.5 rounded-full flex items-center justify-center transition-colors"
              style={{
                border: isSelected ? "2px solid #10b981" : "2px solid rgba(255,255,255,0.3)",
                background: isSelected ? "#10b981" : "transparent",
              }}
            >
              <div
                className="w-2 h-2 rounded-full bg-white transition-transform"
                style={{ transform: isSelected ? "scale(1)" : "scale(0)" }}
              />
            </div>
            <div className="flex-1">
              <p className={`text-sm text-slate-200 ${isSelected ? "font-semibold" : ""}`}>
                <span className="mr-2 font-bold text-emerald-400">{opt.letter})</span>
                {opt.text}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
};

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

// ─── Main Professional Chat UI ──────────────────────────────────────────────
const ProfessionalChatUI = ({
  messages,
  isLoading,
  isChatActive,
  isChatLoading,
  isAnonymousLimited,
  mode,
  query,
  setQuery,
  handleQuery,
  handleSuggestion,
  handleStop,
  handleOpenImagePreview,
  user,
  suggestions,
  quizSuggestions,
  quizSessionActive,
  selectedImages,
  setSelectedImages,
  processImageFiles,
  isPopoverOpen,
  setIsPopoverOpen,
  audienceType,
  quizConfig,
}) => {
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const [latestQuizFeedback, setLatestQuizFeedback] = useState(null);
  const [lastSubmittedQuizAnswer, setLastSubmittedQuizAnswer] = useState(null);
  const rawQuizReport = useMemo(() => {
    if (mode !== "quiz") return null;
    return buildProfessionalQuizReport(messages, quizConfig?.topic);
  }, [messages, mode, quizConfig?.topic]);
  const [quizReport, setQuizReport] = useState(null);

  useEffect(() => {
    let ignore = false;

    const resolveLinks = async () => {
      if (!rawQuizReport) {
        setQuizReport(null);
        return;
      }
      if (rawQuizReport.reportItems.length === 0) {
        setQuizReport(rawQuizReport);
        return;
      }

      try {
        const res = await fetchWithInternalToken("/api/ai/report-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: rawQuizReport.topic || "",
            items: rawQuizReport.reportItems,
          }),
        });
        if (!res.ok) {
          if (!ignore) setQuizReport(rawQuizReport);
          return;
        }
        const payload = await res.json();
        if (!ignore) {
          setQuizReport({
            ...rawQuizReport,
            reportItems: payload.items || rawQuizReport.reportItems,
          });
        }
      } catch {
        if (!ignore) setQuizReport(rawQuizReport);
      }
    };

    resolveLinks();
    return () => {
      ignore = true;
    };
  }, [rawQuizReport]);

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

  useEffect(() => {
    if (mode !== "quiz") {
      setLatestQuizFeedback(null);
      return;
    }

    const lastAiMsg = [...messages].reverse().find((msg) => msg.role === "ai");
    if (!lastAiMsg) return;

    const feedback = parseFeedbackBlock(lastAiMsg.parts?.[0]?.text || "");
    if (feedback) {
      setLatestQuizFeedback({
        ...feedback,
        selectedAnswer: lastSubmittedQuizAnswer,
      });
    }
  }, [lastSubmittedQuizAnswer, messages, mode]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 80;
    isAtBottomRef.current = isBottom;
  }, []);

  return (
    <>
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
                    backgroundImage: "linear-gradient(135deg, #10b981, #0d9488)",
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
                    backgroundImage: "linear-gradient(135deg, #10b981, #0d9488)",
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
            {(mode === "quiz" ? quizSuggestions : suggestions).map((text, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(text)}
                className="group flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(16,185,129,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
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
            ))}
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
              <>
                {mode === "quiz" && messages.length > 0 && (
                  <div className="mb-8">
                    <header
                      className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 pb-4 pt-4"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-[11px] font-bold tracking-widest text-slate-500 mb-2">
                            QUIZ SESSION ACTIVE
                          </div>
                          <div
                            className="w-48 h-1 rounded-full overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.1)" }}
                          >
                            <div className="h-full bg-emerald-500 rounded-full w-[100%] animate-pulse" />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end">
                        <span className="text-[11px] font-bold tracking-widest text-slate-500 mb-1">
                          MODE
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          PROFESSIONAL
                        </span>
                      </div>
                    </header>
                  </div>
                )}
                {mode === "quiz" && latestQuizFeedback && (
                  <QuizFeedbackCard feedback={latestQuizFeedback} />
                )}
                {mode === "quiz" && quizReport && (
                  <ProfessionalQuizReport report={quizReport} />
                )}
                {messages.map((msg, i) => {
                  if (isHiddenQuizAnswerMessage(msg, mode)) {
                    return null;
                  }
                  const isLastAiMsg = msg.role === "ai" && i === messages.length - 1;
                  const showQuizButtons = isLastAiMsg && mode === "quiz" && !isLoading;

                  return (
                    <div
                      key={i}
                      className={`flex items-end gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg mb-1"
                          style={{
                            background: "linear-gradient(135deg, #059669, #0d9488)",
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
                        {msg.attachedImages && msg.attachedImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2 justify-end">
                            {msg.attachedImages.map((imgSrc, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={imgSrc}
                                alt="Attachment"
                                className="w-40 h-40 object-cover rounded-2xl border border-white/10 shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleOpenImagePreview(imgSrc)}
                              />
                            ))}
                          </div>
                        )}
                        <div
                          className={`px-5 py-4 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "rounded-3xl rounded-br-lg text-white"
                              : "rounded-2xl rounded-bl-none text-slate-200"
                          }`}
                          style={
                            msg.role === "user"
                              ? {
                                  background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                                  boxShadow: "0 4px 20px rgba(5,150,105,0.25)",
                                }
                              : {
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  backdropFilter: "blur(8px)",
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                                }
                          }
                        >
                          {msg.role === "ai" ? (
                            <MessageRenderer
                              text={msg.isStreaming ? msg.parts[0].text + " █" : msg.parts[0].text}
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
                            onSelect={(letter) => {
                              setLastSubmittedQuizAnswer(letter);
                              setLatestQuizFeedback(null);
                              handleQuery(null, letter);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                {isLoading && <ShimmerSkeleton />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* ── Input Bar ─────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 sm:px-6 lg:px-10 py-4 relative z-40"
        style={{
          background: "rgba(15,17,23,0.8)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {isPopoverOpen && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsPopoverOpen(false)}
          />
        )}
        <div
          className="relative mx-auto max-w-4xl rounded-[32px] transition-all duration-200 flex flex-col z-40"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {/* Image Preview Thumbnails */}
          {selectedImages.length > 0 && (
            <div className="px-12 pt-4 pb-1 flex flex-wrap gap-3 items-start">
              {selectedImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.previewUrl}
                    alt="Selected"
                    className="w-16 h-16 object-cover rounded-xl border border-white/10 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(img.previewUrl);
                      setSelectedImages((prev) => prev.filter((i) => i.id !== img.id));
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/90 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-md"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-center">
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
              className="w-full bg-transparent border-0 rounded-3xl pl-12 pr-14 py-4 outline-none text-slate-100 placeholder-slate-500 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleQuery(e)}
              disabled={isAnonymousLimited}
            />

            {/* Left button with Popover */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                  disabled={isAnonymousLimited}
                  className="p-2 rounded-full hover:bg-white/10 transition text-slate-400 hover:text-white"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {isPopoverOpen && (
                  <div className="absolute bottom-full left-0 mb-3 w-56 bg-[#1e2532] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 text-left overflow-hidden origin-bottom-left animate-in fade-in zoom-in-95 duration-200">
                    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors group">
                      <ImageIcon className="w-4 h-4 text-emerald-400/80 group-hover:text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                        Upload image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            processImageFiles(e.target.files);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <div className="px-4 py-3 flex items-center gap-3 opacity-40 cursor-not-allowed border-t border-white/5">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-slate-300">
                        Upload document
                      </span>
                    </div>
                  </div>
                )}
              </div>
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
                    (!query.trim() && !(mode === "quiz") && selectedImages.length === 0)
                  }
                  className="rounded-xl p-2.5 text-white transition hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                    boxShadow: "0 4px 12px rgba(5,150,105,0.35)",
                  }}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2.5">
          HeritageX was developed to support academic activity at Sardar Patel Institute of Technology.
        </p>
        <p className="text-center text-[10px] text-slate-600 mt-1">
          Developers: Dnyandeep Gaonkar, Rudrapratapsing Rajput, Shreeya Nemade
        </p>
      </div>
    </>
  );
};

export default ProfessionalChatUI;
