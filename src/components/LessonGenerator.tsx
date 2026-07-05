"use client";

import { useEffect, useState } from "react";

import LessonDisplay from "@/components/LessonDisplay";
import { SAMPLE_LESSON } from "@/lib/sampleLesson";
import { DAILY_LIMIT, useDailyLimit } from "@/lib/useDailyLimit";
import { useLicense } from "@/lib/useLicense";
import type { GenerateLessonResponse } from "@/types/lesson";

// Replace with your Lemon Squeezy checkout URL (or set the env var).
const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ??
  "https://your-store.lemonsqueezy.com/buy/your-product-id";

type LicenseStatus = "idle" | "validating" | "error";

export default function LessonGenerator() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateLessonResponse | null>(null);
  const [devMode, setDevMode] = useState(false);

  const [showLicenseInput, setShowLicenseInput] = useState(false);
  const [licenseInput, setLicenseInput] = useState("");
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>("idle");
  const [licenseError, setLicenseError] = useState<string | null>(null);

  const { remaining, limitReached, hydrated, increment } = useDailyLimit();
  const {
    isPro,
    hydrated: licenseHydrated,
    activate,
  } = useLicense();

  const blockedByLimit = !devMode && !isPro && limitReached;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "true") {
      setDevMode(true);
      setResult(SAMPLE_LESSON);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Dev mode: skip the Claude API and load dummy data (no credits used).
    if (devMode) {
      setError(null);
      setResult(SAMPLE_LESSON);
      return;
    }

    if (blockedByLimit) {
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
      if (!isPro) {
        increment();
      }
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

  async function handleLicenseSubmit() {
    const key = licenseInput.trim();
    if (!key) {
      return;
    }

    setLicenseStatus("validating");
    setLicenseError(null);

    try {
      const response = await fetch("/api/validate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key }),
      });

      const data = (await response.json()) as {
        valid?: boolean;
        error?: string;
      };

      if (!response.ok || !data.valid) {
        throw new Error(data.error ?? "Mã không hợp lệ hoặc đã hết hạn.");
      }

      activate(key);
      setShowLicenseInput(false);
      setLicenseInput("");
      setLicenseStatus("idle");
    } catch (validateError) {
      setLicenseStatus("error");
      setLicenseError(
        validateError instanceof Error
          ? validateError.message
          : "Không thể xác thực mã.",
      );
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
        {devMode ? (
          <span className="mx-auto flex w-fit items-center gap-1 rounded-full border-2 border-primary bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
            🛠️ Dev mode — dữ liệu mẫu
          </span>
        ) : null}
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
            required={!devMode}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Dán link YouTube vào đây..."
            disabled={blockedByLimit}
            className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-background px-4 py-4 text-base font-semibold text-heading outline-none placeholder:text-muted transition ease-smooth focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || (!devMode && !url.trim()) || blockedByLimit}
            className="rounded-2xl bg-primary px-10 py-5 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_#CA2851] transition ease-smooth hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:translate-y-0.5 active:shadow-[0_2px_0_#CA2851]"
          >
            {loading ? "Đang tạo bài học..." : "Bắt đầu"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-body sm:text-left">
          Hoạt động tốt nhất với video có phụ đề tiếng Anh.
        </p>

        {hydrated && licenseHydrated ? (
          isPro ? (
            <p className="mt-2 flex items-center gap-1 text-center text-xs font-bold text-primary sm:text-left">
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-primary bg-highlight px-3 py-1">
                ☕ Pro — không giới hạn
              </span>
            </p>
          ) : (
            <p className="mt-2 text-center text-xs font-bold text-primary sm:text-left">
              Còn lại: {remaining}/{DAILY_LIMIT} lượt hôm nay
            </p>
          )
        ) : null}

        {!isPro ? (
          <div className="mt-4 border-t border-border pt-4">
            {showLicenseInput ? (
              <div className="space-y-2">
                <label
                  htmlFor="license-key"
                  className="block text-xs font-bold text-body"
                >
                  Nhập mã ủng hộ của bạn
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="license-key"
                    type="text"
                    value={licenseInput}
                    onChange={(event) => setLicenseInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleLicenseSubmit();
                      }
                    }}
                    placeholder="Dán mã license vào đây..."
                    className="min-w-0 flex-1 rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-semibold text-heading outline-none placeholder:text-muted transition ease-smooth focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => void handleLicenseSubmit()}
                    disabled={licenseStatus === "validating" || !licenseInput.trim()}
                    className="rounded-xl bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_#CA2851] transition ease-smooth hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    {licenseStatus === "validating" ? "Đang kiểm tra..." : "Kích hoạt"}
                  </button>
                </div>
                {licenseError ? (
                  <p className="text-xs font-bold text-wrong">{licenseError}</p>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <a
                  href={CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary underline-offset-2 transition ease-smooth hover:underline"
                >
                  ☕ Ủng hộ Fluent
                </a>
                <button
                  type="button"
                  onClick={() => setShowLicenseInput(true)}
                  className="text-xs font-bold text-primary underline-offset-2 transition ease-smooth hover:underline"
                >
                  Đã ủng hộ? Nhập mã tại đây
                </button>
              </div>
            )}
          </div>
        ) : null}
      </form>

      {blockedByLimit ? (
        <div className="rounded-2xl border-2 border-border bg-highlight px-6 py-6 text-center">
          <p className="text-base font-bold leading-7 text-heading">
            Fluent hoàn toàn miễn phí! Nếu bạn thấy hữu ích và muốn ủng hộ mình,
            bạn có thể mua cho mình một ly cà phê để mình tiếp tục phát triển
            Fluent ☕
          </p>
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_#CA2851] transition ease-smooth hover:bg-primary-hover active:translate-y-0.5 active:shadow-[0_2px_0_#CA2851]"
          >
            Ủng hộ Fluent — $3 ☕
          </a>
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
