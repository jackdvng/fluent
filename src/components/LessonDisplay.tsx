"use client";

import { useState } from "react";

import GrammarSection from "@/components/lesson/GrammarSection";
import IdiomsSection from "@/components/lesson/IdiomsSection";
import QuizSection from "@/components/lesson/QuizSection";
import VocabularyCards from "@/components/lesson/VocabularyCards";
import type { Lesson } from "@/types/lesson";

type LessonTab = "vocabulary" | "idioms" | "grammar" | "quiz";

const TABS: { id: LessonTab; label: string; emoji: string }[] = [
  { id: "vocabulary", label: "Từ vựng", emoji: "📚" },
  { id: "idioms", label: "Thành ngữ & Tiếng lóng", emoji: "💬" },
  { id: "grammar", label: "Ngữ pháp", emoji: "✏️" },
  { id: "quiz", label: "Kiểm tra", emoji: "🎯" },
];

interface LessonDisplayProps {
  lesson: Lesson;
  videoId: string;
}

export default function LessonDisplay({ lesson, videoId }: LessonDisplayProps) {
  const [activeTab, setActiveTab] = useState<LessonTab>("vocabulary");

  return (
    <div>
      <header className="mb-8 space-y-4 text-center sm:text-left">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">
          Bài học của bạn đã sẵn sàng!
        </p>
        <h2 className="text-3xl font-extrabold leading-tight text-heading">
          {lesson.title}
        </h2>
        <p className="max-w-2xl text-base leading-7 text-body">{lesson.summary}</p>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-highlight px-4 py-2 text-sm font-bold text-primary transition ease-smooth hover:bg-tab-inactive"
        >
          ▶ Xem video gốc
        </a>
      </header>

      <nav
        aria-label="Các phần bài học"
        className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-full border-2 px-5 py-3 text-sm font-extrabold transition ease-smooth ${
                isActive
                  ? "border-primary bg-primary text-white shadow-[0_3px_0_#CA2851]"
                  : "border-border bg-tab-inactive text-body hover:border-primary hover:text-primary"
              }`}
            >
              <span className="mr-2">{tab.emoji}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === "vocabulary" ? (
          <VocabularyCards items={lesson.vocabulary} />
        ) : null}

        {activeTab === "idioms" ? (
          <IdiomsSection items={lesson.idiomsAndSlang} />
        ) : null}

        {activeTab === "grammar" ? (
          <GrammarSection items={lesson.exampleSentences} />
        ) : null}

        {activeTab === "quiz" ? <QuizSection questions={lesson.quiz} /> : null}
      </div>
    </div>
  );
}
