# 壽司郎問卷一鍵助手 (Sushiro NPS Form Auto-Submitter)

一個基於 React + Vite + TypeScript 打造的單頁應用程式（SPA），將壽司郎官方問卷簡化至單一頁面，並提供自動填寫、預設答案及一鍵提交功能，幫助使用者快速取得折價券認證碼。

* 🚀 **本專案網站**：[https://winedays.github.io/sushiro-nps/](https://winedays.github.io/sushiro-nps/)
* 📋 **官方問卷網站**：[https://nps.sushiro.com.tw](https://nps.sushiro.com.tw)

---

## 🚀 核心功能

1. **一頁式問卷填寫**：將原本需要跨越數十個頁面跳轉的問卷整合至單一頁面，提供極速的填寫體驗。
2. **自動隨機生成基本資訊**：
   - **邀請序號**：自動生成符合格式的 `YYMMDDXX` 序號（`XX` 為 `01-10` 隨機值）。系統會依據當前時間進行日期推算（上午 10 點前使用昨日日期，10 點後使用今日日期）。
   - **消費金額**：自動隨機生成 `300` 至 `1500` 元之間的消費金額（以 `10` 元為單位）。
   - **用餐時段**：自動隨機選擇用餐時間段。
3. **一鍵套用預設答案**：
   - **全部最佳答案**（預設）：自動套用問卷分析報告中最正面的滿意度選項。
   - **滿意 / 普通 / 不滿意**：一鍵將所有適用題目全部答為特定等級選項。
   - **預設答案**：全部單選題設為 Option 1，文字題留空。
4. **即時問卷調整**：提供摺疊面板可供展開，允許使用者手動修改每個題目（單選題與意見回饋）的答案。
5. **一鍵送出與複製認證碼**：送出成功後，系統會回傳 5 碼折價券認證碼，並支援一鍵複製到剪貼簿。

---

## 🛠️ 開發與建置

本專案使用 `bun` 進行依賴追蹤與套件管理，您也可以使用 `npm` 執行以下指令：

### 安裝依賴
```bash
# 使用 bun
bun install

# 或使用 npm
npm install
```

### 啟動開發伺服器
```bash
# 使用 bun
bun run dev

# 或使用 npm
npm run dev
```
啟動後，可在瀏覽器中打開 `http://localhost:5173` 進行預覽。

### 專案建置
* **開發模式建置** (輸出的 Vite 開發版本)：
  ```bash
  npm run build:dev
  ```
* **生產模式建置**：
  ```bash
  npm run build
  ```

---

## 🔌 API 串接與 CORS 處理

* **API 端點**：`/api/v1/surveys/next`
* **認證方式**：`Authorization` 標頭帶有 `Bearer web:624a677331626b5044e9bb25a1fcf8a9`。
* **本地開發代理 (Proxy)**：
  在本地端開發時，Vite 已配置於 `vite.config.ts` 中，將 `/sushiro-api` 代理至 `https://nps.sushiro.com.tw` 以解決瀏覽器跨來源資源共享 (CORS) 限制。
* **生產環境 CORS 限制**：
  直接呼叫 `nps.sushiro.com.tw` 會因瀏覽器 CORS 限制而失敗。專案部署至生產環境時，必須透過代理伺服器（例如 Supabase Edge Function `sushiro-proxy` 或其他後端反向代理）處理。
  - **自訂 Proxy URL**：可在瀏覽器的 `localStorage` 中，將 `sushiro_proxy_url` 設定為您的自訂代理 API 基礎路徑。
