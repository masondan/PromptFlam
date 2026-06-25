# PromptFlam — Agent Guide

**Comprehensive guide for AI agents acting as lead coders.**

---

## Quick Start (Read This First)

PromptFlam is a **SvelteKit-based AI writing assistant** for journalists and content creators. Users chat with Perplexity AI, run style checks via Claude, manage prompt templates, and save work locally.

**Key facts:**
- **Tech**: SvelteKit + Svelte 5, vanilla JavaScript (no TypeScript)
- **Data**: localStorage-first architecture (offline-capable)
- **Hosting**: Cloudflare Pages (auto-deploy on `main` push)
- **Live**: https://promptflam.pages.dev
- **Status**: Phase 8 (Live Testing, Version 2.0.0)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | SvelteKit 2.0 | Full-stack meta-framework |
| **UI** | Svelte 5 (runes mode) | Reactive components, no TypeScript |
| **Styling** | Vanilla CSS + design tokens | No Tailwind/SCSS |
| **State** | Svelte stores + localStorage | Auto-persisted, offline-capable |
| **AI (chat)** | Perplexity AI (sonar-pro) | Server-side proxy for security |
| **AI (style)** | Anthropic Claude (claude-sonnet-4-6) | Server-side proxy for security |
| **Hosting** | Cloudflare Pages | Auto-deploy on `main` push |
| **Build** | Vite 6 + SvelteKit adapter | ~70KB gzipped bundle |

**Dependencies**:
- `@sveltejs/kit` (^2.0.0)
- `@sveltejs/adapter-cloudflare` (^4.0.0)
- `svelte` (^5.0.0)
- `marked` (^17.0.1) — Markdown parsing
- `vite` (^6.0.0)

---

## Setup & Development

### Prerequisites
- Node.js 18+
- Git

