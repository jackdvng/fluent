import { NextResponse } from "next/server";

import { generateLesson } from "@/lib/anthropic";
import { isProLicense } from "@/lib/license";
import { isMaintenanceMode } from "@/lib/maintenance";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import {
  extractVideoId,
  getTranscriptText,
  truncateTranscript,
} from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    if (isMaintenanceMode()) {
      console.log("[generate-lesson] Blocked — maintenance mode is on");
      return NextResponse.json(
        {
          error:
            "Fluent đang được nâng cấp. Vui lòng quay lại sau ít phút nhé! 🛠️",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      url?: string;
      licenseKey?: string;
    };
    const url = body.url?.trim();

    console.log("[generate-lesson] Request received, URL:", url ?? "(empty)");

    if (!url) {
      return NextResponse.json(
        { error: "Vui lòng nhập liên kết video YouTube." },
        { status: 400 },
      );
    }

    const videoId = extractVideoId(url);

    if (!videoId) {
      console.log("[generate-lesson] Invalid URL — no video ID extracted");
      return NextResponse.json(
        { error: "Liên kết YouTube không hợp lệ." },
        { status: 400 },
      );
    }

    console.log("[generate-lesson] Video ID:", videoId);

    // Rate limit by IP BEFORE any Supadata/Anthropic work so we block the
    // expensive calls, not just the response.
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(ip);

    if (!rateLimit.success) {
      console.log("[generate-lesson] Rate limit exceeded for IP:", ip);
      return NextResponse.json(
        {
          error:
            "Bạn đã tạo quá nhiều bài học trong một giờ qua (tối đa 5 bài/giờ). Vui lòng thử lại sau ít phút nhé! ⏳",
        },
        { status: 429 },
      );
    }

    const rawTranscript = await getTranscriptText(videoId);
    const transcript = truncateTranscript(rawTranscript);

    // Validate the license server-side so Pro-only vocabulary depth can't be
    // spoofed by the client. Free (no/invalid key) gets the lighter prompt.
    const includeDepth = await isProLicense(body.licenseKey);
    console.log(
      `[generate-lesson] Generating lesson with Claude (tier: ${
        includeDepth ? "pro" : "free"
      })...`,
    );
    const lesson = await generateLesson(transcript, { includeDepth });
    console.log("[generate-lesson] Lesson generated successfully");

    return NextResponse.json({ lesson, videoId });
  } catch (error) {
    console.error("[generate-lesson] Failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi tạo bài học.";

    const status = message.includes("ANTHROPIC_API_KEY") ? 500 : 422;

    return NextResponse.json({ error: message }, { status });
  }
}
