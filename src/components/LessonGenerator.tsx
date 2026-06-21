"use client";

import { useState } from "react";

import LessonDisplay from "@/components/LessonDisplay";
import { DAILY_LIMIT, useDailyLimit } from "@/lib/useDailyLimit";
import type { GenerateLessonResponse } from "@/types/lesson";

export default function LessonGenerator() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateLessonResponse | null>(null);

  const { remaining, limitReached, hydrated, increment } = useDailyLimit();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (limitReached) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = (await response.json()) as GenerateLessonResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tạo bài học.");
      }

      setResult(data);
      increment();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể tạo bài học.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-10 px-5 py-12 sm:px-6">
      <header className="relative space-y-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Fluent"
          className="mx-auto mb-2 h-16 w-auto"
          style={{ filter: "drop-shadow(0 0 20px rgba(255, 103, 102, 0.3))" }}
        />
        <h1 className="text-4xl font-extrabold tracking-tight text-heading">
          Fluent
        </h1>
        <p className="mx-auto max-w-xl text-base leading-7 text-body">
          Biến mọi video YouTube thành bài học tiếng Anh
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <label
          htmlFor="youtube-url"
          className="block text-sm font-extrabold uppercase tracking-wide text-body"
        >
          Liên kết YouTube
        </label>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            id="youtube-url"
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Dán link YouTube vào đây..."
            disabled={limitReached}
            className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-background px-4 py-4 text-base font-semibold text-heading outline-none placeholder:text-muted transition ease-smooth focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !url.trim() || limitReached}
            className="rounded-2xl bg-primary px-10 py-5 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_#CA2851] transition ease-smooth hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:translate-y-0.5 active:shadow-[0_2px_0_#CA2851]"
          >
            {loading ? "Đang tạo bài học..." : "Bắt đầu"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-body sm:text-left">
          Hoạt động tốt nhất với video có phụ đề tiếng Anh.
        </p>
        {hydrated ? (
          <p className="mt-2 text-center text-xs font-bold text-primary sm:text-left">
            Còn lại: {remaining}/{DAILY_LIMIT} lượt hôm nay
          </p>
        ) : null}
      </form>

      {limitReached ? (
        <div
          role="alert"
          className="rounded-2xl border-2 border-border bg-highlight px-5 py-4 text-center text-base font-bold text-heading"
        >
          Bạn đã dùng hết 3 lượt hôm nay. Quay lại ngày mai nhé! 🌟
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border-2 border-wrong bg-wrong-light px-5 py-4 text-sm font-bold text-wrong"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-highlight px-6 py-20 text-center">
          <p className="text-4xl">⏳</p>
          <p className="mt-4 text-lg font-extrabold text-heading">
            Đang tạo bài học...
          </p>
          <p className="mt-2 text-sm text-body">
            Thường mất khoảng 20–40 giây.
          </p>
        </div>
      ) : null}

      {result ? (
        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm sm:p-8">
          <LessonDisplay lesson={result.lesson} videoId={result.videoId} />
        </div>
      ) : null}
    </div>
  );
}
