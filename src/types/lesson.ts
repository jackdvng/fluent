/**
 * One sense of a word: an English definition plus an English example and its
 * Vietnamese translation.
 *
 * NOTE: `meanings` is part of the "depth" content (see VocabularyItem) intended
 * to become a paid-tier feature.
 */
export interface VocabularyMeaning {
  definition: string; // English
  example: string; // English example sentence
  vietnamese: string; // Vietnamese translation of the example
}

/** A related word form, e.g. "develop" -> { word: "developer", partOfSpeech: "noun" }. */
export interface WordFamilyEntry {
  word: string; // English
  partOfSpeech: string; // English
}

export interface VocabularyItem {
  word: string; // English
  partOfSpeech: string; // English, e.g. "noun", "phrasal verb"
  definitionEn: string; // English definition — available to ALL users
  definitionVi: string; // Vietnamese explanation (previously `definition`)
  vietnamese: string; // Vietnamese translation / equivalent

  // --- DEPTH FIELDS (intended to become paid-tier features) ---
  // These three are kept as a clearly separable group so a future free vs. paid
  // variant can omit or conditionally render them without restructuring the
  // schema or the card UI. `definitionEn` above is NOT a depth field.
  meanings: VocabularyMeaning[]; // multiple senses when applicable, else one
  collocations: string[]; // common English collocations/phrases
  wordFamily: WordFamilyEntry[]; // related word forms
  // --- END DEPTH FIELDS ---
}

export interface IdiomItem {
  phrase: string;
  meaning: string;
  vietnamese: string;
  note?: string;
}

export interface ExampleSentence {
  sentence: string;
  keyPhrase: string;
  vietnamese: string;
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface Lesson {
  title: string;
  summary: string;
  vocabulary: VocabularyItem[];
  idiomsAndSlang: IdiomItem[];
  exampleSentences: ExampleSentence[];
  quiz: QuizQuestion[];
}

export interface GenerateLessonResponse {
  lesson: Lesson;
  videoId: string;
}
