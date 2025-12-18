# Architecture Guide

Complete technical reference for PromptFlam SvelteKit implementation.

---

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte           Create page (AI chat)
│   ├── +layout.svelte         Root layout with header/nav
│   ├── prompts/
│   │   └── +page.svelte       Prompts library page
│   ├── edit/
│   │   └── +page.svelte       Draft editor page
│   └── archive/
│       └── +page.svelte       Saved chats & edits archive
│
├── lib/
│   ├── stores.js              State management (all stores)
│   │
│   ├── services/
│   │   ├── perplexity.js      Perplexity API wrapper
│   │   └── storage.js         localStorage abstraction
│   │
│   ├── components/
│   │   ├── Icon.svelte        Reusable icon wrapper
│   │   ├── Header.svelte      Top navigation bar
│   │   ├── ChatMessage.svelte Single message display
│   │   ├── ChatInput.svelte   Input field + send button
│   │   └── ...
│   │
│   └── icons.js               Icon barrel export
│
├── app.svelte                 Root component
└── app.css                    Global styles

public/
├── icons/                     All SVG icons (24×24px)
└── [images, logos]
```

---

## State Management (Svelte Stores)

Located in: `src/lib/stores.js`

### Core Stores

#### `chatMessages`
```javascript
// Array of message objects
[
  {
    id: 'msg-1',
    role: 'user' | 'assistant',
    content: 'Your message text',
    timestamp: Date,
    sources: [{ title, url, snippet }]  // For AI responses
  },
  ...
]
```

#### `currentPrompts`
```javascript
// Bracket content in active chat input
// Example: "Write a headline for [AUDIENCE: journalists]"
// Renders as visual chips in chat input for editing
string
```

#### `drafts`
```javascript
// Array of saved note drafts
[
  {
    id: timestamp,
    title: 'Draft title',
    content: 'Full text content',
    timestamp: Date
  },
  ...
]
```

#### `archiveChats`
```javascript
// Saved AI conversations (auto-cleanup: 30 days + max 10 items)
[
  {
    id: timestamp,
    messages: [...],  // Full chat array
    timestamp: Date
  },
  ...
]
```

#### `archiveEdits`
```javascript
// Saved draft notes (auto-cleanup: 30 days + max 10 items)
[
  {
    id: timestamp,
    title: string,
    content: string,
    timestamp: Date
  },
  ...
]
```

### Store Pattern

All stores auto-persist to localStorage. Example:

```javascript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createChatStore() {
  const key = 'promptflam_chat';
  const stored = browser ? localStorage.getItem(key) : null;
  const initial = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    add: (message) => update(msgs => {
      const updated = [...msgs, message];
      if (browser) localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    })
  };
}

export const chatMessages = createChatStore();
```

---

## Services Layer

### Perplexity API Service

**File**: `src/lib/services/perplexity.js`

```javascript
export async function callPerplexity(messages, systemPrompt) {
  // Sends messages to Perplexity API
  // Returns: { content, citations }
  // 
  // messages: [{ role, content }, ...]
  // Returns: {
  //   content: "Response text",
  //   citations: [{ title, url, snippet }, ...]
  // }
}
```

**Key Details**:
- Uses `/openai/` endpoint (OpenAI-compatible)
- Model: `sonar` (real-time, fast)
- `search_recency_filter: 'month'` for fresh data
- Streaming support (token-by-token animation)
- Error handling + retry logic
- API key from `import.meta.env.VITE_PERPLEXITY_API_KEY`

### Storage Service

**File**: `src/lib/services/storage.js`

```javascript
export const storage = {
  set: (key, value) => { /* Save to localStorage */ },
  get: (key) => { /* Retrieve from localStorage */ },
  remove: (key) => { /* Delete from localStorage */ },
  clear: () => { /* Clear all localStorage */ }
}
```

---

## Component Patterns

### Page Components

Each page is a SvelteKit route with standard layout:

```svelte
<script>
  import Header from '$lib/components/Header.svelte';
  import { chatMessages } from '$lib/stores.js';
</script>

<Header title="Create" />
<main>
  <!-- Page content -->
</main>

<style>
  main { padding: 1rem; }
</style>
```

### Icon System

**Barrel Export** (`src/lib/icons.js`):
```javascript
export { default as IconCreate } from '../../public/icons/icon-create.svg?component';
export { default as IconSend } from '../../public/icons/icon-send.svg?component';
// ... all icons
```

**Icon Component** (`src/lib/components/Icon.svelte`):
```svelte
<script>
  export let name;          // 'send', 'create', etc.
  export let size = 24;     // 24px default
  export let variant = '';  // 'outline' or 'fill'
</script>

<svelte:component 
  this={iconMap[name]} 
  {width, height}
  stroke="currentColor" />
