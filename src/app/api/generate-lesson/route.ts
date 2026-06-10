import { NextResponse } from "next/server";

import { generateLesson } from "@/lib/anthropic";
import {
  extractVideoId,
  getTranscriptText,
  truncateTranscript,
} from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
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

    const rawTranscript = await getTranscriptText(videoId);
    const transcript = truncateTranscript(rawTranscript);

    console.log("[generate-lesson] Generating lesson with Claude...");
    const lesson = await generateLesson(transcript);
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
