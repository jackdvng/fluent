import Anthropic from "@anthropic-ai/sdk";

import type { Lesson } from "@/types/lesson";

const SYSTEM_PROMPT = `You are an expert English teacher creating lessons for Vietnamese speakers.

Given a YouTube video transcript, produce a structured English lesson as valid JSON only — no markdown, no code fences, no extra text.

The JSON must match this schema exactly:
{
  "title": "short lesson title in Vietnamese",
  "summary": "2-3 sentence overview entirely in Vietnamese describing what English skills and topics the learner will study",
  "vocabulary": [
    {
      "word": "English word or phrase from the transcript",
      "partOfSpeech": "English part of speech, e.g. noun, verb, adjective, phrasal verb",
      "definitionEn": "a clear, concise English definition of the word",
      "definitionVi": "clear explanation in Vietnamese of what the English word/phrase means",
      "vietnamese": "Vietnamese translation or equivalent",
      // --- DEPTH FIELDS (grouped so a future free-tier prompt variant can omit them) ---
      "meanings": [
        {
          "definition": "English definition for this specific sense of the word",
          "example": "English example sentence using the word in this sense",
          "vietnamese": "Vietnamese translation of the example sentence"
        }
      ],
      "collocations": ["common English collocation or phrase using the word", "another collocation"],
      "wordFamily": [
        { "word": "related English word form", "partOfSpeech": "English part of speech" }
      ]
      // --- END DEPTH FIELDS ---
    }
  ],
  "idiomsAndSlang": [
    {
      "phrase": "English idiom, slang, or colloquial expression",
      "meaning": "explanation in Vietnamese of what it means",
      "vietnamese": "Vietnamese equivalent or paraphrase",
      "note": "optional usage note in Vietnamese"
    }
  ],
  "exampleSentences": [
    {
      "sentence": "English example sentence using a key phrase",
      "keyPhrase": "the highlighted English phrase",
      "vietnamese": "Vietnamese translation of the sentence"
    }
  ],
  "quiz": [
    {
      "question": "quiz question in Vietnamese",
      "options": ["Vietnamese option A", "Vietnamese option B", "Vietnamese option C", "Vietnamese option D"],
      "correctAnswer": 0,
      "explanation": "explanation in Vietnamese"
    }
  ]
}

Language rules:
- title and summary MUST be entirely in Vietnamese
- vocabulary.word, partOfSpeech, definitionEn, meanings.definition, meanings.example, collocations, and wordFamily MUST be in English (the content being taught)
- idiomsAndSlang.phrase and exampleSentences.sentence MUST be in English (the content being taught)
- definitionVi, vietnamese, meanings.vietnamese, idiom meanings, notes, quiz questions, and explanations MUST be in Vietnamese

Requirements:
- Include 8-12 vocabulary items drawn from the transcript
- For each vocabulary item, partOfSpeech, definitionEn, definitionVi, and vietnamese are ALWAYS required
- Include 3-6 idioms or slang expressions (use [] if none appear)
- Include exactly 3 example sentences using key phrases from the lesson
- Include exactly 5 quiz questions with 4 options each
- correctAnswer must be the 0-based index of the correct option
- Use simple, learner-friendly Vietnamese for all Vietnamese text

Vocabulary DEPTH fields (meanings, collocations, wordFamily) — these are grouped together so they can be omitted in a future free-tier variant; for now ALWAYS include them:
- meanings: include one entry per common meaning of the word. If the word has multiple common meanings, include multiple entries; otherwise include exactly one. Each meaning needs an English definition, an English example sentence, and a Vietnamese translation of that example.
- collocations: 2-4 common English collocations or set phrases that use the word (English only)
- wordFamily: related English word forms with their part of speech (e.g. "develop" -> "development" (noun), "developer" (noun), "developing" (adjective)). Use [] only if there are no natural related forms.

CRITICAL — Quiz rules:
- NEVER ask about the video's story, plot, events, people, places, times, or factual details (e.g. "mấy giờ họ thức dậy?", "họ đi đâu?", "chuyện gì xảy ra tiếp theo?")
- ALL quiz questions MUST test English language knowledge only: vocabulary meanings, grammar usage, idiom/slang meanings, choosing the correct word/phrase, fill-in-the-blank, or identifying correct usage
- Every question must test whether the learner understands an English word, phrase, or grammar pattern from THIS lesson
- Quiz question text must be in Vietnamese; quiz answer options must ALL be in Vietnamese (they are translations/explanations of the English word being tested)
- Good example: "Từ 'break the ice' có nghĩa là gì?" with English idiom options
- Bad example: "Trong video, họ đi đâu sau bữa sáng?"`;

function stripJsonFences(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  return trimmed;
}

function parseLesson(raw: string): Lesson {
  const parsed = JSON.parse(stripJsonFences(raw)) as Lesson;

  if (!parsed.title || !parsed.vocabulary?.length || parsed.quiz?.length !== 5) {
    throw new Error("Claude trả về cấu trúc bài học không đầy đủ.");
  }

  if (parsed.exampleSentences?.length !== 3) {
    throw new Error("Claude trả về số câu ví dụ không hợp lệ.");
  }

  return parsed;
}

export async function generateLesson(transcript: string): Promise<Lesson> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Chưa cấu hình ANTHROPIC_API_KEY.");
  }

  const client = new Anthropic({ apiKey });

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

  const message = await client.messages.create({
    model,
    // Larger output budget for the richer vocabulary schema (meanings,
    // collocations, word family).
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Create an English lesson for Vietnamese speakers from this YouTube transcript:\n\n${transcript}`,
      },
    ],
  });

  console.log("[USAGE]", JSON.stringify(message.usage));

  const textBlock = message.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude không trả về nội dung văn bản.");
  }

  return parseLesson(textBlock.text);
}
