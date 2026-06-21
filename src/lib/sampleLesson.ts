import type { GenerateLessonResponse } from "@/types/lesson";

// Dummy data for dev mode (?dev=true). Mirrors the exact JSON shape the
// Claude API returns so the UI can be tested without spending API credits.
export const SAMPLE_LESSON: GenerateLessonResponse = {
  videoId: "dQw4w9WgXcQ",
  lesson: {
    title: "Bài học mẫu: Giao tiếp hằng ngày",
    summary:
      "Bài học này giúp bạn học các từ vựng và cụm từ thông dụng trong giao tiếp tiếng Anh hằng ngày. Bạn sẽ làm quen với cách diễn đạt tự nhiên, một vài thành ngữ phổ biến, và luyện tập qua các câu ví dụ cùng bài kiểm tra ngắn. Đây là nội dung mẫu dùng để kiểm tra giao diện mà không cần gọi API.",
    vocabulary: [
      {
        word: "reliable",
        definition: "Able to be trusted to do something well.",
        vietnamese: "đáng tin cậy",
        context: "She is a reliable friend who always keeps her promises.",
      },
      {
        word: "overwhelmed",
        definition: "Feeling that you have too much to deal with.",
        vietnamese: "choáng ngợp, quá tải",
        context: "I felt overwhelmed by all the new information.",
      },
      {
        word: "approach",
        definition: "A way of dealing with a situation or problem.",
        vietnamese: "cách tiếp cận, phương pháp",
        context: "We need a different approach to solve this.",
      },
      {
        word: "genuine",
        definition: "Real and exactly what it appears to be; sincere.",
        vietnamese: "chân thật, thật lòng",
        context: "He showed genuine interest in the project.",
      },
      {
        word: "efficient",
        definition: "Working in a well-organized way without wasting time.",
        vietnamese: "hiệu quả",
        context: "This is a more efficient way to get things done.",
      },
      {
        word: "curious",
        definition: "Eager to know or learn something.",
        vietnamese: "tò mò, ham học hỏi",
        context: "She was curious about how the machine worked.",
      },
      {
        word: "encourage",
        definition: "To give someone support or confidence to do something.",
        vietnamese: "khuyến khích, động viên",
        context: "My teacher encouraged me to try again.",
      },
    ],
    idiomsAndSlang: [
      {
        phrase: "break the ice",
        meaning: "To make people feel more comfortable in a social situation.",
        vietnamese: "phá vỡ sự ngại ngùng ban đầu",
        note: "Thường dùng khi gặp gỡ người mới.",
      },
      {
        phrase: "piece of cake",
        meaning: "Something very easy to do.",
        vietnamese: "dễ như ăn bánh, rất dễ",
        note: "Dùng để nói một việc gì đó rất đơn giản.",
      },
      {
        phrase: "hang in there",
        meaning: "To stay determined during a difficult situation.",
        vietnamese: "cố gắng lên, đừng bỏ cuộc",
      },
      {
        phrase: "on the same page",
        meaning: "To agree about or understand something the same way.",
        vietnamese: "cùng chung quan điểm, hiểu ý nhau",
        note: "Hay dùng trong công việc nhóm.",
      },
    ],
    exampleSentences: [
      {
        sentence: "Let's break the ice with a quick introduction.",
        keyPhrase: "break the ice",
        vietnamese: "Hãy phá vỡ sự ngại ngùng bằng một lời giới thiệu ngắn.",
      },
      {
        sentence: "Don't worry, the test was a piece of cake.",
        keyPhrase: "piece of cake",
        vietnamese: "Đừng lo, bài kiểm tra dễ như ăn bánh.",
      },
      {
        sentence: "We finally got on the same page about the plan.",
        keyPhrase: "on the same page",
        vietnamese: "Cuối cùng chúng tôi đã hiểu ý nhau về kế hoạch.",
      },
    ],
    quiz: [
      {
        question: "Từ 'reliable' có nghĩa là gì?",
        options: ["đáng tin cậy", "lười biếng", "đắt đỏ", "ồn ào"],
        correctAnswer: 0,
        explanation: "'Reliable' nghĩa là đáng tin cậy, có thể trông cậy được.",
      },
      {
        question: "Thành ngữ 'piece of cake' mang ý nghĩa nào?",
        options: [
          "một miếng bánh thật",
          "rất khó khăn",
          "rất dễ dàng",
          "rất đắt tiền",
        ],
        correctAnswer: 2,
        explanation: "'Piece of cake' nghĩa là việc gì đó rất dễ dàng.",
      },
      {
        question: "Chọn câu dùng đúng từ 'overwhelmed':",
        options: [
          "I felt overwhelmed by the workload.",
          "The cake tastes overwhelmed.",
          "She overwhelmed to school.",
          "He is a overwhelmed car.",
        ],
        correctAnswer: 0,
        explanation:
          "'Overwhelmed' là tính từ chỉ cảm giác quá tải: 'I felt overwhelmed by the workload.'",
      },
      {
        question: "'Hang in there' được dùng khi nào?",
        options: [
          "Khi muốn khen ai đó giàu có",
          "Khi động viên ai đó vượt qua khó khăn",
          "Khi từ chối lời mời",
          "Khi hỏi đường",
        ],
        correctAnswer: 1,
        explanation:
          "'Hang in there' dùng để động viên ai đó cố gắng trong lúc khó khăn.",
      },
      {
        question: "Từ nào có nghĩa là 'khuyến khích, động viên'?",
        options: ["efficient", "curious", "encourage", "genuine"],
        correctAnswer: 2,
        explanation: "'Encourage' nghĩa là khuyến khích, động viên ai đó.",
      },
    ],
  },
};
