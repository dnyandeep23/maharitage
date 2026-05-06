"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loading from "../../loading";
import { useAudience } from "../../../contexts/AudienceContext";

export default function GeneralQuizPage() {
  const router = useRouter();
  const { audience, isReady, selectAudience } = useAudience();

  useEffect(() => {
    if (!isReady) return;

    if (!audience) {
      selectAudience("general");
      router.replace("/ai?mode=quiz&newQuiz=1");
      return;
    }

    if (audience !== "general") {
      router.replace("/quiz/student");
      return;
    }

    router.replace("/ai?mode=quiz&newQuiz=1");
  }, [audience, isReady, router, selectAudience]);

  return <Loading to="General Quiz" />;
}
