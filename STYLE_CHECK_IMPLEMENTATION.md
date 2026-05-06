# Style Check — Implementation Plan for PromptFlam

**Feature**: Style Check page (`/style-check`)
**App**: PromptFlam (SvelteKit 2, Svelte 5 runes, vanilla CSS, Cloudflare Pages)
**AI**: Claude API (`claude-sonnet-4-20250514`) via new server-side proxy
**Status**: Ready to build

---

## Before You Start: Developer Actions Required

These must be done manually before the agent begins coding.

### 1. Add the API key

In `.env.local`, add:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

In Cloudflare Pages dashboard → Settings → Environment Variables, add:
```
ANTHROPIC_API_KEY = sk-ant-your-key-here
```
(Add to both Production and Preview environments.)

### 2. System prompt file

`static/style-check-system-prompt.md` already exists with the `{{LANGUAGE}}` token intact. No action needed.

### 3. Nav icon

`static/icons/icon-stylecheck.svg` already exists. No action needed.

---

## Architecture Summary

```
User input (paste or URL fetch)
        ↓
/style-check page (Svelte 5, new route)
        ↓
POST /api/style-check (new server route)
  - reads ANTHROPIC_API_KEY from env
  - loads style-check-system-prompt.md
  - replaces {{LANGUAGE}} token
  - calls Claude API (non-streaming, JSON response)
        ↓
Claude returns structured JSON array of suggestions
        ↓
Page renders annotated story in StyleCheckDrawer
  - colour-coded highlights by category
  - tap highlight → modal
  - accept/reject/rewrite
        ↓
Save → Results view (Original preview + Edited story)
```

**Why non-streaming for this feature**: Unlike chat, Style Check needs the complete suggestion set before rendering highlights. A partial list would create a broken annotation experience. One complete JSON response is correct here.

**Claude response format** (the API prompt must instruct Claude to return this exactly):
```json
[
  {
    "id": "s1",
    "type": "spelling",
    "original": "recieve",
    "suggested": "receive",
    "reason": null,
    "sentenceIndex": 2
  },
  {
    "id": "g1",
    "type": "grammar",
    "original": "The results was announced yesterday.",
    "suggested": "The results were announced yesterday.",
    "reason": "Subject-verb agreement: 'results' is plural and requires 'were'.",
    "sentenceIndex": 5
  },
  {
    "id": "st1",
    "type": "style",
    "original": "The shocking announcement came amid growing concerns.",
    "suggested": "The announcement followed weeks of rising concern among ministers.",
    "reason": "'Shocking' is an evaluative adjective not supported by the facts as stated. 'Amid growing concerns' is a cliché — rewrite with specifics.",
    "sentenceIndex": 8
  }
]
```

---

## Design Tokens

Add the following new CSS variables to `src/app.css` inside the `:root` block, under the existing colour tokens. All other spacing, radius, shadow and typography must use existing `--spacing-*`, `--radius`, `--shadow-*`, `--font-size-*` tokens.

```css
/* Style Check highlight colours */
--color-spelling-bg: #FEE2E2;
--color-spelling-border: #EF4444;
--color-grammar-bg: #FEF9C3;
--color-grammar-border: #EAB308;
--color-style-bg: #DBEAFE;
--color-style-border: #3B82F6;
--color-accept: #16A34A;
--color-reject: #DC2626;
```

**Button specs (use these tokens throughout):**
- Accept button: 36px solid circle, `background: var(--color-accept)`, white tick icon, `border-radius: 50%`
- Reject button: 36px solid circle, `background: var(--color-reject)`, white × icon, `border-radius: 50%`
- Both aligned right, `gap: var(--spacing-sm)` between them
- Rewrite button: outlined, `color: var(--accent-brand)`, aligned left, same row as accept/reject

---

## Step 1 — CSS Tokens

**File to modify**: `src/app.css`

Add the eight new CSS variables listed above to the `:root` block, immediately after the existing `--color-separator` line. No other changes to this file.

### Checkpoint 1 ✓
Open DevTools and confirm the new variables are visible in the computed styles panel.

---

## Step 2 — API Route `/api/style-check`

**File to create**: `src/routes/api/style-check/+server.js`