```

**Usage**:
```svelte
<Icon name="send" size={24} />
<Icon name="star" size={20} variant="fill" />
```

### Reusable Components

Pattern for all reusable components:

```svelte
<!-- MyComponent.svelte -->
<script>
  export let data;         // Props from parent
  export let onAction;     // Callback to parent
</script>

<div class="component">
  <!-- Content -->
  <button on:click={() => onAction()}>Action</button>
</div>

<style>
  .component {
    /* Minimal styles; use app.css for globals */
  }
</style>
```

---

## Pages & Features

### Create Page (`src/routes/+page.svelte`)

**What it shows**:
- Chat message history
- Chat input with bracket-chip support
- Send button
- Prompt library shortcut icon (in input)

**Key interactions**:
- User types → sends → AI responds with citations
- Citations render as clickable links below message
- Text selection in responses → inline menu (Rewrite, Expand, Shorten, Copy)
- [Sources] button → drawer with full citations

### Prompts Page (`src/routes/prompts/+page.svelte`)

**What it shows**:
- Full-screen prompt library
- Category + subcategory filters
- Search toolbar: [All Prompts] [Search] [Favourites]

**Key interactions**:
- Browse or search prompts
- Mark as favorite (saved to localStorage)
- Copy prompt to clipboard
- NOT direct insertion (users navigate via button; insertion via Create page drawer)

### Prompt Shortcut Drawer (In Create Page)

**What it shows**:
- Same prompt library (category, search, favorites)
- "Insert Prompt" button closes drawer + adds to chat input

**Key interactions**:
- Icon in chat input opens drawer
- Select prompt → "Insert Prompt" → adds to chat input
- Bracket content renders as visual chips for editing

### Edit Page (`src/routes/edit/+page.svelte`)

**What it shows**:
- Text editor with title + content
- Formatting toolbar (Bold, Italic, Underline, Text Size)
- Save, Download, Clear buttons

**Key interactions**:
- Type/format text → auto-save to localStorage
- Download as .txt file
- Load saved drafts from list

### Archive Page (`src/routes/archive/+page.svelte`)

**What it shows**:
- Two tabs: "Chats" | "Edits"
- List of saved items with preview + timestamp
- Three-dot menu per item (Download | Share | Delete)

**Key interactions**:
- Tap item → restore to Create/Edit page
- Three-dot menu → Download, Share, or Delete
- "Clear All" button (with confirmation)
- Auto-cleanup: 30 days + max 10 items per tab

### Header/Navigation

**Always visible** (fixed at top):
- Four buttons: Prompts | Create | Edit | Saved (Archive)
- Light background, pale grey buttons
- Active page highlighted
- Mobile: also accessible via swipe left/right

---

## Styling Approach

### Design Principles
- Minimalist: clean, uncluttered UI
- Material Design: soft shadows, rounded corners
- Responsive: mobile-first, tablet/desktop compatible
- Light theme: light background, dark text
- Accessibility: sufficient color contrast, keyboard navigation

### CSS Organization

**Global styles** (`src/app.css`):
```css
/* Root variables */
:root {
  --bg-primary: #f9f9f9;
  --bg-secondary: #fff;
  --text-primary: #333;
  --text-secondary: #666;
}

/* Base elements */
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
button { cursor: pointer; border: none; border-radius: 8px; }

