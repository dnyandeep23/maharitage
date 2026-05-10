"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { fetchWithInternalToken } from "../../lib/fetch";
import QuizSkeleton from "./QuizSkeleton";

const ANSWER_LETTERS = ["A", "B", "C", "D"];

const extractInlineImageTag = (value) => {
  if (typeof value !== "string") {
    return { text: "", imageUrl: null };
  }

  const match = value.match(/\[Image:\s*([^\]]+)\]/i);
  const imageUrl = match?.[1]?.trim() || null;
  const text = value.replace(/\[Image:\s*[^\]]+\]/gi, "").trim();

  return { text, imageUrl };
};

const normalizeDifficultyValue = (value) => {
  if (typeof value !== "string") return "Easy";
  const normalized = value.trim().toLowerCase();
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";
  return "Easy";
};

const createStudyLinks = (topic, question, site) => {
  if (site?.href) {
    return [{ label: `Open ${site.site_name}`, href: site.href }];
  }
  const focus = encodeURIComponent(question || topic || "Maharashtra heritage");
  return [
    { label: "Search this topic", href: `/search?q=${focus}` },
    { label: "Explore heritage home", href: "/" },
  ];
};

const normalizeReportItem = (item = {}) => {
  const selectedAnswer = item.selectedAnswer ?? null;
  const correctAnswer = item.correctAnswer ?? null;
  const isCorrect =
    typeof item.isCorrect === "boolean"
      ? item.isCorrect
      : selectedAnswer && correctAnswer
      ? selectedAnswer === correctAnswer
      : null;
  const status =
    isCorrect === true
      ? "correct"
      : selectedAnswer
      ? "incorrect"
      : "unvisited";

  return {
    ...item,
    selectedAnswer,
    correctAnswer,
    isCorrect,
    status,
  };
};

const resolveReportItems = (completeData, localReportItems) => {
  if (Array.isArray(completeData?.report) && completeData.report.length > 0) {
    return completeData.report.map(normalizeReportItem);
  }
  return (localReportItems || []).map(normalizeReportItem);
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

const buildPerformanceLabel = (score, totalQuestions) => {
  if (!totalQuestions) return "needs_improvement";
  const ratio = score / totalQuestions;
  if (ratio >= 0.8) return "excellent";
  if (ratio >= 0.5) return "good";
  return "needs_improvement";
};

const normalizeQuestionPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  const parsedQuestion = extractInlineImageTag(payload.question);
  return {
    ...payload,
    question: parsedQuestion.text,
    questionImage: parsedQuestion.imageUrl,
    options: Array.isArray(payload.options) ? payload.options : [],
  };
};

const getQuestionKey = (questionNumber) =>
  Math.max((Number(questionNumber) || 1) - 1, 0);

const upsertQuestionRecord = (prev, payload) => {
  const normalizedQuestion = normalizeQuestionPayload(payload);
  if (!normalizedQuestion) return prev;

  const key = getQuestionKey(normalizedQuestion.questionNumber);
  return {
    ...prev,
    [key]: {
      ...prev[key],
      questionNumber: normalizedQuestion.questionNumber,
      question: normalizedQuestion.question,
      questionImage: normalizedQuestion.questionImage,
      options: normalizedQuestion.options,
      totalQuestions: normalizedQuestion.totalQuestions,
    },
  };
};

const buildDerivedReportItems = (
  questionsByIndex,
  answers,
  totalQuestions,
  completeReport = []
) => {
  const completeReportMap = new Map(
    (completeReport || []).map((item) => [getQuestionKey(item.questionNumber), item])
  );
  const total =
    Number(totalQuestions) ||
    Math.max(
      Object.keys(questionsByIndex || {}).length,
      Object.keys(answers || {}).length,
      completeReportMap.size
    );

  const items = [];

  for (let index = 0; index < total; index += 1) {
    const question = questionsByIndex?.[index] || {};
    const reportItem = completeReportMap.get(index) || {};
    const selectedAnswer = answers?.[index] ?? reportItem.selectedAnswer ?? null;
    const correctAnswer = question.correctAnswer || reportItem.correctAnswer || null;
    const isCorrect =
      correctAnswer && selectedAnswer
        ? selectedAnswer === correctAnswer
        : typeof reportItem.isCorrect === "boolean"
        ? reportItem.isCorrect
        : null;
    const status =
      isCorrect === true
        ? "correct"
        : selectedAnswer
        ? "incorrect"
        : "unvisited";

    items.push({
      questionNumber: question.questionNumber || reportItem.questionNumber || index + 1,
      question:
        question.question ||
        reportItem.question ||
        `Question ${index + 1} was not visited.`,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      explanation:
        question.explanation ||
        reportItem.explanation ||
        (selectedAnswer
          ? ""
          : "This question was not answered before the quiz ended."),
      status,
      site: reportItem.site,
    });
  }

  return items;
};

const calculateQuizResults = (questionsByIndex, answers, totalQuestions) => {
  const total = Number(totalQuestions) || Object.keys(questionsByIndex || {}).length;
  let correct = 0;

  for (let index = 0; index < total; index += 1) {
    const correctAnswer = questionsByIndex?.[index]?.correctAnswer;
    if (correctAnswer && answers?.[index] === correctAnswer) {
      correct += 1;
    }
  }

  const incorrect = Math.max(total - correct, 0);
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  return {
    finalScore: correct,
    totalQuestions: total,
    incorrect,
    accuracy,
    performance: buildPerformanceLabel(correct, total),
  };
};

