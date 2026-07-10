## 目標
新增地區切換功能（台灣 / 香港），預設依使用者瀏覽器地區自動選擇，並提供手動切換 UI。

## 檔案變更

### 1. 新增 `src/data/questions.hk.json`
從 `reports/hk/sushiro_nps_survey_questions.json` 複製到 `src/data/` 供打包使用。

### 2. 改寫 `src/data/questions.ts`
- 匯出 `SURVEY_PAGES_BY_REGION: Record<"TW" | "HK", SurveyPage[]>`。
- 保留舊 `SURVEY_PAGES`、`ALL_QUESTIONS`（指向 TW，兼容），但主流程改用 region-aware getter。
- 新增 `getSurveyPages(region)` / `getAllQuestions(region)`。

### 3. 改寫 `src/lib/sushiro.ts`
- 新增 `Region = "TW" | "HK"` 型別。
- `REGION_CONFIG`：
  - `TW`: `apiHost: "https://nps.sushiro.com.tw"`, `apiKey: "web:624a677331626b5044e9bb25a1fcf8a9"`, `proxyPath: "/sushiro-api"`, `label: "台灣"`。
  - `HK`: `apiHost: "https://nps.sushiro.com.hk"`, `apiKey: "web:1c263ca9a5b36e58b8a3f3ca02f54f97"`, `proxyPath: "/sushiro-api-hk"`, `label: "香港"`。
- 所有函式加上 `region` 參數：`buildDefaultAnswers(region)`、`buildBestAnswers(region)`、`applyUniformRadioAnswer(current, optionNo, region)`、`questionCount(region)`、`submitSurvey(payload)` 讀 `payload.region`。
- 新增 `detectRegion()`：以 `navigator.language`、`navigator.languages`、`Intl.DateTimeFormat().resolvedOptions().timeZone` 判斷。含 `zh-HK` / `Asia/Hong_Kong` → `HK`；否則 `TW`。
- 「最佳答案」對應表：TW 保持現況；HK 依 HK 分析報告題目 ID 建一份（Q1/5–14/24/27/28→1，Q17→2，Q19→1，Q20→1，Q23/25/26/72→""，Q64→5，Q67→3，Q68→1，Q73→3，Q74→8）。

### 4. 更新 `vite.config.ts`
新增 `/sushiro-api-hk` proxy 指向 `https://nps.sushiro.com.hk`。TW proxy 維持不變。

### 5. 更新 `src/pages/Index.tsx`
- 新增 `region` state，初值 `detectRegion()`。
- Header 加入切換按鈕（ToggleGroup 或兩顆 Button：「台灣」「香港」）並顯示目前 API 目的地。
- 切換 region 時：重建 `answers = buildBestAnswers(region)`、`activePreset = "best"`、清除 `submit` 結果；`invitation_code / total_price / visited_time` 保留（格式相同）。
- `SURVEY_PAGES` 改用 `getSurveyPages(region)`（useMemo）。
- footer 改成顯示對應 host（`nps.sushiro.com.tw` 或 `nps.sushiro.com.hk`）。

### 6. 更新 memory
`mem://index.md` 加一行說明支援 TW / HK 雙地區與自動偵測。

## 不做的事
- 不改動 UI 主題、樣式系統或既有隨機值產生邏輯。
- 不新增 Lovable Cloud / edge function（沿用 Vite proxy）。
- 不更動測試設定。
