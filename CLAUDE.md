# BrezNu 碧森妮｜芳療診斷系統 — 開發指引

## 專案基本資訊

| 項目 | 內容 |
|------|------|
| 品牌客戶 | BrezNu 碧森妮 / 鴻元生技股份有限公司 |
| 品牌定位 | 天然精油的專家（台中）|
| 開發公司 | 遠特企業管理諮詢有限公司 |
| GitHub Repo | `fanyayajoin-lion/lionaroma` |
| GitHub Pages | https://fanyayajoin-lion.github.io/lionaroma/ |
| 部署分支 | `claude/aroma-diagnosis-handover-tuwwm`（GitHub Pages 讀這個）|
| 開發分支 | `claude/loving-lamport-mswMT`（所有開發在這個分支進行）|
| Cloudflare Worker | https://aroma-therapist-api.fanyayajoin.workers.dev |

## 檔案結構

```
lionaroma/
├── index.html                         ← 主應用程式（前台診斷 SPA，1936 行）
├── worker.js                          ← Cloudflare Worker（API 閘道，121 行）
├── wrangler.toml                      ← Cloudflare 部署設定
├── PROGRESS.md                        ← 歷史進度交接文件
├── CLAUDE.md                          ← 本文件（給下一個 Claude session 看）
├── supabase/
│   └── schema.sql                     ← 資料庫 schema（Sprint 0 建立）
├── admin/
│   ├── login.html                     ← 後台登入頁（Sprint 0）
│   ├── dashboard.html                 ← 儀表板（Sprint 3）
│   ├── users.html                     ← 用戶管理 + 四層階層（Sprint 1）
│   ├── crm.html                       ← CRM 客戶管理（Sprint 1）
│   ├── oils.html                      ← 精油知識庫管理（Sprint 2）
│   └── codes.html                     ← 認證碼管理（Sprint 3）
└── privacy.html                       ← 隱私聲明（Sprint 4）
```

> ⚠️ `aroma-system.html` 只存在於開發分支（歷史遺留）。部署分支的主頁是 `index.html`。

## 系統架構（目標狀態）

```
前台（GitHub Pages）        後端（Supabase）
─────────────────────      ──────────────────────────
index.html                  PostgreSQL
  診斷流程                   ├── organizations（組織階層）
  PDF 報告                   ├── users（4層帳號 + parent_id）
admin/（新建中）              ├── oil_knowledge（精油知識庫）
  login.html                 ├── diagnosis_reports（診斷紀錄）
  dashboard.html             └── cert_codes（認證碼）
  users.html                 Auth（JWT）
  crm.html                   Row Level Security（多租戶隔離）
  oils.html
  codes.html                Cloudflare Worker（擴充中）
                             ├── POST /api/generate（既有）
                             ├── POST /api/verify（升級為 DB 驗證）
                             ├── GET  /api/oils（新增）
                             └── POST /api/reports（新增）
```

## 四層權限架構

| 層級 | 角色 | 使用者 | 主要權限 |
|------|------|--------|---------|
| Layer 1 | 總管理員 | BrezNu 碧森妮 / 鴻元生技 | 管理全系統；知識庫 CRUD；全局認證碼；全公司報表 |
| Layer 2 | 總公司內部管理員 | 業務督導、客服、教育訓練 | 管理 L3 帳號；查看轄下報告；管理轄下認證碼；知識庫唯讀 |
| Layer 3 | 店家 / 業務 / 行動芳療師 | 加盟店主、品牌業務、獨立芳療師 | 管理旗下 L4；查看旗下診斷紀錄；知識庫唯讀；各自額度 |
| Layer 4 | 店家內老師 / 芳療師 | 各店旗下個別老師 | 使用診斷系統；查看自己客戶報告；知識庫唯讀 |

階層關係：`users.parent_id` 指向直屬上層，RLS 確保每層只能看自己及下層資料。

## 精油知識庫

- 現有 44 支精油寫死在 `index.html` 的 `AVAILABLE_OILS` 陣列中
- 目標：遷移至 Supabase `oil_knowledge` 表，動態載入
- 前台啟動時呼叫 `GET /api/oils?available=true` 取得清單
- 管理介面：`/admin/oils.html`（L1/L2 可編輯，L3/L4 唯讀）

## 已知安全問題（P0 — 動工前必修）

