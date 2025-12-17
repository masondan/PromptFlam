# PromptFlam Refactor: Planning Summary

**Date**: December 15, 2025  
**Status**: Planning Complete — Ready for Phase 1  

---

## Questions Answered

### 1. Do We Refactor or Create New?

**Answer: Create fresh locally, merge when ready.**

**Rationale:**
- Keeps existing code safe in git history
- Reduces risk of breaking live site during development
- Clean separation between old (vanilla JS) and new (SvelteKit)
- Easy to compare before/after for learning

**Workflow:**
```
1. Create svelte-refactor branch
2. Generate NEW SvelteKit project (sister directory initially)
3. Build Phase 1-6 on branch
4. When ready: move Svelte project into repo, commit as atomic "Refactor" commit
5. Merge to main when Phase 1 verified
6. Deploy from main → Cloudflare auto-deploys
```

**How Deployment Works:**
- Your current URL (https://promptflam.pages.dev/) stays the same
- Cloudflare watches GitHub `main` branch
- On `git push origin main`, Cloudflare auto-builds and deploys within 2-3 minutes
- Old code stays in git history (rollback possible with `git revert HEAD`)

---

### 2. Best Practice Approach?

**Answer: Yes, this is best practice for educational projects.**

This approach combines:
- **Git branching** (industry standard)
- **Modular documentation** (ROADMAP, DEVELOPMENT, PROJECT_CHECKLIST)
- **Phased development** (reduce risk, enable rollback)
- **Clear AI instructions** (agents.md)

**Why it works:**
- Each phase can be tested and deployed independently
- If Phase 3 (AI integration) breaks, Phase 1 & 2 are still solid
- Documentation lives in git (searchable, version-controlled)
- Easy for new AI agents to onboard

**Why it's better than alternatives:**
- ❌ Parallel folder approach: Confusing which version is "real"
- ❌ No documentation: AI agents have to re-learn decisions
- ❌ Single massive commit: Impossible to rollback specific features

---

### 3. Is This Professional?

**Answer: Yes, and here's why:**

| Element | Professional? | Benefit |
|---------|---------------|---------|
| **Markdown docs (ROADMAP, DEVELOPMENT)** | ✓ | Git-versioned, searchable, collaborative |
| **Git branch strategy** | ✓ | Industry standard for teams |
| **Phased development with checklist** | ✓ | Prevents scope creep; enables parallel work |
| **Environment separation (.env)** | ✓ | Secrets never in code; safe for open source |
| **Clear agent instructions** | ✓ | Reduces rework; improves AI guidance |
| **Cost tracking** | ✓ | Business case documented; budget limits set |

**Compared to enterprise approaches:**
- No JIRA/GitHub Issues (too much overhead for one person + AI)
- No formal code review process (you're learning; do as you scale)
- No CI/CD pipeline (Cloudflare handles it simply)
- Simple > overkill for your context

---

## What I've Created

### 1. **ROADMAP.md** (7 Phases, 6-7 weeks)
- Complete phase breakdown with deliverables
- Definition of Done for each phase
- Git workflow documented
- Risks identified + mitigations
- Success criteria

**How to use:** Reference before starting each phase; check off deliverables.

### 2. **DEVELOPMENT.md** (Step-by-step setup)
- Prerequisites check (Node.js, npm, Git)
- Full SvelteKit setup from scratch
- OpenAI API key walkthrough
- Environment file configuration
- Test at each step
- Troubleshooting guide

**How to use:** Follow exactly for Phase 1 setup; revisit if stuck.

### 3. **PROJECT_CHECKLIST.md** (Actionable tasks)
- Pre-dev setup checklist
- Phase 1-7 checkboxes (tick as you complete)
- Known risks with mitigations
- Success criteria

**How to use:** Print or keep in browser tab; check off tasks daily.

### 4. **Updated agents.md** (New architecture guide)
- Current tech stack documented
- New SvelteKit structure explained
- Services (OpenAI, storage) defined
- Phase overview linked to ROADMAP
- Clear instructions for AI agents

**How to use:** First file AI agents read when joining project.

### 5. **PLANNING_SUMMARY.md** (This file)
- Answers your specific questions
- Rationale for decisions
- Professional best practices
- Next steps

---

## Key Decisions Made

| Decision | Why | Alternative | Why Not |
|----------|-----|-------------|---------|
| **Svelte + SvelteKit** | Small bundle, reactive stores, simple | React | Too heavy for team size |
| | | Vue | Less adoption for SvelteKit deployment |
| | | Vanilla JS refactor | Becomes unmaintainable at 2000+ LOC |
| **Perplexity API** | Real-time sources, citations, journalistic focus | OpenAI | Fixed April 2024 knowledge cutoff |
| | | Google Gemini | Unreliable real-time; stricter quotas |
| | | Anthropic | More expensive; no built-in citations |
| **Browser localStorage only** | Simple, no server cost, fits use case | Firebase | Adds complexity + cost for educational use |
| | | Custom backend | Requires hosting, auth, database |
| **Cloudflare Pages** | Free, auto-deploy, simple | Vercel | Fine, but lock-in; stick with Cloudflare |
| | | Traditional server | Requires maintenance |
| **Git branching (svelte-refactor)** | Industry standard, safe | Parallel folder | Confusing |
| | | Direct to main | Risky; breaks live site |

---

## Cost Summary

### Monthly

| Service | Cost | Why |
|---------|------|-----|
| **Perplexity API** | $0.50-2 | 100-200 users × light usage (~0.005-0.015 per request) |
| **Cloudflare Pages** | $0 | Free tier |
| **Domain** | $0 | Using Pages subdomain |
| **Total** | **~$1-2/month** | Effectively free |

### One-time

- Perplexity account setup: Free
- SvelteKit: Free (open source)
- Development time: Your time (or AI agent time)

### Rollup (First Year)
- **API costs**: $12-24
- **Hosting**: $0
- **Total**: **$12-24**

For 100-200 journalists using the app to learn, this is negligible. Perplexity is actually more cost-effective than OpenAI while providing better features (real-time sources, citations).

---

## Timeline Expectations

| Phase | Duration | Risk Level | Dependencies |
|-------|----------|-----------|--------------|
| **Phase 1: Foundation** | 1-2 weeks | Low | Node.js, npm, Git |
| **Phase 2: Chat UI** | 1 week | Low | Phase 1 done |
| **Phase 3: AI Integration** | 1 week | Medium | OpenAI API key |
| **Phase 4: Prompt Library** | 1-2 weeks | Low | Phase 2 done |
| **Phase 5: Notepad** | 1-2 weeks | Low | Phase 2 done |
| **Phase 6: Polish** | 1-2 weeks | Medium | User testing |
| **Phase 7: Deploy** | 1 day | Low | Phase 6 done |
| **TOTAL** | **6-7 weeks** | — | — |

**Buffer:** Add 1-2 weeks for debugging, learning curves, user feedback.

---

## Next Steps (Action Items)

### Immediate (Today/This Week)
1. ✓ Review ROADMAP.md (understand the 7 phases)
2. ✓ Review DEVELOPMENT.md (understand the setup)
3. ✓ Skim PROJECT_CHECKLIST.md (get comfortable with tasks)
4. Read PLANNING_SUMMARY.md (this file)
5. **Get Perplexity API key** (see DEVELOPMENT.md)
6. **Set $5 monthly budget limit** on Perplexity account

### Phase 1 Start (Next Week or When Ready)
1. Follow DEVELOPMENT.md step-by-step
2. Create `svelte-refactor` branch
3. Generate SvelteKit project
4. Set up stores, services, routes
5. Test locally
6. Commit to branch
7. Deploy to `svelte-refactor` (not live yet)

### During Phase 1-6
1. Follow PROJECT_CHECKLIST.md
2. Commit daily with meaningful messages
3. Reference ROADMAP.md for phase requirements
4. Push to `svelte-refactor` branch (safe; not live)
5. Ask questions using agents.md guidelines

### Before Merging to Main
1. Test Phase 1 thoroughly locally
2. Ensure no console errors
3. Verify localStorage works
4. Create git commit: `"Phase 1: SvelteKit foundation"`
5. Push to GitHub
6. When confident: merge to main

---

## Common Questions Anticipated

### Q: What if I break something in Phase 1?
**A:** You can't. It's on `svelte-refactor` branch. Users won't see it. Revert with `git reset --hard HEAD~1` or `git revert HEAD`. Start over if needed.

### Q: When do I merge to main?
**A:** Only when Phase 1 is fully working locally. Suggest waiting until Phase 2 is also done (lower risk). First merge to main should be: "Phases 1-2 complete, chat UI skeleton ready."

### Q: Will my old vanilla JS code disappear?
**A:** No. It's in git history forever. You can access it with `git checkout <commit-hash>`. The `main` branch will have the new Svelte version, but old version is safe.

### Q: How do I coordinate with AI agents?
**A:** Point them to agents.md (updated with new architecture). They'll see:
- Tech stack decisions (why Svelte)
- Project structure (where files go)
- State management pattern (how to use stores)
- Phase requirements (what to build)

### Q: What if Perplexity API goes down?
**A:** App shows error message to user. No data loss. When API recovers, chat works again. Users just need to refresh.

### Q: Can I test the app without deploying to live site?
**A:** Yes! Run `npm run dev` locally. Test Phase 1-6 as much as you want. Only `git push origin main` triggers live deployment.

---

## Success Definition

**Phase 1 is successful when:**
- [ ] `npm run dev` runs without errors
- [ ] All 3 pages route correctly
- [ ] localStorage saves and loads chat messages
- [ ] No console errors
- [ ] You feel comfortable with Svelte basics

**Full project is successful when:**
- [ ] Journalists can chat with AI
- [ ] Prompts integrate into chat
- [ ] Drafts save and export
- [ ] Works on slow connections
- [ ] Users give thumbs-up feedback
- [ ] Running cost is ~$2/month

---

## Files Created

1. **ROADMAP.md** - Phase breakdown (7 phases)
2. **DEVELOPMENT.md** - Setup instructions (step-by-step)
3. **PROJECT_CHECKLIST.md** - Task checklist (actionable)
4. **agents.md** - Updated with new architecture
5. **PLANNING_SUMMARY.md** - This file (rationale + next steps)

**Total reading time:** ~30 minutes (scan; don't memorize)

---

## My Recommendation

**Start immediately with Phase 1.** Here's why:

- Documentation is complete and clear
- Risk is low (development branch)
- You'll learn Svelte basics by doing
- If stuck, you have step-by-step DEVELOPMENT.md guide
- First checkpoint (Phase 1 done) is only 1-2 weeks away
- Early success builds confidence

**You're not doing this alone.** Each phase:
- Has clear deliverables (no ambiguity)
- Has been risk-assessed (no surprises)
- Can be debugged independently (focused troubleshooting)
- Has been cost-analyzed ($2/month is negligible)

This is achievable. Let's build.

---

## Questions Before We Start?

If you have questions about:
- **Svelte syntax** → See https://svelte.dev/docs
- **SvelteKit routing** → See https://kit.svelte.dev/docs/routing
- **Perplexity API** → See https://docs.perplexity.ai/
- **Git workflow** → Ask; happy to clarify
- **Project scope** → Reference ROADMAP.md phases

Otherwise, **you're ready for Phase 1.**

