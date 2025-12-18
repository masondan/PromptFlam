# AI Agent Briefing: PromptFlam SvelteKit Refactor

**Status**: Ready for Phase 1 Implementation  
**Date**: Dec 16, 2025  
**Lead**: Dan Mason  
**AI Agent Assignment**: Amp

---

## Executive Summary

PromptFlam is a prompt library application being refactored from vanilla JavaScript to SvelteKit. This document confirms that all planning is complete and the AI agent has sufficient clarity to begin Phase 1 development.

---

## What You Need to Know Before Starting

### 1. Context Documents (Read in Order)
1. **INDEX.md** - Project overview and features (2 min)
2. **PLANNING_SUMMARY.md** - Design decisions and rationale (10 min)
3. **agents.md** - Architecture and tech stack (10 min)
4. **ROADMAP.md** - Phase breakdown and timeline (20 min)
5. **ICON_REFERENCE.md** - Icon system and naming (5 min)
6. **DEVELOPMENT.md** - Local setup instructions (when needed)

### 2. Critical Agreement Points (Already Decided)

✓ **Framework**: SvelteKit + Svelte stores (no TypeScript)  
✓ **Icons**: Hybrid system with barrel export + Icon.svelte wrapper  
✓ **Design**: Minimalist, light background, material design principles  
✓ **Data**: localStorage only (no backend)  
✓ **Archive**: 30-day retention + max 10 chats/10 notes with three-dot menu (Download | Share | Delete)  
✓ **Development**: Step-by-step phases with explicit lead approval before each phase  

### 3. Icon System (Critical for All Phases)

All icons are in `public/icons/` at 24×24px. The icon system workflow is:

```
public/icons/
├── icon-create.svg
├── icon-create-fill.svg
├── icon-send.svg
├── icon-prompts.svg
├── icon-prompts-fill.svg
├── icon-delete.svg
├── ... etc

src/lib/icons.js (barrel export)
↓
export { default as IconCreate } from '$lib/icons/icon-create.svg?component';
export { default as IconSend } from '$lib/icons/icon-send.svg?component';
... etc

src/lib/components/Icon.svelte (wrapper)
↓
Usage in components: <Icon name="send" size={24} />
```

See **ICON_REFERENCE.md** for complete icon list and filenames.

---

## Phase 1: Foundation & Refactor (Your Starting Point)

### Objective
Establish modular SvelteKit architecture with icon system. No new features yet.

### Deliverables (Non-Negotiable)

**Core Setup:**
- [ ] SvelteKit initialized with Cloudflare Pages adapter
- [ ] 4 page stubs (Create, Prompts, Edit, Archive) with basic routing
- [ ] Svelte stores for state: chatMessages, drafts, currentPrompts, archiveChats, archiveEdits
- [ ] localStorage wrapper service (`src/lib/services/storage.js`)
- [ ] Environment setup for Perplexity API key
- [ ] prompts.json ported and accessible
- [ ] Assets migrated to `public/icons/` and `public/` (logos)

**Icon System (Critical):**
- [ ] `$lib/icons.js` - Barrel export of all icons
- [ ] `$lib/components/Icon.svelte` - Wrapper component
  - Accepts `name` and `size` props (default 24px)
  - Handles global styling (color, hover, accessibility)
  - Supports outline and filled variants
- [ ] Icon usage documented with examples
- [ ] All 20+ icons test correctly

**Definition of Done:**
- `npm run dev` works locally
- 4 pages route correctly
- localStorage persists/reads data
- `<Icon name="send" size={24} />` works in any component
- No console errors

