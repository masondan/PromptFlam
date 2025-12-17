# PromptFlam AI Agent Onboarding

This document provides AI agents with a comprehensive understanding of the PromptFlam web application's architecture, development environment, and operational workflow.

## Application Overview

PromptFlam is a single-page web application (SPA) designed as a prompt library for content creators. It provides a categorized and searchable interface to a collection of prompts for various content formats, including text, audio, and video.

- **URL**: The application is live and accessible at [https://promptflam.pages.dev/](https://promptflam.pages.dev/).
- **Deployment**: The application is deployed via GitHub to Cloudflare Pages.

## Core Functionality

- **AI Chat Interface**: Users can chat with an AI assistant (Perplexity API) for writing assistance.
- **Prompt Library Integration**: Full-screen drawer provides access to prompt library; users tap "Insert Prompt" to add prompts to chat.
- **Bracket Editing**: Prompts contain [square brackets] that render as visual chips in the chat input; users can edit/delete brackets before sending.
- **Categorization and Filtering**: Prompts are organized into categories and subcategories with dropdown filters.
- **Search**: Prompt library search field in toolbar with [All Prompts] [Search] [Favourites] options.
- **Favorites**: Users can mark favorite subcategories; saved to localStorage.
- **Copy Functionality**: Users can copy prompts directly from the library.
- **Edit Page**: Text editor for refining content with formatting, save, and export to .txt.
- **Response Interactions**: Inline text selection menu, response buttons (Rewrite, Sources, Copy), and sources drawer for citations.
- **Archive Page**: Unified archive with two tabs (Chats and Edits) for saving/restoring AI conversations and draft notes; auto-cleanup after 30 days or max 10+10 items; three-dot menu for Download | Share | Delete per item.

## Technical Stack

- **Frontend**:
    - **HTML**: `index.html` provides the main structure of the application.
    - **CSS**: `style.css` contains all the styles for the application, including a responsive design for mobile devices.
    - **JavaScript**: `script.js` contains all the application logic, written in vanilla JavaScript. It handles state management, DOM manipulation, event handling, and fetching data.
- **Data**:
    - `prompts.json`: This file contains the array of prompt objects that the application displays.
- **Development**:
    - `live-server`: A lightweight development server with live reload functionality is used for local development.

## Project Structure

```
/
├── .gitignore
├── index.html
├── LICENSE
├── manifest.json
├── package.json
├── package-lock.json
├── promptflam-logo100.png
├── prompts.json
├── script.js
├── style.css
├── public/
│   ├── promptflam-icon-maskable.png
│   ├── promptflam-icon.png
│   └── promptflam-logo.png
└── agents.md
```

- **`index.html`**: The main entry point of the application.
- **`style.css`**: Contains all the styles for the application.
- **`script.js`**: Contains the application's JavaScript code.
- **`prompts.json`**: The data source for the prompts.
- **`package.json`**: Defines the project's metadata and dependencies.
- **`public/`**: Contains static assets like logos and icons.
- **`agents.md`**: This file.

## Current Status (As of Dec 15, 2025)

**PromptFlam is undergoing a major refactor from vanilla JavaScript to SvelteKit.**

- **Previous Stack**: Vanilla HTML/CSS/JavaScript SPA
- **New Stack**: SvelteKit + Svelte stores + Cloudflare Pages
- **AI Integration**: Perplexity API (real-time sources + citations for journalism)
- **Data Storage**: Browser localStorage (no backend)
- **Status**: Planning complete; Phase 1 setup ready

---

## Development Workflow (Post-Refactor)

### Local Development
1. **Clone repository**: `git clone https://github.com/masondan/PromptFlam.git`
2. **Create dev branch**: `git checkout -b svelte-refactor`
3. **Install dependencies**: `npm install`
4. **Start dev server**: `npm run dev`

Application is accessible at `http://localhost:5173` (SvelteKit default).

### Full Setup Guide
**See DEVELOPMENT.md** for complete step-by-step instructions, including:
- Prerequisites (Node.js, npm, Git)
- SvelteKit project setup
- Perplexity API key configuration
- Environment file setup
- Testing locally
- Git workflow

### Phased Development
**See ROADMAP.md** for complete phase breakdown:
- **Phase 1** (Week 1-2): Foundation & modular architecture
- **Phase 2** (Week 2-3): Chat UI skeleton
- **Phase 3** (Week 3-4): Real AI integration
- **Phase 4** (Week 4-5): Prompt library integration
- **Phase 5** (Week 5-6): Archive page (chat & edit history with auto-cleanup)
- **Phase 6** (Week 6-7): Edit page (text editor)
- **Phase 7** (Week 7-8): Advanced features & polish
- **Phase 8** (Week 8): Production deployment

---

## New Architecture (SvelteKit)

### Project Structure
```
src/
├── routes/
│   ├── +page.svelte           (Create page - AI chat)
│   ├── +layout.svelte         (Root layout)
│   ├── prompts/
│   │   └── +page.svelte       (Prompts library)
│   └── edit/
│       └── +page.svelte       (Edit page - text editor)
├── lib/
│   ├── stores.js              (Svelte stores - state mgmt)
│   ├── services/
│   │   ├── perplexity.js      (API calls to Perplexity)
│   │   └── storage.js         (localStorage wrapper)
│   └── components/
│       ├── Header.svelte
│       ├── Footer.svelte
│       ├── ChatMessage.svelte
│       └── ...
├── app.css                    (Global styles)
└── app.svelte                 (Root component)
```

### Key Components

#### State Management (Svelte Stores)
Located in `src/lib/stores.js`:
- **chatMessages**: Array of user/AI messages
- **drafts**: Saved text drafts
- **currentPrompts**: Active prompts in chat input (contains bracket chips)

All stores auto-persist to localStorage for session recovery.

**Note**: Persona & Audience fields are postponed to Phase 9 (Future Enhancement).

#### API Service
Located in `src/lib/services/perplexity.js`:
- **callPerplexity(messages)**: Calls Perplexity API
- Handles streaming responses
- Citation extraction and display
- Error handling + retry logic
- Manages API key securely via environment variables

#### Storage Service
Located in `src/lib/services/storage.js`:
- Wrapper around browser localStorage
- Methods: `get()`, `set()`, `remove()`, `clear()`
- Guards against SSR issues with `browser` check

### Pages

#### Top Navigation Bar
- **Fixed at top of screen** with light background (same as app background)
- **Design**: Four modest rounded buttons, aligned left; very pale grey styling
- **Visual effect**: Slight transparency with graduated lower edge (fade effect as page content scrolls behind)
- **Menu buttons (left to right)**: Prompts | Create | Edit | Saved (Archive)
- **Navigation**: Buttons open their respective pages; active page indicated by button highlight
- **Mobile**: Also accessible via left/right swipe gestures between pages
- Always visible; does not scroll with content

#### Prompts Page (`src/routes/prompts/+page.svelte`)
- Full-screen prompt library with category/subcategory filters
- Search functionality with toolbar: [All Prompts] [Search] [Favourites]
- Favorites system (persisted to localStorage)
- Copy prompt functionality

#### Create Page (`src/routes/+page.svelte`)
- Main chat interface with AI-powered writing assistance
- Chat input with visual bracket-chip support for prompt editing
- Prompt library shortcut access (icon in chat input launches drawer)
- Message display (user prompts + AI responses with citations)
- Inline text selection menu (Rewrite, Expand, Shorten, Copy)
- Response action buttons: [Rewrite] [Sources] [Copy]
- Sources drawer for viewing citations

#### Prompt Shortcut Drawer (Full-Screen Modal in Create Page)
- Accessed via icon in chat input (not the Prompts navigation button)
- Quick access to prompts for insertion into chat
- "Insert Prompt" button adds prompt to chat input
- Category/subcategory filters
- Search functionality with toolbar: [All Prompts] [Search] [Favourites]
- Favorites system (persisted to localStorage)
- "Insert Prompt" button closes drawer and adds prompt to chat input
- Bracket content rendered as visual chips for editing

#### Edit Page (`src/routes/edit/+page.svelte`)
- Text editor for refining and finalizing content
- Formatting toolbar (Bold, Italic, Underline, Text Size)
- Draft saving and management
- Download as .txt
- Copy to clipboard
- Load saved drafts

---

## Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | SvelteKit | Lightweight, reactive, file-based routing |
| **Language** | JavaScript (ES6+) | No TypeScript (keep simple) |
| **State** | Svelte stores | Built-in reactive state management |
| **Styling** | CSS (vanilla) | No CSS framework; keep minimal |
| **Storage** | Browser localStorage | Anonymous, no accounts |
| **AI** | Perplexity API | Real-time sources, citations (~$0.005-0.015/request, ~$1-2/mo at scale) |
| **Hosting** | Cloudflare Pages | Free tier; auto-deploys on git push |
| **Version Control** | Git + GitHub | Branch-based workflow |

---

## Cost Breakdown

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| **Perplexity API** | ~$0.50-2 | Light usage by 100-200 users (~$0.005-0.015 per request) |
| **Cloudflare Pages** | $0 | Free; unlimited deployments |
| **Domain** | $0 | Using Cloudflare Pages subdomain |
| **Database** | $0 | localStorage only; no backend |
| **Total** | **~$1-2/month** | Cheaper & better features than OpenAI; ideal for educational use |

---

## Git Workflow

### Creating a Feature Branch
```bash
git checkout -b svelte-refactor
git push origin svelte-refactor
```

### Committing Work
```bash
git add .
git commit -m "Phase 1: SvelteKit foundation"
git push origin svelte-refactor
```

### Deploying to Production
When phase is complete and tested:
```bash
git checkout main
git merge svelte-refactor
git push origin main
# Cloudflare auto-deploys within 2-3 minutes
```

### Rolling Back (If Needed)
```bash
git revert HEAD
git push origin main
# Previous version restored in ~2 minutes
```

---

## Documentation Files

- **agents.md** (this file): Architecture, tech stack, component overview
- **ROADMAP.md**: Phase breakdown, deliverables, timelines
- **DEVELOPMENT.md**: Step-by-step local setup & workflow
- **Original Prompt Library Documentation**: See version history or `/archive` folder

---

## Questions for AI Agents

When working on this project:

1. **Favor Svelte patterns** over vanilla JS DOM manipulation
2. **Use stores** for all state (don't use local variables)
3. **Preserve localStorage integration** in all new features
4. **Test locally** before pushing (`npm run dev`)
5. **Keep components small** (one responsibility per file)
6. **Document new stores/services** in comments
7. **Check ROADMAP.md** for phase requirements before coding