### What it does

1. Reads `ANTHROPIC_API_KEY` from `env` (import from `$env/dynamic/private`, same pattern as the existing chat route)
2. Imports `static/style-check-system-prompt.md` at build time using `?raw`
3. Accepts POST body: `{ text: string, language: 'British English' | 'American English' }`
4. Replaces `{{LANGUAGE}}` in the system prompt with the value from the request body
5. Appends the JSON output format instruction (see below) to the assembled system prompt
6. Calls Claude API with:
   - `model`: `claude-sonnet-4-20250514`
   - `max_tokens`: 4000
   - `system`: assembled system prompt
   - `messages`: `[{ role: 'user', content: text }]`
7. Parses and returns the JSON array of suggestions

### JSON instruction suffix (append to system prompt at runtime)

```
---
## OUTPUT FORMAT

You must respond with ONLY a valid JSON array. No preamble, no explanation, no markdown fences.

Each item in the array represents one suggestion and must follow this schema exactly:
{
  "id": string,          // unique id: "s1", "s2", "g1", "g2", "st1" etc
  "type": "spelling" | "grammar" | "style",
  "original": string,    // the exact text from the article that needs changing
  "suggested": string,   // the replacement text
  "reason": string|null, // explanation of the rule (null for spelling)
  "sentenceIndex": number // 0-based index of the sentence in the article
}

If there are no suggestions, return an empty array: []
```

### Error handling

- Missing API key → 500 with message: `"API key not configured"`
- Claude returns malformed JSON → 500 with message: `"Style check failed — please try again"`
- Request body missing `text` field → 400 with message: `"No article text provided"`

### Checkpoint 2 ✓
Test with `curl` or a REST client before building any UI:
```bash
curl -X POST http://localhost:5173/api/style-check \
  -H "Content-Type: application/json" \
  -d '{"text": "The results was announced yesterday amid growing concerns.", "language": "British English"}'
```
Expected: a JSON array with at least one grammar and one style suggestion.

---

## Step 3 — API Route `/api/style-rewrite`

**File to create**: `src/routes/api/style-rewrite/+server.js`

This is a separate endpoint for the Rewrite flow in the suggestion modal. It must not reuse `/api/style-check` — the two have different user message formats and different expected response shapes.

### What it does

1. Reads `ANTHROPIC_API_KEY` from `$env/dynamic/private`
2. Accepts POST body: `{ original: string, language: 'British English' | 'American English' }`
3. Calls Claude API with:
   - `model`: `claude-sonnet-4-20250514`
   - `max_tokens`: 1000
   - `system`: `"You are a professional sub-editor working to BBC/Reuters standards. Respond with ONLY a valid JSON array of strings. No preamble, no markdown fences."`
   - `messages`: `[{ role: 'user', content: "Provide 3 alternative rewrites for the following sentence to conform to BBC/Reuters style in {{LANGUAGE}}. Return as a JSON array of strings only: [\"option1\", \"option2\", \"option3\"]. Sentence: {original}" }]`
4. Parses and returns `{ rewrites: string[] }`

### Error handling

- Missing API key → 500
- Malformed JSON from Claude → 500 with message: `"Rewrite failed — please try again"`
- Missing `original` field → 400

### Checkpoint 3 ✓
Test with curl. Expected: `{ "rewrites": ["option1", "option2", "option3"] }`.

---

## Step 4 — URL Fetch API Route

**File to create**: `src/routes/api/fetch-article/+server.js`

### What it does

1. Accepts POST body: `{ url: string }`
2. Fetches the URL server-side (avoids CORS issues), 8s timeout
3. Extracts article body text using a simple heuristic: strip `<script>`, `<style>`, `<nav>`, `<header>`, `<footer>`, `<aside>` tags; extract remaining `<p>` tag content; join with newlines
4. Returns `{ text: string, title: string | null, success: boolean }`
5. On failure (timeout, non-200, extraction returns <100 chars): return `{ success: false, error: "We couldn't extract the article cleanly — please paste the text instead" }`

> **Note**: Do not use any external scraping library — keep it dependency-free with regex/string operations to stay within Cloudflare Pages constraints.

