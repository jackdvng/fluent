interface SupadataTranscriptResponse {
  content?: string;
  jobId?: string;
  status?: string;
  error?: string;
}

const SUPADATA_BASE = "https://api.supadata.ai/v1";

async function pollSupadataJob(jobId: string, apiKey: string): Promise<string> {
  const maxAttempts = 20;
  const delayMs = 1500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log("[youtube/supadata] Polling job", jobId, `attempt ${attempt}`);

    const response = await fetch(`${SUPADATA_BASE}/transcript/${jobId}`, {
      headers: { "x-api-key": apiKey },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supadata job poll failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as SupadataTranscriptResponse;

    if (data.status === "failed") {
      throw new Error(data.error ?? "Supadata không thể lấy phụ đề.");
    }

    if (typeof data.content === "string" && data.content.trim()) {
      return data.content.trim();
    }

    if (data.status === "completed" && data.content) {
      return data.content.trim();
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("Supadata hết thời gian chờ khi lấy phụ đề.");
}

export async function fetchSupadataTranscript(
  videoId: string,
  apiKey: string,
): Promise<string> {
  const params = new URLSearchParams({
    videoId,
    lang: "en",
    text: "true",
    mode: "native",
  });

  const response = await fetch(
    `${SUPADATA_BASE}/youtube/transcript?${params.toString()}`,
    {
      headers: { "x-api-key": apiKey },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supadata error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as SupadataTranscriptResponse;

  if (data.jobId) {
    return pollSupadataJob(data.jobId, apiKey);
  }

  if (typeof data.content === "string" && data.content.trim()) {
    return data.content.trim();
  }

  throw new Error("Supadata trả về phụ đề trống.");
}
