# AGENTS.md - AI Agent Instructions

## Project Overview

**PromptFlam** is an AI-powered prompt library and writing assistant for journalists.

- **Framework**: SvelteKit 2 with Svelte 5
- **Language**: JavaScript (ES6+), no TypeScript
- **Hosting**: Cloudflare Pages (auto-deploys on push to `main`)
- **Live URL**: https://promptflam.pages.dev/

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build locally

# Git workflow
git checkout main && git merge <branch>   # Merge feature branch
git push origin main                       # Deploy (Cloudflare auto-deploys)
```

---

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte           # Create page (AI chat)
│   ├── +layout.svelte         # Root layout with header
│   ├── prompts/+page.svelte   # Prompt library
│   ├── notepad/+page.svelte   # Text editor
│   ├── archive/+page.svelte   # Saved chats & edits
│   └── api/
│       ├── chat/+server.js    # Perplexity API proxy
│       └── metadata/+server.js # URL metadata fetcher
├── lib/
│   ├── stores.js              # Svelte stores (state)
│   ├── services/
│   │   ├── perplexity.js      # AI API wrapper
│   │   └── storage.js         # localStorage wrapper
│   └── components/            # Reusable UI components
├── app.css                    # Global styles with CSS variables
└── app.html                   # HTML template

static/
├── icons/                     # SVG icons (24×24px)
├── prompts.json               # Prompt library data
└── manifest.json              # PWA manifest
```

---

## Key Files

| Purpose | File |
|---------|------|
| State management | `src/lib/stores.js` |
| AI API calls | `src/lib/services/perplexity.js` |
| Chat page | `src/routes/+page.svelte` |
| Design tokens | `src/app.css` (`:root` variables) |
| Prompts data | `static/prompts.json` |

---

## Code Conventions

1. **No TypeScript** - Use plain JavaScript
2. **Svelte 5 syntax** - Use `$state`, `$derived`, `$effect` where appropriate
3. **CSS variables** - Use `var(--spacing-md)`, `var(--accent-brand)`, etc.
4. **Component imports** - Use `$lib/` alias: `import { chatMessages } from '$lib/stores.js'`
5. **No comments** - Unless code is complex; explanation goes in commit messages
6. **Icons** - Add to `static/icons/`, export in `src/lib/icons.js`

---

## State Management

All stores are in `src/lib/stores.js` and auto-persist to localStorage:

- `chatMessages` - Current chat conversation
- `archiveChats` - Saved chat sessions
- `archiveEdits` - Saved notepad drafts
- `favoritePrompts` - User's favorited prompts

---

## API Integration

Perplexity API is proxied through SvelteKit server routes to protect the API key:

- **Chat**: `POST /api/chat` → `src/routes/api/chat/+server.js`
- **Metadata**: `POST /api/metadata` → `src/routes/api/metadata/+server.js`

API key is set via environment variable: `PERPLEXITY_API_KEY`

---

## Deployment

- Push to `main` branch triggers Cloudflare Pages auto-deploy
- Build command: `npm run build`
- Output directory: `.svelte-kit/cloudflare`
- Deploy time: ~2-3 minutes

**Rollback**: `git revert HEAD && git push origin main`

---

## Documentation

- `README.md` - Quick start and overview
- `ARCHITECTURE.md` - Technical deep-dive
- `DEVELOPMENT.md` - Local setup guide
- `PHASES.md` - Project history

---

**Version**: 2.0.0  
**Last Updated**: Dec 20, 2025