### Environment
Create `.env.local` (not committed):
```
PERPLEXITY_API_KEY=pplx-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Copy from `.env.example` if needed.

### Commands
```bash
npm install               # Install dependencies
npm run dev              # Dev server at http://localhost:5173 (hot reload)
npm run build            # Production build → .svelte-kit/cloudflare
npm run preview          # Test production build locally
```

### Git Workflow
```bash
git checkout -b feature/your-name
git add .
git commit -m "Description"
git push origin feature/your-name
# → Create PR or merge to main to auto-deploy
```

### Deployment
- **Auto**: Push to `main` → Cloudflare Pages builds & deploys in ~2 min
- **Rollback**: `git revert HEAD && git push origin main`

---

## Architecture Overview

**Three-layer structure:**

1. **Pages** (`src/routes/*.svelte`) — SvelteKit routes with reactive Svelte components
2. **Stores** (`src/lib/stores.js`) — Centralized state management with auto-persistence to localStorage
3. **Services** (`src/lib/services/`) — API clients (Perplexity, storage, utilities)

**Data flow**: User action → Component → Store update → localStorage auto-sync

---

## Project Overview

PromptFlam is a **SvelteKit-based AI writing assistant** designed for journalists and content creators. It provides:

- **Real-time chat** with Perplexity AI (sonar-pro model)
- **Style checking** via Claude AI — spelling, grammar, and editorial style suggestions
- **Prompt library** with 100+ categorized templates
- **Full-featured notepad** with formatting and export
- **Local-first storage** via localStorage (offline-capable)
- **Citation management** with source tracking
- **Persona settings** for customized prompt responses
- **Archive system** with auto-cleanup (max 10 items, 30-day retention)

**Live**: https://promptflam.pages.dev
**GitHub**: https://github.com/masondan/PromptFlam

---

## State Management (`src/lib/stores.js`)

### Core Stores

All stores use `createPersistentStore(key, initialValue)` for auto-sync with localStorage (prefixed `promptflam_`).

#### Chat Session
- `chatMessages` — Current conversation: `[{role, content, timestamp, sources}]`
- `currentChatSessionId` — Archive ID for auto-save (links messages to archive entry)

#### Notes Session
- `currentNoteTitle` — Notepad title
- `currentNoteContent` — Notepad HTML content
- `currentNoteSessionId` — Archive ID for auto-save

#### Archives (max 10 items each, auto-cleanup after 30 days)
- `archiveChats` — `[{id, messages[], timestamp}]`
- `archiveNotes` — `[{id, title, content, timestamp}]`

#### Style Check Session
- `styleCheckInputText` — Article text being checked
- `styleCheckLanguage` — Language preference (default: `'British English'`)
- `styleCheckSuggestions` — `[{id, type, original, suggested, reason, sentenceIndex}]`
- `styleCheckEditedText` — Text after accepting suggestions
- `styleCheckOriginalText` — Original text before editing
- `styleCheckShowResults` — Whether results view is active

#### UI State
- `currentPrompts` — Bracket content for chat input chips: `[{bracketContent}]`
- `favorites` — Favorited prompt subcategories: `['Category-SubCategory', ...]`
- `pendingChatInput` — Pre-filled text from prompt library (transient, not persisted)
- `promptLibraryCategory`, `promptLibrarySubcategory`, `promptLibraryExpandedId`, `promptLibraryScrollY` — Library navigation state
- `personaRole`, `personaAudience` — User persona settings (replaces [role] and [who, where] tags)

### Helper Functions

**Chat operations:**
```javascript
addChatMessage(role, content, sources)    // Add to session
updateLastMessage(content, sources)       // Update last (for streaming)
clearChat()                               // Clear session (transient)
archiveCurrentChat()                      // Save & reset
autoSaveChat()                            // Update archive (called after AI response)
restoreChat(archivedChat)                 // Load from archive
startNewChat()                            // Archive + reset
```

**Note operations:**
```javascript
autoSaveNote()                            // Update archive entry
startNewNote()                            // Reset title + content
restoreNote(archivedNote)                 // Load from archive
archiveNote(title, content)               // Save & reset
```

**Style Check operations:**
```javascript
clearStyleCheckSession()                  // Reset all style check state
```

**Utilities:**
```javascript
cleanupOldArchives()                      // Remove 30+ day items (call on app init)
clearSessionStores()                      // Reset transient state (called on page load)
toggleFavorite(category, subCategory)     // Toggle favorite
isFavorite(category, subCategory, favsList) // Check favorite status
```

---

## Services Layer

### Perplexity Service (`src/lib/services/perplexity.js`)

```javascript
callPerplexity(messages, onChunk, signal)
  // → Calls POST /api/chat (server proxy)
  // → Streams response chunks to onChunk callback
  // → Returns {content, sources, aborted}
```

**How streaming works:**
1. Client calls `callPerplexity()` with message array
2. Service POSTs to `/api/chat` (our server endpoint)
3. Server forwards to Perplexity API with `stream: true`
4. Server pipes chunks back as `text/event-stream`
5. Client reads chunks as `data: {content: '...'}`
6. `onChunk()` callback fires for each chunk (UI updates in real-time)
7. At completion, server sends `data: {citations: [...]}`

**Citation normalization**: Converts `text[1].` → `text.[1]` (citation placement after punctuation)

### Storage Service (`src/lib/services/storage.js`)

Simple localStorage wrapper. Currently minimal; stores handle persistence directly via `createPersistentStore`.

---

## API Routes

### POST `/api/chat` (Perplexity Proxy)
**File**: `src/routes/api/chat/+server.js`

- Reads `PERPLEXITY_API_KEY` from server env (never exposed to browser)
- Injects `SYSTEM_PROMPT` to guide AI formatting and tone
- Converts streaming to `text/event-stream` for real-time display
- Extracts citations from Perplexity response

**Config:** Model `sonar-pro`, temperature 0.7, max tokens 8000, search recency: month

### POST `/api/style-check` (Claude Style Check)
**File**: `src/routes/api/style-check/+server.js`

- Reads `ANTHROPIC_API_KEY` from server env
- Accepts `{ text: string, language: string }`
- Loads system prompt from `static/style-check-system-prompt.md`
- Uses few-shot examples to guide Claude's judgment
- Returns JSON array of suggestion objects: `[{id, type, original, suggested, reason, sentenceIndex}]`

**Config:** Model `claude-sonnet-4-6`, temperature 0.3, max tokens 4000

### POST `/api/style-rewrite` (Claude Style Rewrite)
**File**: `src/routes/api/style-rewrite/+server.js`

- Reads `ANTHROPIC_API_KEY` from server env
- Rewrites selected text based on style check suggestions

### POST `/api/metadata`
**File**: `src/routes/api/metadata/+server.js`

Fetches Open Graph title/description from citation URLs (5s timeout, 50KB limit). Infrastructure ready; not yet integrated in UI.

---

## Components (`src/lib/components/`, 18 total)

Organized by feature:

**Page-wide:**
- [`Header.svelte`](src/lib/components/Header.svelte) — Fixed nav with page buttons + logo

**Chat (Create page):**
- [`ChatInput.svelte`](src/lib/components/ChatInput.svelte) — Message input + bracket-chip system
- [`ChatMessage.svelte`](src/lib/components/ChatMessage.svelte) — Individual message + citations + action menu
- [`PromptCard.svelte`](src/lib/components/PromptCard.svelte) — User prompt display (search result style)
- [`PromptDrawer.svelte`](src/lib/components/PromptDrawer.svelte) — Fullscreen prompt library overlay
- [`SourcesDrawer.svelte`](src/lib/components/SourcesDrawer.svelte) — Citation details drawer
- [`TextSelectionMenu.svelte`](src/lib/components/TextSelectionMenu.svelte) — Inline menu on text selection (copy, rewrite, expand, shorten)
- [`ThinkingDots.svelte`](src/lib/components/ThinkingDots.svelte) — Loading animation while waiting for AI

**Prompts Library:**
- [`PromptLibrary.svelte`](src/lib/components/PromptLibrary.svelte) — Main library UI (filter, search, favorites)
- [`PromptEditDrawer.svelte`](src/lib/components/PromptEditDrawer.svelte) — Drawer version of library (for inserting)

**Notepad:**
- [`NotepadSelectionMenu.svelte`](src/lib/components/NotepadSelectionMenu.svelte) — Inline menu for text selection in notepad
- [`NotepadToolbar.svelte`](src/lib/components/NotepadToolbar.svelte) — Formatting buttons (bold, italic, list, font size, undo/redo)

**Style Check:**
- [`StyleCheckDrawer.svelte`](src/lib/components/StyleCheckDrawer.svelte) — Drawer showing style suggestions with accept/dismiss controls

**Archive:**
- [`ArchiveItem.svelte`](src/lib/components/ArchiveItem.svelte) — Chat/note card with menu (restore, download, share, delete)

**UI Utilities:**
- [`Icon.svelte`](src/lib/components/Icon.svelte) — SVG icon renderer by name
- [`SwipeNavigation.svelte`](src/lib/components/SwipeNavigation.svelte) — Touch swipe navigation between pages
- [`PersonaSettingsDrawer.svelte`](src/lib/components/PersonaSettingsDrawer.svelte) — Persona settings modal

**Export:** [`src/lib/components/index.js`](src/lib/components/index.js) — Barrel export all components

---

## Pages & Routes

### Home / Prompts Library (`src/routes/+page.svelte`)
Browse and search prompt library from `static/prompts.json`.

**Features:**
- Category filtering and search
- Favorite toggle (persisted)
- Copy prompt to clipboard
- **Tap edit icon on prompt** → Opens `PromptEditDrawer` (overlay modal)
- Insert prompt into chat (via drawer)
- Persona settings button (upper right)

### Create (`src/routes/create/+page.svelte`)
Main chat interface with Perplexity AI.

**Key state:**
- `inputValue` — Chat input text
- `isLoading` — Waiting for API response
- `isStreaming` — Actively receiving chunks
- `streamingContent` — Accumulated streamed response
- `showPromptDrawer` — Prompt library open (fullscreen)
- `showSourcesDrawer` — Citations drawer open
- `abortController` — Cancel ongoing requests
- `errorMessage` — API error display

**Key flows:**
1. User sends message → `handleSend()` → add to `chatMessages`
2. Call `callPerplexity()` with streaming callback
3. On first chunk → add empty assistant message
4. On chunks → `updateLastMessage()` with accumulated content
5. On complete → `updateLastMessage()` with final content + sources → `autoSaveChat()`
6. On abort → remove empty message or keep partial response

### Notepad (`src/routes/notepad/+page.svelte`)
Full-page text editor with formatting toolbar.

**Features:**
- Contenteditable divs (title + content)
- Formatting toolbar (bold, italic, list, font size, undo, redo)
- Auto-save on input change (debounced 2s)
- Download as `.txt` file
- Share via system API
- "Start Over" archives and resets

### Style Check (`src/routes/style-check/+page.svelte`)
AI-powered editorial style checker using Claude.

**Features:**
- Paste or type article text
- Select language (British English / American English)
- Sends to `/api/style-check` → Claude returns JSON suggestions
- `StyleCheckDrawer` shows suggestions grouped by type (spelling, grammar, style)
- Accept or dismiss individual suggestions
- Accepted suggestions applied to edited text
- Copy or send edited text to Notepad
- Session state persists across page refreshes

### Archive (`src/routes/archive/+page.svelte`)
Saved chats and notes.

**Features:**
- Two tabs: Chats | Notes
- Click item → restore to Create/Notepad
- Three-dot menu → Download, Share, Delete
- "Clear All" with confirmation
- Timestamp + preview text

### Style Guide (`src/routes/style-guide/+page.svelte`)
Editorial style guide reference page (static content from `static/style-guide.md`)

---

## Icon System

**Location**: `static/icons/` (40+ SVG icons)

**Naming convention:**
- Outline: `icon-{name}.svg`
- Filled: `icon-{name}-fill.svg`
- All: 24×24px at 2px stroke weight

**Import method:** Icons are imported as **raw SVG strings** (using `?raw` in Vite), not as components. This allows inline SVG rendering with CSS control.

**Usage:**
```javascript
// In src/lib/icons.js — import as raw string and add to iconMap:
import IconMyicon from '../../static/icons/icon-myicon.svg?raw';
export const iconMap = {
  myicon: IconMyicon,
  // ...
};

// In component:
import Icon from '$lib/components/Icon.svelte';
<Icon name="myicon" size={24} />
```

The `Icon.svelte` component renders the SVG string inline and applies styling via props.

---

## Global Styles (`src/app.css`)

**Design tokens** (CSS variables in `:root`):

**Colors:**
```css
--bg-main: #ffffff              /* Main background */
--bg-surface: #f8f8f8           /* Card/elevated backgrounds */
--text-primary: #1f1f1f         /* Primary text */
--text-secondary: #777777       /* Secondary text */
--accent-brand: #5422b0         /* Primary accent (purple) */
--color-border: #e0e0e0         /* Borders */
--color-highlight: #F0E6F7      /* Highlight/selection */
```

**Spacing:** `--spacing-xs` (4px) → `--spacing-xl` (32px)  
**Typography:** `--font-size-base` (1rem) → `--font-size-h1` (1.5rem)  
**Shadows:** `--shadow-sm`, `--shadow-md`  
**Radius:** `--radius` (12px), `--radius-sm` (6px), `--radius-lg` (16px)

All components use CSS variables for consistency.

---

## Common Patterns

### Adding a New Store
```javascript
// src/lib/stores.js
export const myStore = createPersistentStore('myKey', defaultValue);