### Checkpoint 4 ✓
Test with a public article URL. Confirm clean text extraction and graceful failure on a paywalled URL.

---

## Step 5 — Main Page

**File to create**: `src/routes/style-check/+page.svelte`

All state is component-local using Svelte 5 `$state` runes. No store additions are needed — style check session data does not need to persist across page navigation.

### Component state

```javascript
let inputText = $state('');
let language = $state('British English');
let isLoading = $state(false);
let showDrawer = $state(false);
let showFetchInput = $state(false);
let fetchUrl = $state('');
let fetchError = $state('');
let errorMessage = $state('');
let suggestions = $state([]);
let editedText = $state('');
let originalText = $state('');
let showResults = $state(false);
```

### Layout (mobile-first, single column)

```
┌─────────────────────────────────┐
│  HEADER (existing, fixed top)   │
├─────────────────────────────────┤
│  Title: "Spelling, Grammar & Style"      │
│  Language toggle [British | US] │
├─────────────────────────────────┤
│  Input area                     │
│  ┌───────────────────────────┐  │
│  │ Paste article here…  │  │
│  │ (textarea, min 200px)     │  │
│  └───────────────────────────┘  │
│  [  Fetch from URL  ] (link btn)│
├─────────────────────────────────┤
│  [  Check Style  ] (primary CTA)│
└─────────────────────────────────┘
```

### Language toggle

Two pill buttons side by side. Active state: `background: var(--accent-brand)`, `color: #fff`. Inactive: outlined with `border: 1px solid var(--color-border)`, `color: var(--text-primary)`.

```
[ British English ]  [ US English ]
```

### Fetch from URL flow

Tapping "Fetch from URL" expands an inline input below the textarea:
```
[ https://... paste URL here     ] [Fetch]
```
On tap Fetch:
1. Show inline loading spinner
2. Call `/api/fetch-article` directly (no service wrapper)
3. On success: populate `inputText` textarea, collapse URL input
4. On failure: show `fetchError` message below input using `color: var(--color-reject)`, keep URL input visible

### Check Style button

- Full-width, `background: var(--accent-brand)`, `color: #fff`, `border-radius: var(--radius)`
- Disabled if `inputText.trim()` is empty
- On tap:
  1. Set `isLoading = true`
  2. Store `originalText = inputText`
  3. Call `/api/style-check` with `{ text: inputText, language }`
  4. On success: set `suggestions`, set `showDrawer = true`, `isLoading = false`
  5. On error: show `errorMessage`, `isLoading = false`
- Loading state: button shows `ThinkingDots` component (already exists at `src/lib/components/ThinkingDots.svelte`) and is disabled

### Checkpoint 5 ✓
Page renders, toggle works, textarea accepts input, Fetch from URL expands/collapses, Check Style calls the API and receives suggestions, drawer flag flips. Drawer content not required yet.

---

## Step 6 — Style Check Drawer

**File to create**: `src/lib/components/StyleCheckDrawer.svelte`

This is the core editing experience. It renders as a full-screen overlay using `position: fixed; inset: 0; z-index: var(--z-drawer)` — consistent with how `SourcesDrawer.svelte` and `PromptDrawer.svelte` are implemented.

### Props

```javascript
let { 
  originalText,     // string — the raw article
  suggestions,      // array — from Claude
  language,         // string
  onSave,           // callback(editedText)
  onClose           // callback
} = $props();
```

### Internal state (all component-local `$state`)

```javascript
let activeFilter = $state(null);        // null | 'spelling' | 'grammar' | 'style'
let dismissed = $state(new Set());      // ids of rejected suggestions
let accepted = $state(new Map());       // id → accepted replacement text
let activeSuggestion = $state(null);    // suggestion object currently in modal
let rewrites = $state(new Map());       // id → array of rewrite strings
let rewriteLoading = $state(false);     // loading state for rewrite API call
let rewriteIndex = $state(new Map());   // id → current rewrite index shown
```

### Drawer structure

```
┌─────────────────────────────────┐
│ ×  Style Check    [Save]        │  ← fixed header
├─────────────────────────────────┤
│ [Spell 4] [Grammar 2] [Style 6] │  ← category filter bar
├─────────────────────────────────┤
│                                 │
│  Article text with highlights   │
│  rendered as inline spans       │
│                                 │
│  (scrollable)                   │
│                                 │
└─────────────────────────────────┘
```

