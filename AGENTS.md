# PromptFlam — Agent Guide

**Comprehensive guide for AI agents acting as lead coders.**

---

## Quick Start (Read This First)

PromptFlam is a **SvelteKit-based AI writing assistant** for journalists and content creators. Users chat with Perplexity AI, manage prompt templates, and save work locally.

**Key facts:**
- **Tech**: SvelteKit 2 + Svelte 5, vanilla JavaScript (no TypeScript)
- **Data**: localStorage-first architecture (offline-capable)
- **Hosting**: Cloudflare Pages (auto-deploy on `main` push)
- **Live**: https://promptflam.pages.dev
- **Status**: Phase 8 (Live Testing, Version 2.0.0)

---

## Setup & Development

### Prerequisites
- Node.js 18+
- Git

### Environment
Create `.env.local` (not committed):
```
PERPLEXITY_API_KEY=pplx-your-key-here
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

#### UI State
- `currentPrompts` — Bracket content for chat input chips: `[{bracketContent}]`
- `favorites` — Favorited prompt subcategories: `['Category-SubCategory', ...]`
- `pendingChatInput` — Pre-filled text from prompt library (transient)
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

### POST `/api/chat` (Secure Proxy)
**File**: `src/routes/api/chat/+server.js`

**Key features:**
- Reads `PERPLEXITY_API_KEY` from server env (never exposed to browser)
- Injects `SYSTEM_PROMPT` to guide AI formatting and tone
- Converts streaming to `text/event-stream` for real-time display
- Extracts citations from Perplexity response

**Config:**
- **Model**: `sonar` (Perplexity default)
- **Temperature**: 0.7
- **Max tokens**: 1500
- **Search recency**: month

### POST `/api/metadata`
**File**: `src/routes/api/metadata/+server.js`

Fetches Open Graph title/description from citation URLs (5s timeout, 50KB limit). Infrastructure ready; not yet integrated in UI.

---

## Components (`src/lib/components/`, 16 total)

Organized by feature:

**Page-wide:**
- `Header.svelte` — Fixed nav with 4 page buttons + logo

**Chat (Create page):**
- `ChatInput.svelte` — Message input + bracket-chip system
- `ChatMessage.svelte` — Individual message + citations + action menu
- `PromptCard.svelte` — User prompt display (search result style)
- `PromptDrawer.svelte` — Fullscreen prompt library overlay
- `SourcesDrawer.svelte` — Citation details drawer
- `TextSelectionMenu.svelte` — Inline menu on text selection (copy, rewrite, expand, shorten)
- `ThinkingDots.svelte` — Loading animation while waiting for AI

**Prompts Library:**
- `PromptLibrary.svelte` — Main library UI (filter, search, favorites)
- `PromptEditDrawer.svelte` — Drawer version of library (for inserting)

**Notepad:**
- `NotepadSelectionMenu.svelte` — Inline menu for text selection in notepad
- `NotepadToolbar.svelte` — Formatting buttons (bold, italic, list, font size, undo/redo)

**Archive:**
- `ArchiveItem.svelte` — Chat/note card with menu (restore, download, share, delete)

**UI Utilities:**
- `Icon.svelte` — SVG icon renderer by name
- `SwipeNavigation.svelte` — Touch swipe navigation between pages
- `PersonaSettingsDrawer.svelte` — Persona settings modal

**Export:** `src/lib/components/index.js` — Barrel export all components

---

## Pages & Routes

### Create (`src/routes/+page.svelte`)
Main chat interface.

**Key state:**
- `inputValue` — Chat input text
- `isLoading` — Waiting for API response
- `isStreaming` — Actively receiving chunks
- `streamingContent` — Accumulated streamed response
- `showPromptDrawer` — Prompt library open
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

### Prompts (`src/routes/prompts/+page.svelte`)
Browse prompt library from `static/prompts.json`.

**Features:**
- Category filtering
- Search by title/description
- Favorite toggle (persisted)
- Copy to clipboard
- Insert into chat (via drawer)

### Notepad (`src/routes/notepad/+page.svelte`)
Text editor with formatting.

**Features:**
- Contenteditable divs (title + content)
- Formatting toolbar (bold, italic, list, font size, undo, redo, more)
- Auto-save on input change (debounced 2s)
- Download as `.txt` file
- Share via system API
- "Start Over" archives and resets

### Archive (`src/routes/archive/+page.svelte`)
Saved chats and notes.

**Features:**
- Two tabs: Chats | Notes
- Click item → restore to Create/Notepad
- Three-dot menu → Download, Share, Delete
- "Clear All" with confirmation
- Timestamp + preview text

---

## Icon System

**Location**: `static/icons/` (40+ SVG icons)

**Naming convention:**
- Outline: `icon-{name}.svg`
- Filled: `icon-{name}-fill.svg`
- All: 24×24px at 2px stroke weight

**Usage:**
```javascript
// In src/lib/icons.js (export):
export { default as IconCreate } from '../../static/icons/icon-create.svg?component';

