# Spec: Education Platform (Eduhouse Style)

## Objective
建立一個供員工/學員使用的教育訓練平台，支援課程瀏覽、章節學習與測驗評估功能。為了提升學習動機與互動樂趣，本系統採用 **Soft UI (Claymorphism)** 設計風格，提供遊戲化、友善且高參與度的使用者體驗。

使用者包含一般學員與後台管理者。學員需要快速找到課程、觀看 Reveal.js 投影片教材、完成單元/課程測驗；管理者需要建立課程、排序單元、撰寫 Markdown 教材、維護測驗題庫。圖片提示詞若出現在教材中，必須具體且具畫面感，至少交代風格、光線、主體與場景，讓後續生成圖像可直接執行。

## Tech Stack
- Vue 3 + Vite 7
- Pinia 3
- Vue Router 4
- Firebase 12 / Firestore
- Reveal.js 5 + markdown-it
- Vitest 4 + happy-dom
- ESLint 9 + Prettier 3

## Commands
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm test -- --run`
- Lint: `npm run lint`
- Format: `npm run format`

## Project Structure
- `src/main.js`: Vue app bootstrap.
- `src/router/index.js`: route definitions and auth/admin guards.
- `src/stores/`: Pinia stores for auth, UI state, courses, and admin data.
- `src/views/`: page-level user and admin views.
- `src/views/admin/`: admin course, lesson, quiz, dashboard, and help views.
- `src/components/`: shared UI and lesson presentation components.
- `src/utils/`: small reusable logic with unit tests.
- `src/assets/`: global CSS, Reveal theme, and teacher-facing Markdown guide.
- `docs/`: project specs and engineering notes.

## Code Style
Prefer small Vue Composition API components and store actions over ad hoc Firebase calls in views. Keep reusable parsing/formatting logic in `src/utils/` with focused tests.

```js
export const splitMarkdownSlides = (markdownText = '') => {
  return markdownText.split(/^---[ \t]*(?:\r?\n|$)/gm)
}
```

Conventions:
- Use single quotes in JavaScript.
- Keep user-facing text in Traditional Chinese.
- Match existing Soft UI tokens from `src/assets/main.css`.
- Avoid speculative abstractions; add a helper only when multiple files need the same behavior or tests are useful.

## Testing Strategy
- Unit-test pure parsing and transformation logic under the same folder as the source file, using `*.spec.js`.
- Run `npm test -- --run` after logic changes.
- Run `npm run build` after Vue component, router, or store changes.
- Use the local browser at `http://localhost:5173/` for manual checks when UI changes affect layout or interaction.

## Boundaries
- **Always:**
  - 資料狀態的存取與寫入統一透過 Pinia Store 進行，元件內部不直接呼叫 Firebase API。
  - 介面必須完全遵循最新的 Soft UI 設計規範（圓潤邊角、粉彩底色、漂浮陰影）。
  - 所有按鈕與可點擊元素必須具備流暢的過渡動畫 (Transitions)。
  - Markdown 投影片分隔線使用獨立一行 `---`。
  - 圖片提示詞需包含風格、光線、主體、場景、構圖、情緒或用途。
- **Ask First:**
  - 變更 Firebase Firestore 資料結構 (Schema)。
  - 引入新的全域 npm 套件。
  - 變更登入/權限規則。
  - 大規模重寫既有 UI 架構。
- **Never:**
  - 使用銳利的純黑邊框或強烈的純黑陰影。
  - 在前端直接將機密資訊寫死。
  - 回退或覆蓋未確認來源的既有工作樹變更。

## Data Models
主要使用 Firebase Firestore，結構如下：
- `users/{userId}`: 儲存使用者基本資料與權限。
  - `users/{userId}/progress/{courseId}`: 使用者在特定課程的學習進度。
  - `users/{userId}/quizResults/{quizId}`: 使用者的測驗結果。
- `courses/{courseId}`: 課程主檔 (包含 `lessonsCount` 以優化效能)。
  - `courses/{courseId}/lessons/{lessonId}`: 該課程的章節內容。
  - `courses/{courseId}/quizzes/{quizId}`: 該課程的測驗。

## Performance & Error Handling
- **效能**: 列表頁嚴禁在迴圈內執行 `getDocs` 查詢 (N+1問題)，必須使用反正規化。
- **錯誤處理**: 任何 API 與 DB 操作皆須以 `try/catch` 包覆，並在捕捉到錯誤時，設定對應的 UI 錯誤狀態。

## UI/UX Design System
本專案全面採用「活潑、親和、柔和」的 Soft UI 設計風格，專為提升學習動機打造。

### Color Palette
- **Primary (主色)**: `#4F46E5` (Indigo 600) - 用於主要按鈕、進度條。
- **Background (背景)**: `#FDFBF7` - 帶有極淺米色調的暖白，柔和不刺眼。
- **Surface (卡片表面)**: `#FFFFFF` - 用於浮起內容區塊。
- **Text (主標文字)**: `#1E1B4B` - 深靛藍色取代純黑，增加溫潤感。
- **Text Secondary (次標/輔助)**: `#64748B` - 舒適的次要文字色彩。
- **Pastel Categories (粉彩分類色)**: 
  - 類別一：`#EFEFFC` (粉紫)
  - 類別二：`#FFF1E6` (粉橘)
  - 類別三：`#EAF5FF` (粉藍)
  - 類別四：`#EBF9EC` (粉綠)
  - 前端需實作類別到色彩的對應邏輯。

### Typography
- **基礎字體 (Font Family)**: 全面使用 Google Fonts 的 `'Poppins'`，以其圓潤的無襯線字型傳達友善感。
- **粗細 (Font Weight)**: 標題可使用 Semibold (600) 或 Bold (700) 增加層次，內文採用 Normal (400)。

### Interaction & Layout
- **整體佈局 (Layout)**:
  - 廢除頂部導覽，全面改用 **左側邊欄 (Sidebar)** 結構。
  - 主內容區需與側邊欄有明顯區隔，通常主區為米白背景，側邊欄為純白或帶有膠囊狀 Active 狀態。
- **形狀與材質 (Shapes & Material)**:
  - **極致圓角**: 卡片使用 `24px`，按鈕採用全圓角 (`9999px` 或 Pill shape)。
  - **軟陰影 (Soft Shadows)**: 不使用實線邊框，依賴柔和陰影區隔層次 (`box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05)`)。
- **狀態回饋 (State Feedback)**:
  - **懸停 (Hover)**: 卡片需有明顯的向上浮動 (`translateY(-4px)`) 與陰影加深效果，耗時約 `0.3s`。按鈕 hover 也需放大或浮起。

## Success Criteria
- `npm test -- --run` passes.
- `npm run build` passes.
- Lesson Markdown with standalone `---` renders as separate Reveal.js slides.
- Admin lesson editor displays a concrete image prompt checklist and example.
- Teacher guide documents image prompt requirements with a reusable formula and example.
- No Firestore schema or dependency changes are introduced for prompt guidance.

## Open Questions
- 是否需要未來在儲存單元時強制驗證圖片 Prompt 品質，目前先採用編輯器提示與教師指南，避免阻擋既有教材。