// In component
import { myStore } from '$lib/stores.js';
<div>{$myStore}</div>
```

### Adding a New Icon
```javascript
// 1. Place SVG in static/icons/icon-myicon.svg
// 2. Import and add to iconMap in src/lib/icons.js:
import IconMyicon from '../../static/icons/icon-myicon.svg?raw';
export const iconMap = { myicon: IconMyicon, ... };

// 3. Use in component
<Icon name="myicon" size={24} />
```

### Creating an API Route
```javascript
// src/routes/api/myroute/+server.js
export async function POST({ request }) {
  const { data } = await request.json();
  return new Response(JSON.stringify({ result: data }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Call from client
const res = await fetch('/api/myroute', {
  method: 'POST',
  body: JSON.stringify({ data: 'value' })
});
```

---

## Key Conventions

### Naming
- Svelte components: PascalCase (`ChatMessage.svelte`)
- Store functions: camelCase (`addChatMessage()`)
- CSS variables: kebab-case (`--bg-main`)
- Routes: lowercase with `+` prefix (`+page.svelte`, `+layout.svelte`, `+server.js`)

### Code Style
- **No TypeScript** — Use JSDoc for type hints if needed
- **Vanilla CSS** — No Tailwind/SCSS; use design tokens
- **Svelte 5** — Runes mode (`$state`, `$effect`)
- **ES modules** — `import`/`export`

### Patterns
- **Persistence**: Always use `createPersistentStore` for user data
- **Streaming**: Use `onChunk` callback for real-time updates
- **Errors**: Display in UI; log to console; never expose API keys
- **Cleanup**: 30-day archive auto-cleanup; max 10 items per type

---

## File Structure

```
src/
├── routes/
│   ├── +page.svelte              (Prompts library — home page)
│   ├── +layout.svelte            (Root layout + header)
│   ├── create/+page.svelte       (Create/Chat page)
│   ├── notepad/+page.svelte      (Text editor)
│   ├── archive/+page.svelte      (Saved items)
│   ├── style-check/+page.svelte  (Style checker)
│   ├── style-guide/+page.svelte  (Editorial style guide)
│   └── api/
│       ├── chat/+server.js       (Perplexity proxy)
│       ├── style-check/+server.js (Claude style check)
│       ├── style-rewrite/+server.js (Claude style rewrite)
│       └── metadata/+server.js   (URL metadata fetcher)
│
├── lib/
│   ├── stores.js                 (All state management)
│   ├── services/
│   │   ├── perplexity.js         (AI client)
│   │   └── storage.js            (localStorage wrapper)
│   ├── components/
│   │   ├── Header.svelte
│   │   ├── ChatInput.svelte
│   │   ├── ChatMessage.svelte
│   │   ├── PromptLibrary.svelte
│   │   ├── SourcesDrawer.svelte
│   │   ├── TextSelectionMenu.svelte
│   │   ├── NotepadToolbar.svelte
│   │   ├── StyleCheckDrawer.svelte
│   │   ├── ArchiveItem.svelte
│   │   └── ... (9 more)
│   ├── icons.js                  (Icon map — raw SVG strings)
│   ├── utils.js                  (Shared utilities)
│   └── utils/
│       └── formatTime.js         (Timestamp formatter)
│
├── app.html                      (HTML shell)
├── app.css                       (Global styles + tokens)
└── service-worker.js             (PWA service worker)

static/
├── prompts.json                  (Prompt library data — 100+ templates)
├── style-guide.md                (Editorial guidelines — markdown)
├── style-check-system-prompt.md  (Claude system prompt for style check)
├── flam-nav.js                   (Navigation configuration)
├── icons/                        (40+ SVG icons)
├── fonts/                        (Saira and Inter variable fonts)
├── logos/                        (App icons, favicons, OG images)
└── manifest.json                 (PWA metadata)
```

---

## Debugging

### Check localStorage
```javascript
// Browser console
JSON.parse(localStorage.getItem('promptflam_chatMessages'))
localStorage.clear() // Nuclear option
```

### Watch API calls
**DevTools → Network tab:**
- Chat: `POST /api/chat` — response type `text/event-stream`
- Style check: `POST /api/style-check` — response type `application/json`

### Watch stores in real-time
```javascript
// In .svelte component
import { chatMessages } from '$lib/stores.js';
$: console.log('Messages updated:', $chatMessages);
```

---

## Performance

- **Bundle size**: ~70KB gzipped (SvelteKit + marked + dependencies)
- **Streaming**: Token-by-token animation prevents UI freeze
- **localStorage**: Synchronous but fast; ~5MB typical max
- **Icons**: Imported as raw SVG strings; tree-shaken by Vite
- **Code splitting**: Page components split by route (automatic)

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (desktop & iOS)
- Android Chrome 90+

**Not supported**: IE 11, older mobile browsers

---

## Testing

Manual testing is primary. Vitest/Playwright are available as dependencies but not yet integrated.

**Test Checklist**:
1. `npm run dev`
2. Open http://localhost:5173
3. Send message → watch streaming
4. Open DevTools Network → see `/api/chat` stream
5. Switch pages (Prompts, Notepad, Archive, Style Check)
6. Paste article into Style Check → verify suggestions load
7. Refresh → check localStorage persistence
8. Test on mobile

---

## Cost

- **Perplexity API**: $0.50–2/month (light usage)
- **Anthropic API**: Variable (Claude style check calls)
- **Cloudflare Pages**: Free
- **Domain**: Free (`.pages.dev` subdomain)

---

## Useful Links

- **Live app**: https://promptflam.pages.dev
- **GitHub repo**: https://github.com/masondan/PromptFlam
- **Perplexity docs**: https://docs.perplexity.ai/
- **Anthropic docs**: https://docs.anthropic.com/
- **SvelteKit docs**: https://kit.svelte.dev/
- **Svelte 5 docs**: https://svelte.dev/docs/svelte/5-migration-guide

---

**Maintained by**: Dan Mason
**License**: ISC
**Last Updated**: June 2026
