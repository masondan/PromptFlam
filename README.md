# PromptFlam

An AI-powered prompt library and writing assistant for journalists and content creators.

**Live**: https://promptflam.pages.dev  
**Status**: Phase 8 (Live Testing)  
**Version**: 2.0.0  
**Last Updated**: Dec 21, 2025

---

## Quick Start for AI Agents

**Read this first to understand the app in 2 minutes:**

1. **What is it?** A SvelteKit app that lets users chat with Perplexity AI, manage prompt templates, and save/export notes
2. **Where's the code?** `/src` → `/routes` (pages), `/lib` (state & services)
3. **How to run?** `npm install && npm run dev` → http://localhost:5173
4. **Need API key?** Add `PERPLEXITY_API_KEY` to `.env.local`
5. **Need docs?** Read `ARCHITECTURE.md` for implementation details

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | SvelteKit 2 + Svelte 5 |
| Language | JavaScript (no TypeScript) |
| State | Svelte stores (auto-persist to localStorage) |
| Styling | Vanilla CSS with design tokens |
| AI | Perplexity API (streaming responses) |
| Hosting | Cloudflare Pages (auto-deploy on git push) |

---

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte              (Chat/Create page)
│   ├── +layout.svelte            (Root layout + header nav)
│   ├── prompts/+page.svelte      (Prompt library)
│   ├── notepad/+page.svelte      (Text editor)
│   ├── archive/+page.svelte      (Saved chats & notes)
│   └── api/
│       ├── chat/+server.js       (Perplexity API proxy - secure)
│       └── metadata/+server.js   (URL metadata fetcher)
│
├── lib/
│   ├── stores.js                 (All state management)
│   ├── services/
│   │   ├── perplexity.js         (AI API client)
│   │   └── storage.js            (localStorage wrapper)
│   ├── components/               (17 Svelte components)
│   │   ├── Header.svelte
│   │   ├── ChatInput.svelte
│   │   ├── ChatMessage.svelte
│   │   ├── PromptLibrary.svelte
│   │   ├── SourcesDrawer.svelte
│   │   ├── TextSelectionMenu.svelte
│   │   ├── NotepadToolbar.svelte
│   │   ├── ArchiveItem.svelte
│   │   └── ... (9 more)
│   ├── icons.js                  (Icon barrel export)
│   ├── utils.js                  (Shared utilities)
│   └── utils/
│       └── formatTime.js         (Timestamp formatter)
│
├── app.svelte                    (Root component)
└── app.css                       (Global styles + design tokens)

static/
├── prompts.json                  (Prompt library data)
├── icons/                        (40+ SVG icons, 24×24px)
├── manifest.json                 (PWA manifest)
└── *.png                         (Logo & app icons)
```

---

## Core Stores (`src/lib/stores.js`)

All stores auto-persist to localStorage:

| Store | Purpose | Schema |
|-------|---------|--------|
| `chatMessages` | Current chat session | `[{role, content, timestamp, sources?}]` |
| `currentChatSessionId` | Archive ID tracking | `number \| null` |
| `currentNoteTitle` | Notepad title | `string` |
| `currentNoteContent` | Notepad content | `string` |
| `currentNoteSessionId` | Note archive ID | `number \| null` |
| `archiveChats` | Saved conversations (max 10) | `[{id, messages, timestamp}]` |
| `archiveNotes` | Saved drafts (max 10) | `[{id, title, content, timestamp}]` |
| `currentPrompts` | Bracket content in chat | `[{bracketContent}]` |
| `favorites` | Favorited prompt subcategories | `['Text-Blog', 'Audio-Mini-pod']` |

**Auto-cleanup**: Items older than 30 days + max 10 per type

---

## API Routes

### POST `/api/chat`
Secure proxy to Perplexity API. Returns **streaming** response (text/event-stream).

**Request**: `{ messages: [{role, content}, ...] }`  
**Response**: `data: {content: '...'}` + `data: {citations: [...]}`

### POST `/api/metadata`
Fetches title + description from citation URLs (5s timeout per URL).

**Request**: `{ urls: ['https://...', ...] }`  
**Response**: `{ metadata: { url: {title, excerpt}, ... } }`

---

## Pages Overview

| Page | Path | Purpose |
|------|------|---------|
| **Create** | `/` | AI chat interface (current chat session) |
| **Prompts** | `/prompts` | Browse/search/favorite prompt templates |
| **Notepad** | `/notepad` | Text editor with formatting & export |
| **Archive** | `/archive` | View/restore/delete saved chats & notes |

---

## Key Features

- **Streaming AI responses** with real-time citations
- **Prompt library** with category filtering, search, favorites
- **Rich text editor** with bold, italic, lists, formatting
- **Archive system** with 30-day auto-cleanup
- **Offline-first** (all data in localStorage)
- **Responsive** (mobile-first design)
- **PWA** support (installable on home screen)

---

## Development

### Commands
```bash
npm run dev       # Dev server at http://localhost:5173
npm run build     # Build for production
npm run preview   # Test production build locally
```

### Git Workflow
```bash
git checkout -b feature-name
git add .
git commit -m "Brief description"
git push origin feature-name
# → Create PR or merge to main to deploy
```

### Deployment
- **Auto-deploy**: Push to `main` branch → Cloudflare Pages builds & deploys in ~2 min
- **Rollback**: `git revert HEAD && git push origin main`

---

## Environment Setup

Create `.env.local`:
```
PERPLEXITY_API_KEY=pplx-your-key-here
```

Safety: Set Perplexity spending limit to $5/month on their console.

---

## Documentation Files

- **README.md** (this file) — Quick start for all roles
- **ARCHITECTURE.md** — Technical deep-dive (stores, components, patterns)
- **DEVELOPMENT.md** — Local setup & troubleshooting
- **PHASES.md** — Project history & completed phases
- **AGENTS.md** — AI agent instructions (commands, conventions)

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (desktop & iOS)
- Android Chrome 90+

---

## Cost

- **Perplexity API**: $0.50–2/month (100–200 users, light usage)
- **Cloudflare Pages**: Free
- **Domain**: Included (`.pages.dev` subdomain)
- **Total**: ~$1–2/month

---

## Useful Links

- **Live app**: https://promptflam.pages.dev
- **GitHub repo**: https://github.com/masondan/PromptFlam
- **Perplexity docs**: https://docs.perplexity.ai/

---

**For questions**: Check `DEVELOPMENT.md` troubleshooting section or review code in `/src`