### Category filter buttons

Each button shows the category name + a count badge:
- Count = suggestions of that type not yet dismissed or accepted
- Badge background uses the category border colour token (`--color-spelling-border`, etc.)
- Badge text: white, `font-size: 0.75rem`
- Active filter button: filled with category background colour, border in category border colour
- Inactive: `background: var(--bg-surface)`, `border: 1px solid var(--color-border)`
- Tapping an active filter deactivates it (shows all highlights again)

### Text rendering with highlights

Split `originalText` into sentences on `.`, `!`, `?` followed by whitespace or end of string. Normalise whitespace (collapse multiple spaces/newlines) before matching. Each sentence renders as a `<span>`.

For each sentence, check if any non-dismissed suggestion's `original` text is a substring (after whitespace normalisation). If matched:
- Wrap the matching substring in a `<mark>` with `background: var(--color-{type}-bg)` and `outline: 1px solid var(--color-{type}-border)`
- If `activeFilter` is set, only highlight suggestions of that type; others render as plain text

Tapping a `<mark>` sets `activeSuggestion` to that suggestion object, opening the modal.

Accepted suggestions (in `accepted` map): render with `text-decoration: underline; text-decoration-color: var(--color-accept); text-decoration-style: solid` instead of the highlight background.

### Suggestion Modal

Rendered as a bottom sheet over the drawer (`position: fixed; bottom: 0; left: 0; right: 0; z-index: calc(var(--z-drawer) + 10)`). Use `var(--radius-lg)` on top corners, `var(--shadow-lg)` for elevation.

**Spelling modal:**
```
┌─────────────────────────────────┐
│ 🔴 Spelling                     │
│                                 │
│  recieve → receive              │
│                                 │
│                    [×]  [✓]     │
└─────────────────────────────────┘
```

**Grammar modal:**
```
┌─────────────────────────────────┐
│ 🟡 Grammar                      │
│                                 │
│  [Suggested text shown here]    │
│                                 │
│  Why: Subject-verb agreement:   │
│  'results' is plural.           │
│                                 │
│                    [×]  [✓]     │
└─────────────────────────────────┘
```

**Style modal:**
```
┌─────────────────────────────────┐
│ 🔵 Style                        │
│                                 │
│  [Suggested text shown here]    │
│                                 │
│  Why: 'Shocking' is evaluative. │
│                                 │
│  [Rewrite]         [×]  [✓]     │
└─────────────────────────────────┘
```

**Button specs:**
- ✓ Accept: 36px solid circle, `background: var(--color-accept)`, white tick icon, `border-radius: 50%`
- × Reject: 36px solid circle, `background: var(--color-reject)`, white × icon, `border-radius: 50%`
- Both aligned right, `gap: var(--spacing-sm)` between them
- Rewrite: outlined button, `color: var(--accent-brand)`, `border: 1px solid var(--accent-brand)`, aligned left, same row

**On Accept (✓):**
1. Add `id` to `accepted` map with `suggestion.suggested` as value
2. Add `id` to `dismissed` set
3. Close modal (`activeSuggestion = null`)
4. Highlight on canvas changes to accepted underline style

**On Reject (×):**
1. Add `id` to `dismissed` set
2. Close modal
3. Highlight removed from canvas — text reverts to unstyled

**On Rewrite:**
1. Set `rewriteLoading = true`; show `ThinkingDots` in place of suggested text
2. Call `/api/style-rewrite` with `{ original: activeSuggestion.original, language }`
3. On response: store array in `rewrites` map for this suggestion id; set `rewriteIndex` for this id to 0; set `rewriteLoading = false`
4. Show first rewrite option in the modal
5. Back/forward navigation buttons appear below the text; inactive at boundaries or if only one option

### Save button

On tap Save:
1. Build `editedText` by applying all `accepted` replacements to `originalText` in order (replace `suggestion.original` with `accepted.get(id)` for each accepted id)
2. Call `onSave(editedText)`
3. Close drawer (`onClose()`)

