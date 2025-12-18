# PromptFlam Refactor: Development Roadmap

**Status**: Planning Phase  
**Last Updated**: Dec 15, 2025  
**Lead**: Dan Mason (Coding Lead: Amp AI)

---

## Project Overview

PromptFlam is evolving from a prompt library into an **AI-powered writing tool for journalists**. This roadmap documents the refactor from vanilla JavaScript to **SvelteKit**, including phased development and deployment strategy.

### Key Decisions

- **Framework**: SvelteKit (Vue-like reactivity, smaller bundle, easier state management)
- **AI Service**: Perplexity API (real-time web sources, built-in citations for journalism)
- **Data Storage**: Browser localStorage (anonymous, no accounts)
- **Users**: Classroom-based, educational use (~100-200 journalists)
- **Deployment**: Cloudflare Pages (existing host; auto-deploys on git push)
- **Cost**: ~$1-2/month total (Perplexity API at scale)

### Target Users

- Journalists in developing countries who cannot afford expensive tools
- Media students in Dan Mason's training programs
- Educational use only; not for commercial purposes

---

## Development Process & Approval Workflow

**This is a step-by-step development cycle with deliberate checkpoints.**

Each phase follows this workflow:

1. **Planning**: Requirements and deliverables documented (ROADMAP.md)
2. **Implementation**: AI agent begins coding based on clear specifications
3. **Checkpoint**: Upon completion, AI agent submits work with summary of what was built
4. **Review**: Lead (Dan Mason) reviews the checkpoint, confirms understanding, and identifies next step
5. **Approval**: Only after lead confirms understanding and gives explicit "green light" does development proceed to the next phase

**This ensures:**
- Clear communication between lead and developer
- No assumptions about direction
- Ability to pivot if required before proceeding
- Quality control at each phase boundary

**Timeline Note**: Each phase includes a 1-2 day buffer for review and adjustments before proceeding to the next phase.

---

## Phase Breakdown

### Phase 1: Foundation & Refactor (Week 1-2)
**Objective**: Establish modular SvelteKit architecture; no new features yet.

**Deliverables:**
- [ ] SvelteKit project initialized with Cloudflare Pages adapter
- [ ] SPA router with 3 page stubs: Create, Prompts, Edit, Archive
- [ ] State management (Svelte stores): chatMessages, drafts, currentPrompts, archiveChats, archiveEdits
- [ ] localStorage wrapper service
- [ ] Environment variables setup (Perplexity API key)
- [ ] Existing prompts.json ported and integrated
- [ ] Assets (logos, icons) migrated to public/icons/
- [ ] **Icon System Setup** (Critical for all phases):
  - [ ] Create `$lib/icons.js` barrel export with all icons from `public/icons/`
  - [ ] Create reusable `$lib/components/Icon.svelte` wrapper component
    - [ ] Accepts `name` prop (icon identifier) and `size` prop (default 24px)
    - [ ] Handles global icon sizing and styling (color, hover states, accessibility)
    - [ ] Supports both outline and filled variants (`icon-name.svg` and `icon-name-fill.svg`)
  - [ ] Document icon usage pattern in code comments
  - [ ] Test all icons render correctly at 24px
- [ ] Local development workflow tested
- [ ] Deployed to `svelte-refactor` branch (not live yet)

**Key Files Created:**
- `src/lib/stores.js` - Centralized state
- `src/lib/services/storage.js` - localStorage abstraction
- `src/lib/icons.js` - Icon barrel export (all icons)
- `src/lib/components/Icon.svelte` - Reusable icon wrapper
- `src/routes/+page.svelte` - Create page (stub)
- `src/routes/prompts/+page.svelte` - Prompts page (stub)
- `src/routes/edit/+page.svelte` - Edit page (stub)
- `src/routes/archive/+page.svelte` - Archive page (stub)
- `svelte.config.js` - Cloudflare adapter configured
- `.env.example` - Perplexity API key template

**Definition of Done:**
- Can run `npm run dev` locally
- Four pages (Create, Prompts, Edit, Archive) are routing correctly
- localStorage reads/writes work
- Icon system functional: `<Icon name="send" size={24} />` works in any component
- All icons from `public/icons/` render correctly
- No console errors

---

### Phase 2: Chat UI Skeleton (Week 2-3)
**Objective**: Build interactive chat interface with mock AI responses.

