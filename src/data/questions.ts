import twRaw from "./questions.json";
import hkRaw from "./questions.hk.json";

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

export type Region = "TW" | "HK";

export const SURVEY_PAGES_BY_REGION: Record<Region, SurveyPage[]> = {
  TW: twRaw as unknown as SurveyPage[],
  HK: hkRaw as unknown as SurveyPage[],
};

export const getSurveyPages = (region: Region): SurveyPage[] =>
  SURVEY_PAGES_BY_REGION[region];

export const getAllQuestions = (region: Region): SurveyQuestion[] =>
  getSurveyPages(region).flatMap((p) => p.questions);

// Backwards-compat (TW default)
export const SURVEY_PAGES = SURVEY_PAGES_BY_REGION.TW;
export const ALL_QUESTIONS: SurveyQuestion[] = getAllQuestions("TW");
