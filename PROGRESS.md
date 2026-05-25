# 芳香體質診斷系統 — 專案進度交接文件

> 最後更新：2026-05-25
> 負責品牌：群獅整合行銷

---

## 🌐 基本資訊

| 項目 | 內容 |
|------|------|
| GitHub Repo | `fanyayajoin-lion/lionaroma` |
| GitHub Pages 網址 | https://fanyayajoin-lion.github.io/lionaroma/ |
| 部署分支（GitHub Pages 讀這個） | `claude/aroma-diagnosis-handover-tuwwm` |
| 開發分支 | `claude/review-optimize-website-t8BVb` |
| Cloudflare Worker URL | `https://aroma-therapist-api.fanyayajoin.workers.dev` |

---

## 📂 檔案結構說明

```
lionaroma/
├── index.html                         ← 主應用程式（完整單頁 HTML，就是整個網站）
├── worker.js                          ← Cloudflare Worker：Gemini API 中繼 + 認證碼驗證
├── wrangler.toml                      ← Cloudflare 部署設定
├── PROGRESS.md                        ← 本文件
└── .github/workflows/deploy-worker.yml ← Worker 自動部署 CI/CD
```

> ⚠️ 重要：`aroma-system.html` 只存在於開發分支，部署分支的主頁是 `index.html`，兩者內容相同。下次開發請直接修改部署分支的 `index.html`，修改完推送即可上線。

---

## ⚙️ 系統架構

```
使用者瀏覽器
    │
    ├─ 填寫生日 → 前端 JS 計算五行(日柱天干)、星座、節氣（純前端，無需 API）
    │
    ├─ 生成報告 → POST /api/generate → Cloudflare Worker → Gemini 2.0 Flash API
    │
    └─ 認證碼驗證 → POST /api/verify → Cloudflare Worker（比對環境變數 CERT_CODES）
```

### 使用次數機制
- 免費：每日 2 次（`localStorage` 計數，每日重置）
- 認證後：無限使用（`localStorage.certified = true` 永久保存）
- 認證碼：存在 Cloudflare 環境變數 `CERT_CODES`，格式 `CODE1,CODE2,CODE3`，前端**看不到**

---

## ✅ 已完成工作（本階段）

### 第一輪：安全性 + Bug 修復 + UX
- 移除前端硬編碼的認證碼（`CERT_CODES` 陣列）
- Cloudflare Worker CORS 由 `*` 改為限定 `fanyayajoin-lion.github.io`
- 修復 `certWall` 按鈕 `onclick` 使用未定義變數 `prompt_placeholder` 的 bug
- 修復 `callGemini` 少傳 `dayStem`/`dayGanzhi` 導致報告標題顯示空白
- 修復 `resetSystem` 未重設 `select` 欄位（性別、月份、用途）
- 年齡欄位改為從生日自動計算（`readonly`）
- Step 1 加入必填驗證（姓名、年月日缺填時顯示錯誤）
- 生成按鈕防重複點擊（送出後禁用，完成後恢復）
- Google Fonts 加入 `preconnect` 提速

### 第二輪：功能改善
- 症狀對應精油：建立 16 種症狀各自的精油對照表，每個症狀推薦不同精油
- 出生月份從下拉 `<select>` 改為可直接輸入的 `<input type="number">`
- 頁尾加入版權聲明

### 第三輪：台灣廣告法合規
依據《化粧品衛生安全管理法》第 10 條，違反醫療效能宣稱最高罰 **500 萬**，以下違規內容全部修正：

| 位置 | 修改前（違規） | 修改後（合規） |
|------|-------------|-------------|
| `elementScents['木']` | 舒肝理氣 | 帶來自在舒暢的感官體驗 |
| `elementScents['金']` | 清肺潤燥、有助呼吸道健康 | 帶來清新爽朗的感官體驗 |
| `elementScents['水']` | 補腎納氣 | 帶來深沉穩定的香氣感受 |
| `zodiacBlend['天秤']` | 平衡荷爾蒙 | 帶來和諧均衡的花香感受 |
| `symptomOilMap` x16 | 調節GABA、降低腎上腺素、激活免疫細胞… | 全改為香氣氛圍體驗描述 |
| AI Prompt | 「改善症狀機制」 | 「香氣感受與使用體驗，不宣稱療效」 |
| 區塊標題 | 症狀對應精油說明 | 身心關注香氛建議 |
| Step 3 標題 | 目前困擾症狀 | 目前身心關注方向 |
| meta/JSON-LD | 身體症狀 | 身心關注方向 |
| 頁尾 | 無 | 加入免責聲明 |

- 版權年份更新為 `Copyright © 2026 群獅整合行銷 All Rights Reserved.`

---

## ❗ 待處理事項（下一階段）

| 優先度 | 項目 | 說明 |
|--------|------|------|
| 🔴 高 | OG 圖片缺失 | `og-image.jpg` 不存在，LINE/FB 分享預覽無圖，需設計並上傳 1200×630px 圖片 |
| 🔴 高 | LINE 聯絡連結 | `certWall` 裡 `https://line.me/ti/p/~yourlinehere` 是 placeholder，需換成真實 LINE ID |
| 🟡 中 | Worker CORS | 若有其他合法來源需存取 API，加入 `worker.js` 的 `ALLOWED_ORIGINS` 陣列 |
| 🟡 中 | 行動版體驗 | 目前 3 欄表單在手機上折為 1 欄，月份/日期輸入框在 iOS Safari 數字鍵盤體驗可再優化 |
| 🟢 低 | PDF 頁首 | 下載的 PDF 只有內容截圖，可考慮加入公司 LOGO 浮水印或頁首 |
| 🟢 低 | 深色模式 | 目前無 `prefers-color-scheme` 支援 |

---

## 🔧 開發注意事項

### 修改網站內容
1. 直接編輯 `index.html`（部署分支）
2. `git add index.html && git commit -m "說明" && git push`
3. GitHub Pages 約 1-3 分鐘後更新

### 修改 Worker（後端 API）
1. 編輯 `worker.js`
2. Push 後 GitHub Actions (`deploy-worker.yml`) 會自動部署到 Cloudflare
3. 需要在 GitHub Secrets 設定 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`

### AI Prompt 位置
- `index.html` 搜尋 `const prompt = \`` 即可找到（約在 JS 段落中段）
- 可供應精油清單在 prompt 上方的 `AVAILABLE_OILS` 陣列

### 五行計算邏輯
- 以「日柱天干」為主（最精準），非年份天干
- 函數：`getDayStemInfo(year, month, day)` 使用儒略日算法
- 已驗證基準：1989/9/27 = 庚（金）、1900/1/1 = 甲戌

---

## 📋 給下一位 Claude 的工作指引

接手時請依序確認：
1. 先讀本文件（PROGRESS.md）
2. `git checkout claude/aroma-diagnosis-handover-tuwwm` — 切換到部署分支
3. 開啟 `index.html` 即為完整程式碼（約 1830 行）
4. 確認「待處理事項」表格，優先處理 🔴 高優先項目