**Deliverables:**
- [ ] Top navigation bar (fixed at top of screen)
  - [ ] Light background (same as app) with very pale grey rounded buttons
  - [ ] Four buttons aligned left: Prompts | Create | Edit | Saved (Archive)
  - [ ] Visual effect: slight transparency + graduated lower edge (fade effect)
  - [ ] Active page indication (button highlight/state)
  - [ ] Navigation via button tap OR left/right swipe on mobile
  - [ ] Always visible; does not scroll with content
- [ ] Chat input field + send button with visual bracket-chip support
- [ ] Message display (user prompts + AI responses)
- [ ] Prompt shortcut drawer icon in chat input (launches full-screen drawer for quick access)
- [ ] Message state persisted to localStorage
- [ ] "New Session" button (clears chat history)
- [ ] Mock AI responses (dummy text) flowing through UI
- [ ] Responsive mobile layout + swipe navigation
- [ ] Basic styling (minimalist + material design; matches design brief)

**Key Components:**
- `Header.svelte` - Top navigation bar with menu buttons
- `ChatMessage.svelte` - Individual message display
- `ChatInput.svelte` - Input field + send button with bracket-chip support
- `PromptDrawer.svelte` - Full-screen prompt library drawer (stub for Phase 4)

**Definition of Done:**
- User can type → send → see mock response
- Messages persist on page refresh
- Mobile layout works on phone browser
- "Start Again" clears all messages
- Prompt library icon accessible and drawer opens (Phase 4 will populate)

---

### Phase 3: Real AI Integration (Week 3-4)
**Objective**: Connect to Perplexity API; handle streaming responses with citations.

**Deliverables:**
- [ ] Perplexity API service (`lib/services/perplexity.js`)
- [ ] API key management (environment variables)
- [ ] Real API calls to Perplexity chat endpoint
- [ ] Streaming response display (token-by-token animated text)
- [ ] Citation extraction and display (linked sources)
- [ ] Error handling (network failures, quota exceeded, etc.)
- [ ] Loading states (spinner while waiting for response)
- [ ] Cost monitoring (log request usage)
- [ ] Retry logic for failed requests

**Key Files:**
- `src/lib/services/perplexity.js` - API wrapper with citation parsing

**Definition of Done:**
- Send prompt → receive real AI response from Perplexity
- Response appears animated (streaming)
- Citations display as clickable links below response
- Errors displayed to user gracefully
- No exposing API key in frontend code
- Cost is tracking correctly

---

### Phase 4: Prompt Library Integration (Week 4-5)
**Objective**: Migrate existing prompts page into new architecture; implement two access points.

**Important Distinction**: There are **two separate ways** to access prompts:
1. **Prompts Page** (via navigation button or swipe) - Full browsing experience for discovering prompts. Copy prompt for insertion into Create page AI prompt.
2. **Prompt Shortcut Drawer** (icon in Create page chat input) - Enables prompts to be added directly to prompt input window.

**Deliverables:**

**A. Prompts Page (Full Library)**
- [ ] Full-screen prompt library page functional (`/routes/prompts/+page.svelte`)
- [ ] Category + subcategory filters working
- [ ] Search functionality in toolbar ([All Prompts] [Search] [Favourites])
- [ ] Favorites system (saved to localStorage)
- [ ] Copy prompt functionality
- [ ] Browse-only (no direct insertion from page; users navigate via button)

**B. Prompt Shortcut Drawer (In Create Page)**
- [ ] Full-screen drawer accessible from chat input icon
- [ ] Same category/subcategory filters
- [ ] Same search functionality
- [ ] "Insert Prompt" button closes drawer and adds prompt to chat input
- [ ] Prompt text with [square brackets] inserted into chat input
- [ ] Bracket content renders as visual chips in chat input

**Key Components:**
- `PromptPage.svelte` - Full prompts page for browsing
- `PromptCard.svelte` - Individual prompt display (reused in both page and drawer)
- `PromptDrawer.svelte` - Shortcut drawer with insert functionality
- `PromptFilters.svelte` - Category + subcategory dropdowns (reused)
- `PromptSearch.svelte` - Search toolbar (reused)

**Definition of Done:**
- Prompts page accessible via navigation button and swipe
- Shortcut drawer accessible from Create page chat input
- Both share the same prompt library and filtering logic
- Users can insert prompts into chat from drawer
- Drawer closes on insert; prompt appears in chat input with bracket chips
- Favorites persist across both interfaces
- Search finds prompts correctly in both interfaces
- No changes to prompts.json structure (postponed to Phase 8)

---

### Phase 5: Archive Page (Week 5-6)
**Objective**: Build unified archive for saved AI chats and edited notes with auto-cleanup logic.

