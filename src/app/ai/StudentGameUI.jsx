"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Zap,
  Heart,
  PartyPopper,
  RotateCcw,
  ArrowRight,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";
import { fetchWithInternalToken } from "../../lib/fetch";

const ANSWER_LETTERS = ["A", "B", "C", "D"];

const createStudyLinks = (topic, question, site) => {
  if (site?.href) {
    return [{ label: `Open ${site.site_name}`, href: site.href }];
  }
  const focus = encodeURIComponent(question || topic || "Maharashtra heritage");
  return [
    { label: "Search this topic", href: `/search?q=${focus}` },
    { label: "Read heritage docs", href: "/docs" },
  ];
};

const resolveReportItems = (completeData, localReportItems) => {
  if (Array.isArray(completeData?.report) && completeData.report.length > 0) {
    return completeData.report;
  }
  return localReportItems;
};

const buildDisplaySummary = (data, reportItems) => {
  const totalQuestions =
    reportItems.length || Number(data?.totalQuestions) || 0;
  const finalScore =
    reportItems.length > 0
      ? reportItems.filter((item) => item.isCorrect).length
      : Math.min(Number(data?.finalScore) || 0, totalQuestions);
  const pct = totalQuestions
    ? Math.round((finalScore / totalQuestions) * 100)
    : 0;
  const earnedXp =
    Number(data?.totalXp) ||
    Number(data?.xp) ||
    finalScore * 10;

  return { totalQuestions, finalScore, pct, earnedXp };
};