### Checkpoint 6 ✓
Drawer opens over the page. Filter buttons show correct counts. Tapping a filter highlights correct suggestions. Tapping a highlight opens the correct modal type. Accept/reject work and update the canvas. Rewrite calls `/api/style-rewrite` and cycles options. Save produces correct edited text.

---

## Step 7 — Results View

Rendered on the main `/style-check` page after `onSave` fires (`showResults = true`). The input/CTA area is replaced by this layout.

```

├─────────────────────────────────┤
│  Original  (4-line preview)     │  ← label above card 
│  Lorem ipsum dolor sit amet,    │
│  consectetur adipiscing elit.   │
│  Sed do eiusmod tempor…         │
│                        [∨]      │  ← expand chevron, bottom right
├─────────────────────────────────┤

├─────────────────────────────────┤
│  Edited                         │  ← label above card
│  (full edited story)            │
│                                 │
│  [scrollable]                   │
│                                 │
├─────────────────────────────────┤
│  [Copy]  [Share]  [Edit]        │  ← bottom action bar
chevron, bottom right
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  New Style Check                │  ← button link (resets all state)
├─────────────────────────────────┤
```

### Original panel (collapsed by default)

- Fixed height using `-webkit-line-clamp: 4` via CSS
- `background: var(--bg-surface)`, `border-radius: var(--radius)`, `padding: var(--spacing-md)`
- Expand chevron (`icon-expand`) bottom right
- On tap chevron: panel expands to full height, chevron flips to `icon-collapse`

### Expand/collapse mechanic

```javascript
let expandedPanel = $state('edited'); // 'original' | 'edited'
```
Only one panel is expanded at a time. Tapping either chevron flips the state.

### Edited panel

- Renders `editedText` with line breaks preserved (`white-space: pre-wrap`)
- Scrollable if content exceeds viewport

### Bottom action bar

- **Copy**: copies `editedText` to clipboard; button label flashes "Copied ✓" for 1.5s
- **Share**: calls `navigator.share({ text: editedText })` if available; falls back to Copy behaviour
- **Edit**: re-opens `StyleCheckDrawer` with `showDrawer = true` (current accepted state is preserved in component state)

### Checkpoint 7 ✓
Results view renders correctly. Original collapses to 4 lines. Tapping chevron expands original and collapses edited. Copy, Share, Edit all function. "Check another article" resets all state to input view.

---

## Step 8 — Navigation Integration

### `src/lib/components/Header.svelte`

Add Style Check as the fifth item in the `navItems` array:

```javascript
const navItems = [
  { name: 'prompts', path: '/', label: 'Prompts' },
  { name: 'create', path: '/create', label: 'Create' },
  { name: 'notepad', path: '/notepad', label: 'Notepad' },
  { name: 'archive', path: '/archive', label: 'Saved' },
  { name: 'stylecheck', path: '/style-check', label: 'Style' }   // ← add this
];
```

Add the icon to `src/lib/icons.js`:
```javascript
import IconStylecheck from '../../static/icons/icon-stylecheck.svg?raw';
// add to iconMap:
stylecheck: IconStylecheck,
```

### `src/lib/components/SwipeNavigation.svelte`

Append `/style-check` at the end of the pages array:
```javascript
const pages = ['/', '/create', '/notepad', '/archive', '/style-check'];
```

> **Do not modify `static/flam-nav.js`** — that file is a cross-app hamburger menu for the FlamTools suite and is unrelated to the in-app tab navigation.

### Checkpoint 8 ✓
Style Check tab appears at the far right of the header nav. Tapping navigates to `/style-check`. Swipe navigation includes the new page at the end of the sequence.

---

## Step 9 — Integration Testing

Work through this checklist on mobile (or mobile emulation in DevTools):

**Input flow:**
- [ ] Textarea accepts pasted text
- [ ] Language toggle switches between British and US English
- [ ] "Fetch from URL" expands, fetches, populates textarea
- [ ] Failed fetch shows correct error message and leaves URL input visible
- [ ] Check Style button is disabled when textarea is empty
- [ ] Loading state shows correctly while API call is in progress

