# PromptFlam Refactor: Project Checklist

**Project**: PromptFlam AI Writer (Svelte Refactor)  
**Status**: Planning ✓ → Phase 1 (In Progress)  
**Lead**: Dan Mason  
**Coding Lead**: Amp AI  
**Start Date**: Dec 15, 2025  
**Target Completion**: ~6-7 weeks

---

## Pre-Development (Setup)

- [ ] **Create ROADMAP.md** (Phases 1-7) ✓
- [ ] **Create DEVELOPMENT.md** (Step-by-step setup) ✓
- [ ] **Update agents.md** (New architecture, tech stack) ✓
- [ ] **Create PROJECT_CHECKLIST.md** (This file) ✓
- [ ] Verify Git repo is clean and ready
- [ ] Confirm GitHub repo access (`git push` works)
- [ ] Get Perplexity API key (see DEVELOPMENT.md)
- [ ] Set Perplexity budget limit to $5/month

---

## Phase 1: Foundation & Refactor (Week 1-2)

### Setup

- [ ] Create `svelte-refactor` branch locally
- [ ] Generate SvelteKit project (`npm create svelte@latest`)
- [ ] Install dependencies (`npm install`)
- [ ] Install Cloudflare adapter (`npm install -D @sveltejs/adapter-cloudflare`)
- [ ] Configure `svelte.config.js` with adapter
- [ ] Create `.env.local` with OpenAI API key
- [ ] Create `.env.example` template (no key)
- [ ] Copy `prompts.json` to `static/`
- [ ] Copy assets (logos, icons) to `static/`

### Routes & Pages

- [ ] Create `src/routes/+page.svelte` (Create page stub)
- [ ] Create `src/routes/prompts/+page.svelte` (Prompts page stub)
- [ ] Create `src/routes/edit/+page.svelte` (Edit page stub)
- [ ] Create `src/routes/+layout.svelte` (Root layout stub)
- [ ] Verify routing works locally (all 3 pages accessible)

### State Management

- [ ] Create `src/lib/stores.js` with:
  - [ ] `chatMessages` store (with localStorage persistence)
  - [ ] `currentPersona` store
  - [ ] `currentAudience` store
  - [ ] `drafts` store (with localStorage persistence)
- [ ] Test stores in browser console

### Services

- [ ] Create `src/lib/services/storage.js` (localStorage wrapper)
  - [ ] `set(key, value)` method
  - [ ] `get(key)` method
  - [ ] `remove(key)` method
  - [ ] `clear()` method
- [ ] Create `src/lib/services/perplexity.js` (API wrapper)
  - [ ] `callPerplexity(messages, persona, audience)` function
  - [ ] Citation extraction and parsing
  - [ ] Error handling
  - [ ] API key from env vars
- [ ] Test API key works (see DEVELOPMENT.md)

### Components (Stubs)

- [ ] Create `src/lib/components/Header.svelte` (basic)
- [ ] Create `src/lib/components/Footer.svelte` (basic)
- [ ] Create `src/lib/components/ChatMessage.svelte` (placeholder)

### Testing & Verification

- [ ] Run `npm run dev` → no errors
- [ ] All 3 pages route correctly
- [ ] localStorage reads/writes work
- [ ] Browser console has no errors
- [ ] Formatting code with Prettier: `npm run format`
- [ ] Linting passes: `npm run lint`

### Git & Commit

- [ ] Commit to `svelte-refactor` branch
- [ ] `git push origin svelte-refactor`
- [ ] Create GitHub PR (optional, for code review)

**Phase 1 Definition of Done**: Local dev environment fully functional with router, stores, and services working.

---

## Phase 2: Chat UI Skeleton (Week 2-3)

- [ ] **Chat Input Component**
  - [ ] Text input field
  - [ ] Send button
  - [ ] Microphone button (placeholder)
- [ ] **Message Display**
  - [ ] Display user messages
  - [ ] Display AI responses (mock)
  - [ ] Scroll to bottom on new message
  - [ ] Timestamp display
- [ ] **Persona & Audience**
  - [ ] Text input for "Act as..."
  - [ ] Text input for "Audience"
  - [ ] Save to store on blur
- [ ] **Session Management**
  - [ ] Messages persist on refresh
  - [ ] "Start Again" button clears session
- [ ] **Footer Navigation**
   - [ ] Create tab (current page)
   - [ ] Prompts tab (navigate)
   - [ ] Edit tab (navigate)
   - [ ] Fixed positioning (~50px height)
   - [ ] Full labels on desktop view
   - [ ] Icons-only on mobile (space efficient)
   - [ ] No scroll-based hide/show (reliability > space)
- [ ] **Styling & Layout**
  - [ ] Mobile-first responsive
  - [ ] Chat bubbles styled
  - [ ] Input area sticky to bottom
- [ ] **Testing**
  - [ ] Messages persist across page refresh
  - [ ] Mock responses flow through UI
  - [ ] Navigation between pages works
