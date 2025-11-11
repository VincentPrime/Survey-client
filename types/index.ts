// types/index.ts

export type UserRole = 'student' | 'teacher';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  section?: string;
  course?: string;
  year_level?: number;
}

export type SurveyStatus = 'draft' | 'active' | 'closed';

export interface Survey {
  id: number;
  title: string;
  description: string;
  status: SurveyStatus;
  due_date?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name: string;
  target_sections: string[];
  target_courses: string[];
  target_years: number[];
  questions?: Question[];
}

export interface SurveyList {
  id: number;
  title: string;
  description: string;
  status: SurveyStatus;
  due_date?: string;
  created_at: string;
  created_by_name: string;
  question_count: number;
  response_count: number;
}

export type QuestionType = 'mcq' | 'likert' | 'short_answer' | 'long_answer';

export interface Question {
  id: number;
  survey: number;
  question_text: string;
  question_type: QuestionType;
  order: number;
  is_required: boolean;
  options: string[];
  likert_min?: number;
  likert_max?: number;
  likert_min_label?: string;
  likert_max_label?: string;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id?: number;
  question: number;
  question_text?: string;
  question_type?: QuestionType;
  answer_text?: string;
  answer_choice?: string;
  answer_number?: number;
}

export interface Response {
  id: number;
  survey: number;
  survey_title: string;
  student: number;
  student_name: string;
  submitted_at: string;
  answers: Answer[];
}

export interface ResponseCreate {
  survey: number;
  answers: {
    question_id: number;
    answer_text?: string;
    answer_choice?: string;
    answer_number?: number;
  }[];
}

export interface AnalyticsData {
  question_id: number;
  question_text: string;
  question_type: QuestionType;
  total_responses: number;
  data: {
    // For MCQ
    [key: string]: number;
  } | {
    // For Likert
    distribution: { [key: string]: number };
    average: number;
  } | {
    // For text answers
    responses: string[];
    word_frequency: { [key: string]: number };
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  section?: string;
  course?: string;
  year_level?: number;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}