**Drawer — annotation:**
- [ ] Drawer opens full screen
- [ ] All three filter buttons show correct counts
- [ ] Tapping Spell highlights only spelling suggestions (red)
- [ ] Tapping Grammar highlights only grammar suggestions (yellow)
- [ ] Tapping Style highlights only style suggestions (blue)
- [ ] Tapping a filter again deactivates it (shows all)
- [ ] Tapping a highlight opens the correct modal type

**Drawer — modals:**
- [ ] Spelling modal shows suggested word, ✓ and × buttons only
- [ ] Grammar modal shows suggested text, reason, ✓ and ×
- [ ] Style modal shows suggested text, reason, Rewrite button, ✓ and ×
- [ ] Accept applies green underline to accepted text on canvas
- [ ] Reject removes highlight from canvas
- [ ] Rewrite triggers `/api/style-rewrite` call, shows loading, returns options
- [ ] Back/forward buttons cycle through rewrite options
- [ ] Filter badge counts decrement as suggestions are accepted or rejected

**Save and results:**
- [ ] Tapping Save applies all accepted replacements correctly
- [ ] Results view renders with original (4-line preview) and edited (full)
- [ ] Chevron expands/collapses panels correctly
- [ ] Copy copies edited text to clipboard
- [ ] Share invokes native share sheet (test on actual mobile)
- [ ] Edit re-opens drawer with current state
- [ ] "Check another article" resets to input view

**Edge cases:**
- [ ] Article with zero suggestions: drawer opens, all counts show 0, Save produces identical text
- [ ] Very long article (1000+ words): drawer scrolls, highlights still work
- [ ] All suggestions accepted: Save produces fully edited text with all changes applied
- [ ] API error during Check Style: error message shown on page, input remains editable

---

## File Summary — New Files to Create

| File | Purpose |
|---|---|
| `src/routes/style-check/+page.svelte` | Main Style Check page |
| `src/routes/api/style-check/+server.js` | Claude API proxy for style checking |
| `src/routes/api/style-rewrite/+server.js` | Claude API proxy for rewrite suggestions |
| `src/routes/api/fetch-article/+server.js` | URL article extractor |
| `src/lib/components/StyleCheckDrawer.svelte` | Annotation drawer |

## Files to Modify

| File | Change |
|---|---|
| `src/app.css` | Add 8 new CSS colour tokens for highlights and action buttons |
| `src/lib/icons.js` | Add `stylecheck` icon import and map entry |
| `src/lib/components/Header.svelte` | Add Style Check to `navItems` array |
| `src/lib/components/SwipeNavigation.svelte` | Append `/style-check` to pages array |
| `.env.local` | Add `ANTHROPIC_API_KEY` |
| `AGENTS.md` | Update to document new route and components |

**Do not modify**: `src/lib/stores.js` (no new stores needed), `static/flam-nav.js` (cross-app nav, unrelated), `src/lib/services/perplexity.js`, `src/routes/api/chat/+server.js`.

---

## Notes for the Agent

- **No TypeScript.** JSDoc hints only if needed.
- **Svelte 5 runes throughout.** Use `$state`, `$derived`, `$effect` for all component-local state. Do NOT add `$state` to `.js` files — runes only work in `.svelte` or `.svelte.js` files.
- **No new stores.** All style check state is component-local. Do not modify `src/lib/stores.js`.
- **Vanilla CSS only.** No Tailwind. Use the design tokens from `app.css` for all colours, spacing, and radius. Use the new `--color-*` tokens added in Step 1 for all highlight and button colours.
- **Do not modify** `src/lib/services/perplexity.js` or `src/routes/api/chat/+server.js`.
- **Do not modify** `static/flam-nav.js` — it is a cross-app navigation component unrelated to the in-app tab bar.
- **Whitespace normalisation**: Before matching `suggestion.original` as a substring of a sentence, normalise whitespace in both strings (collapse multiple spaces/newlines to single space, trim) to avoid silent match failures.
- **Build checkpoints in order.** Do not proceed to Step 6 until the API route in Step 2 is returning valid JSON.
- **Rewrite uses a separate endpoint.** The `/api/style-rewrite` route has a different system prompt, user message format, and response shape from `/api/style-check`. Never send rewrite requests to the style-check endpoint.
