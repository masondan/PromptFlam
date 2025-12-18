# Phase Development Guide

**Purpose**: Single source of truth for current phase tasks and approval gates.

Each phase has its own detailed file. This document shows the overall structure.

---

## Phase Overview

| Phase | Title | Status | Duration |
|-------|-------|--------|----------|
| 1 | Foundation & Refactor | ✓ Complete | Week 1-2 |
| 2 | Chat UI Skeleton | ✓ Complete | Week 2-3 |
| 3 | Real AI Integration | ✓ Complete | Week 3-4 |
| 4 | Prompt Library Integration | **Current** | Week 4-5 |
| 5 | Archive Page | Pending | Week 5-6 |
| 6 | Edit Page | Pending | Week 6-7 |
| 7 | Advanced Features & Polish | Pending | Week 7-8 |
| 8 | Deployment & Launch | Pending | Week 8 |

---

## Current Phase

**See**: `PHASE_4.md` for detailed tasks and deliverables.

---

## Phase Structure

Each phase file (`PHASE_N.md`) contains:

1. **Objective** - What we're building and why
2. **Deliverables** - Non-negotiable checklist
3. **Key Components** - Files to create/modify
4. **Definition of Done** - Success criteria
5. **Approval Gate** - When to proceed to next phase

---

## Workflow

### For Developers

1. **Read current phase file** (e.g., `PHASE_3.md`)
2. **Follow deliverables checklist**
3. **Commit frequently** with clear messages
4. **When done**: Submit checkpoint summary
   - What was built (bullet list)
   - Proof of functionality (links, screenshots)
   - Any blockers or questions
5. **Wait for lead approval** before proceeding

### For Project Lead

1. **Review checkpoint submission**
2. **Test locally** (`npm run dev`)
3. **Confirm understanding** with developer
4. **Give explicit approval** ("Ready for Phase X")
5. **Update this file** with new current phase

---

## Key Gates

Before proceeding to next phase:

- [ ] All deliverables in current phase complete
- [ ] Code tested locally (`npm run dev`)
- [ ] No console errors
- [ ] Commits pushed to `svelte-refactor` branch
- [ ] Project Lead reviews and approves
- [ ] Explicit "green light" given to proceed

**No exceptions** to this workflow. Prevents scope creep and ensures quality.

---

## Communication

- **Questions about phase tasks?** Ask before coding
- **Blocked or unsure?** Stop and communicate
- **Phase looks wrong?** Clarify with lead before implementing
- **Found a bug in previous phase?** Note it; prioritize current phase tasks

---

## Historical Phases (Complete)

### Phase 1: Foundation & Refactor ✓
- SvelteKit initialized
- Router with 4 pages
- State stores setup
- localStorage wrapper
- Icon system ready

**Status**: Complete

### Phase 2: Chat UI Skeleton ✓
- Top navigation bar
- Chat input with bracket-chip support
- Message display
- Mock AI responses
- Mobile responsive

**Status**: Complete

### Phase 3: Real AI Integration ✓
- Perplexity API service
- Real API calls integrated
- Streaming response display
- Citation extraction and display
- Error handling and loading states

**Status**: Complete

---

## Upcoming Phases (Pending)

### Phase 5: Archive Page
See `PHASE_5.md` for reference

### Phase 6: Edit Page
See `PHASE_6.md` for reference

### Phase 7: Advanced Features & Polish
See `PHASE_7.md` for reference

### Phase 8: Deployment & Launch
See `PHASE_8.md` for reference

---

## Git Workflow (All Phases)

**Development branch**: `svelte-refactor`  
**Stable branch**: `main` (production)

```bash
# While in phase
git add .
git commit -m "Phase X: [what was built]"
git push origin svelte-refactor

# When phase complete
# Lead reviews + approves
# Then merge to main:
git checkout main
git merge svelte-refactor
git push origin main
# Cloudflare auto-deploys
```

---

## Approval Checklist Template

Use this when submitting a phase checkpoint:

```markdown
# Phase X Checkpoint

## What Was Built
- ✓ Deliverable 1
- ✓ Deliverable 2
- ✓ Deliverable 3

## Proof of Functionality
- [x] Local dev runs (`npm run dev`)
- [x] No console errors
- [x] Feature X works (tested)
- [x] localStorage persists
- [x] Mobile layout OK

## Blockers or Questions
None

## Ready for Phase X+1
Yes
```

---

## Timeline & Expectations

- **Phase duration**: 1-2 weeks per phase
- **Review turnaround**: 1-2 days
- **Buffer**: Add 1-2 weeks total for debugging + questions
- **Total project**: ~8 weeks estimated

**This is not a race.** Quality and understanding matter more than speed.

---

## Questions?

- **"What should I build?"** → Current phase file (e.g., `PHASE_3.md`)
- **"Is this phase done?"** → Check "Definition of Done" in phase file
- **"Can I start next phase?"** → Wait for lead approval + explicit green light
- **"What if I don't understand a task?"** → Ask lead before coding

---

**Last Updated**: Dec 18, 2025  
**Current Phase**: 4 (Prompt Library Integration)  
**Project Lead**: Dan Mason