- [ ] **Git Commit**
  - [ ] `git push origin svelte-refactor`

**Phase 2 Definition of Done**: Chat UI works; mock responses display; ready for real AI.

---

## Phase 3: Real AI Integration (Week 3-4)

- [ ] **API Integration**
  - [ ] Replace mock responses with real Perplexity API calls
  - [ ] Pass persona/audience to API
  - [ ] Extract and store citations
  - [ ] Handle API errors gracefully
- [ ] **Streaming Display**
  - [ ] Token-by-token text animation
  - [ ] Display citations below response (with links)
  - [ ] Loading spinner
  - [ ] Stop/cancel button
- [ ] **Citation Handling**
  - [ ] Parse citations from API response
  - [ ] Display source links below each response
  - [ ] Make citations clickable to open in new tab
  - [ ] Store citation data in message object
- [ ] **Error Handling**
  - [ ] Network error messages
  - [ ] Rate limit messages
  - [ ] Helpful error recovery
- [ ] **Loading States**
  - [ ] Disable send button while processing
  - [ ] Show "thinking..." indicator
  - [ ] Timeout after 30 seconds
- [ ] **Cost Monitoring**
  - [ ] Log request count
  - [ ] Display cost in dev mode
- [ ] **Testing**
  - [ ] Send real prompt → receive AI response with sources
  - [ ] Streaming animation works
  - [ ] Citations display correctly
  - [ ] Errors handled gracefully
  - [ ] API key not exposed in frontend
- [ ] **Git Commit**
  - [ ] `git push origin svelte-refactor`

**Phase 3 Definition of Done**: Real AI responses working with citations; streaming display implemented.

---

## Phase 4: Prompt Library Integration (Week 4-5)

- [ ] **Prompts Page**
  - [ ] Load prompts from `prompts.json`
  - [ ] Display as cards
  - [ ] Limit text to 2 lines + expand option
- [ ] **Filtering**
  - [ ] Category dropdown
  - [ ] Subcategory dropdown
  - [ ] Filter on selection
- [ ] **Search**
  - [ ] Search input field
  - [ ] Filter prompts by text
  - [ ] Highlight matches
- [ ] **Favorites**
  - [ ] Star button on cards
  - [ ] Save to localStorage
  - [ ] "Show Favorites" toggle
  - [ ] Favorites persist across sessions
- [ ] **Insert Prompt → Chat**
  - [ ] Button on each prompt card
  - [ ] Insert text into chat input
  - [ ] Navigate to Create page
  - [ ] Set persona/audience from prompt defaults
- [ ] **Edit Drawer**
  - [ ] Tap to edit prompt text
  - [ ] Copy edited prompt
  - [ ] Bracket selection helper
- [ ] **Copy Functionality**
  - [ ] Copy prompt to clipboard
  - [ ] Visual feedback (checkmark)
- [ ] **JSON Schema Update**
  - [ ] Add `defaultPersona` field
  - [ ] Add `defaultAudience` field
  - [ ] Update `prompts.json`
- [ ] **Testing**
  - [ ] All prompts display
  - [ ] Filtering works
  - [ ] Search finds prompts
  - [ ] Favorites persist
  - [ ] Insert to chat works
- [ ] **Git Commit**
  - [ ] `git push origin svelte-refactor`

**Phase 4 Definition of Done**: Full prompt library integration; insert-to-chat working.

---

## Phase 5: Edit Page (Week 5-6)

- [ ] **Editor Layout**
  - [ ] Title input field
  - [ ] Main text area (contenteditable or textarea)
  - [ ] Fixed toolbar at top
- [ ] **Formatting Toolbar**
  - [ ] Bold button
  - [ ] Italic button
  - [ ] Underline button
  - [ ] Text size dropdown (small/normal/large)
- [ ] **Draft Management**
  - [ ] Save draft to localStorage
  - [ ] List of saved drafts
  - [ ] Load draft
  - [ ] Delete draft
  - [ ] Auto-save on every keystroke
- [ ] **Export**
  - [ ] Copy to clipboard
  - [ ] Download as .txt file
  - [ ] Verify downloaded file opens correctly
- [ ] **Clear Function**
  - [ ] Clear button with confirmation
- [ ] **Optional: Spelling & Grammar**
  - [ ] Display issues as underlines
  - [ ] Suggest fixes
  - [ ] Fix/Skip buttons
  - [ ] (If time permits; can defer)
- [ ] **Testing**
  - [ ] Text edits work
  - [ ] Formatting applies
  - [ ] Drafts save/load correctly
  - [ ] Download produces valid .txt
  - [ ] Mobile keyboard doesn't hide content
- [ ] **Git Commit**
  - [ ] `git push origin svelte-refactor`

**Phase 5 Definition of Done**: Draft editor fully functional with save/export.

---

## Phase 6: Advanced Features & Polish (Week 6-7)

- [ ] **Text Selection Menu**
   - [ ] Highlight text in chat response → inline pop-up menu (Gemini pill style)
   - [ ] Text selection menu options: Rewrite, Expand, Shorten, Copy
   - [ ] Selected text regenerates in place (not full response)