1. **XSS 漏洞**：`renderReport()` 中 `innerHTML` 直接注入未過濾的使用者輸入與 AI 輸出，需加 `DOMPurify.sanitize()`
2. **認證繞過**：`localStorage.certified = true` 任何人可在 DevTools 設定，認證必須改為 server-side JWT 驗證
3. **無伺服端速率限制**：API 目前只靠前端 `FREE_LIMIT = 2` 控制，需在 Cloudflare Worker 加 Rate Limiting

## 重要技術細節

### Gemini API
- 模型：`gemini-2.0-flash`
- API Key：存在 Cloudflare 環境變數 `GEMINI_API_KEY`
- 費用：每份報告約 $0.001 USD，500份/月 ≈ NT$16，可能在免費額度內（1,500次/日）
- 主要 prompt 位置：`index.html` 搜尋 `const prompt = \``

### 五行計算
- 以「日柱天干」為核心（最精準），非年份天干
- 函數：`getDayStemInfo(year, month, day)` 使用儒略日算法
- 驗證基準：1989/9/27 = 庚（金）

### 認證碼
- 目前存在 Cloudflare 環境變數 `CERT_CODES`（格式 `CODE1,CODE2`）
- 目標：遷移至 Supabase `cert_codes` 表，Worker 改為 DB 查詢

### 本地Storage 結構
```js
localStorage.getItem('aromaUsage')
// → JSON: { date: "Fri May 29 2026", count: 0-2, certified: false }
```

## Sprint 執行計畫

| Sprint | 週期 | 主要工作 |
|--------|------|---------|
| Sprint 0 | 週 1–2 | DOMPurify XSS 修復 + Supabase 初始化 + Auth 登入頁 + cert code 遷移至 DB |
| Sprint 1 | 週 3–4 | 四層帳號管理 UI + 基礎 CRM + 報告持久化儲存 |
| Sprint 2 | 週 5–6 | 精油知識庫 CRUD + 前台動態載入 + 44 支初始資料遷移 |
| Sprint 3 | 週 7 | 後台儀表板 + 認證碼管理後台 + 使用額度管理 |
| Sprint 4 | 週 8 | BrezNu 品牌視覺 + PDPA 合規 + UAT + 教育訓練 |

完整計畫文件：`/root/.claude/plans/transient-tickling-valiant.md`

## 待處理高優先事項

- [ ] P0：XSS 修復（DOMPurify）
- [ ] P0：認證改為 server-side JWT
- [ ] P0：Worker 加 Rate Limiting
- [ ] 🔴 OG 圖片缺失（`og-image.jpg`，需 1200×630px）
- [ ] 🔴 LINE 連結 placeholder（`~yourlinehere`，需換真實 ID）
- [ ] Supabase 帳號設定（由業主申請，費用自付）
- [ ] BrezNu 品牌資產取得（Logo + 主色 HEX + 字型）

## 合約資訊（內部參考）

- 總金額：NT$352,000 未稅（含稅 NT$369,600）
- 付款：30% 簽約 → 50% 原型確認 → 20% 上線驗收
- 保固：1 年 + 前 3 個月陪跑
- 年度服務：A 方案 NT$20,000/年、B 方案 NT$60,000/年

合約審查已完成，12 項優化建議已提供（含不可抗力、IP 條款精確化、終止條款補強、SLA 定義）。

## 外部銷售定價（此系統作為產品販售給其他客戶）

| 方案 | 一次性建置費 | 年費維運 |
|------|------------|---------|
| 基礎版（品牌換裝上線）| NT$38,000 | NT$12,000/年 |
| 標準版（全客製開發）| NT$68,000 | NT$18,000/年 |
| 進階版（加值功能整合）| NT$98,000+ | NT$24,000/年 |

Notion 資料庫：
- 🤖 [AI診斷系統｜服務方案](https://www.notion.so/0ef84a70a4d140b88f569dfabf3bf877)
- 🌿 [AI診斷系統｜客戶管理](https://www.notion.so/0d8de19245294d9ca0a28aa6d8fa082f)

## 給下一個 Claude Session 的提示

```
我有一個芳療診斷系統（BrezNu 碧森妮 × 群獅整合行銷），
GitHub Pages：https://fanyayajoin-lion.github.io/lionaroma/
Repo：fanyayajoin-lion/lionaroma
開發分支：claude/loving-lamport-mswMT
部署分支：claude/aroma-diagnosis-handover-tuwwm（index.html 是主頁）
Cloudflare Worker：https://aroma-therapist-api.fanyayajoin.workers.dev

目前正在進行：Sprint 0 — 安全修復 + Supabase 初始化
完整計畫：CLAUDE.md + /root/.claude/plans/transient-tickling-valiant.md

接下來要做：[你的需求]
```
