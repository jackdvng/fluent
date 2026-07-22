"use client";

import type { GenerateLessonResponse } from "@/types/lesson";

/**
 * Saved-lessons storage layer (localStorage-backed).
 *
 * All access to `window.localStorage` lives here so the UI never touches
 * storage directly — this module can later be swapped for a database/API
 * implementation without changing any components.
 *
 * IMPORTANT: every function must be called from the browser only (inside a
 * useEffect or an event handler). They guard against SSR but return empty/no-op
 * values on the server.
 */

const INDEX_KEY = "fluent-saved-lessons";
const lessonKey = (videoId: string) => `fluent-lesson-${videoId}`;

/**
 * Bump this whenever the lesson schema changes. Saved lessons (and index
 * entries) tagged with a different version are treated as stale: they are
 * discarded and cleaned up on read rather than rendered against the new UI.
 *
 * NOTE: this is also intended to support a future paid tier — e.g. lessons
 * generated with/without the vocabulary "depth" fields could be distinguished
 * or migrated via this version. No paywall/gating logic exists yet.
 */
export const SAVED_LESSON_SCHEMA_VERSION = 2;

export interface SavedLessonMeta {
  videoId: string;
  title: string;
  vocabCount: number;
  savedAt: number; // epoch ms
  version: number; // schema version this entry was saved under
}

/** Envelope actually persisted per lesson key (adds the schema version). */
interface StoredLesson {
  version: number;
  savedAt: number;
  response: GenerateLessonResponse;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/**
 * Read the saved-lessons index. The index is the single source of truth for
 * the list UI, so we never load full lesson payloads to render the list.
 * Corrupted JSON is discarded rather than throwing.
 */
export function getSavedIndex(): SavedLessonMeta[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Keep only well-formed entries so one bad record can't break the list.
    const wellFormed = parsed.filter(
      (entry): entry is SavedLessonMeta =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as SavedLessonMeta).videoId === "string" &&
        typeof (entry as SavedLessonMeta).title === "string" &&
        typeof (entry as SavedLessonMeta).vocabCount === "number" &&
        typeof (entry as SavedLessonMeta).savedAt === "number",
    );

    // Discard entries saved under a different schema version.
    const current = wellFormed.filter(
      (entry) => entry.version === SAVED_LESSON_SCHEMA_VERSION,
    );

    // If anything was dropped (stale version or malformed), clean up storage:
    // remove orphaned lesson keys and rewrite the index.
    if (current.length !== parsed.length) {
      const keepIds = new Set(current.map((entry) => entry.videoId));
      const staleIds = parsed
        .filter(
          (entry): entry is { videoId: string } =>
            !!entry &&
            typeof entry === "object" &&
            typeof (entry as { videoId?: unknown }).videoId === "string",
        )
        .map((entry) => entry.videoId)
        .filter((videoId) => !keepIds.has(videoId));

      for (const videoId of staleIds) {
        try {
          window.localStorage.removeItem(lessonKey(videoId));
        } catch {
          // Ignore removal failures.
        }
      }

      try {
        writeIndex(current);
      } catch {
        // Ignore write failures; we still return the valid subset.
      }
    }

    return current;
  } catch {
    return [];
  }
}

function writeIndex(index: SavedLessonMeta[]): void {
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

/**
 * Load a single full lesson by videoId. Returns null when missing or corrupt.
 */
export function getSavedLesson(videoId: string): GenerateLessonResponse | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(lessonKey(videoId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredLesson>;

    // Discard anything not saved under the current schema version (this also
    // rejects the old un-versioned shape) and clean it up.
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== SAVED_LESSON_SCHEMA_VERSION ||
      !parsed.response?.lesson
    ) {
      try {
        window.localStorage.removeItem(lessonKey(videoId));
      } catch {
        // Ignore removal failures.
      }
      return null;
    }

    return parsed.response;
  } catch {
    return null;
  }
}

