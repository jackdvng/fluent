import { ProxyAgent, fetch as undiciFetch } from "undici";
import { YoutubeTranscript } from "youtube-transcript";

function createProxyFetch(proxyUrl: string): typeof fetch {
  const agent = new ProxyAgent(proxyUrl);

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await undiciFetch(input as string, {
      ...(init as Record<string, unknown>),
      dispatcher: agent,
    });

    return response as unknown as Response;
  }) as typeof fetch;
}

export async function fetchProxyTranscript(
  videoId: string,
  proxyUrl: string,
): Promise<string> {
  const proxyFetch = createProxyFetch(proxyUrl);
  const segments = await YoutubeTranscript.fetchTranscript(videoId, {
    lang: "en",
    fetch: proxyFetch,
  });

  if (!segments.length) {
    throw new Error("Video này không có phụ đề tiếng Anh.");
  }

  const text = segments
    .map((segment) => segment.text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");

  if (!text) {
    throw new Error("Phụ đề của video này trống.");
  }

  return text;
}