/* Layout utilities */
.container { max-width: 600px; margin: 0 auto; padding: 1rem; }
```

**Component styles** (in `<style>` blocks):
```css
/* Scoped to component only */
.button {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
}
```

---

## Icon System Details

### Icon Directory Structure

```
public/icons/
├── icon-create.svg (outline)
├── icon-create-fill.svg (filled variant)
├── icon-send.svg
├── icon-prompts.svg
├── icon-prompts-fill.svg
├── icon-edit.svg
├── icon-archive.svg
├── icon-delete.svg
├── icon-copy.svg
├── icon-star.svg
├── icon-star-fill.svg
├── ... (24 total)
```

### Icon Naming Convention

- **Outline**: `icon-{name}.svg` (default)
- **Filled**: `icon-{name}-fill.svg` (variant)
- All 24×24px at 2px stroke weight

### Icon Categories

**Navigation** (Footer tabs):
- `icon-create` - Chat/messaging
- `icon-prompts` - Prompt library
- `icon-edit` - Draft editor
- `icon-archive` - Saved items

**Chat/Actions**:
- `icon-send` - Send message
- `icon-plus` - Add/insert
- `icon-menu` - Three-dot menu
- `icon-close` - Close/dismiss
- `icon-search` - Search
- `icon-copy` - Copy
- `icon-star` / `icon-star-fill` - Favorite toggle

**Editing**:
- `icon-bold`, `icon-italic`, `icon-underline` - Text formatting
- `icon-type` - Text size
- `icon-save`, `icon-download` - File operations
- `icon-delete` - Remove

**Other**:
- `icon-info` - Information/sources
- `icon-share` - Share via system
- `icon-refresh` - Reload/redo
- `icon-expand`, `icon-collapse` - Toggle
- `icon-link` - External link
- `icon-settings` - Configuration
- `icon-back` - Navigate back

---

## Environment Setup

### Required Variables

**`.env.local`** (not committed):
```
VITE_PERPLEXITY_API_KEY=pplx-your-key-here
```

**`.env.example`** (committed):
```
VITE_PERPLEXITY_API_KEY=pplx-your-key-here
```

### SvelteKit Config

**`svelte.config.js`**:
```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      routes: { include: ['/*'], exclude: ['<all>'] }
    })
  }
};
```

---

## Build & Deployment

### Local Development
```bash
npm run dev           # Starts http://localhost:5173
npm run build         # Build for production
npm run preview       # Test production locally
```

### Production Deployment

Cloudflare Pages auto-deploys when you push to GitHub `main` branch:

```bash
git push origin main
# Cloudflare detects change → runs "npm run build" → deploys to CDN within 2-3 min
```

**Domain**: https://promptflam.pages.dev/

---

## Key Design Decisions

| Decision | Why | Trade-off |
|----------|-----|-----------|
| SvelteKit | Reactive, small bundle, file-based routing | Learning curve for new devs |
| Svelte stores | Built-in state mgmt, no Redux/Pinia needed | Different paradigm if coming from React |
| localStorage only | No server cost, simple for educational use | Limited to user device; no multi-device sync |
| Perplexity API | Real-time sources + citations for journalism | Dependency on external API; ~2-3s response |
| Vanilla CSS | No framework bloat, easy to customize | More CSS to write; no component styling libraries |
| Cloudflare Pages | Free, simple, auto-deploys | Vendor lock-in (but low cost) |

---

## Performance Considerations

### Bundle Size
- Target: < 100KB gzipped
- SvelteKit compilation removes dead code
- Test: `npm run build && npm run preview`

### Streaming Responses
- Token-by-token animation for AI responses
- Prevents UI freeze while waiting for API
- Uses `EventStream` pattern

### localStorage Limits
- Warn users at 80% capacity
- Auto-cleanup: 30 days + max 10 items per archive tab
- Prevents "quota exceeded" errors

### Network Optimization
- Lazy load non-critical components
- Code splitting via SvelteKit routes
- Test on slow connections (3G simulated)

---

## Browser Support

- Chrome/Edge 90+ (desktop & mobile)
- Firefox 88+
- Safari 14+ (desktop & iOS)
- Android Chrome 90+

**Not supported**: IE 11, older mobile browsers

---

## Accessibility (WCAG 2.1 AA)

- Keyboard navigation: Tab through all interactive elements
- Color contrast: All text meets 4.5:1 for normal text
- Screen readers: ARIA labels for icons + buttons
- Focus indicators: Visible outline on buttons/inputs
- Forms: Proper label associations

---

## Common Tasks

### Adding a New Icon

1. Place SVG in `public/icons/icon-{name}.svg`
2. Add export to `src/lib/icons.js`:
   ```javascript
   export { default as IconMyIcon } from '../../public/icons/icon-my-icon.svg?component';
   ```
3. Use in component:
   ```svelte
   <Icon name="my-icon" size={24} />
   ```

### Creating a New Page

1. Create folder in `src/routes/` (e.g., `src/routes/my-page/`)
2. Create `+page.svelte` inside
3. File-based routing: `/my-page` automatically available

### Adding Store Data

1. Define store in `src/lib/stores.js`
2. Import in component: `import { myStore } from '$lib/stores.js'`
3. Subscribe in template: `{#each $myStore as item}`

### Using API Service

1. Import service: `import { callPerplexity } from '$lib/services/perplexity.js'`
2. Call with await: `const { content, citations } = await callPerplexity(messages)`
3. Handle errors with try/catch

---

## Debugging Tips

### Console Logging
```javascript
console.log('Store value:', $chatMessages);  // Reactive value
console.log('Env key:', import.meta.env.VITE_PERPLEXITY_API_KEY);
```

### DevTools
- **Network**: Check API calls to Perplexity
- **Storage**: Inspect localStorage keys
- **Console**: Watch for errors

### Common Issues
- **"Cannot find module"**: Check import paths start with `$lib` or `./`
- **Store not updating**: Ensure you're using `update()` or `set()`, not direct mutation
- **Styling not applied**: Check CSS specificity; scoped styles have lower priority

---

## Testing

**Not yet implemented** (Phase 8+):
- Unit tests (Vitest)
- E2E tests (Playwright)
- Accessibility audit (axe DevTools)

For now: Manual testing in dev server (`npm run dev`).

---

**Last Updated**: Dec 18, 2025
