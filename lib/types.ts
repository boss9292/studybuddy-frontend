export type Card = { type?: string; front: string; back: string; source?: string | null };
export type UploadAPIResponse = { id: string; title: string; summary: string; cards_json: string };
export type MCQ = { question: string; choices: string[]; answer_index: number; explanation: string; source?: string | null };
export type QuizAPIResponse = { id: string; title: string; num_questions: number; quiz_json: string };
