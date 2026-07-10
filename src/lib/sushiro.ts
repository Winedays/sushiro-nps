import {
  getAllQuestions,
  type Region,
  type SurveyQuestion,
} from "@/data/questions";

export type { Region } from "@/data/questions";

type RegionConfig = {
  label: string;
  apiHost: string;
  apiKey: string;
  proxyPath: string;
};

export const REGION_CONFIG: Record<Region, RegionConfig> = {
  TW: {
    label: "台灣",
    apiHost: "https://nps.sushiro.com.tw",
    apiKey: "web:624a677331626b5044e9bb25a1fcf8a9",
    proxyPath: "/sushiro-api",
  },
  HK: {
    label: "香港",
    apiHost: "https://nps.sushiro.com.hk",
    apiKey: "web:1c263ca9a5b36e58b8a3f3ca02f54f97",
    proxyPath: "/sushiro-api-hk",
  },
};

const getApiBase = (region: Region): string => {
  const cfg = REGION_CONFIG[region];
  if (typeof window !== "undefined") {
    const custom = window.localStorage.getItem(`sushiro_proxy_url_${region}`);
    if (custom) return custom;
  }
  return import.meta.env.PROD
    ? `https://corsproxy.io/?${cfg.apiHost}`
    : cfg.proxyPath;
};

/** 依瀏覽器語系 / 時區偵測地區，預設 TW。 */
export function detectRegion(): Region {
  if (typeof navigator === "undefined") return "TW";
  const langs = [
    ...(navigator.languages ?? []),
    navigator.language ?? "",
  ].map((l) => l.toLowerCase());
  if (langs.some((l) => l.includes("zh-hk") || l.includes("zh-mo"))) return "HK";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (tz === "Asia/Hong_Kong" || tz === "Asia/Macau") return "HK";
  } catch {
    /* ignore */
  }
  return "TW";
}

export const VISITED_TIME_OPTIONS = [
  { value: "1", label: "～14 時" },
  { value: "2", label: "14 時～17 時" },
  { value: "3", label: "17 時～21 時" },
  { value: "4", label: "21 時～" },
] as const;

const pad2 = (n: number) => n.toString().padStart(2, "0");

/**
 * 產生邀請序號 YYMMDDXX。
 * 以瀏覽器本地時間為準：<10 點使用昨天日期，>=10 點使用今天日期。
 * XX 為 01–10 的隨機值。
 */
export function generateInvitationCode(now: Date = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < 10) {
    d.setDate(d.getDate() - 1);
  }
  const yy = pad2(d.getFullYear() % 100);
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const xx = pad2(Math.floor(Math.random() * 10) + 1); // 01-10
  return `${yy}${mm}${dd}${xx}`;
}

/** 隨機 300–1500，以 10 為單位。 */
export function generateTotalPrice(): string {
  const steps = Math.floor(Math.random() * 121);
  return String(300 + steps * 10);
}

/** 隨機用餐時段 "1"–"4"。 */
export function generateVisitedTime(): string {
  return String(Math.floor(Math.random() * 4) + 1);
}

/** 全部題目的預設答案：radio 一律 option "1"，textarea 一律 ""。 */
export function buildDefaultAnswers(region: Region): Record<number, string> {
  const map: Record<number, string> = {};
  for (const q of getAllQuestions(region)) {
    map[q.question_id] = q.form_type === 1 ? "1" : "";
  }
  return map;
}

/** 依現有題庫、將所有 radio 題套用同一 option_no（若該題有此選項）。 */
export function applyUniformRadioAnswer(
  current: Record<number, string>,
  optionNo: string,
  region: Region,
): Record<number, string> {
  const next = { ...current };
  for (const q of getAllQuestions(region)) {
    if (q.form_type !== 1) continue;
    const has = q.options.some((o) => o.option_no === optionNo);
    if (has) next[q.question_id] = optionNo;
  }
  return next;
}

/** 「最佳答案」對應表 - 各地區獨立。 */
const BEST_ANSWER_TW: Record<number, string> = {
  1: "1", 5: "1", 6: "1", 7: "1", 8: "1", 9: "1",
  10: "1", 11: "1", 12: "1", 13: "1", 14: "1",
  4: "1", 17: "2", 19: "1", 20: "1", 27: "1", 28: "1",
  64: "5", 67: "3", 70: "1", 74: "8", 75: "1",
};

const BEST_ANSWER_HK: Record<number, string> = {
  1: "1", 5: "1", 6: "1", 7: "1", 8: "1", 9: "1",
  10: "1", 11: "1", 12: "1", 13: "1", 14: "1",
  17: "2", 19: "1", 20: "1", 24: "1", 27: "1", 28: "1",
  64: "5", 67: "3", 68: "1", 73: "3", 74: "8",
  23: "", 25: "", 26: "", 72: "",
};

const BEST_ANSWER_BY_REGION: Record<Region, Record<number, string>> = {
  TW: BEST_ANSWER_TW,
  HK: BEST_ANSWER_HK,
};

export function buildBestAnswers(region: Region): Record<number, string> {
  const map = buildDefaultAnswers(region);
  for (const [qid, no] of Object.entries(BEST_ANSWER_BY_REGION[region])) {
    map[Number(qid)] = no;
  }
  return map;
}

export type SubmitPayload = {
  region: Region;
  invitation_code: string;
  total_price: string;
  visited_time: string;
  answers: Record<number, string>;
};

export type SubmitSuccess = { ok: true; code: string };
export type SubmitError = { ok: false; message: string; detail?: unknown };

export async function submitSurvey(
  payload: SubmitPayload,
): Promise<SubmitSuccess | SubmitError> {
  const { region } = payload;
  const cfg = REGION_CONFIG[region];
  const answers: { mst_question_id: number; answered_option_no: string }[] = [];
  const comments: { mst_question_id: number; answered_text: string }[] = [];

  for (const q of getAllQuestions(region)) {
    const v = payload.answers[q.question_id] ?? "";
    if (q.form_type === 1) {
      answers.push({ mst_question_id: q.question_id, answered_option_no: String(v || "1") });
    } else {
      comments.push({ mst_question_id: q.question_id, answered_text: String(v ?? "") });
    }
  }

  const body = {
    invitation_code: payload.invitation_code,
    total_price: payload.total_price,
    visited_time: payload.visited_time,
    answers,
    comments,
  };

  let res: Response;
  try {
    res = await fetch(`${getApiBase(region)}/api/v1/surveys/next`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, message: `網路請求失敗：${(e as Error).message}` };
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    return { ok: false, message: `伺服器回應非 JSON（HTTP ${res.status}）` };
  }

  if (!res.ok || json?.status !== 200) {
    const msg = json?.message || `HTTP ${res.status}`;
    return { ok: false, message: `送出失敗：${msg}`, detail: json?.data };
  }

  const code = json?.data?.code;
  if (typeof code === "string" && code.length > 0) {
    return { ok: true, code };
  }
  return {
    ok: false,
    message: "伺服器未回傳折價券認證碼，可能問卷尚未完成。",
    detail: json?.data,
  };
}

export function questionCount(region: Region): { radio: number; text: number } {
  let radio = 0;
  let text = 0;
  for (const q of getAllQuestions(region)) {
    if (q.form_type === 1) radio += 1;
    else text += 1;
  }
  return { radio, text };
}

export type { SurveyQuestion };
