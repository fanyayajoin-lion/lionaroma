# 芳香體質診斷系統

**BrezNu 碧森妮 × 群獅整合行銷** 聯合開發

> AI 驅動的芳療諮詢工具：輸入客戶生日與身心關注方向，自動生成個人化精油配方報告

🌐 **線上使用**：https://fanyayajoin-lion.github.io/lionaroma/

---

## 這個系統在做什麼

芳療師在與客戶諮詢時，傳統上需要手動查閱五行資料、比對精油特性、再手寫或口頭給出配方建議，耗時且難以標準化。

這個系統把整個流程自動化：

1. **芳療師輸入客戶基本資料**（姓名、生日、性別、使用目的、身心關注方向）
2. **系統自動計算**五行（日柱天干）、星座、當月節氣
3. **AI 生成個人化報告**，包含：
   - 體質深度分析（五行 × 星座 × 節氣）
   - 各身心關注方向的精油香氛建議
   - 五支精油的前中後調配方（比例、理由）
   - 擴香、滾珠、按摩、精油浴的具體使用建議
   - 個人化肯定語句
4. **報告輸出**：一鍵下載 PDF 或複製分享 LINE

---

## 使用對象

| 使用者 | 用途 |
|--------|------|
| 芳療師 / 老師 | 客戶諮詢現場，當場生成報告交給客戶 |
| 店家 | 作為服務亮點，提升客戶體驗與回訪率 |
| 業務 / 行動芳療師 | 外出拜訪時的專業工具 |

---

## 系統架構

```
使用者瀏覽器
    │
    ├─ 填寫表單 → 前端 JS 計算五行（日柱天干）、星座、節氣
    │               ↑ 純前端運算，無需 API
    │
    ├─ 點擊生成 → POST /api/generate
    │               → Cloudflare Worker（API 安全中繼）
    │                   → Google Gemini 2.0 Flash
    │                       → 結構化 JSON 報告
    │
    └─ 輸入認證碼 → POST /api/verify
                    → Cloudflare Worker（比對環境變數，不暴露於前端）
```

### 技術棧

| 元件 | 技術 | 說明 |
|------|------|------|
| 前台 | 純 HTML / CSS / JS（單一檔案）| 無框架，1936 行，部署於 GitHub Pages |
| API 閘道 | Cloudflare Workers | Gemini API 安全中繼 + 認證碼驗證 |
| AI 引擎 | Google Gemini 2.0 Flash | 依提示詞生成結構化 JSON 報告 |
| PDF 生成 | html2canvas + jsPDF（前端）| 無需後端，純瀏覽器生成 |

---

## 核心功能

### 五行計算
- 以「日柱天干」為核心（比年份天干更精準）
- 使用儒略日算法計算，已驗證：1989/9/27 = 庚（金）
- 自動對應星座（12星座）與節氣（24節氣）

### 精油推薦
- 現有 44 支 BrezNu 碧森妮精油（35 單方 + 9 複方）
- 包含五行系列（土/木/水/火/金行複方）與舒系列（舒壓/舒活/舒眠/舒醒）
- 16 種身心關注方向各有獨立精油建議，避免重複

### 使用次數控制
- 免費：每日 2 次（`localStorage` 計數）
- 認證後：無限使用（輸入認證碼，後端驗證）

### 台灣廣告法合規
- 符合《化粧品衛生安全管理法》第 10 條
- 所有描述以「香氣感受與使用體驗」為主，不宣稱醫療療效
- 頁尾含完整免責聲明

---

## 檔案說明

```
lionaroma/
├── index.html          ← 整個前台應用（診斷流程 + UI + 報告渲染 + PDF）
├── worker.js           ← Cloudflare Worker（/api/generate + /api/verify）
├── wrangler.toml       ← Cloudflare 部署設定
├── CLAUDE.md           ← 開發指引（給 Claude AI 看的上下文文件）
└── PROGRESS.md         ← 歷史進度交接記錄
```

---

## 分支說明

| 分支 | 用途 |
|------|------|
| `claude/aroma-diagnosis-handover-tuwwm` | **部署分支**，GitHub Pages 讀這個，修改即上線 |
| `claude/loving-lamport-mswMT` | **開發分支**，所有開發工作在這裡進行 |

---

## 環境變數（Cloudflare）

| 變數名稱 | 說明 |
|---------|------|
| `GEMINI_API_KEY` | Google Gemini API 金鑰 |
| `CERT_CODES` | 認證碼清單，格式：`CODE1,CODE2,CODE3` |

---

## 正在開發（下一階段）

本系統目前為純前台診斷工具，正在擴充為完整的芳療業務管理平台：

### 四層帳號權限系統
```
Layer 1  總管理員          BrezNu 碧森妮 總公司
Layer 2  總公司內部管理員   業務督導、客服、教育訓練
Layer 3  店家/業務/芳療師   加盟店主、品牌業務、獨立芳療師
Layer 4  店家內老師         各店旗下個別老師
```

### 新增模組
- **CRM 客戶管理**：客戶資料、診斷記錄、追蹤狀態
- **精油知識庫**：可動態管理的精油資料庫，取代目前的硬編碼清單
- **後台管理介面**：帳號管理、認證碼發放、使用量統計
- **Supabase 後端**：PostgreSQL 資料庫 + Auth + Row Level Security

---

## API 文件

### `POST /api/generate`
生成芳療診斷報告

- **Request**：`{ "prompt": string }` （長度 ≥ 10 字元）
- **Response**：Gemini API 回傳的 JSON 結構（含 constitution、formula、lifestyle 等欄位）

### `POST /api/verify`
驗證認證碼

- **Request**：`{ "code": string }`
- **Response**：`{ "valid": boolean }`

### `GET /`
健康檢查：回傳 `{ "status": "ok", "service": "Aroma Therapist API 🌿" }`

---

## 費用估算

| 項目 | 費用 |
|------|------|
| GitHub Pages | 免費 |
| Cloudflare Workers | 免費（含每日 10 萬次請求）|
| Gemini 2.0 Flash | 每份報告 ~$0.001 USD；500份/月 ≈ NT$16 |
| **每月總成本** | **約 NT$0–16** |

---

## 聯絡

- **品牌客戶**：BrezNu 碧森妮 / 鴻元生技股份有限公司
- **開發**：遠特企業管理諮詢有限公司
