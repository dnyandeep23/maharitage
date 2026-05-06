"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loading from "../../loading";
import { useAudience } from "../../../contexts/AudienceContext";

export default function StudentQuizPage() {
  const router = useRouter();
  const { audience, isReady, selectAudience } = useAudience();

  useEffect(() => {
    if (!isReady) return;

    if (!audience) {
      selectAudience("student");
      router.replace("/ai?mode=quiz&newQuiz=1");
      return;
    }

    if (audience !== "student") {
      router.replace("/quiz/general");
      return;
    }

    router.replace("/ai?mode=quiz&newQuiz=1");
  }, [audience, isReady, router, selectAudience]);

  return <Loading to="Student Quiz" />;
}
