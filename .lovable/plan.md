
## 目標

將壽司郎官方多頁問卷 (nps.sushiro.com.tw) 壓縮成單頁表單。使用者進入後所有欄位皆已預設好合理隨機值與預設答案，只要按「送出」即可拿到折價券認證碼；也可展開題目自行修改後再送出。

---

## 頁面結構（單一 `/` 路由）

一個垂直排列的表單，區塊如下：

1. **標題區**：說明用途與注意事項（僅限用餐 6 日內有效）。
2. **基本資訊區**（預設已填、可修改）
   - 邀請序號 `invitation_code`
   - 消費總金額 `total_price`
   - 用餐時間時段 `visited_time`（Radio: 4 選項）
   - 「重新隨機產生」按鈕：一鍵重刷上述三項
3. **問卷答案區**（預設收合）
   - 頂部工具列：
     - 「一鍵全部答『非常滿意 / 一定會再來 / 10 / 有 / 內用 / 未遇到問題』」批次動作按鈕（見下方對應表）
     - 「一鍵全部答 option 1」（等同壽司郎多數題的『非常滿意』）
     - 「展開／收合題目」切換
   - 依 14 個 page 逐頁列出所有題目（radio + 一題 textarea），可個別修改
4. **送出區**
   - 大按鈕「送出問卷」
   - 送出中 loading，成功後顯示大字折價券認證碼 `code`，附「複製」按鈕
   - 失敗顯示 API 回傳的錯誤訊息（含邀請碼過期 / 錯誤）

---

## 預設值邏輯

- **邀請序號**：`YYMMDDXX`
  - 取瀏覽器本地時間 (`new Date()`)；若時 <10 點，日期用「昨天」；≥10 點用「今天」
  - `XX` = 每次載入頁面隨機 `01`–`10`（zero-padded）
- **消費總金額**：隨機 300–1500，以 10 為單位 (`Math.floor(rand*121)*10 + 300`)
- **用餐時間**：從 `["1","2","3","4"]` 隨機選 1
- **問卷題目**：
  - 所有 radio 題預設選 option `"1"`
  - 唯一 textarea 題 (Q72) 預設 `""`

每次頁面載入（或按「重新隨機」）都會重新產生上述值。題目答案本身不隨機、固定 option 1。

---

## API 串接

依附件分析報告：無狀態、只需一次 POST `/api/v1/surveys/next` 帶完整 23 題答案即可完成問卷並拿到 `code`。

- Endpoint（生產）：`https://nps.sushiro.com.tw/api/v1/surveys/next`
- Header：`Authorization: Bearer web:624a677331626b5044e9bb25a1fcf8a9`, `Content-Type: application/json`
- Payload：
  ```json
  {
    "invitation_code": "...",
    "total_price": "...",
    "visited_time": "...",
    "answers": [ { "mst_question_id": <id>, "answered_option_no": "<no>" }, ... 22 題 ],
    "comments": [ { "mst_question_id": 72, "answered_text": "" } ]
  }
  ```

### CORS 處理

瀏覽器直接 fetch `nps.sushiro.com.tw` 幾乎肯定會被 CORS 擋。解決方式：

- **開發環境**：於 `vite.config.ts` 加 `server.proxy`，將 `/sushiro-api` → `https://nps.sushiro.com.tw`，前端 fetch `/sushiro-api/api/v1/surveys/next`。
- **正式部署 (Lovable preview / published)**：Vite proxy 不生效。建議啟用 **Lovable Cloud** 建一支 edge function `sushiro-proxy` 轉發請求（同時附上 Authorization header），前端統一呼叫此 function。這樣本地與線上皆可運作。

> 是否啟用 Lovable Cloud 我會在計畫核可後、實作前再跟你確認一次。若你只想在本地跑 `npm run dev`，可以不啟用 Cloud，只用 Vite proxy。

---

## 一鍵回答對應表

「一鍵全部最佳答案」= 對每題選出「最正面」的 option：

- 5 段滿意度題（Q1, Q5–Q14）→ option 1（非常滿意）
- Q4 消費方式 → option 1（內用）
- Q17 遇到問題？ → option 2（否）
- Q19 3個月內再訪？ → option 1（一定會再來）
- Q20 推薦分數 → option 1（10 分）
- Q27, Q28 服務招呼/笑臉 → option 1（有）
- Q64 過去 3 個月次數 → option 5（5 次以上）
- Q67 來店原因 → option 3（因壽司餐點好吃）
- Q70 最常去 → option 1（壽司郎）
- Q72 文字題 → `""`
- Q74 年齡 → option 8（不想回答）
- Q75 吸引主因 → option 1（餐點）

另提供「全部 option 1」的簡易版按鈕（即原始需求描述）。

---

## 技術細節（給工程師）

- 題目資料：把 `sushiro_nps_survey_questions.json` 內容原封不動存成 `src/data/questions.ts`（`export const SURVEY_PAGES = [...] as const`），做為題目來源。
- Type：`Question`, `Page`, `AnswerState = Record<number, string>`
- 狀態管理：`useState<AnswerState>` + 個別欄位 state；不引入額外狀態庫。
- 送出邏輯：組合 `answers`（form_type=1）與 `comments`（form_type=3），POST 呼叫。
- UI：沿用 shadcn/ui 元件（Card, Button, Input, RadioGroup, Textarea, Collapsible, Alert, Badge, Skeleton）；日文/中文全形排版。
- 排版：極簡實用風，非壽司郎品牌翻版，以功能為主；深/淺色皆可運作。

### 檔案異動

```text
src/
  pages/Index.tsx           # 全部 UI + 送出邏輯
  data/questions.ts         # 題目常數
  lib/sushiro.ts            # 預設值產生器（邀請碼/金額/時段）+ 呼叫 API
vite.config.ts              # 加入 /sushiro-api proxy
index.html                  # <title>、<meta description> 更新
```

（若啟用 Lovable Cloud，另加 `supabase/functions/sushiro-proxy/index.ts`）

---

## 驗證方式

1. 進入 `/`，確認邀請序號符合 `YYMMDDXX`、金額為 300–1500 且為 10 倍數、時段落在 1–4。
2. 直接按「送出」→ 期望顯示 5 碼 `code`。
3. 展開題目、切換某題答案後再送出，確認仍可成功。
4. 按「重新隨機」，確認 3 個預設值均變動。
5. 用過期/亂數邀請碼送出，確認顯示 API 錯誤訊息。