**Deliverables:**
- [ ] Archive page route (`/archive`)
- [ ] Two-tab interface: "Chats" tab + "Edits" tab
- [ ] Chat archive: list of saved AI conversations
  - [ ] Preview (first 50-100 characters, max 2 lines)
  - [ ] Timestamp (when saved)
  - [ ] Three-dot menu: Download | Share | Delete
  - [ ] Tap to restore chat into Create page
- [ ] Edit archive: list of saved note drafts
  - [ ] Preview (first 50-100 characters, max 2 lines)
  - [ ] Timestamp (when saved)
  - [ ] Three-dot menu: Download | Share | Delete
  - [ ] Tap to restore note into Edit page
- [ ] Auto-cleanup: Delete items older than 30 days
- [ ] Auto-cleanup: Keep max 10 chats + 10 notes (auto-delete oldest if exceeded)
- [ ] Manual deletion via three-dot menu
- [ ] "Clear All" button for both tabs (bulk delete with confirmation)
- [ ] Download functionality (export as .txt)
- [ ] Share functionality (email, WhatsApp, etc. via system share API)
- [ ] Sorting: Most recent first (descending by timestamp)

**Key Components:**
- `ArchivePage.svelte` - Main archive page with tabs
- `ArchiveTab.svelte` - Reusable tab component (Chats | Edits)
- `ArchiveItem.svelte` - Individual chat/edit card with menu
- `ArchiveMenu.svelte` - Three-dot dropdown (Download | Share | Delete)

**Definition of Done:**
- Archive page accessible from footer navigation
- Both tabs display saved items with previews + timestamps
- Download button exports as .txt correctly
- Share button opens system share dialog
- Delete removes item; Clear All removes all with confirmation
- Auto-cleanup runs silently (no user notification needed)
- Mobile layout works correctly
- localStorage limits respected (10+10 maximum per tab)

---

### Phase 6: Edit Page (Week 6-7)
**Objective**: Build text editor for refining and exporting draft content.

**Deliverables:**
- [ ] Title input field
- [ ] Rich text area (editable content)
- [ ] Text formatting toolbar (Bold, Italic, Underline, Text Size)
- [ ] Copy to clipboard
- [ ] Save draft to localStorage
- [ ] Download as .txt file
- [ ] Clear draft button
- [ ] Optional: Spelling/grammar checker (if time permits)
- [ ] Draft list (manage multiple drafts)

**Key Components:**
- `TextEditor.svelte` - Main editor
- `FormattingToolbar.svelte` - B/I/U buttons
- `DraftList.svelte` - Saved drafts

**Definition of Done:**
- User can type, format, save, download .txt
- Drafts persist across sessions
- Downloaded file opens correctly in any text editor
- Mobile keyboard doesn't hide content

---

### Phase 7: Advanced Features & Polish (Week 7-8)
**Objective**: Text selection UI + AI features + sources + performance + user testing.

**Deliverables:**
- [ ] Highlight text in chat responses → inline pop-up menu (Gemini pill style)
- [ ] Text selection menu: Rewrite, Expand, Shorten, Copy (regenerates selected portion in place)
- [ ] Buttons under each AI response: [Rewrite] [Sources] [Copy]
- [ ] "Rewrite" button behavior: adds original prompt to input field for user modification before regenerating
- [ ] Inline source citations (tappable numbers in response text)
- [ ] Sources drawer (triggered by inline citation tap or [Sources] button)
  - [ ] Card-based source display with website name + preview text
  - [ ] Clickable links to external sources
  - [ ] Summary "X sources" button under response
- [ ] Session history (view past chats)
- [ ] Relaunch old sessions
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Browser compatibility testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] User testing with 3-5 journalists

**Definition of Done:**
- All UX flows work smoothly
- Sources drawer accessible and functional
- No performance bottlenecks on slow networks
- Users give positive feedback in testing
- Ready for classroom deployment

---

### Phase 8: Deployment & Launch (Week 8)
**Objective**: Merge to main; deploy to production.

**Deliverables:**
- [ ] svelte-refactor branch merged to main
- [ ] Cloudflare Pages auto-deploys
- [ ] https://promptflam.pages.dev/ shows new Svelte version
- [ ] Old version in git history (rollback available if needed)
- [ ] Update README with new tech stack
- [ ] Update agents.md with new architecture
- [ ] Notify users of new features
- [ ] Monitor for issues (first week)

**Definition of Done:**
- App lives and works at production URL
- Old version rollback-able within 5 minutes if disaster
- No data loss for existing users