/**
 * True when a lesson for this videoId is already stored.
 */
export function hasSavedLesson(videoId: string): boolean {
  if (!isBrowser()) {
    return false;
  }
  return window.localStorage.getItem(lessonKey(videoId)) !== null;
}

/**
 * Attempt a set + retry, evicting the oldest saved lessons when storage is
 * full (QuotaExceededError). Returns true on success.
 */
function trySetWithEviction(
  key: string,
  value: string,
  index: SavedLessonMeta[],
): { ok: boolean; index: SavedLessonMeta[] } {
  let workingIndex = index;

  // Oldest-first candidates for eviction (index is newest-first).
  const evictionOrder = [...workingIndex].sort((a, b) => a.savedAt - b.savedAt);

  for (let attempt = 0; attempt <= evictionOrder.length; attempt += 1) {
    try {
      window.localStorage.setItem(key, value);
      return { ok: true, index: workingIndex };
    } catch (error) {
      const isQuota =
        error instanceof DOMException &&
        (error.name === "QuotaExceededError" ||
          error.name === "NS_ERROR_DOM_QUOTA_REACHED");

      if (!isQuota || attempt >= evictionOrder.length) {
        return { ok: false, index: workingIndex };
      }

      // Evict the oldest lesson that isn't the one we're trying to write.
      const victim = evictionOrder[attempt];
      if (victim && lessonKey(victim.videoId) !== key) {
        try {
          window.localStorage.removeItem(lessonKey(victim.videoId));
        } catch {
          // Ignore removal failures and keep trying.
        }
        workingIndex = workingIndex.filter(
          (item) => item.videoId !== victim.videoId,
        );
      }
    }
  }

  return { ok: false, index: workingIndex };
}

/**
 * Save a full lesson and upsert its index entry (newest-first, deduped by
 * videoId). Returns the updated index for the UI to render.
 */
export function saveLesson(response: GenerateLessonResponse): SavedLessonMeta[] {
  if (!isBrowser()) {
    return [];
  }

  const { videoId, lesson } = response;
  const savedAt = Date.now();

  const meta: SavedLessonMeta = {
    videoId,
    title: lesson.title,
    vocabCount: Array.isArray(lesson.vocabulary) ? lesson.vocabulary.length : 0,
    savedAt,
    version: SAVED_LESSON_SCHEMA_VERSION,
  };

  const stored: StoredLesson = {
    version: SAVED_LESSON_SCHEMA_VERSION,
    savedAt,
    response,
  };

  // Upsert into index: remove any existing entry, then put newest first.
  let index = getSavedIndex().filter((entry) => entry.videoId !== videoId);
  index = [meta, ...index];

  // Write the full lesson first (with quota eviction), then the index.
  const lessonWrite = trySetWithEviction(
    lessonKey(videoId),
    JSON.stringify(stored),
    index,
  );

  if (!lessonWrite.ok) {
    // Couldn't store the lesson even after eviction; leave storage as-is.
    return getSavedIndex();
  }

  // Eviction may have dropped some entries from the index; keep our new entry.
  index = lessonWrite.index.some((entry) => entry.videoId === videoId)
    ? lessonWrite.index
    : [meta, ...lessonWrite.index];

  const indexWrite = trySetWithEviction(INDEX_KEY, JSON.stringify(index), index);

  return indexWrite.ok ? index : getSavedIndex();
}

/**
 * Delete a saved lesson: both its lesson key and its index entry.
 * Returns the updated index.
 */
export function deleteSavedLesson(videoId: string): SavedLessonMeta[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    window.localStorage.removeItem(lessonKey(videoId));
  } catch {
    // Ignore removal failures.
  }

  const index = getSavedIndex().filter((entry) => entry.videoId !== videoId);

  try {
    writeIndex(index);
  } catch {
    // If we can't persist the index, return what's actually stored.
    return getSavedIndex();
  }

  return index;
}