const buildStudentSessionSnapshot = (messages, fallbackMeta, fallbackConfig) => {
  if (!Array.isArray(messages) || messages.length === 0) return null;

  let activeQuestion = null;
  let pendingAnswer = null;
  let reportItems = [];
  let completeData = null;
  let xp = 0;
  let progress = 0;
  let level = "Explorer";
  let encouragement = "Welcome. Let us begin with a focused heritage question.";
  let totalQuestions = Number(fallbackConfig?.questionCount) || 0;

  for (const msg of messages) {
    const text = msg?.parts?.[0]?.text || "";
    if (!text) continue;

    if (msg.role === "user") {
      const answer = text.trim().toUpperCase();
      if (/^[A-D]$/.test(answer)) {
        pendingAnswer = answer;
      }
      continue;
    }

    const data = parseAIResponse(text);
    if (!data) continue;

    if (typeof data.xp === "number") xp = data.xp;
    if (typeof data.progress === "number") progress = data.progress;
    if (typeof data.level === "string" && data.level) level = data.level;
    if (typeof data.encouragement === "string" && data.encouragement) {
      encouragement = data.encouragement;
    }
    if (typeof data.totalQuestions === "number" && data.totalQuestions > 0) {
      totalQuestions = data.totalQuestions;
    }

    if (data.type === "question") {
      activeQuestion = normalizeQuestionPayload(data);
      continue;
    }

    if (data.type === "feedback") {
      if (activeQuestion) {
        reportItems.push({
          questionNumber: activeQuestion.questionNumber,
          question: activeQuestion.question,
          selectedAnswer: pendingAnswer,
          correctAnswer: data.correctAnswer,
          isCorrect: data.isCorrect === true,
          explanation: data.explanation || "",
          status: data.isCorrect === true ? "correct" : "incorrect",
        });
      }
      pendingAnswer = null;
      activeQuestion = normalizeQuestionPayload(data.nextQuestion);
      continue;
    }

    if (data.type === "complete") {
      completeData = data;
      activeQuestion = null;
    }
  }

  if (completeData) {
    return {
      reportItems:
        Array.isArray(completeData.report) && completeData.report.length > 0
          ? completeData.report.map((item) => ({
              ...item,
              status: item.isCorrect ? "correct" : "incorrect",
            }))
          : reportItems,
      completeData,
      isAbandoned: false,
    };
  }

  if (reportItems.length === 0 && !activeQuestion) return null;

  const finalTotalQuestions =
    totalQuestions ||
    activeQuestion?.totalQuestions ||
    Number(fallbackConfig?.questionCount) ||
    reportItems.length;

  const revisitReport = [...reportItems];

  const highestQuestionNumber = revisitReport.reduce(
    (max, item) => Math.max(max, item.questionNumber || 0),
    0
  );

  const nextQuestionNumber = activeQuestion?.questionNumber || highestQuestionNumber + 1;

  for (
    let questionNumber = nextQuestionNumber;
    questionNumber <= finalTotalQuestions;
    questionNumber += 1
  ) {
    revisitReport.push({
      questionNumber,
      question:
        activeQuestion && questionNumber === activeQuestion.questionNumber
          ? activeQuestion.question
          : `Question ${questionNumber} was not visited.`,
      selectedAnswer: null,
      correctAnswer: null,
      isCorrect: null,
      explanation:
        activeQuestion && questionNumber === activeQuestion.questionNumber
          ? "You left the quiz before answering this question."
          : "This question was never reached before you left the quiz.",
      status: "unvisited",
    });
  }
  const computedProgress =
    typeof fallbackMeta?.progress === "number"
      ? fallbackMeta.progress
      : finalTotalQuestions
      ? Math.round((reportItems.length / finalTotalQuestions) * 100)
      : 0;

  return {
    reportItems: revisitReport,
    isAbandoned: true,
    activeQuestion,
    progress: computedProgress,
    xp,
    level,
    encouragement,
    totalQuestions: finalTotalQuestions,
  };
};

