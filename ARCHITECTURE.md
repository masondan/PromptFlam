# Architecture Guide

Technical reference for PromptFlam SvelteKit implementation. Read this to understand how the app works.

---

## Core Concepts

**Three-layer architecture:**
1. **Pages** (`src/routes/*.svelte`) — SvelteKit routes, subscribe to stores
2. **Stores** (`src/lib/stores.js`) — Reactive state with localStorage persistence
3. **Services** (`src/lib/services/`) — API calls (Perplexity, metadata, storage)

**Data flow**: User action → Component → Store update → localStorage auto-sync

---

## State Management (`src/lib/stores.js`)

All stores use `createPersistentStore()` helper that auto-syncs to localStorage.

### Core Stores

**Chat Session**:
- `chatMessages` — Current conversation `[{role, content, timestamp, sources}]`
- `currentChatSessionId` — Tracks which archive entry to update (for auto-save)

**Notepad Session**:
- `currentNoteTitle` — Editor title
- `currentNoteContent` — Editor body (HTML)
- `currentNoteSessionId` — Tracks which archive entry to update

**Archive** (max 10 items each, auto-cleanup after 30 days):
- `archiveChats` — `[{id, messages[], timestamp}]`
- `archiveNotes` — `[{id, title, content, timestamp}]`

**Other**:
- `currentPrompts` — Bracket content in chat input
- `favorites` — `['Category-SubCategory', ...]`

### Helper Functions

```javascript
// Chat operations
addChatMessage(role, content, sources)    // Add to current session
updateLastMessage(content, sources)       // Update streaming response
clearChat()                               // Clear current session
startNewChat()                            // Archive + reset
autoSaveChat()                            // Update/create archive entry
restoreChat(archivedChat)                 // Load from archive

// Note operations
autoSaveNote()                            // Update/create archive entry
startNewNote()                            // Reset title + content
restoreNote(archivedNote)                 // Load from archive

// Utilities
cleanupOldArchives()                      // Remove 30+ day old items
toggleFavorite(category, subcategory)     // Toggle favorite
isFavorite(category, subcategory, favsList) // Check if favorited
```

---

## Services Layer

### Perplexity Service (`src/lib/services/perplexity.js`)

```javascript
callPerplexity(messages, onChunk, signal)
// → Calls POST /api/chat (our server proxy)
// → Streams response chunks to onChunk callback
// → Returns {content, sources, aborted}
```

**How streaming works:**
1. Client calls `callPerplexity()` with message array
2. Service POSTs to `/api/chat` (our endpoint)
3. Server forwards to Perplexity API with `stream: true`
4. Server pipes chunks back to client as `text/event-stream`
5. Client receives `data: {content: '...'}` chunks
6. `onChunk()` callback fires for each chunk (UI updates in real-time)
7. At end, server sends `data: {citations: [...]}`

**Citation normalization**: Converts `text[1].` → `text.[1]` (citation after punctuation)

### Storage Service (`src/lib/services/storage.js`)

Simple localStorage wrapper (currently minimal usage; stores handle persistence directly).

---

## API Routes

### POST `/api/chat` (Secure Proxy)

**Server file**: `src/routes/api/chat/+server.js`

**Key features**:
- Reads `PERPLEXITY_API_KEY` from server-side env (never exposed to browser)
- Injects `SYSTEM_PROMPT` to guide AI behavior (formatting, tone, citations)
- Converts streaming response to `text/event-stream` for real-time display
- Extracts citations from Perplexity response
- Handles errors gracefully