- [ ] **Response Buttons**
   - [ ] [Rewrite] button under each AI response
   - [ ] [Sources] button under each AI response
   - [ ] [Copy] button under each AI response
- [ ] **Rewrite Behavior**
   - [ ] [Rewrite] button adds original prompt to input field
   - [ ] User can modify prompt before regenerating
   - [ ] New response replaces old one in conversation
- [ ] **Sources Drawer**
   - [ ] Tapping inline source number opens drawer
   - [ ] Tapping [Sources] button opens drawer
   - [ ] Card-based display with website name + 2-line preview
   - [ ] Clickable links to external sources
   - [ ] Summary "X sources" button under response
- [ ] **Session History**
   - [ ] List past chat sessions
   - [ ] Restore old session
   - [ ] Delete session
   - [ ] Timestamp on each session
- [ ] **Performance Optimization**
   - [ ] Lazy load components
   - [ ] Code splitting
   - [ ] Bundle size analysis
- [ ] **Browser Compatibility**
   - [ ] Test on Chrome, Firefox, Safari
   - [ ] Test on iOS Safari, Android Chrome
   - [ ] Check console for errors
- [ ] **Accessibility (WCAG 2.1 AA)**
   - [ ] Keyboard navigation
   - [ ] Color contrast ratios
   - [ ] Alt text on images
   - [ ] ARIA labels
   - [ ] Screen reader testing (optional)
- [ ] **User Testing**
   - [ ] Recruit 3-5 test users
   - [ ] Watch them use app (no guidance)
   - [ ] Collect feedback
   - [ ] Fix blockers
- [ ] **Documentation**
   - [ ] Update agents.md with final tech stack
   - [ ] Add troubleshooting section
   - [ ] Add user guide (optional)
- [ ] **Git Commit**
   - [ ] `git push origin svelte-refactor`

**Phase 6 Definition of Done**: App is polished, tested, and ready for production. Sources drawer functional, text selection menu working, response buttons accessible.

---

## Phase 7: Deployment & Launch (Week 7)

- [ ] **Merge to Main**
  - [ ] Final review of svelte-refactor branch
  - [ ] `git checkout main`
  - [ ] `git merge svelte-refactor`
  - [ ] `git push origin main`
- [ ] **Cloudflare Deploy**
  - [ ] Wait for auto-deploy (2-3 min)
  - [ ] Verify https://promptflam.pages.dev/ works
  - [ ] Check all pages load
  - [ ] Test AI chat works
- [ ] **Rollback Plan**
  - [ ] Document rollback procedure
  - [ ] Test rollback works (revert last commit)
  - [ ] Verify old version loads
- [ ] **Update Documentation**
  - [ ] Update README with new features
  - [ ] Update agents.md final status
  - [ ] Archive old vanilla JS docs
- [ ] **Notify Users**
  - [ ] Email/message your journalists
  - [ ] Highlight new features
  - [ ] Request feedback
- [ ] **Monitor (First Week)**
  - [ ] Check Cloudflare analytics
  - [ ] Monitor OpenAI API usage
  - [ ] Fix any reported issues
  - [ ] Adjust based on user feedback

**Phase 7 Definition of Done**: App live in production; old version in git history for rollback.

---

## Post-Launch (Ongoing)

- [ ] Monitor Perplexity API costs (should be ~$0.50-2/mo)
- [ ] Fix user-reported bugs
- [ ] Gather feedback for future enhancements
- [ ] Update ROADMAP with lessons learned
- [ ] Consider analytics (when, where, how app is used)
- [ ] Evaluate Phase 8 features (Related Questions, Persona/Audience) based on user feedback

---

## Known Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| SvelteKit learning curve | Use official docs; leverage AI agent support |
| Data loss during refactor | Git branch strategy; frequent commits |
| Perplexity API quota exceeded | Set $5 monthly budget limit |
| Slow network (users in developing countries) | Optimize bundle; Perplexity typically faster than OpenAI; test on 3G |
| Browser localStorage fills up | Warn users at 80%; offer cleanup |
| Users on old devices can't run app | Test on older phones (iPhone 6s, Android 5) |

---

## Questions for Code Lead (Amp)

- Should we add GitHub Issues + Projects for task tracking?
- Should we implement analytics (usage metrics)?
- Should "Saved Chats" feature be Phase 6 or defer to future?
- Should we include a "Feedback" button to collect user input?
- When should Phase 8 features (Related Questions, Persona/Audience) be evaluated?

---

## Success Criteria (Overall)

- ✓ App deployed and live at https://promptflam.pages.dev/
- ✓ Users can chat with AI without friction
- ✓ Prompt library integrated and searchable
- ✓ Drafts on Edit page save and export as .txt
- ✓ Runs smoothly on slow networks
- ✓ Journalists can use it for their work
- ✓ Cost stays under $5/month
- ✓ Positive user feedback

