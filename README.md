# PromptFlam

An AI-powered prompt library and writing assistant for journalists and content creators.

**Live**: [https://promptflam.pages.dev/](https://promptflam.pages.dev/)  
**Status**: Phase 3 (Real AI Integration)  
**Last Updated**: Dec 18, 2025

---

## Quick Navigation

**Looking for something specific?**

| Question | Answer In |
|----------|-----------|
| What is PromptFlam? | [Below](#what-is-promptflam) |
| What's the tech stack? | [Below](#tech-stack) |
| How do I set up locally? | `DEVELOPMENT.md` |
| How does this work technically? | `ARCHITECTURE.md` |
| What do I build this week? | `PHASE_3.md` |
| What's the approval workflow? | `PHASES.md` |
| I'm stuck, what do I do? | `DEVELOPMENT.md` (Troubleshooting) |

---

## What is PromptFlam?

PromptFlam helps content creators write better, faster by:
- Chatting with an AI assistant (Perplexity API) for real-time insights and citations
- Accessing a library of categorized prompts for various formats (articles, videos, audio)
- Editing and exporting drafts
- Archiving past conversations and notes

**Why Perplexity API?** Real-time sources + built-in citations (crucial for journalism) + $1-2/month cost.

---

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| **Framework** | SvelteKit | Lightweight, reactive, file-based routing |
| **Language** | JavaScript (ES6+) | No TypeScript |
| **State** | Svelte stores | Built-in reactive stores with localStorage persistence |
| **Styling** | Vanilla CSS | No framework; minimal, clean design |
| **Storage** | Browser localStorage | Anonymous, no backend needed |
| **AI** | Perplexity API | Real-time sources, citations, $0.005-0.015/request |
| **Hosting** | Cloudflare Pages | Free tier, auto-deploys on git push |

---

## Quick Start (5 min)

### Prerequisites
- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Git (`git --version`)

### Setup
```bash
# Clone and create dev branch
git clone https://github.com/masondan/PromptFlam.git
cd PromptFlam
git checkout -b svelte-refactor

# Install and run
npm install
npm run dev
```

**Open**: http://localhost:5173

### Get Perplexity API Key
1. Go to [https://www.perplexity.ai/](https://www.perplexity.ai/)
2. Sign up → API Keys → Create new key
3. Create `.env.local`:
   ```
   VITE_PERPLEXITY_API_KEY=pplx-your-key-here
   ```
4. Set spending limit to $5/month (safety)

**Full setup guide**: See `DEVELOPMENT.md`

---

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte           (Create page - chat)
│   ├── +layout.svelte         (Root layout)
│   ├── prompts/
│   │   └── +page.svelte       (Prompts library)
│   ├── edit/
│   │   └── +page.svelte       (Edit/draft page)
│   └── archive/
│       └── +page.svelte       (Saved chats & edits)
├── lib/
│   ├── stores.js              (State management)
│   ├── services/
│   │   ├── perplexity.js      (AI API wrapper)
│   │   └── storage.js         (localStorage wrapper)
│   └── components/
│       └── Icon.svelte        (Reusable icon)
├── app.svelte                 (Root component)
└── app.css                    (Global styles)

public/
└── icons/                     (24×24px SVG icons)
```

**More details**: See `ARCHITECTURE.md`

---

## Current Phase: Phase 3 (Real AI Integration)

### What's Built
- ✓ SvelteKit foundation with routing
- ✓ State management (stores + localStorage)
- ✓ Chat UI skeleton with message display
- ✓ Navigation bar with page tabs

### What's Next
- [ ] Real Perplexity API integration
- [ ] Streaming response display
- [ ] Citation extraction & display
- [ ] Error handling + loading states

**Phase Details & Task List**: See `PHASE_3.md`

---

## Key Features (All Phases)

- **AI Chat**: Real-time responses with current sources + citations
- **Prompt Library**: Categorized, searchable prompts for quick insertion into chat
- **Draft Editor**: Format, save, and export notes as .txt
- **Archive**: Unified save history with 30-day auto-cleanup + max 10 items per type
- **Offline Support**: localStorage ensures chat persists across sessions

---

## Cost Breakdown

| Service | Cost/Month | Why |
|---------|-----------|-----|
| Perplexity API | $0.50-2 | 100-200 users × light usage |
| Cloudflare Pages | $0 | Free tier |
| Domain | $0 | Pages subdomain |
| **Total** | **~$1-2** | Effectively free |

---

## Development Workflow

### Git Strategy
- **Branch**: `svelte-refactor` (development)
- **Main**: Stable, auto-deployed to production
- **Commit message**: `Phase X: [what was built]`

### Commands
```bash
npm run dev       # Local dev server (http://localhost:5173)
npm run build     # Build for production
npm run preview   # Test production build locally
npm run format    # Format code with Prettier
npm run lint      # Check for errors
```

### Deployment
1. Work on `svelte-refactor` branch
2. When phase is done: `git push origin svelte-refactor`
3. When ready for production: merge to `main`
4. Cloudflare auto-deploys within 2-3 minutes

---

## Documentation

- **README.md** (this file) — Start here; 5-min overview + navigation
- **DEVELOPMENT.md** — Step-by-step local setup & troubleshooting
- **ARCHITECTURE.md** — Technical deep-dive (stores, services, components)
- **PHASES.md** — Current phase workflow and approval gates
- **PHASE_3.md** — This week's deliverables and implementation guide

*Historical docs archived in `/archive` folder.*

---

## Common Commands

```bash
# Setup (first time only)
npm install
cp .env.example .env.local
# [Add Perplexity API key to .env.local]

# Development
npm run dev              # Local dev server (http://localhost:5173)
npm run build            # Build for production

# Git
git add .
git commit -m "Phase 3: Your message here"
git push origin svelte-refactor

# When phase is done
git checkout main
git merge svelte-refactor
git push origin main     # Cloudflare auto-deploys
```

---

## Entry Points by Role

### New Developer
1. README.md (this file)
2. DEVELOPMENT.md (setup)
3. ARCHITECTURE.md (how it works)
4. PHASE_3.md (tasks)

### AI Agent Joining Mid-Project
1. README.md (this file)
2. PHASE_3.md (current tasks)
3. ARCHITECTURE.md (coding patterns)

### Project Lead
1. PHASES.md (oversight)
2. PHASE_N.md (current phase details)
3. Review submissions + approve

---

## Support & Contributing

**For questions or bugs**: Check `DEVELOPMENT.md` troubleshooting section.

**For new phases**: See `PHASES.md` for current phase; chat with lead (Dan Mason) for approval to proceed.

---

**Repository**: https://github.com/masondan/PromptFlam  
**Live App**: https://promptflam.pages.dev/