const QuestionReportCard = ({ item, topic }) => (
  <div
    className="rounded-2xl p-4 text-left"
    style={{
      background:
        item.status === "correct"
          ? "rgba(16,185,129,0.1)"
          : item.status === "unvisited"
          ? "rgba(59,130,246,0.08)"
          : "rgba(255,255,255,0.06)",
      border: `1px solid ${
        item.status === "correct"
          ? "rgba(16,185,129,0.2)"
          : item.status === "unvisited"
          ? "rgba(59,130,246,0.18)"
          : "rgba(255,255,255,0.1)"
      }`,
    }}
  >
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-white/40">
        Question {item.questionNumber}
      </span>
      <span
        className={`text-xs font-semibold ${
          item.status === "correct"
            ? "text-emerald-400"
            : item.status === "unvisited"
            ? "text-sky-300"
            : "text-amber-300"
        }`}
      >
        {item.status === "correct"
          ? "Correct"
          : item.status === "unvisited"
          ? "Unvisited"
          : "Needs improvement"}
      </span>
    </div>
    <p className="mt-2 text-sm font-semibold text-white">{item.question}</p>
    <p className="mt-2 text-xs text-white/70">
      Your answer: <span className="font-semibold text-white">{item.selectedAnswer || "Not attempted"}</span>
      {item.correctAnswer ? (
        <>
          {" · "}
          Correct answer: <span className="font-semibold text-white">{item.correctAnswer}</span>
        </>
      ) : null}
    </p>
    {item.explanation && (
      <p className="mt-2 text-xs text-white/65">{item.explanation}</p>
    )}
    {item.status === "incorrect" && (
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
    const parsed = JSON.parse(jsonStr);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    // Fallback: try to find JSON object in the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return parsed && typeof parsed === "object" ? parsed : null;
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
    className={`relative h-2.5 overflow-hidden rounded-full ${className}`}
    style={{ background: "rgba(251,247,238,0.12)" }}
  >
    <motion.div
      className="absolute inset-y-0 left-0 rounded-full"
      style={{
        background: "linear-gradient(90deg, #d9c18a, #9fb49d)",
      }}
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ type: "spring", stiffness: 60, damping: 15 }}
    />
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
        isCorrect ? "text-[#d9c18a]" : "text-[#f0c9a8]"
      }`}
    >
      {isCorrect ? `+${xp} XP` : "Reviewing"}
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
        className="h-14 w-14 overflow-hidden rounded-2xl shadow-lg sm:h-16 sm:w-16"
        style={{ border: "1px solid rgba(217,193,138,0.42)" }}
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
          className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border border-[#d9c18a]/40 bg-[#123327]"
        >
          <span className="mx-auto mt-[0.4rem] block h-1.5 w-1.5 rounded-full bg-[#d9c18a]" />
        </motion.div>
      )}
    </div>
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      key={encouragement}
      className="max-w-[min(24rem,calc(100vw-6rem))] rounded-2xl rounded-bl-md px-4 py-2.5"
      style={{
        background: "rgba(251,247,238,0.08)",
        border: "1px solid rgba(217,193,138,0.14)",
      }}
    >
      <p className="text-sm font-medium leading-6 text-[#fbf7ee]/82">{encouragement}</p>
    </motion.div>
  </div>
);

// ─── Option Button ──────────────────────────────────────────────────────────
const OptionButton = ({
  letter,
  text,
  isSelected,
  isPending,
  isCorrect,
  isActuallyCorrect,
  isDisabled,
  onClick,
}) => {
  const letters = ["A", "B", "C", "D"];
  const colors = {
    idle: {
      bg: "rgba(251,247,238,0.07)",
      border: "rgba(251,247,238,0.12)",
      shadow: "0 12px 30px rgba(0,0,0,0.12)",
    },
    hover: {
      bg: "rgba(251,247,238,0.11)",
      border: "rgba(217,193,138,0.28)",
      shadow: "0 16px 38px rgba(0,0,0,0.18)",
    },
    selected: {
      bg: "rgba(217,193,138,0.16)",
      border: "rgba(217,193,138,0.55)",
      shadow: "0 14px 34px rgba(217,193,138,0.14)",
    },
    pending: {
      bg: "rgba(217,193,138,0.14)",
      border: "rgba(217,193,138,0.62)",
      shadow: "0 0 0 1px rgba(217,193,138,0.14), 0 18px 38px rgba(0,0,0,0.2)",
    },
    correct: {
      bg: "rgba(94,142,105,0.24)",
      border: "rgba(134,190,145,0.64)",
      shadow: "0 16px 36px rgba(94,142,105,0.18)",
    },
    wrong: {
      bg: "rgba(176,96,70,0.18)",
      border: "rgba(240,169,141,0.5)",
      shadow: "0 16px 36px rgba(176,96,70,0.14)",
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
  else if (isSelected && isPending) state = "pending";
  else if (isActuallyCorrect && isDisabled) state = "correct";
  else if (isSelected) state = "selected";
  else if (isDisabled) state = "disabled";

  const style = colors[state];

  return (
    <motion.button
      whileHover={!isDisabled ? { y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.99 } : {}}
      onClick={() => !isDisabled && onClick()}
      disabled={isDisabled}
      className="group flex min-h-[clamp(4.5rem,9vw,5.2rem)] w-full items-center gap-3 rounded-2xl px-[clamp(0.9rem,2vw,1.1rem)] py-[clamp(0.85rem,2vw,1rem)] text-left transition-all duration-200"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: style.shadow,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled && !isSelected ? 0.45 : 1,
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
        style={{
          background:
            state === "correct"
              ? "rgba(16,185,129,0.4)"
              : state === "wrong"
              ? "rgba(239,68,68,0.4)"
              : state === "pending"
              ? "rgba(245,158,11,0.35)"
              : "rgba(255,255,255,0.12)",
          color:
            state === "correct"
              ? "#c7f1cf"
              : state === "wrong"
              ? "#ffd0bf"
              : state === "pending"
              ? "#f5dfaa"
              : "rgba(255,255,255,0.8)",
        }}
      >
        {letters[letter]}
      </span>
      <div className="flex-1 min-w-0">
        <span
          className={`block text-[clamp(0.92rem,1.7vw,1rem)] font-medium leading-6 ${
            isDisabled && !isSelected ? "text-white/30" : "text-white/90"
          }`}
        >
          {text}
        </span>
        {state === "pending" && (
          <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200/90">
            Answer submitted
          </span>
        )}
      </div>
      {state === "pending" && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
          className="w-5 h-5 rounded-full border-2 border-amber-200/30 border-t-amber-200 shrink-0"
        />
      )}
      {state === "correct" && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-lg text-[#c7f1cf]"
        >
          ✓
        </motion.span>
      )}
      {state === "wrong" && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-lg text-[#ffd0bf]"
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
  const resultLabel =
    data.performance === "excellent"
      ? "Excellent command"
      : data.performance === "good"
      ? "Strong progress"
      : "Review recommended";
  const totalCorrect = reportItems.filter((item) => item.status === "correct").length;
  const totalIncorrect = reportItems.filter((item) => item.status === "incorrect").length;
  const totalUnvisited = reportItems.filter((item) => item.status === "unvisited").length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-6 py-[clamp(1.5rem,4vw,2.5rem)] text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d9c18a]/30 bg-[#d9c18a]/10 text-[#d9c18a] shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <Star className="h-7 w-7" />
      </div>

      <div>
        <h2 className="mb-2 font-cinzel-decorative text-[clamp(1.7rem,4vw,2.45rem)] font-bold leading-tight text-white">
          {resultLabel}
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-6 text-white/62">{data.message}</p>
      </div>

      <div
        className="w-full max-w-sm rounded-3xl p-[clamp(1.15rem,3vw,1.5rem)]"
        style={{
          background: "rgba(251,247,238,0.08)",
          border: "1px solid rgba(217,193,138,0.16)",
        }}
      >
        <div className="mb-2 text-[clamp(2.5rem,8vw,3.5rem)] font-black leading-none text-white">
          {summary.finalScore}/{summary.totalQuestions}
        </div>
        <div className="mb-4 text-sm text-white/50">Score</div>

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
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <div className="text-2xl font-black text-emerald-300">{totalCorrect}</div>
          <div className="text-[11px] uppercase tracking-widest text-white/45">Correct</div>
        </div>
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
          <div className="text-2xl font-black text-amber-300">{totalIncorrect}</div>
          <div className="text-[11px] uppercase tracking-widest text-white/45">Incorrect</div>
        </div>
        <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
          <div className="text-2xl font-black text-sky-300">{Math.max(0, totalUnvisited)}</div>
          <div className="text-[11px] uppercase tracking-widest text-white/45">Unvisited</div>
        </div>
      </div>

      {reportItems.length > 0 && (
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-[clamp(1rem,2.5vw,1.25rem)] text-left">
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
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRestart}
        className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, #123327, #566044)",
          boxShadow: "0 18px 42px rgba(0,0,0,0.22)",
        }}
      >
        <RotateCcw className="w-4 h-4" />
        Start New Quiz
      </motion.button>
    </motion.div>
  );
};

// ─── Loading State ──────────────────────────────────────────────────────────
const GameLoading = ({ label }) => <QuizSkeleton label={label} />;

const QuestionLoadingOverlay = ({ label }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <QuizSkeleton label={label} variant="inline" />
  </motion.div>
);

const createInitialGameState = () => ({
  xp: 0,
  progress: 0,
  level: "Explorer",
  questionNumber: 0,
  totalQuestions: 5,
  currentQuestion: null,
  currentQuestionImage: null,
  options: [],
  encouragement: "Welcome. Let us begin with a focused heritage question.",
  isAnswered: false,
  isCorrect: null,
  correctAnswer: null,
  explanation: "",
  showFeedback: false,
  pendingNextQuestion: null,
  isComplete: false,
  completeData: null,
  showXPPopup: false,
});

// ─── Main Student Game UI ───────────────────────────────────────────────────
const StudentGameUI = ({
  messages,
  isLoading,
  handleQuery,
  handleStop,
  chatMeta,
  onNewQuiz,
  quizConfig,
  setQuizTopic,
  setQuizDifficulty,
  setQuizQuestionCount,
  setQuizQuestionType,
  requestErrorSignal,
}) => {
  const latestAttemptRef = useRef(null);
  const nextQuestionTimeoutRef = useRef(null);
  const answerTimeoutRef = useRef(null);
  const reportLinksRequestKeyRef = useRef("");
  const [answers, setAnswers] = useState({});
  const [questionsByIndex, setQuestionsByIndex] = useState({});
  const [resolvedReportItems, setResolvedReportItems] = useState([]);
  const [loadingLabel, setLoadingLabel] = useState("Preparing your next challenge...");
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [submissionTimedOut, setSubmissionTimedOut] = useState(false);
  const [gameState, setGameState] = useState(createInitialGameState);

  const currentQuestionKey = getQuestionKey(gameState.questionNumber);
  const currentSelectedAnswer = answers[currentQuestionKey] || null;
  const reportItems = useMemo(
    () =>
      buildDerivedReportItems(
        questionsByIndex,
        answers,
        gameState.totalQuestions,
        gameState.completeData?.report || []
      ),
    [answers, gameState.completeData?.report, gameState.totalQuestions, questionsByIndex]
  );
  const completeReportItems = useMemo(
    () => resolveReportItems(gameState.completeData, reportItems),
    [gameState.completeData, reportItems]
  );

  const clearAnswerTimeout = useCallback(() => {
    clearTimeout(answerTimeoutRef.current);
    answerTimeoutRef.current = null;
  }, []);

  const resetTransientState = useCallback(() => {
    answerLockedRef.current = false;
    setLocked(false);
    setFeedback(null);
    setSubmissionTimedOut(false);
    setGameState((prev) => ({
      ...prev,
      isAnswered: false,
      isCorrect: null,
      correctAnswer: null,
      explanation: "",
      showFeedback: false,
      showXPPopup: false,
    }));
  }, []);

  const advanceToPendingNextQuestion = useCallback((nextQuestionPayload) => {
    clearTimeout(nextQuestionTimeoutRef.current);
    const nextQuestion = nextQuestionPayload;
    const nextQuestionKey = getQuestionKey(nextQuestion?.questionNumber);

    setGameState((prev) => ({
      ...prev,
      currentQuestion: nextQuestion?.question || prev.currentQuestion,
      currentQuestionImage:
        nextQuestion?.questionImage || prev.currentQuestionImage,
      options: nextQuestion?.options || prev.options,
      questionNumber: nextQuestion?.questionNumber || prev.questionNumber,
      totalQuestions: nextQuestion?.totalQuestions || prev.totalQuestions,
      isAnswered: Boolean(answers[nextQuestionKey]),
      isCorrect: null,
      correctAnswer: null,
      explanation: "",
      showFeedback: false,
      pendingNextQuestion: null,
      showXPPopup: false,
    }));
    setSelected(answers[nextQuestionKey] || null);
    setLocked(false);
    setFeedback(null);
    setSubmissionTimedOut(false);
    answerLockedRef.current = false;
  }, [answers]);

  useEffect(() => {
    setSelected(currentSelectedAnswer);
    setLocked(false);
    setFeedback(null);
    setSubmissionTimedOut(false);
    clearAnswerTimeout();
  }, [gameState.questionNumber]);

  useEffect(() => {
    if (messages.length > 0 || chatMeta || isLoading) return;

    clearTimeout(nextQuestionTimeoutRef.current);
    answerLockedRef.current = false;
    latestAttemptRef.current = null;
    setAnswers({});
    setQuestionsByIndex({});
    setResolvedReportItems([]);
    setSelected(null);
    setLocked(false);
    setFeedback(null);
    setSubmissionTimedOut(false);
    clearAnswerTimeout();
    setGameState(createInitialGameState());
  }, [chatMeta, isLoading, messages.length]);

  useEffect(() => {
    if (!chatMeta || messages.length === 0 || isLoading) return;

    const snapshot = buildStudentSessionSnapshot(messages, chatMeta, quizConfig);
    if (!snapshot) return;

    const restoredAnswers = {};
    const restoredQuestions = {};
    snapshot.reportItems.forEach((item) => {
      const key = getQuestionKey(item.questionNumber);
      restoredQuestions[key] = {
        ...(restoredQuestions[key] || {}),
        questionNumber: item.questionNumber,
        question: item.question,
        correctAnswer: item.correctAnswer || restoredQuestions[key]?.correctAnswer || null,
        explanation: item.explanation || restoredQuestions[key]?.explanation || "",
      };
      if (item.selectedAnswer) {
        restoredAnswers[key] = item.selectedAnswer;
      }
    });

    setAnswers(restoredAnswers);
    setQuestionsByIndex(restoredQuestions);
    setLocked(false);
    setGameState((prev) => ({
      ...prev,
      xp:
        snapshot.completeData?.xp ??
        snapshot.xp ??
        prev.xp,
      progress:
        snapshot.completeData?.progress ??
        snapshot.progress ??
        prev.progress,
      level:
        snapshot.completeData?.level ||
        snapshot.level ||
        prev.level,
      encouragement:
        snapshot.isAbandoned
          ? "Welcome back! Let's continue where you left off."
          : snapshot.completeData?.encouragement || prev.encouragement,
      currentQuestion: snapshot.isAbandoned
        ? snapshot.activeQuestion?.question || null
        : null,
      currentQuestionImage: snapshot.isAbandoned
        ? snapshot.activeQuestion?.questionImage || null
        : null,
      options: snapshot.isAbandoned
        ? snapshot.activeQuestion?.options || []
        : [],
      questionNumber: snapshot.isAbandoned
        ? snapshot.activeQuestion?.questionNumber || prev.questionNumber
        : snapshot.completeData?.totalQuestions ?? prev.questionNumber,
      totalQuestions: snapshot.isAbandoned
        ? snapshot.totalQuestions ?? prev.totalQuestions
        : snapshot.completeData?.totalQuestions ?? prev.totalQuestions,
      isAnswered: false,
      isCorrect: null,
      correctAnswer: null,
      explanation: "",
      showFeedback: false,
      pendingNextQuestion: null,
      isComplete: !snapshot.isAbandoned,
      completeData: snapshot.isAbandoned ? null : snapshot.completeData,
      showXPPopup: false,
    }));
  }, [chatMeta, isLoading, messages, quizConfig]);

  useEffect(() => {
    let ignore = false;

    const resolveLinks = async () => {
      if (!gameState.isComplete) {
        reportLinksRequestKeyRef.current = "";
        return;
      }
      if (completeReportItems.length === 0) {
        reportLinksRequestKeyRef.current = "";
        setResolvedReportItems([]);
        return;
      }

      const requestKey = JSON.stringify({
        topic: quizConfig?.topic || "",
        items: completeReportItems,
      });

      if (reportLinksRequestKeyRef.current === requestKey) {
        return;
      }

      reportLinksRequestKeyRef.current = requestKey;

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

  useEffect(() => {
    if (!isLoading) {
      setLoadingLabel("Preparing your next challenge...");
      return;
    }

    setLoadingLabel(
      gameState.isAnswered
        ? "Checking your answer..."
        : "Preparing your next challenge..."
    );

    const t1 = setTimeout(() => {
      setLoadingLabel("Reviewing heritage details...");
    }, 1800);
    const t2 = setTimeout(() => {
      setLoadingLabel("Slow network detected. Still working...");
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [gameState.isAnswered, isLoading]);

  // Parse the latest AI message
  useEffect(() => {
    if (messages.length === 0) return;

    const lastAiMsg = [...messages].reverse().find((m) => m.role === "ai");
    if (!lastAiMsg) return;

    const data = parseAIResponse(lastAiMsg.parts[0].text);
    if (!data) return;

    if (data.type === "question") {
      const normalizedQuestion = normalizeQuestionPayload(data);
      if (!normalizedQuestion) return;
      if (data.questionNumber === 1) {
        setAnswers({});
        setQuestionsByIndex({});
      }
      setQuestionsByIndex((prev) =>
        upsertQuestionRecord(data.questionNumber === 1 ? {} : prev, normalizedQuestion)
      );
      const questionKey = getQuestionKey(normalizedQuestion.questionNumber);
      setGameState((prev) => {
        const isSameQuestion =
          prev.questionNumber === normalizedQuestion.questionNumber &&
          prev.currentQuestion?.trim() === normalizedQuestion.question?.trim();
        const persistedAnswer = answers[questionKey] || null;
        return {
          ...prev,
          currentQuestion: normalizedQuestion.question,
          currentQuestionImage: normalizedQuestion.questionImage,
          options: normalizedQuestion.options,
          questionNumber: normalizedQuestion.questionNumber,
          totalQuestions: normalizedQuestion.totalQuestions,
          xp: data.xp ?? prev.xp,
          progress: data.progress ?? prev.progress,
          level: data.level || prev.level,
          encouragement: data.encouragement || prev.encouragement,
          isAnswered: isSameQuestion ? prev.isAnswered : Boolean(persistedAnswer),
          isCorrect: isSameQuestion ? prev.isCorrect : null,
          correctAnswer: isSameQuestion ? prev.correctAnswer : null,
          explanation: isSameQuestion ? prev.explanation : "",
          showFeedback: isSameQuestion ? prev.showFeedback : false,
          pendingNextQuestion: isSameQuestion ? prev.pendingNextQuestion : null,
          isComplete: false,
          showXPPopup: isSameQuestion ? prev.showXPPopup : false,
        };
      });
    } else if (data.type === "feedback") {
      const normalizedNextQuestion = normalizeQuestionPayload(data.nextQuestion);
      const feedbackQuestionKey = getQuestionKey(data.questionNumber || gameState.questionNumber);
      setQuestionsByIndex((prev) => ({
        ...prev,
        [feedbackQuestionKey]: {
          ...(prev[feedbackQuestionKey] || {}),
          questionNumber:
            prev[feedbackQuestionKey]?.questionNumber ||
            data.questionNumber ||
            gameState.questionNumber,
          question:
            prev[feedbackQuestionKey]?.question ||
            latestAttemptRef.current?.question ||
            "",
          correctAnswer: data.correctAnswer || null,
          explanation: data.explanation || "",
        },
      }));
      if (normalizedNextQuestion) {
        setQuestionsByIndex((prev) => upsertQuestionRecord(prev, normalizedNextQuestion));
      }
      setGameState((prev) => ({
        ...prev,
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        xp: data.xp ?? prev.xp,
        progress: data.progress ?? prev.progress,
        encouragement: data.encouragement || prev.encouragement,
        showFeedback: false,
        showXPPopup: true,
        pendingNextQuestion: normalizedNextQuestion,
      }));
      setFeedback(data.isCorrect === true ? "correct" : "incorrect");
      clearAnswerTimeout();

      if (normalizedNextQuestion) {
        clearTimeout(nextQuestionTimeoutRef.current);
        advanceToPendingNextQuestion(normalizedNextQuestion);
      } else {
        clearTimeout(nextQuestionTimeoutRef.current);
        nextQuestionTimeoutRef.current = setTimeout(() => {
          setGameState((prev) => ({
            ...prev,
            showXPPopup: false,
          }));
        }, 1800);
      }
      latestAttemptRef.current = null;
    } else if (data.type === "complete") {
      const completeReport = Array.isArray(data.report) ? data.report : [];
      let mergedQuestionsByIndex = questionsByIndex;
      if (completeReport.length > 0) {
        mergedQuestionsByIndex = { ...questionsByIndex };
        completeReport.forEach((item) => {
          const key = getQuestionKey(item.questionNumber);
          mergedQuestionsByIndex[key] = {
            ...mergedQuestionsByIndex[key],
            questionNumber: item.questionNumber,
            question: item.question,
            correctAnswer:
              item.correctAnswer || mergedQuestionsByIndex[key]?.correctAnswer || null,
            explanation:
              item.explanation || mergedQuestionsByIndex[key]?.explanation || "",
          };
        });
        setQuestionsByIndex(mergedQuestionsByIndex);
      }
      const resultTotals = calculateQuizResults(
        mergedQuestionsByIndex,
        answers,
        data.totalQuestions ?? gameState.totalQuestions
      );
      setGameState((prev) => ({
        ...prev,
        isComplete: true,
        completeData: {
          ...data,
          finalScore: resultTotals.finalScore,
          totalQuestions: resultTotals.totalQuestions,
          performance: resultTotals.performance,
        },
        xp: data.xp ?? prev.xp,
        progress: 100,
        showFeedback: false,
        isAnswered: false,
        isCorrect: null,
        correctAnswer: null,
        explanation: "",
        currentQuestion: null,
        currentQuestionImage: null,
        options: [],
        questionNumber: data.totalQuestions ?? prev.totalQuestions,
        totalQuestions: data.totalQuestions ?? prev.totalQuestions,
        pendingNextQuestion: null,
        showXPPopup: false,
      }));
      setLocked(false);
    } else if (data.type === "error") {
      setGameState((prev) => ({
        ...prev,
        encouragement: data.message || "Please answer with A, B, C, or D.",
      }));
      setLocked(false);
      setFeedback(null);
      clearAnswerTimeout();
    }
  }, [advanceToPendingNextQuestion, answers, chatMeta, clearAnswerTimeout, gameState.questionNumber, gameState.totalQuestions, isLoading, messages, questionsByIndex]);

  // Ref-based lock ensures the click is atomically registered before React re-renders
  const answerLockedRef = useRef(false);

  useEffect(() => {
    if (!requestErrorSignal?.id) return;
    answerLockedRef.current = false;
    latestAttemptRef.current = null;
    clearTimeout(nextQuestionTimeoutRef.current);
    clearAnswerTimeout();
    setLocked(false);
    setFeedback(null);
    setSubmissionTimedOut(false);
    setGameState((prev) => ({
      ...prev,
      isAnswered: false,
      isCorrect: null,
      correctAnswer: null,
      explanation: "",
      showFeedback: false,
      pendingNextQuestion: null,
      showXPPopup: false,
      encouragement:
        requestErrorSignal.message ||
        "We couldn't submit that answer. Please try again.",
    }));
  }, [requestErrorSignal]);

  const handleAnswerSelect = useCallback(
    (index) => {
      if (answerLockedRef.current || locked || gameState.isAnswered || isLoading) return;
      answerLockedRef.current = true;
      const selectedLetter = ANSWER_LETTERS[index];
      const questionKey = getQuestionKey(gameState.questionNumber);

      setLocked(true);
      setFeedback(null);
      setSelected(selectedLetter);
      setAnswers((prev) => ({
        ...prev,
        [questionKey]: selectedLetter,
      }));
      setSubmissionTimedOut(false);

      latestAttemptRef.current = {
        questionNumber: gameState.questionNumber,
        question: gameState.currentQuestion,
        selectedAnswer: selectedLetter,
      };
      setGameState((prev) => ({
        ...prev,
        isAnswered: true,
        isCorrect: null,
        correctAnswer: null,
        explanation: "",
        showFeedback: false,
        showXPPopup: false,
      }));

      clearAnswerTimeout();
      answerTimeoutRef.current = setTimeout(() => {
        setSubmissionTimedOut(true);
        answerLockedRef.current = false;
        setLocked(false);
        setFeedback(null);
        setGameState((prev) => ({
          ...prev,
          isAnswered: false,
          isCorrect: null,
          correctAnswer: null,
          explanation: "",
          showFeedback: false,
          showXPPopup: false,
          encouragement:
            "This answer is taking too long. You can wait, retry, or continue.",
        }));
      }, 25000);

      handleQuery(null, selectedLetter);
    },
    [clearAnswerTimeout, gameState.currentQuestion, gameState.isAnswered, gameState.questionNumber, handleQuery, handleStop, isLoading, locked]
  );


  // Reset the ref lock when a new question arrives
  useEffect(() => {
    if (!locked) {
      answerLockedRef.current = false;
    }
  }, [locked]);

  useEffect(
    () => () => {
      clearTimeout(nextQuestionTimeoutRef.current);
      clearTimeout(answerTimeoutRef.current);
    },
    []
  );

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
      <div className="flex flex-1 flex-col items-center justify-center px-[clamp(1rem,3vw,1.75rem)] py-[clamp(1rem,3vw,1.75rem)]">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-[clamp(0.9rem,2.3vw,1.25rem)]">
          {/* ── Stats HUD ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-3 px-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
          >
            {/* XP */}
            <div
              className="flex items-center gap-2 rounded-2xl px-3 py-2"
              style={{
                background: "rgba(217,193,138,0.12)",
                border: "1px solid rgba(217,193,138,0.2)",
              }}
            >
              <Star className="h-4 w-4 text-[#d9c18a]" />
              <span className="text-sm font-bold text-[#f1dfb7]">
                {gameState.xp} XP
              </span>
            </div>

            {/* Progress */}
            <div className="min-w-0">
              <AnimatedProgressBar progress={gameState.progress} />
            </div>

            {/* Level */}
            <div
              className="px-3 py-2 rounded-2xl"
              style={{
                background: "rgba(251,247,238,0.07)",
                border: "1px solid rgba(251,247,238,0.12)",
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#fbf7ee]/72">
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
          <div className="relative min-h-[min(31rem,70vh)] w-full">
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
              <GameLoading label={loadingLabel} />
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
                  className="mb-4 rounded-3xl p-[clamp(1.1rem,3vw,1.6rem)]"
                  style={{
                    background: "rgba(251,247,238,0.075)",
                    border: "1px solid rgba(217,193,138,0.15)",
                    boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
                  }}
                >
                  <p className="text-center text-[clamp(1.05rem,2.6vw,1.35rem)] font-bold leading-relaxed text-white">
                    {gameState.currentQuestion}
                  </p>
                  {gameState.currentQuestionImage ? (
                    <div className="mt-4 aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      <img
                        src={gameState.currentQuestionImage}
                        alt="Quiz reference"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Options */}
                <div className="grid gap-3">
                  {gameState.options.map((opt, i) => (
                    <OptionButton
                      key={`${gameState.questionNumber}-${i}`}
                      letter={i}
                      text={opt}
                      isSelected={selected === ANSWER_LETTERS[i]}
                      isPending={
                        selected === ANSWER_LETTERS[i] &&
                        locked &&
                        feedback == null
                      }
                      isCorrect={
                        selected === ANSWER_LETTERS[i]
                          ? gameState.isCorrect
                          : null
                      }
                      isActuallyCorrect={
                        gameState.correctAnswer === ANSWER_LETTERS[i]
                      }
                      isDisabled={locked}
                      onClick={() => handleAnswerSelect(i)}
                    />
                  ))}
                </div>

                {locked && gameState.isCorrect == null && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#d9c18a]/25 bg-[#d9c18a]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f1dfb7]">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                        className="h-3.5 w-3.5 rounded-full border-2 border-[#f1dfb7]/25 border-t-[#f1dfb7]"
                      />
                      Checking answer
                    </span>
                  </div>
                )}

                {submissionTimedOut && (
                  <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                    <p className="text-sm font-semibold text-red-300">
                      This answer is taking more than 25 seconds.
                    </p>
                    <p className="mt-1 text-xs text-white/65">
                      You can retry this question, or continue if the next question is already available.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {gameState.pendingNextQuestion ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleStop?.();
                            clearAnswerTimeout();
                            advanceToPendingNextQuestion(gameState.pendingNextQuestion);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          Next Question
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          handleStop?.();
                          clearAnswerTimeout();
                          resetTransientState();
                          setSelected(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retry Question
                      </button>
                    </div>
                  </div>
                )}

                {/* Feedback Banner */}
                <AnimatePresence>
                  {feedback !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 rounded-2xl p-4 overflow-hidden"
                      style={{
                        background: feedback === "correct"
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(239,68,68,0.15)",
                        border: `1px solid ${
                          feedback === "correct"
                            ? "rgba(16,185,129,0.3)"
                            : "rgba(239,68,68,0.3)"
                        }`,
                      }}
                    >
                      <p
                        className={`font-bold text-sm mb-1 ${
                          feedback === "correct"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {feedback === "correct"
                          ? "Correct. +10 XP"
                          : `The answer was ${gameState.correctAnswer}`}
                      </p>
                      <p className="text-white/70 text-xs">
                        {gameState.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading next */}
                <AnimatePresence>
                  {isLoading && gameState.isAnswered && (
                    <QuestionLoadingOverlay label={loadingLabel} />
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Waiting for quiz to start */
              <div className="flex flex-col items-center py-[clamp(2rem,6vw,3.5rem)] text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c18a]/24 bg-[#d9c18a]/10 text-[#d9c18a]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-cinzel-decorative text-[clamp(1.5rem,4vw,2rem)] font-bold leading-tight text-white">
                  Begin a Heritage Quiz
                </h3>
                <p className="mb-8 max-w-md text-sm leading-6 text-white/52">
                  Choose a topic and the system will prepare a focused learning sequence.
                </p>

                {/* Minimal Setup */}
                <div className="mb-8 w-full max-w-md space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 ml-1">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={quizConfig?.topic || ""}
                      onChange={(e) => setQuizTopic?.(e.target.value)}
                      placeholder="e.g. Ajanta Caves, Shivaji Maharaj"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/24 transition-colors focus:border-[#d9c18a]/50 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 ml-1">
                        Difficulty
                      </label>
                      <select
                        value={normalizeDifficultyValue(quizConfig?.difficulty)}
                        onChange={(e) => setQuizDifficulty?.(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-colors focus:border-[#d9c18a]/50 focus:outline-none"
                      >
                        <option value="Easy" className="bg-slate-900">Easy</option>
                        <option value="Medium" className="bg-slate-900">Medium</option>
                        <option value="Hard" className="bg-slate-900">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 ml-1">
                        Questions
                      </label>
                      <select
                        value={quizConfig?.questionCount || 5}
                        onChange={(e) => setQuizQuestionCount?.(Number(e.target.value))}
                        className="w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-colors focus:border-[#d9c18a]/50 focus:outline-none"
                      >
                        <option value={3} className="bg-slate-900">3 Questions</option>
                        <option value={5} className="bg-slate-900">5 Questions</option>
                        <option value={10} className="bg-slate-900">10 Questions</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
                    <input
                      type="checkbox"
                      checked={quizConfig?.questionType === "Image MCQ"}
                      onChange={(e) =>
                        setQuizQuestionType?.(
                          e.target.checked ? "Image MCQ" : "MCQ"
                        )
                      }
                      className="h-4 w-4 accent-[#d9c18a]"
                    />
                    <span>
                      Use image-based questions
                    </span>
                  </label>
                </div>

                <motion.button
                  type="button"
                  whileHover={!isLoading ? { y: -1 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  onClick={() => handleQuery(null, "", true)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 rounded-full bg-[#123327] px-8 py-3.5 text-sm font-bold text-white transition-all ${
                    isLoading 
                      ? "opacity-50 cursor-not-allowed" 
                      : "shadow-[0_18px_44px_rgba(0,0,0,0.22)] hover:bg-[#1f4738]"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Starting..." : "Start Quiz"}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 pb-5">
        <p className="text-center text-[10px] text-white/35">
          HeritageX was developed to support academic activity at Sardar Patel Institute of Technology.
        </p>
        <p className="text-center text-[10px] text-white/30 mt-1">
          Developers: Dnyandeep Gaonkar, Rudrapratapsing Rajput, Shreeya Nemade
        </p>
      </div>
    </div>
  );
};

export default StudentGameUI;
