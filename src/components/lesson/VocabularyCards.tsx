"use client";

import { useCallback, useRef, useState } from "react";

import SpeakButton from "@/components/SpeakButton";
import type { VocabularyItem } from "@/types/lesson";

const STAGGER_MS = 150;

interface VocabularyCardsProps {
  items: VocabularyItem[];
  onReview?: (word: string) => void;
}

export default function VocabularyCards({
  items,
  onReview,
}: VocabularyCardsProps) {
  const [flippedWord, setFlippedWord] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCardClick = useCallback(
    (word: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (flippedWord === word) {
        setFlippedWord(null);
        return;
      }

      onReview?.(word);

      if (flippedWord !== null) {
        setFlippedWord(null);
        timeoutRef.current = setTimeout(() => {
          setFlippedWord(word);
          timeoutRef.current = null;
        }, STAGGER_MS);
        return;
      }

      setFlippedWord(word);
    },
    [flippedWord, onReview],
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => {
        const isFlipped = flippedWord === item.word;

        return (
          <div
            key={item.word}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(item.word)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleCardClick(item.word);
              }
            }}
            className="flip-scene w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-pressed={isFlipped}
          >
            <div className={`flip-inner ${isFlipped ? "is-flipped" : ""}`}>
              <div className="flip-face flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
                <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-primary">
                  Chạm để xem
                </span>
                <div className="mt-2 flex w-full items-center justify-center gap-2">
                  <p className="line-clamp-3 break-words text-center text-xl font-bold leading-snug text-heading sm:text-2xl">
                    {item.word}
                  </p>
                  <SpeakButton text={item.word} />
                </div>
              </div>

              <div className="flip-face flip-back flex flex-col rounded-2xl border-2 border-border bg-highlight p-6 shadow-sm">
                <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto">
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="break-words text-base font-bold leading-snug text-heading">
                      {item.word}
                    </p>
                    <SpeakButton text={item.word} />
                  </div>
                  <p className="mt-2 shrink-0 break-words text-sm leading-5 text-body">
                    {item.definition}
                  </p>
                  <p className="mt-2 shrink-0 break-words text-sm font-bold leading-5 text-translation">
                    {item.vietnamese}
                  </p>
                  {item.context ? (
                    <p className="mt-3 shrink-0 break-words rounded-xl bg-card p-3 text-xs italic leading-5 text-heading">
                      “{item.context}”
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
