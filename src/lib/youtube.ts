import { YoutubeTranscript } from "youtube-transcript";

const VIDEO_ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /^([a-zA-Z0-9_-]{11})$/,
];

export function extractVideoId(url: string): string | null {
  const trimmed = url.trim();
  console.log("[youtube] Extracting video ID from URL:", trimmed);

  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      console.log("[youtube] Extracted video ID:", match[1]);
      return match[1];
    }
  }

  console.log("[youtube] Could not extract video ID from URL");
  return null;
}

export async function getTranscriptText(videoId: string): Promise<string> {
  console.log("[youtube] Fetching transcript for video ID:", videoId);

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    console.log("[youtube] Received", segments.length, "transcript segments");

    if (!segments.length) {
      console.log("[youtube] No transcript segments returned");
      throw new Error("Video này không có phụ đề tiếng Anh.");
    }

    const text = segments
      .map((segment) => segment.text.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");

    if (!text) {
      console.log("[youtube] Transcript segments were empty after joining");
      throw new Error("Phụ đề của video này trống.");
    }

    console.log(
      "[youtube] Transcript fetched successfully, length:",
      text.length,
      "chars",
    );

    return text;
  } catch (error) {
    console.error("[youtube] Transcript fetch failed:", error);
    if (error instanceof Error) {
      console.error("[youtube] Error message:", error.message);
      console.error("[youtube] Error stack:", error.stack);
    }
    throw error;
  }
}

const MAX_TRANSCRIPT_CHARS = 14_000;

export function truncateTranscript(text: string): string {
  if (text.length <= MAX_TRANSCRIPT_CHARS) {
    return text;
  }

  console.log(
    "[youtube] Truncating transcript from",
    text.length,
    "to",
    MAX_TRANSCRIPT_CHARS,
    "chars",
  );

  return `${text.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[Transcript truncated due to length.]`;
}