**Model**: `sonar` (Perplexity's default)  
**Config**: `temperature: 0.7`, `max_tokens: 1500`, `search_recency_filter: month`

### POST `/api/metadata`

**Server file**: `src/routes/api/metadata/+server.js`

**Fetches**: Open Graph `title`, `description` from URLs  
**Timeout**: 5 seconds per URL  
**Read limit**: First 50KB of HTML (stops at `</head>`)

Used to enrich citation display in UI (currently not integrated in components; infrastructure ready).

---

## Components (`src/lib/components/`)

**17 Svelte components** organized by function:

### Page Components
- `Header.svelte` — Fixed nav bar with 4 page buttons

### Chat (Create Page)
- `ChatInput.svelte` — Message input + bracket-chip system + send button
- `ChatMessage.svelte` — Renders individual message + citations
- `PromptDrawer.svelte` — Drawer to insert prompts into chat
- `SourcesDrawer.svelte` — View full citation details
- `TextSelectionMenu.svelte` — Inline menu on text selection (copy, rewrite, expand, shorten)
- `ThinkingDots.svelte` — Loading animation while waiting for AI

### Prompts Library
- `PromptLibrary.svelte` — Main library UI (category filter, search, favorites)
- `PromptCard.svelte` — Single prompt card + favorite/copy buttons
- `PromptEditDrawer.svelte` — Drawer version of library (for inserting into chat)

### Notepad (Edit Page)
- `NotepadToolbar.svelte` — Formatting buttons (bold, italic, list, font size, undo, redo)
- `NotepadSelectionMenu.svelte` — Inline menu on text selection in notepad

### Archive (Saved Items)
- `ArchiveItem.svelte` — Single chat/note card with menu (restore, download, share, delete)

### Utilities
- `Icon.svelte` — Renders SVG icons by name with size + variant
- `index.js` — Barrel export of all components

---

## Icon System

**Location**: `static/icons/` (40+ SVG icons)

**Naming**: 
- Outline: `icon-{name}.svg`
- Filled: `icon-{name}-fill.svg`
- All 24×24px at 2px stroke weight

**Import**: 
```javascript
// In src/lib/icons.js:
export { default as IconCreate } from '../../static/icons/icon-create.svg?component';

// In components:
import Icon from '$lib/components/Icon.svelte';
<Icon name="create" size={24} />
```

---

## Global Styles (`src/app.css`)

**Design tokens** in `:root`:

Colors:
```css
--bg-main: #ffffff
--bg-surface: #f8f8f8
--text-primary: #1f1f1f
--text-secondary: #777777
--accent-brand: #5422b0
--color-border: #e0e0e0
--color-highlight: #F0E6F7
```

Spacing: `--spacing-xs` (4px) → `--spacing-xl` (32px)  
Typography: `--font-size-base` (1rem) → `--font-size-h1` (1.5rem)  
Shadows: `--shadow-sm`, `--shadow-md`  
Radius: `--radius` (12px), `--radius-sm` (6px), `--radius-lg` (16px)

**Scoped styles** in components use CSS variables for consistency.

---

## Page Details

### Create Page (`src/routes/+page.svelte`)

**Key state**:
```javascript
let inputValue = '';              // Chat input text
let isLoading = false;            // Waiting for API
let isStreaming = false;          // Actively receiving chunks
let streamingContent = '';        // Current streamed response
let showPromptDrawer = false;     // Prompt library drawer open
let showSourcesDrawer = false;    // Citations drawer open
let abortController = null;       // For canceling requests
```

**Key flows**:
1. User sends message → `handleSend()` → adds to `chatMessages`
2. Call `callPerplexity()` with streaming callback
3. On first chunk → add empty assistant message
4. On chunks → `updateLastMessage()` with accumulated content
5. On complete → `updateLastMessage()` with final content + sources → `autoSaveChat()`
6. On abort → remove empty message or keep partial response

**Text selection menu**: Show on text selection in AI response (copy, rewrite, expand, shorten)

### Prompts Page (`src/routes/prompts/+page.svelte`)

Displays `static/prompts.json` with:
- Category filtering
- Search by title/description
- Favorite toggle (persisted in `favorites` store)
- Copy prompt to clipboard

### Notepad Page (`src/routes/notepad/+page.svelte`)

**Key features**:
- Contenteditable divs for title + content
- Formatting buttons (bold, italic, list, font size, undo, redo, more menu)
- Auto-save on input change (debounced 2s)
- Download as `.txt` file
- Share via system API
- "Start Over" clears and archives

**HTML to Markdown**: Converts formatting tags when exporting

### Archive Page (`src/routes/archive/+page.svelte`)

**Two tabs**: Chats | Edits

**Per item**:
- Click → restore to Create/Notepad page
- Three-dot menu → Download, Share, Delete
- Timestamp + preview text

**"Clear All"**: Confirmation modal, then delete all items in current tab

---

## Data Persistence

**localStorage keys** (all prefixed with `promptflam_`):
```
promptflam_chatMessages
promptflam_currentChatSessionId
promptflam_currentNoteTitle
promptflam_currentNoteContent
promptflam_currentNoteSessionId
promptflam_archiveChats
promptflam_archiveNotes
promptflam_currentPrompts
promptflam_favorites
```

**Auto-sync**: Every store update → `localStorage.setItem()` (synchronous, fast)

**Limits**:
- Max 10 items per archive type
- Items older than 30 days auto-removed
- Browser warning at 80% capacity (typical: 5–10MB available)

---

## Environment Setup

**`.env.local`** (not committed):
```
PERPLEXITY_API_KEY=pplx-your-key-here
```

**`.env.example`** (committed, shows structure):
```
PERPLEXITY_API_KEY="your-key-here"
```

**SvelteKit config** (`svelte.config.js`):
- Adapter: `@sveltejs/adapter-cloudflare`
- Preprocessor: `vitePreprocess`

---

## Build & Deployment

**Local**:
```bash
npm run dev           # http://localhost:5173 (hot reload)
npm run build         # Build to .svelte-kit/cloudflare
npm run preview       # Test production build locally
```

**Production** (Cloudflare Pages):
1. Push to `main` branch
2. GitHub webhook triggers build
3. `npm run build` runs automatically
4. Deployed to CDN within 2–3 minutes
5. Live at `https://promptflam.pages.dev`

**Rollback**: `git revert HEAD && git push origin main`

---

## Common Patterns

### Adding a New Store

```javascript
// In src/lib/stores.js
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

### Creating API Route

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
- **localStorage**: Synchronous but fast; max ~5MB typical
- **Icons**: Imported as components; tree-shaken by Vite
- **Lazy loading**: Page components split by route (automatic with SvelteKit)

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Android Chrome 90+

**Not supported**: IE 11, older mobile browsers (localStorage, fetch limitations)

---

## Accessibility (WCAG 2.1 AA)

- Keyboard navigation: Tab through all interactive elements
- Color contrast: 4.5:1 for normal text (purple `#5422b0` on white background)
- ARIA labels: Icons + buttons have `aria-label`
- Focus indicators: Visible outline on interactive elements
- Forms: Proper semantic HTML

---

## Debugging Tips

### Check localStorage
```javascript
// In browser console
JSON.parse(localStorage.getItem('promptflam_chatMessages'))
localStorage.clear() // Nuclear option: clear all data
```

### Check API calls
**DevTools → Network tab**:
- Look for `POST /api/chat` (not direct Perplexity call)
- Response type: `text/event-stream`
- Check for error status codes

### Watch stores in real-time
```javascript
// In .svelte component
import { chatMessages } from '$lib/stores.js';
$: console.log('Messages updated:', $chatMessages);
```

---

## Testing (Manual)

**Not yet automated** (Vitest/Playwright ready in SvelteKit but not integrated).

**Manual flow**:
1. `npm run dev`
2. Open http://localhost:5173
3. Type message → send → watch streaming response
4. Open DevTools Network tab to see `/api/chat` stream
5. Switch pages (Prompts, Notepad, Archive) → test functionality
6. Refresh page → check localStorage persistence
7. Test on mobile (iPhone Safari, Android Chrome)

---

## File Structure Summary

```
src/
├── routes/          (5 pages + 2 API endpoints)
├── lib/
│   ├── stores.js    (9 stores + helpers)
│   ├── services/    (2 services)
│   ├── components/  (17 components)
│   ├── utils/       (utility functions)
│   └── icons.js     (icon exports)
├── app.svelte       (root)
└── app.css          (design tokens)

static/
├── prompts.json     (prompt library)
├── icons/           (40+ SVG icons)
├── manifest.json    (PWA)
└── *.png            (logos)
```

---

**Last Updated**: Dec 21, 2025
