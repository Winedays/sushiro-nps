import raw from "./questions.json";

export type SurveyOption = { option_no: string; content: string };
export type SurveyQuestion = {
  question_id: number;
  question_no: number;
  content: string;
  form_type: number; // 1 = radio, 3 = textarea
  form_type_desc: string;
  is_required: boolean;
  options: SurveyOption[];
};
export type SurveyPage = {
  page_id: number;
  page_name: string;
  display_title: string | null;
  questions: SurveyQuestion[];
};

export const SURVEY_PAGES = raw as unknown as SurveyPage[];

export const ALL_QUESTIONS: SurveyQuestion[] = SURVEY_PAGES.flatMap((p) => p.questions);