const QuestionReportCard = ({ item, topic }) => (
  <div
    className="rounded-2xl p-4 text-left"
    style={{
      background: item.isCorrect ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.06)",
      border: `1px solid ${item.isCorrect ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)"}`,
    }}
  >
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-white/40">
        Question {item.questionNumber}
      </span>
      <span className={`text-xs font-semibold ${item.isCorrect ? "text-emerald-400" : "text-amber-300"}`}>
        {item.isCorrect ? "Correct" : "Needs improvement"}
      </span>
    </div>
    <p className="mt-2 text-sm font-semibold text-white">{item.question}</p>
    <p className="mt-2 text-xs text-white/70">
      Your answer: <span className="font-semibold text-white">{item.selectedAnswer || "Not captured"}</span>
      {" · "}
      Correct answer: <span className="font-semibold text-white">{item.correctAnswer || "N/A"}</span>
    </p>
    {item.explanation && (
      <p className="mt-2 text-xs text-white/65">{item.explanation}</p>
    )}
    {!item.isCorrect && (
      <div className="mt-3 flex flex-wrap gap-2">
        {createStudyLinks(topic, item.question, item.site).map((link) => (
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
);

// ─── Parse AI Response ──────────────────────────────────────────────────────
const parseAIResponse = (text) => {
  try {
    // Try to extract JSON from the text, handling potential markdown wrapping
    let jsonStr = text.trim();
    // Remove markdown code fences if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }
    return JSON.parse(jsonStr);
  } catch {
    // Fallback: try to find JSON object in the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

// ─── Animated Progress Bar ──────────────────────────────────────────────────
const AnimatedProgressBar = ({ progress, className = "" }) => (
  <div
    className={`relative h-4 rounded-full overflow-hidden ${className}`}
    style={{ background: "rgba(255,255,255,0.1)" }}
  >
    <motion.div
      className="absolute inset-y-0 left-0 rounded-full"
      style={{
        background: "linear-gradient(90deg, #f59e0b, #ef4444, #ec4899)",
      }}
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ type: "spring", stiffness: 60, damping: 15 }}
    />
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-[10px] font-bold text-white drop-shadow-md">
        {progress}%
      </span>
    </div>
  </div>
);

// ─── XP Popup ───────────────────────────────────────────────────────────────
const XPPopup = ({ xp, isCorrect }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.5 }}
    animate={{ opacity: 1, y: -30, scale: 1 }}
    exit={{ opacity: 0, y: -60 }}
    transition={{ type: "spring", stiffness: 200 }}
    className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
  >
    <span
      className={`text-2xl font-black ${
        isCorrect ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {isCorrect ? `+${xp} XP 🎉` : "Try again! 💪"}
    </span>
  </motion.div>
);

// ─── Avatar Component ───────────────────────────────────────────────────────
const AaravAvatar = ({ encouragement, isThinking }) => (
  <div className="flex items-end gap-3 mb-6">
    <div className="relative">
      <motion.div
        animate={isThinking ? { rotate: [0, -5, 5, 0] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg"
        style={{ border: "3px solid rgba(245,158,11,0.5)" }}
      >
        <img
          alt="Aarav Explorer"
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxNPZb_qi_6itG_ls08tSfpH4xuigxMlz13Zw4mwVK6RNF0p26Wsz_OZ5oCCtDexoLwN--ti7VghlQNPm_y9Kw7hUMjnBvzjxGjWGs6Bb5CwaPyXflmoEkrSs93jIXQSmbAGxMVk-jPvJcctaU6YCYrgkEbLUDNwon9gx8k624UpAGwPqpLX5TtCk6McsJhMbC4QzbceZI_4bTj3wQ4cvWdlyYQl0ki152vmDFk_RWgIymEl3TktfmeFCaJ1yrE3kZXN8-ubhyGA0F"
        />
      </motion.div>
      {isThinking && (
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
        >
          <span className="text-[10px]">💭</span>
        </motion.div>
      )}
    </div>
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      key={encouragement}
      className="px-4 py-2.5 rounded-2xl rounded-bl-none max-w-[260px]"
      style={{
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <p className="text-white/90 text-sm font-medium">{encouragement}</p>
    </motion.div>
  </div>
);

// ─── Option Button ──────────────────────────────────────────────────────────
const OptionButton = ({
  letter,
  text,
  isSelected,
  isCorrect,
  isActuallyCorrect,
  isDisabled,
  onClick,
}) => {
  const letters = ["A", "B", "C", "D"];
  const colors = {
    idle: {
      bg: "rgba(255,255,255,0.08)",
      border: "rgba(255,255,255,0.12)",
      shadow: "0 4px 0 rgba(0,0,0,0.3)",
    },
    hover: {
      bg: "rgba(255,255,255,0.14)",
      border: "rgba(255,255,255,0.2)",
      shadow: "0 4px 0 rgba(0,0,0,0.3)",
    },
    selected: {
      bg: "rgba(16,185,129,0.25)",
      border: "rgba(16,185,129,0.6)",
      shadow: "0 2px 0 rgba(16,185,129,0.3)",
    },
    correct: {
      bg: "rgba(16,185,129,0.3)",
      border: "rgba(16,185,129,0.8)",
      shadow: "0 0 20px rgba(16,185,129,0.3)",
    },
    wrong: {
      bg: "rgba(239,68,68,0.2)",
      border: "rgba(239,68,68,0.6)",
      shadow: "0 0 20px rgba(239,68,68,0.2)",
    },
    disabled: {
      bg: "rgba(255,255,255,0.03)",
      border: "rgba(255,255,255,0.06)",
      shadow: "none",
    },
  };

  let state = "idle";
  if (isSelected && isCorrect === true) state = "correct";
  else if (isSelected && isCorrect === false) state = "wrong";
  else if (isActuallyCorrect && isDisabled) state = "correct";
  else if (isSelected) state = "selected";
  else if (isDisabled) state = "disabled";

  const style = colors[state];

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.97, y: 2 } : {}}
      onClick={() => !isDisabled && onClick()}
      disabled={isDisabled}
      className="w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-3 transition-all duration-150 group"
      style={{
        background: style.bg,
        border: `2px solid ${style.border}`,
        boxShadow: style.shadow,
        transform: isSelected ? "translateY(2px)" : "translateY(0)",
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
        style={{
          background:
            state === "correct"
              ? "rgba(16,185,129,0.4)"
              : state === "wrong"
              ? "rgba(239,68,68,0.4)"
              : "rgba(255,255,255,0.12)",
          color:
            state === "correct"
              ? "#6ee7b7"
              : state === "wrong"
              ? "#fca5a5"
              : "rgba(255,255,255,0.8)",
        }}
      >
        {letters[letter]}
      </span>
      <span
        className={`flex-1 text-sm font-medium ${
          isDisabled && !isSelected ? "text-white/30" : "text-white/90"
        }`}
      >
        {text}
      </span>
      {state === "correct" && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-emerald-400 text-lg"
        >
          ✓
        </motion.span>
      )}
      {state === "wrong" && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-red-400 text-lg"
        >
          ✗
        </motion.span>
      )}
    </motion.button>
  );
};

// ─── Quiz Complete Screen ───────────────────────────────────────────────────
const QuizCompleteScreen = ({ data, reportItems, quizConfig, onRestart }) => {
  const summary = buildDisplaySummary(data, reportItems);
  const emoji =
    data.performance === "excellent"
      ? "🏆"
      : data.performance === "good"
      ? "👍"
      : "📚";
  const totalCorrect = reportItems.filter((item) => item.isCorrect).length;
  const totalIncorrect = reportItems.filter((item) => !item.isCorrect).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center gap-6 py-8"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-7xl"
      >
        {emoji}
      </motion.div>

      <div>
        <h2 className="text-3xl font-black text-white mb-2">Quiz Complete!</h2>
        <p className="text-white/60 text-sm">{data.message}</p>
      </div>

      <div
        className="rounded-3xl p-6 w-full max-w-xs"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div className="text-5xl font-black text-white mb-2">
          {summary.finalScore}/{summary.totalQuestions}
        </div>
        <div className="text-sm text-white/50 mb-4">Score</div>

        <div className="flex justify-center gap-6">
          <div className="text-center">
            <div className="text-xl font-bold text-amber-400">
              {summary.earnedXp} XP
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">
              Earned
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-emerald-400">{summary.pct}%</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">
              Accuracy
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-400/20">
          <div className="text-2xl font-black text-emerald-300">{totalCorrect}</div>
          <div className="text-[11px] uppercase tracking-widest text-white/45">Correct</div>
        </div>
        <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-400/20">
          <div className="text-2xl font-black text-amber-300">{totalIncorrect}</div>
          <div className="text-[11px] uppercase tracking-widest text-white/45">Incorrect</div>
        </div>
        <div className="rounded-2xl p-4 bg-sky-500/10 border border-sky-400/20">
          <div className="text-2xl font-black text-sky-300">{Math.max(0, totalIncorrect)}</div>
          <div className="text-[11px] uppercase tracking-widest text-white/45">Improve</div>
        </div>
      </div>

      {reportItems.length > 0 && (
        <div className="w-full text-left rounded-3xl p-5 border border-white/10 bg-white/5">
          <h3 className="text-lg font-bold text-white mb-4">Your Quiz Report</h3>
          <div className="space-y-3">
            {reportItems.map((item) => (
              <QuestionReportCard
                key={`${item.questionNumber}-${item.question}`}
                item={item}
                topic={quizConfig?.topic}
              />
            ))}
          </div>
        </div>
      )}
      {reportItems.length === 0 && (
        <div className="w-full text-left rounded-3xl p-5 border border-amber-400/20 bg-amber-500/10">
          <h3 className="text-lg font-bold text-white mb-2">Quiz Report</h3>
          <p className="text-sm text-white/70">
            Your score is ready, but detailed question review was not returned for this quiz attempt.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {createStudyLinks(quizConfig?.topic, quizConfig?.topic, null).map((link) => (
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

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg"
        style={{
          background: "linear-gradient(135deg, #059669, #0d9488)",
          boxShadow: "0 8px 24px rgba(5,150,105,0.4)",
        }}
      >
        <RotateCcw className="w-4 h-4" />
        Play Again
      </motion.button>
    </motion.div>
  );
};

// ─── Loading State ──────────────────────────────────────────────────────────
const GameLoading = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-16">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
      className="w-12 h-12 rounded-2xl flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #f59e0b, #ef4444)",
        boxShadow: "0 8px 24px rgba(245,158,11,0.3)",
      }}
    >
      <Sparkles className="w-6 h-6 text-white" />
    </motion.div>
    <motion.p
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      className="text-white/60 text-sm font-medium"
    >
      🎯 Preparing your next challenge...
    </motion.p>
  </div>
);

// ─── Main Student Game UI ───────────────────────────────────────────────────
const StudentGameUI = ({
  messages,
  isLoading,
  handleQuery,
  onNewQuiz,
  quizConfig,
}) => {
  const latestAttemptRef = useRef(null);
  const [reportItems, setReportItems] = useState([]);
  const [resolvedReportItems, setResolvedReportItems] = useState([]);
  const [gameState, setGameState] = useState({
    xp: 0,
    progress: 0,
    level: "Explorer",
    questionNumber: 0,
    totalQuestions: 5,
    currentQuestion: null,
    options: [],
    encouragement: "Welcome, explorer! Let's discover Maharashtra! 🗺️",
    isAnswered: false,
    selectedAnswer: null,
    isCorrect: null,
    correctAnswer: null,
    explanation: "",
    showFeedback: false,
    pendingNextQuestion: null,
    isComplete: false,
    completeData: null,
    showXPPopup: false,
  });

  const completeReportItems = resolveReportItems(gameState.completeData, reportItems);

  useEffect(() => {
    let ignore = false;

    const resolveLinks = async () => {
      if (!gameState.isComplete) return;
      if (completeReportItems.length === 0) {
        setResolvedReportItems([]);
        return;
      }

      try {
        const res = await fetchWithInternalToken("/api/ai/report-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: quizConfig?.topic || "",
            items: completeReportItems,
          }),
        });
        if (!res.ok) {
          if (!ignore) setResolvedReportItems(completeReportItems);
          return;
        }
        const payload = await res.json();
        if (!ignore) {
          setResolvedReportItems(payload.items || completeReportItems);
        }
      } catch {
        if (!ignore) {
          setResolvedReportItems(completeReportItems);
        }
      }
    };

    resolveLinks();
    return () => {
      ignore = true;
    };
  }, [completeReportItems, gameState.isComplete, quizConfig?.topic]);

  // Parse the latest AI message
  useEffect(() => {
    if (messages.length === 0) return;

    const lastAiMsg = [...messages].reverse().find((m) => m.role === "ai");
    if (!lastAiMsg) return;

    const data = parseAIResponse(lastAiMsg.parts[0].text);
    if (!data) return;

    if (data.type === "question") {
      if (data.questionNumber === 1) {
        setReportItems([]);
      }
      setGameState((prev) => ({
        ...prev,
        currentQuestion: data.question,
        options: data.options || [],
        questionNumber: data.questionNumber,
        totalQuestions: data.totalQuestions,
        xp: data.xp ?? prev.xp,
        progress: data.progress ?? prev.progress,
        level: data.level || prev.level,
        encouragement: data.encouragement || prev.encouragement,
        isAnswered: false,
        selectedAnswer: null,
        isCorrect: null,
        correctAnswer: null,
        explanation: "",
        showFeedback: false,
        pendingNextQuestion: null,
        isComplete: false,
        showXPPopup: false,
      }));
    } else if (data.type === "feedback") {
      const attemptSnapshot = latestAttemptRef.current;
      if (attemptSnapshot) {
        setReportItems((prev) => [
          ...prev,
          {
            questionNumber:
              attemptSnapshot.questionNumber ?? prev.length + 1,
            question: attemptSnapshot.question,
            selectedAnswer: attemptSnapshot.selectedAnswer,
            correctAnswer: data.correctAnswer,
            explanation: data.explanation,
            isCorrect: Boolean(data.isCorrect),
          },
        ]);
      }
      setGameState((prev) => ({
        ...prev,
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        xp: data.xp ?? prev.xp,
        progress: data.progress ?? prev.progress,
        encouragement: data.encouragement || prev.encouragement,
        showFeedback: true,
        showXPPopup: true,
        pendingNextQuestion: data.nextQuestion || null,
      }));

      if (data.nextQuestion) {
        setTimeout(() => {
          setGameState((prev) => ({
            ...prev,
            currentQuestion: prev.pendingNextQuestion?.question || prev.currentQuestion,
            options: prev.pendingNextQuestion?.options || prev.options,
            questionNumber:
              prev.pendingNextQuestion?.questionNumber || prev.questionNumber,
            totalQuestions:
              prev.pendingNextQuestion?.totalQuestions || prev.totalQuestions,
            showFeedback: false,
            isAnswered: false,
            selectedAnswer: null,
            isCorrect: null,
            correctAnswer: null,
            explanation: "",
            pendingNextQuestion: null,
            showXPPopup: false,
          }));
        }, 2500);
      } else {
        setTimeout(() => {
          setGameState((prev) => ({
            ...prev,
            showXPPopup: false,
          }));
        }, 1800);
      }
      latestAttemptRef.current = null;
    } else if (data.type === "complete") {
      setGameState((prev) => ({
        ...prev,
        isComplete: true,
        completeData: data,
        xp: data.xp ?? prev.xp,
        progress: 100,
        showFeedback: false,
        isAnswered: false,
        selectedAnswer: null,
        isCorrect: null,
        correctAnswer: null,
        explanation: "",
        currentQuestion: null,
        options: [],
        questionNumber: data.totalQuestions ?? prev.totalQuestions,
        totalQuestions: data.totalQuestions ?? prev.totalQuestions,
        pendingNextQuestion: null,
        showXPPopup: false,
      }));
    } else if (data.type === "error") {
      setGameState((prev) => ({
        ...prev,
        encouragement: data.message || "Hmm, try tapping A, B, C, or D! 🤔",
      }));
    }
  }, [messages]);

  const handleAnswerSelect = useCallback(
    (index) => {
      if (gameState.isAnswered || isLoading) return;

      latestAttemptRef.current = {
        questionNumber: gameState.questionNumber,
        question: gameState.currentQuestion,
        selectedAnswer: ANSWER_LETTERS[index],
      };
      setGameState((prev) => ({
        ...prev,
        isAnswered: true,
        selectedAnswer: index,
      }));

      // Send the answer to the AI
      handleQuery(null, ANSWER_LETTERS[index]);
    },
    [gameState.currentQuestion, gameState.isAnswered, gameState.questionNumber, isLoading, handleQuery]
  );

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-5">
          {/* ── Stats HUD ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-1"
          >
            {/* XP */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{
                background: "rgba(245,158,11,0.15)",
                border: "1px solid rgba(245,158,11,0.3)",
              }}
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-bold text-sm">
                {gameState.xp} XP
              </span>
            </div>

            {/* Progress */}
            <div className="flex-1">
              <AnimatedProgressBar progress={gameState.progress} />
            </div>

            {/* Level */}
            <div
              className="px-3 py-2 rounded-2xl"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
            >
              <span className="text-purple-300 font-bold text-xs uppercase tracking-wider">
                {gameState.level}
              </span>
            </div>
          </motion.div>

          {/* Question counter */}
          {gameState.questionNumber > 0 && (
            <div className="text-center">
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                Question {gameState.questionNumber} of{" "}
                {gameState.totalQuestions}
              </span>
            </div>
          )}

          {/* ── Avatar + Speech ──────────────────────────────────── */}
          <AaravAvatar
            encouragement={gameState.encouragement}
            isThinking={isLoading}
          />

          {/* ── Main Content Area ────────────────────────────────── */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {/* XP Popup */}
              {gameState.showXPPopup && (
                <XPPopup xp={10} isCorrect={gameState.isCorrect} />
              )}
            </AnimatePresence>

            {gameState.isComplete ? (
              <QuizCompleteScreen
                data={gameState.completeData}
                reportItems={
                  resolvedReportItems.length > 0
                    ? resolvedReportItems
                    : completeReportItems
                }
                quizConfig={quizConfig}
                onRestart={onNewQuiz}
              />
            ) : isLoading && !gameState.currentQuestion ? (
              <GameLoading />
            ) : gameState.currentQuestion ? (
              <motion.div
                key={gameState.questionNumber}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                {/* Question Card */}
                <div
                  className="rounded-3xl p-6 mb-4"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                >
                  <p className="text-white text-lg font-bold leading-relaxed text-center">
                    {gameState.currentQuestion}
                  </p>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-3">
      {gameState.options.map((opt, i) => (
        <OptionButton
          key={`${gameState.questionNumber}-${i}`}
          letter={i}
          text={opt}
          isSelected={gameState.selectedAnswer === i}
          isCorrect={
            gameState.selectedAnswer === i
              ? gameState.isCorrect
              : null
          }
          isActuallyCorrect={
            gameState.correctAnswer === ANSWER_LETTERS[i]
          }
          isDisabled={gameState.isAnswered}
          onClick={() => handleAnswerSelect(i)}
        />
      ))}
                </div>

                {/* Feedback Banner */}
                <AnimatePresence>
                  {gameState.showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 rounded-2xl p-4 overflow-hidden"
                      style={{
                        background: gameState.isCorrect
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(239,68,68,0.15)",
                        border: `1px solid ${
                          gameState.isCorrect
                            ? "rgba(16,185,129,0.3)"
                            : "rgba(239,68,68,0.3)"
                        }`,
                      }}
                    >
                      <p
                        className={`font-bold text-sm mb-1 ${
                          gameState.isCorrect
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {gameState.isCorrect
                          ? "✨ Correct! +10 XP"
                          : `❌ The answer was ${gameState.correctAnswer}`}
                      </p>
                      <p className="text-white/70 text-xs">
                        {gameState.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading next */}
                {isLoading && gameState.isAnswered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-center"
                  >
                    <span className="text-white/40 text-xs animate-pulse">
                      Loading next question...
                    </span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* Waiting for quiz to start */
              <div className="text-center py-12">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-5xl mb-4"
                >
                  🏛️
                </motion.div>
                <h3 className="text-white text-xl font-bold mb-2">
                  Ready to explore?
                </h3>
                <p className="text-white/50 text-sm mb-6">
                  Start a quiz from the sidebar to begin your heritage adventure!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGameUI;