### Key Files to Create
```
src/
├── routes/
│   ├── +page.svelte (Create page stub)
│   ├── +layout.svelte (Root layout)
│   ├── prompts/
│   │   └── +page.svelte (Prompts page stub)
│   ├── edit/
│   │   └── +page.svelte (Edit page stub)
│   └── archive/
│       └── +page.svelte (Archive page stub)
├── lib/
│   ├── icons.js ← Icon barrel export (CRITICAL)
│   ├── stores.js ← State management
│   ├── services/
│   │   ├── storage.js ← localStorage wrapper
│   │   └── perplexity.js ← Placeholder for Phase 3
│   └── components/
│       └── Icon.svelte ← Icon wrapper (CRITICAL)
├── app.svelte
└── app.css

public/
├── icons/ ← All 24×24px SVG icons (already provided by lead)
└── [logos, favicon, etc.]

.env.example ← Perplexity API key template
svelte.config.js ← Cloudflare Pages adapter
```

---

## Development Workflow for This Assignment

### Step 1: You (AI Agent) Complete Phase 1
- Follow the deliverables list above
- Create clean, well-commented code
- Test locally (`npm run dev`)
- Commit to `svelte-refactor` branch

### Step 2: Checkpoint Submission
When Phase 1 is complete, **submit a summary** including:
- What was built (bullet list)
- Any deviations from plan (and why)
- Proof of functionality (e.g., "All icons render, stores persist to localStorage")
- Any blockers or questions

### Step 3: Lead Reviews
Dan Mason will:
- Test your work locally
- Confirm understanding
- Ask clarifying questions
- Identify next phase (Phase 2)

### Step 4: Explicit Green Light
**Only after Dan confirms and says "ready for Phase 2"** do you proceed.

---

## Important Constraints & Guidelines

✗ **Do NOT:**
- Add new features beyond Phase 1 scope
- Skip the icon system; it's needed for all phases
- Commit to main branch (use `svelte-refactor`)
- Assume design decisions not in this document

✓ **Do:**
- Ask clarifying questions if anything is unclear
- Keep component file sizes reasonable (<300 LOC)
- Document store schema in `src/lib/stores.js` comments
- Test icon rendering at 24px (the standard size)
- Commit frequently with clear messages

---

## Quick Reference: Store Schema

Based on Phase descriptions, your `src/lib/stores.js` should export:

```javascript
// State stores (all auto-persist to localStorage)
export const chatMessages = writable([]); // [{role, content, timestamp, sources}]
export const drafts = writable([]); // [{id, title, content, timestamp}]
export const currentPrompts = writable([]); // [{bracketContent}] for chat input
export const archiveChats = writable([]); // [{id, messages[], timestamp}]
export const archiveEdits = writable([]); // [{id, title, content, timestamp}]

// Note: Full API integration in Phase 3; store just the response structure
```

See ROADMAP.md for detailed state management notes.

---

## When You're Ready to Start

1. Read the context documents above
2. Confirm you understand Phase 1 deliverables
3. Ask any clarifying questions in this thread
4. When you have green light from lead, begin coding
5. Commit to `svelte-refactor` branch
6. Submit Phase 1 checkpoint when done

---

## Questions This Document Should Answer

- **"What framework am I using?"** → SvelteKit (see agents.md)
- **"How do I use icons?"** → Hybrid system via `Icon.svelte` (see ICON_REFERENCE.md)
- **"What do I build in Phase 1?"** → 4 page stubs + icon system (see above)
- **"When do I proceed to Phase 2?"** → After lead reviews and gives explicit approval
- **"What if I have questions?"** → Ask before coding; checkpoint is not code review time

---

## Files Referenced in This Document

- **ROADMAP.md** - Master timeline and phase details
- **agents.md** - Architecture and tech stack
- **ICON_REFERENCE.md** - Icon system with filenames
- **DEVELOPMENT.md** - Local setup (read before running `npm install`)
- **INDEX.md** - Feature overview and user perspective
- **PLANNING_SUMMARY.md** - Design rationale and decisions

---

**Status**: ✅ Ready for Phase 1  
**Approval Required Before Proceeding**: Dan Mason  
**Next Milestone**: Phase 1 checkpoint + explicit "green light" for Phase 2