// In component:
import Icon from '$lib/components/Icon.svelte';
<Icon name="create" size={24} variant="fill" />
```

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
// 2. Export in src/lib/icons.js
export { default as IconMyicon } from '../../static/icons/icon-myicon.svg?component';

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

## Performance Notes

- **Bundle size**: ~70KB gzipped (SvelteKit + marked + dependencies)
- **Streaming**: Token-by-token animation prevents UI freeze
- **localStorage**: Synchronous but fast; ~5MB typical max
- **Icons**: Imported as components; tree-shaken by Vite
- **Code splitting**: Page components split by route (automatic)

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (desktop & iOS)
- Android Chrome 90+

**Not supported**: IE 11, older mobile browsers

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
- Look for `POST /api/chat` (not direct Perplexity call)
- Response type: `text/event-stream`

### Watch stores in real-time
```javascript
// In .svelte component
import { chatMessages } from '$lib/stores.js';
$: console.log('Messages updated:', $chatMessages);
```

---

## Cost

- **Perplexity API**: $0.50–2/month (light usage)
- **Cloudflare Pages**: Free
- **Domain**: Free (`.pages.dev` subdomain)
- **Total**: ~$1–2/month

---

## Testing

**Manual only** (Vitest/Playwright ready but not integrated).

1. `npm run dev`
2. Open http://localhost:5173
3. Send message → watch streaming
4. Open DevTools Network → see `/api/chat` stream
5. Switch pages (Prompts, Notepad, Archive)
6. Refresh → check localStorage persistence
7. Test on mobile

---

## File Structure

```
src/
├── routes/
│   ├── +page.svelte              (Create/Chat page)
│   ├── +layout.svelte            (Root layout + header)
│   ├── prompts/+page.svelte      (Prompt library)
│   ├── notepad/+page.svelte      (Text editor)
│   ├── archive/+page.svelte      (Saved items)
│   └── api/
│       ├── chat/+server.js       (Perplexity proxy)
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
│   │   ├── ArchiveItem.svelte
│   │   └── ... (8 more)
│   ├── icons.js                  (Icon barrel export)
│   ├── utils.js                  (Shared utilities)
│   └── utils/
│       └── formatTime.js         (Timestamp formatter)
│
├── app.svelte                    (Root component)
└── app.css                       (Global styles + tokens)

static/
├── prompts.json                  (Prompt library data)
├── icons/                        (40+ SVG icons)
├── manifest.json                 (PWA metadata)
└── *.png                         (Logo & app icons)
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

## Useful Links

- **Live app**: https://promptflam.pages.dev
- **GitHub repo**: https://github.com/masondan/PromptFlam
- **Perplexity docs**: https://docs.perplexity.ai/
- **SvelteKit docs**: https://kit.svelte.dev/

---

**Last Updated**: Feb 11, 2026
