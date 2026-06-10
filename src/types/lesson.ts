export interface VocabularyItem {
  word: string;
  definition: string;
  vietnamese: string;
  context?: string;
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
