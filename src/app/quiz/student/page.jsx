"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loading from "../../loading";

export default function StudentQuizPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ai?mode=quiz&newQuiz=1");
  }, [router]);

  return <Loading to="AI Quiz" />;
}
