"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, RotateCcw, Check, X, Medal } from "lucide-react";
import { fetchWithInternalToken } from "../../lib/fetch";
import QuizSkeleton from "./QuizSkeleton";

const ANSWER_LETTERS = ["A", "B", "C", "D"];

const normalizeQuizConfig = (quizState = {}, fallback = {}) => {
  const nestedConfig = quizState.config && typeof quizState.config === "object" ? quizState.config : {};
  return {
    topic: quizState.topic ?? nestedConfig.topic ?? fallback.topic ?? "",
    difficulty:
      quizState.difficulty ??
      nestedConfig.difficulty ??
      fallback.difficulty ??
      "Medium",
    questionCount:
      quizState.questionCount ??
      nestedConfig.questionCount ??
      fallback.questionCount ??
      5,
    questionType:
      quizState.questionType ??
      nestedConfig.questionType ??
      fallback.questionType ??
      "MCQ",
  };
};

// ─── Modern Premium Option Button Component ─────────────────────────────
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
  const letterStr = letters[letter] || "A";

  let cardStyle = "border-white/10 bg-white/[0.03] text-white/90 hover:border-[#d9c18a]/50 hover:bg-white/[0.08] hover:shadow-[0_0_15px_rgba(217,193,138,0.15)]";
  let letterStyle = "bg-white/5 text-white/60 border-white/10 group-hover:text-[#d9c18a] group-hover:border-[#d9c18a]/50";
  let icon = null;

  if (isSelected && isCorrect === true) {
    cardStyle = "border-emerald-500/80 bg-emerald-500/20 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.3)]";
    letterStyle = "bg-emerald-500/90 text-white border-emerald-400";
    icon = <Check className="w-5 h-5 text-emerald-400 ml-auto" />;
  } else if (isSelected && isCorrect === false) {
    cardStyle = "border-red-500/80 bg-red-500/20 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.3)]";
    letterStyle = "bg-red-500/90 text-white border-red-400";
    icon = <X className="w-5 h-5 text-red-400 ml-auto" />;
  } else if (isSelected && isPending) {
    cardStyle = "border-[#d9c18a]/80 bg-[#d9c18a]/20 text-white shadow-[0_0_30px_rgba(217,193,138,0.3)] animate-pulse";
    letterStyle = "bg-[#d9c18a] text-[#071b15] border-[#d9c18a]";
  } else if (isActuallyCorrect && isDisabled) {
    cardStyle = "border-emerald-500/60 bg-emerald-500/15 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
    letterStyle = "bg-emerald-500/70 text-white border-emerald-500";
    icon = <Check className="w-5 h-5 text-emerald-400 ml-auto" />;
  } else if (isSelected) {
    cardStyle = "border-[#d9c18a]/80 bg-[#d9c18a]/20 text-white";
    letterStyle = "bg-[#d9c18a] text-[#071b15] border-[#d9c18a]";
  } else if (isDisabled) {
    cardStyle = "border-white/5 bg-white/[0.01] text-white/30 cursor-not-allowed";
    letterStyle = "bg-transparent text-white/20 border-white/5";
  }

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.01, y: -2 } : {}}
      whileTap={!isDisabled ? { scale: 0.99 } : {}}
      onClick={() => !isDisabled && onClick()}
      disabled={isDisabled}
      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all duration-300 backdrop-blur-sm ${cardStyle}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-colors duration-300 ${letterStyle}`}>
        {letterStr}
      </span>
      <span className="text-sm sm:text-base font-medium leading-relaxed font-sans">
        {text}
      </span>
      {icon}
    </motion.button>
  );
};

// ─── Main Premium Game UI ──────────────────────────────────────────────────
export default function PremiumQuizUI({
  quizConfig,
  chatId,
  chatMeta,
  onQuizSaved,
  onAttemptSimilar,
  onStartNewQuiz,
}) {
  const [showSetup, setShowSetup] = useState(true);
  
  // Local state for setup
  const [localTopic, setLocalTopic] = useState(quizConfig?.topic || "");
  const [localDifficulty, setLocalDifficulty] = useState(quizConfig?.difficulty || "Medium");
  const [localQuestionCount, setLocalQuestionCount] = useState(quizConfig?.questionCount || 5);
  const [localQuestionType, setLocalQuestionType] = useState(quizConfig?.questionType || "MCQ");

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [xp, setXp] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [score, setScore] = useState(0);

  const [questionState, setQuestionState] = useState({
    isAnswered: false,
    isCorrect: null,
    correctAnswer: null,
    explanation: "",
  });

  const saveQuizState = useCallback(async (newState = {}) => {
    if (!chatId) return;
    
    try {
      const authToken = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      if (!authToken) return;

      const config = normalizeQuizConfig(newState, {
        topic: localTopic,
        difficulty: localDifficulty,
        questionCount: localQuestionCount,
        questionType: localQuestionType,
      });
      const nextQuestions = newState.questions !== undefined ? newState.questions : questions;
      const nextScore = newState.score !== undefined ? newState.score : score;
      const nextTotalQuestions =
        newState.totalQuestions !== undefined
          ? newState.totalQuestions
          : nextQuestions.length;
      const nextStatus =
        newState.status ||
        (newState.isComplete || isComplete ? "COMPLETED" : "IN_PROGRESS");

      const payload = {
        ...config,
        questions: nextQuestions,
        currentQuestionIndex:
          newState.currentQuestionIndex !== undefined
            ? newState.currentQuestionIndex
            : newState.currentIndex !== undefined
              ? newState.currentIndex
              : currentIndex,
        answeredQuestions:
          newState.answeredQuestions !== undefined
            ? newState.answeredQuestions
            : answeredQuestions,
        selectedAnswers:
          newState.selectedAnswers !== undefined
            ? newState.selectedAnswers
            : selectedAnswers,
        score: nextScore,
        totalQuestions: nextTotalQuestions,
        accuracy:
          newState.accuracy !== undefined
            ? newState.accuracy
            : nextTotalQuestions
              ? Math.round((nextScore / nextTotalQuestions) * 100)
              : 0,
        xp: newState.xp !== undefined ? newState.xp : xp,
        isComplete: nextStatus === "COMPLETED",
        status: nextStatus,
        completedAt:
          nextStatus === "COMPLETED"
            ? newState.completedAt || new Date().toISOString()
            : null,
        config,
      };

      const response = await fetchWithInternalToken(`/api/ai/chat/${chatId}/quiz-state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok && onQuizSaved) {
        const data = await response.json();
        onQuizSaved(data.quizState, chatId);
      }
    } catch (e) {
      console.error("Failed to save quiz state:", e);
    }
  }, [
    answeredQuestions,
    chatId,
    currentIndex,
    isComplete,
    localDifficulty,
    localQuestionCount,
    localQuestionType,
    localTopic,
    onQuizSaved,
    questions,
    score,
    selectedAnswers,
    xp,
  ]);

  // Fetch real questions from API
  const fetchQuizQuestions = useCallback(async (configOverride = null) => {
    const generationConfig = configOverride || {
      topic: localTopic,
      difficulty: localDifficulty,
      questionCount: localQuestionCount,
      questionType: localQuestionType,
    };

    setLoading(true);
    setSelected(null);
    setLocked(false);
    setFeedback(null);
    setIsComplete(false);
    setQuizError(null);
    setXp(0);
    setScore(0);
    setSelectedAnswers({});
    setAnsweredQuestions([]);
    setQuestionState({
      isAnswered: false,
      isCorrect: null,
      correctAnswer: null,
      explanation: "",
    });

    try {
      const fingerprint = typeof window !== "undefined" ? localStorage.getItem("visitor_fingerprint") || "unknown" : "unknown";
      const authToken = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      
      const headers = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetchWithInternalToken(`/api/ai/quiz`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic: generationConfig.topic,
          difficulty: generationConfig.difficulty,
          questionCount: generationConfig.questionCount,
          questionType: generationConfig.questionType,
          audienceType: "professional", // Unified UI treats everything premium
          fingerprint,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success && Array.isArray(data.data?.quiz) && data.data.quiz.length > 0) {
        const formattedQuestions = data.data.quiz.map((q) => ({
          id: q.id,
          question: q.question,
          options: [q.options.A, q.options.B, q.options.C, q.options.D],
          correctAnswer: q.answer,
          explanation: q.explanation,
        }));
        setQuestions(formattedQuestions);
        setCurrentIndex(0);
        setShowSetup(false);
        saveQuizState({
          ...generationConfig,
          questions: formattedQuestions,
          currentQuestionIndex: 0,
          answeredQuestions: [],
          selectedAnswers: {},
          score: 0,
          totalQuestions: formattedQuestions.length,
          accuracy: 0,
          xp: 0,
          isComplete: false,
          status: "IN_PROGRESS",
        });
      } else {
        setQuizError(data.error || "We couldn't generate a valid quiz. Please try again.");
      }
    } catch (e) {
      console.error("Failed to load questions from Quiz API:", e);
      setQuizError("Quiz generation is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [localTopic, localDifficulty, localQuestionCount, localQuestionType, saveQuizState]);

  // Initialize from saved state if navigating back to a saved chat
  useEffect(() => {
    if (!chatMeta) {
      setShowSetup(true);
      setQuestions([]);
      setCurrentIndex(0);
      setXp(0);
      setScore(0);
      setSelectedAnswers({});
      setAnsweredQuestions([]);
      setIsComplete(false);
      setSelected(null);
      setLocked(false);
      setFeedback(null);
      setQuizError(null);
      setLocalTopic(quizConfig?.topic || "");
      setLocalDifficulty(quizConfig?.difficulty || "Medium");
      setLocalQuestionCount(quizConfig?.questionCount || 5);
      setLocalQuestionType(quizConfig?.questionType || "MCQ");
      setQuestionState({
        isAnswered: false,
        isCorrect: null,
        correctAnswer: null,
        explanation: "",
      });
      return;
    }

    if (chatMeta && chatMeta.quizState && chatMeta.quizState.questions?.length > 0) {
      const qs = chatMeta.quizState;
      const config = normalizeQuizConfig(qs, quizConfig);
      const restoredIndex = qs.currentQuestionIndex ?? qs.currentIndex ?? 0;
      const restoredSelectedAnswers = qs.selectedAnswers || {};
      const restoredAnsweredQuestions = qs.answeredQuestions || [];
      const restoredQuestion = qs.questions[restoredIndex] || null;
      const restoredSelection = restoredQuestion
        ? restoredSelectedAnswers[restoredQuestion.id] ?? restoredSelectedAnswers[restoredIndex] ?? null
        : null;
      const restoredIsAnswered =
        restoredSelection !== null ||
        restoredAnsweredQuestions.includes(restoredQuestion?.id) ||
        restoredAnsweredQuestions.includes(restoredIndex);
      const restoredIsCorrect =
        restoredIsAnswered && restoredQuestion
          ? restoredSelection === restoredQuestion.correctAnswer
          : null;

      setQuestions(qs.questions);
      setCurrentIndex(restoredIndex);
      setXp(qs.xp ?? (qs.score || 0) * 10);
      setScore(qs.score || 0);
      setSelectedAnswers(restoredSelectedAnswers);
      setAnsweredQuestions(restoredAnsweredQuestions);
      setIsComplete(qs.status === "COMPLETED" || qs.isComplete || false);
      setShowSetup(false);
      setLocalTopic(config.topic || "");
      setLocalDifficulty(config.difficulty || "Medium");
      setLocalQuestionCount(config.questionCount || 5);
      setLocalQuestionType(config.questionType || "MCQ");
      
      setSelected(restoredSelection);
      setLocked(Boolean(restoredIsAnswered));
      setFeedback(restoredIsCorrect === null ? null : restoredIsCorrect ? "correct" : "incorrect");
      setQuestionState({
        isAnswered: Boolean(restoredIsAnswered),
        isCorrect: restoredIsCorrect,
        correctAnswer: restoredQuestion?.correctAnswer || null,
        explanation: restoredIsAnswered
          ? restoredQuestion?.explanation || "Correct ground truth answer evaluated from canonical heritage records."
          : "",
      });
    } else if (chatMeta && chatMeta.mode === 'quiz') {
      const config = normalizeQuizConfig(chatMeta.quizState || {}, quizConfig);
      const hasPresetConfig =
        chatMeta.quizState?.config &&
        typeof chatMeta.quizState.config === "object" &&
        Object.keys(chatMeta.quizState.config).length > 0;
      if (chatMeta.quizState && chatMeta.quizState.status === "NOT_STARTED" && hasPresetConfig && (!chatMeta.quizState.questions || chatMeta.quizState.questions.length === 0)) {
        // Attempt Similar Quiz scenario: config is present, but no questions yet
        setShowSetup(false);
        setLocalTopic(config.topic || "");
        setLocalDifficulty(config.difficulty || "Medium");
        setLocalQuestionCount(config.questionCount || 5);
        setLocalQuestionType(config.questionType || "MCQ");
        fetchQuizQuestions(config);
      } else if (!chatMeta.quizState || chatMeta.quizState.questions?.length === 0) {
        // Normal new quiz
        setShowSetup(true);
        setQuestions([]);
        setCurrentIndex(0);
        setXp(0);
        setScore(0);
        setSelectedAnswers({});
        setAnsweredQuestions([]);
        setIsComplete(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMeta]);

  // Instead of auto-fetching, the user clicks Start in the setup UI
  const handleStartQuiz = () => {
    const startConfig = {
      topic: localTopic,
      difficulty: localDifficulty,
      questionCount: localQuestionCount,
      questionType: localQuestionType,
    };

    if (!chatId && onStartNewQuiz) {
      onStartNewQuiz(startConfig);
      return;
    }

    setShowSetup(false);
    fetchQuizQuestions(startConfig);
  };

  const currentQuestion = questions[currentIndex] || null;

  // Handle Option Click & Answer Submission
  const handleOptionSelect = async (index) => {
    if (locked || questionState.isAnswered || !currentQuestion) return;

    const letter = ANSWER_LETTERS[index];
    setSelected(letter);
    setLocked(true);

    // Simulate network delay for "verification" suspense
    await new Promise(r => setTimeout(r, 600));

    const isCorrect = (letter === currentQuestion.correctAnswer);
    const nextSelectedAnswers = {
      ...selectedAnswers,
      [currentQuestion.id || currentIndex]: letter,
    };
    const answeredKey = currentQuestion.id || currentIndex;
    const nextAnsweredQuestions = answeredQuestions.includes(answeredKey)
      ? answeredQuestions
      : [...answeredQuestions, answeredKey];
    const nextScore = isCorrect ? score + 1 : score;
    const nextAccuracy = questions.length
      ? Math.round((nextScore / questions.length) * 100)
      : 0;

    setQuestionState({
      isAnswered: true,
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer || "A",
      explanation: currentQuestion.explanation || "Correct ground truth answer evaluated from canonical heritage records.",
    });

    const newXp = isCorrect ? xp + 10 : xp;
    setXp(newXp);
    setScore(nextScore);
    setSelectedAnswers(nextSelectedAnswers);
    setAnsweredQuestions(nextAnsweredQuestions);
    setFeedback(isCorrect ? "correct" : "incorrect");
    
    // Persist current state WITHOUT auto-advancing
    // Persist current state
    await saveQuizState({
      xp: newXp,
      score: nextScore,
      currentQuestionIndex: currentIndex,
      answeredQuestions: nextAnsweredQuestions,
      selectedAnswers: nextSelectedAnswers,
      totalQuestions: questions.length,
      accuracy: nextAccuracy,
      isComplete: false,
      status: "IN_PROGRESS",
    });
  };

  // Next Question Handler
  const handleNextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setIsComplete(true);
      saveQuizState({
        isComplete: true,
        status: "COMPLETED",
        score,
        totalQuestions: questions.length,
        accuracy: questions.length ? Math.round((score / questions.length) * 100) : 0,
        currentQuestionIndex: currentIndex,
      });
    } else {
      setSelected(null);
      setLocked(false);
      setFeedback(null);
      setQuestionState({
        isAnswered: false,
        isCorrect: null,
        correctAnswer: null,
        explanation: "",
      });
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      saveQuizState({ currentQuestionIndex: nextIndex });
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-[#071b15] text-[#fbf7ee] relative">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#d9c18a]/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 md:p-8 z-10">
        <div className="mx-auto w-full max-w-4xl flex flex-col gap-6">

          {/* ── 0. SETUP SCREEN ── */}
          {showSetup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 sm:p-12 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#d9c18a]/50 to-transparent" />
              
              <div className="text-center mb-10">
                <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#d9c18a] mb-4">
                  Assessment Configuration
                </h2>
                <p className="text-sm text-white/60 font-sans max-w-lg mx-auto">
                  Customize your premium evaluation experience. Our AI will dynamically construct a unique assessment based on your parameters.
                </p>
              </div>

              <div className="space-y-8 max-w-xl mx-auto">
                {/* Topic Input */}
                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase tracking-widest text-[#d9c18a]/80 pl-2">Subject Matter</label>
                  <input
                    type="text"
                    value={localTopic}
                    onChange={(e) => setLocalTopic(e.target.value)}
                    placeholder="E.g., Ajanta Caves, Satavahana Dynasty..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#d9c18a]/50 focus:ring-1 focus:ring-[#d9c18a]/50 transition-all font-sans text-sm"
                  />
                  <p className="text-[10px] text-white/40 pl-2">Leave blank to assess your knowledge across all Maharashtra Heritage topics.</p>
                </div>

                {/* Grid for Selects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-mono uppercase tracking-widest text-[#d9c18a]/80 pl-2">Complexity</label>
                    <select
                      value={localDifficulty}
                      onChange={(e) => setLocalDifficulty(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#d9c18a]/50 focus:ring-1 focus:ring-[#d9c18a]/50 transition-all font-sans text-sm appearance-none"
                    >
                      <option value="Easy" className="bg-[#071b15]">Foundation (Easy)</option>
                      <option value="Medium" className="bg-[#071b15]">Intermediate (Medium)</option>
                      <option value="Hard" className="bg-[#071b15]">Expert (Hard)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-mono uppercase tracking-widest text-[#d9c18a]/80 pl-2">Question Count</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={localQuestionCount}
                      onChange={(e) => {
                        const v = parseInt(e.target.value || "1", 10);
                        setLocalQuestionCount(Number.isFinite(v) ? Math.min(Math.max(v, 1), 20) : 5);
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#d9c18a]/50 focus:ring-1 focus:ring-[#d9c18a]/50 transition-all font-sans text-sm"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-center">
                  <button
                    onClick={handleStartQuiz}
                    className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#d9c18a] to-[#c7ad6e] px-12 py-5 text-sm font-bold text-[#071b15] shadow-[0_0_30px_rgba(217,193,138,0.2)] hover:shadow-[0_0_40px_rgba(217,193,138,0.4)] transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative z-10 font-cinzel text-lg tracking-wide">Initialize Assessment</span>
                    <Sparkles className="relative z-10 h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 1. LOADING SKELETON ── */}
          {loading && !showSetup && <QuizSkeleton />}

          {/* ── 2. ACTIVE QUESTION CARD ── */}
          {!loading && !showSetup && currentQuestion && !isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              {/* Sleek Header HUD */}
              <div className="flex items-center justify-between gap-6 px-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d9c18a]/70">
                    Resume Quiz
                  </span>
                  <span className="text-sm font-cinzel font-bold text-white tracking-wide">
                    Question {currentIndex + 1} <span className="text-white/40">/ {questions.length}</span>
                  </span>
                </div>

                {/* Segmented Progress bar */}
                <div className="flex-1 flex gap-1.5 h-1.5 rounded-full overflow-hidden">
                  {questions.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-1 h-full rounded-full transition-all duration-500 ${
                        idx < currentIndex ? "bg-[#d9c18a]" : 
                        idx === currentIndex ? "bg-[#d9c18a] shadow-[0_0_10px_rgba(217,193,138,0.8)]" : 
                        "bg-white/10"
                      }`} 
                    />
                  ))}
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400/70">
                    Score
                  </span>
                  <span className="text-sm font-cinzel font-bold text-emerald-400 tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {score}/{questions.length}
                  </span>
                </div>
              </div>

              {/* Main Premium Question Card */}
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 sm:p-10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
                
                {/* Subtle top glare */}
                <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <motion.h3 
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-cinzel text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/70 mb-10 text-center"
                >
                  {currentQuestion.question}
                </motion.h3>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="wait">
                    {(Array.isArray(currentQuestion.options) ? currentQuestion.options : []).map((opt, i) => (
                      <motion.div
                        key={`${currentQuestion.id}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                      >
                        <OptionButton
                          letter={i}
                          text={opt}
                          isSelected={selected === ANSWER_LETTERS[i]}
                          isPending={selected === ANSWER_LETTERS[i] && locked && feedback === null}
                          isCorrect={selected === ANSWER_LETTERS[i] ? questionState.isCorrect : null}
                          isActuallyCorrect={questionState.correctAnswer === ANSWER_LETTERS[i]}
                          isDisabled={locked}
                          onClick={() => handleOptionSelect(i)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Feedback & Reasoning Panel */}
                <AnimatePresence>
                  {questionState.isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-8 overflow-hidden"
                    >
                      <div className={`p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden ${
                        questionState.isCorrect 
                          ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]" 
                          : "bg-red-500/10 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
                      }`}>
                        
                        <div className="flex items-start gap-4">
                          <div className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-full border ${
                            questionState.isCorrect ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-red-500/20 border-red-500/50 text-red-400"
                          }`}>
                            {questionState.isCorrect ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className={`text-lg font-cinzel font-bold mb-2 ${questionState.isCorrect ? "text-emerald-300" : "text-red-300"}`}>
                              {questionState.isCorrect ? "Masterful Answer" : "Not Quite Right"}
                            </h4>
                            {questionState.explanation && (
                              <p className="text-sm text-white/80 leading-relaxed font-sans">
                                {questionState.explanation}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Next Question CTA */}
                        <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                          <button
                            type="button"
                            onClick={handleNextQuestion}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d9c18a] to-[#c7ad6e] px-8 py-3 text-sm font-bold text-[#071b15] shadow-[0_0_20px_rgba(217,193,138,0.3)] hover:shadow-[0_0_30px_rgba(217,193,138,0.5)] transition-all hover:scale-105 active:scale-95"
                          >
                            <span>{currentIndex + 1 >= questions.length ? "View Assessment" : "Continue Journey"}</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── 3. FINAL SUMMARY CARD ── */}
          {!loading && isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="rounded-[2.5rem] border border-[#d9c18a]/30 bg-white/[0.03] p-12 text-center backdrop-blur-2xl shadow-[0_0_60px_rgba(217,193,138,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d9c18a] to-transparent opacity-50" />
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#d9c18a]/20 to-[#c7ad6e]/10 border border-[#d9c18a]/40 text-[#d9c18a] mb-8 shadow-[0_0_40px_rgba(217,193,138,0.2)]"
              >
                <Medal className="h-12 w-12" />
              </motion.div>
              
              <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 mb-4">
                Quiz Complete
              </h2>
              <p className="mb-8 text-base font-cinzel text-[#d9c18a]">
                {localTopic || "Maharashtra Heritage"}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#d9c18a]/80">Score</span>
                  <div className="mt-2 text-4xl font-bold font-cinzel text-[#d9c18a]">
                    {score} <span className="text-xl text-white/40">/ {questions.length}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#d9c18a]/80">Accuracy</span>
                  <div className="mt-2 text-4xl font-bold font-cinzel text-[#d9c18a]">
                    {questions.length ? Math.round((score / questions.length) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (onAttemptSimilar) {
                      onAttemptSimilar({
                        topic: localTopic,
                        difficulty: localDifficulty,
                        questionCount: localQuestionCount,
                        questionType: localQuestionType,
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d9c18a]/20 border border-[#d9c18a]/30 px-8 py-3.5 text-sm font-bold text-[#d9c18a] hover:bg-[#d9c18a]/30 transition-all active:scale-95 shadow-[0_0_20px_rgba(217,193,138,0.15)]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Attempt Similar Quiz</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ── 4. EMPTY/ERROR STATE ── */}
          {!loading && !showSetup && questions.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-red-500/30 bg-red-500/5 p-10 text-center backdrop-blur-xl shadow-2xl"
            >
              <h2 className="font-cinzel text-2xl font-bold text-red-200 mb-3">
                {quizError ? "Assessment Unavailable" : "No Content Found"}
              </h2>
              <p className="text-sm text-red-200/70 mb-8 max-w-md mx-auto">
                {quizError || "We couldn't generate an assessment matching your current configuration."}
              </p>
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-8 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Return to Setup</span>
              </button>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