---

## Phase 9: Future Enhancements (Backlog)
**Status**: Postponed; Not in current phase roadmap.

### 9a. Role/Audience Customization
**Description**: Future enhancement to allow custom writing personas and audience definitions with AI-powered defaults. Will include:
- Persona & Audience input fields in Create page
- JSON schema extension for prompts (defaultPersona, defaultAudience fields)
- AI-assisted persona/audience suggestions

**Planned for**: After Phase 8 launch and user feedback collection.

### 9b. Related Questions
**Description**: Extend conversation discovery with AI-generated follow-up questions at the bottom of responses. Will include:
- [Related] button under each AI response
- Generates 3 related questions via Perplexity API
- Users can tap to explore related topics without leaving app
- Loading state with spinner during generation

**Rationale**: Deferred from Phase 6 due to:
- Load time impact (2-5 seconds per request)
- Data cost concern for users in developing countries on limited connections
- Additional API calls increase monthly cost (~$0.50-1 per active user)

**Planned for**: Post-launch assessment after monitoring Phase 6 usage patterns and user bandwidth constraints.

---

## Git Workflow

### Branch Strategy

```
main (stable, deployed)
  ↑
  └── svelte-refactor (development)
       └── feature branches (if needed)
           ├── svelte-phase-1
           ├── svelte-phase-2
           └── etc.
```

### Commands

**Create feature branch:**
```bash
git checkout -b svelte-refactor
```

**Test locally:**
```bash
npm run dev
```

**When phase is done:**
```bash
git add .
git commit -m "Phase 1: SvelteKit foundation"
git push origin svelte-refactor
```

**Merge to main (when ready):**
```bash
git checkout main
git merge svelte-refactor
git push origin main
# Cloudflare auto-deploys
```

**Rollback if disaster:**
```bash
git revert HEAD
git push origin main
# Production restored in 2-3 minutes
```

---

## Environment Setup

### Prerequisites
- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Git (`git --version`)

### Local Setup
```bash
# Clone repo
git clone https://github.com/masondan/PromptFlam.git
cd PromptFlam

# Create and checkout branch
git checkout -b svelte-refactor

# Create SvelteKit project
npm create svelte@latest promptflam-svelte
cd promptflam-svelte
npm install

# Copy existing assets
cp ../prompts.json ./static/
cp ../public/* ./static/

# Create env file
cp .env.example .env.local
# Edit .env.local and add OpenAI API key

# Start dev server
npm run dev
# Opens http://localhost:5173
```

### Cloudflare Deployment
- Connected via GitHub webhook (existing)
- SvelteKit adapter configured in `svelte.config.js`
- Build command: `npm run build` (automatic)
- Output directory: `.svelte-kit/cloudflare` (automatic)

---

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| **Perplexity API** | $0.50-2/mo | 100-200 users, light usage (~$0.005-0.015 per request) |
| **Cloudflare Pages** | $0 | Free tier includes static + serverless |
| **Domain** | $0 | Using Pages subdomain |
| **Database** | $0 | localStorage only; no backend |
| **Total** | **~$1-2/mo** | Negligible cost; cheaper than OpenAI with better features |

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SvelteKit learning curve | Medium | Delays Phase 1 | Use official docs + examples; pair with AI agent support |
| Perplexity API quota exceeded | Low | Service interruption | Monitor usage; set monthly budget limit |
| Data loss during refactor | Low | Blocks project | Git branch strategy + frequent commits |
| Browser localStorage full | Very Low | User can't save | Warn when 80% full; prompt cleanup |
| Slow network (target users) | Medium | Poor UX | Optimize bundle size; progressive loading; Perplexity faster than OpenAI |

---

## Success Criteria

### End of Phase 1
- [ ] Local dev environment working
- [ ] 3 pages routing correctly
- [ ] Svelte stores managing state
- [ ] localStorage persisting data
- [ ] No console errors

### End of Phase 8 (Full Refactor)
- [ ] All features working at https://promptflam.pages.dev/
- [ ] Real journalists can use it without issues
- [ ] Average API response time < 5 seconds
- [ ] App works on poor connections (tested at 3G)
- [ ] Users give thumbs-up in feedback

---

## Questions for Lead Developer (Amp)

1. Should we add GitHub Issues for task tracking, or is this roadmap sufficient?
2. Should we implement analytics (e.g., how many chats/day), or keep it simple?
3. For Phase 6 text selection menu: should "Rewrite" re-prompt the AI, or offer quick presets?

