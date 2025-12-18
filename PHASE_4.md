# Phase 4: Prompt Library Integration

**Objective**: Migrate existing prompts page into new architecture; implement two access points.  
**Status**: Current Phase  
**Approval Required Before Phase 5**: Project Lead (Dan Mason)

---

## What to Build

Integrate the prompt library with two separate access points:
1. **Prompts Page** (via navigation button or swipe) - Full browsing experience for discovering prompts
2. **Prompt Shortcut Drawer** (icon in Create page chat input) - Quick insertion into chat for active conversation

---

## Deliverables (Non-Negotiable)

### A. Prompts Page (Full Library)
- [ ] Full-screen prompt library page functional (`/routes/prompts/+page.svelte`)
- [ ] Category + subcategory filters working
- [ ] Search functionality in toolbar ([All Prompts] [Search] [Favourites])
- [ ] Favorites system (saved to localStorage)
- [ ] Copy prompt functionality
- [ ] Browse-only (no direct insertion from page; users navigate via button)

### B. Prompt Shortcut Drawer (In Create Page)
- [ ] Full-screen drawer accessible from chat input icon
- [ ] Same category/subcategory filters
- [ ] Same search functionality
- [ ] "Insert Prompt" button closes drawer and adds prompt to chat input
- [ ] Prompt text with [square brackets] inserted into chat input
- [ ] Bracket content renders as visual chips in chat input

---

## Key Files to Create/Modify

### Create
- `src/lib/components/PromptCard.svelte` - Individual prompt display (reused in both page and drawer)
- `src/lib/components/PromptFilters.svelte` - Category + subcategory dropdowns (reused)
- `src/lib/components/PromptSearch.svelte` - Search toolbar (reused)
- `src/lib/components/PromptDrawer.svelte` - Shortcut drawer with insert functionality

### Modify
- `src/routes/prompts/+page.svelte` - Full prompts page for browsing
- `src/routes/+page.svelte` - Add drawer icon to chat input
- `src/lib/stores.js` - Add favorites store if needed
- `src/lib/components/ChatInput.svelte` - Add drawer trigger icon

### No Changes Needed
- `prompts.json` structure (postponed to Phase 9)
- API integration (already complete from Phase 3)
- Header/navigation (already complete from Phase 2)

---

## Implementation Guide

### Step 1: Create PromptCard Component

**File**: `src/lib/components/PromptCard.svelte`

```svelte
<script>
  export let prompt;
  export let showInsert = false;
  export let onInsert = null;
  export let onCopy = null;
  
  import { favorites } from '$lib/stores.js';
  
  function toggleFavorite() {
    favorites.toggle(prompt.subcategory);
  }
  
  function handleCopy() {
    navigator.clipboard.writeText(prompt.text);
    if (onCopy) onCopy(prompt);
  }
  
  function handleInsert() {
    if (onInsert) onInsert(prompt);
  }
</script>

<div class="prompt-card">
  <div class="prompt-header">
    <span class="subcategory">{prompt.subcategory}</span>
    <button class="favorite-btn" on:click={toggleFavorite}>
      {$favorites.includes(prompt.subcategory) ? '★' : '☆'}
    </button>
  </div>
  <p class="prompt-text">{prompt.text}</p>
  <div class="prompt-actions">
    <button on:click={handleCopy}>Copy</button>
    {#if showInsert}
      <button class="insert-btn" on:click={handleInsert}>Insert Prompt</button>
    {/if}
  </div>
</div>
```

### Step 2: Create PromptFilters Component

**File**: `src/lib/components/PromptFilters.svelte`

```svelte
<script>
  export let categories = [];
  export let subcategories = [];
  export let selectedCategory = '';
  export let selectedSubcategory = '';
  
  $: filteredSubcategories = selectedCategory 
    ? subcategories.filter(s => s.category === selectedCategory)
    : subcategories;
</script>

<div class="filters">
  <select bind:value={selectedCategory}>
    <option value="">All Categories</option>
    {#each categories as category}
      <option value={category}>{category}</option>
    {/each}
  </select>
  
  <select bind:value={selectedSubcategory}>
    <option value="">All Subcategories</option>
    {#each filteredSubcategories as sub}
      <option value={sub.name}>{sub.name}</option>
    {/each}
  </select>
</div>
```

### Step 3: Create PromptSearch Component

**File**: `src/lib/components/PromptSearch.svelte`

```svelte
<script>
  export let searchQuery = '';
  export let activeTab = 'all'; // 'all' | 'search' | 'favorites'
</script>

<div class="search-toolbar">
  <button 
    class:active={activeTab === 'all'} 
    on:click={() => activeTab = 'all'}>
    All Prompts
  </button>
  <button 
    class:active={activeTab === 'search'} 
    on:click={() => activeTab = 'search'}>
    Search
  </button>
  <button 
    class:active={activeTab === 'favorites'} 
    on:click={() => activeTab = 'favorites'}>
    Favourites
  </button>
</div>

{#if activeTab === 'search'}
  <input 
    type="text" 
    bind:value={searchQuery} 
    placeholder="Search prompts..."
  />
{/if}
```

### Step 4: Create PromptDrawer Component

**File**: `src/lib/components/PromptDrawer.svelte`

```svelte
<script>
  export let isOpen = false;
  export let onInsert;
  
  import PromptCard from './PromptCard.svelte';
  import PromptFilters from './PromptFilters.svelte';
  import PromptSearch from './PromptSearch.svelte';
  
  // Import prompts data
  let prompts = [];
  
  function handleInsert(prompt) {
    onInsert(prompt.text);
    isOpen = false;
  }
  
  function close() {
    isOpen = false;
  }
</script>

{#if isOpen}
  <div class="drawer-overlay" on:click={close}>
    <div class="drawer" on:click|stopPropagation>
      <button class="close-btn" on:click={close}>×</button>
      <PromptSearch />
      <PromptFilters />
      <div class="prompt-list">
        {#each prompts as prompt}
          <PromptCard {prompt} showInsert={true} onInsert={handleInsert} />
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 100;
  }
  
  .drawer {
    position: absolute;
    inset: 0;
    background: white;
    overflow-y: auto;
    padding: 1rem;
  }
</style>
```

### Step 5: Update Stores for Favorites

**File**: `src/lib/stores.js` (add to existing)

```javascript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { storage } from './services/storage.js';

// Favorites store
function createFavoritesStore() {
  const initial = browser ? storage.get('favorites') || [] : [];
  const { subscribe, set, update } = writable(initial);
  
  return {
    subscribe,
    toggle: (subcategory) => {
      update(favs => {
        const newFavs = favs.includes(subcategory)
          ? favs.filter(f => f !== subcategory)
          : [...favs, subcategory];
        if (browser) storage.set('favorites', newFavs);
        return newFavs;
      });
    },
    clear: () => {
      set([]);
      if (browser) storage.remove('favorites');
    }
  };
}

export const favorites = createFavoritesStore();
```

### Step 6: Add Drawer to Create Page

In `src/routes/+page.svelte`, add:

```svelte
<script>
  import PromptDrawer from '$lib/components/PromptDrawer.svelte';
  
  let drawerOpen = false;
  
  function insertPrompt(text) {
    // Add prompt text to chat input
    inputValue = text;
  }
</script>

<!-- In chat input area -->
<button class="drawer-icon" on:click={() => drawerOpen = true}>
  📚
</button>

<PromptDrawer 
  isOpen={drawerOpen} 
  onInsert={insertPrompt} 
/>
```

---

## Definition of Done

Phase 4 is complete when:

- [ ] Prompts page accessible via navigation button and swipe
- [ ] Prompts page shows all prompts with category/subcategory filters
- [ ] Search finds prompts correctly on Prompts page
- [ ] Favorites can be toggled and persist in localStorage
- [ ] Copy button copies prompt text to clipboard
- [ ] Shortcut drawer accessible from Create page chat input icon
- [ ] Drawer has same filters and search as Prompts page
- [ ] "Insert Prompt" button closes drawer
- [ ] Inserted prompt appears in chat input
- [ ] Bracket content `[like this]` renders as visual chips in chat input
- [ ] Both interfaces share the same prompt data
- [ ] No changes to `prompts.json` structure
- [ ] `npm run dev` works without errors
- [ ] Mobile layout functional
- [ ] No console errors or warnings

---

## Testing Checklist

Before marking Phase 4 complete:

- [ ] Navigate to Prompts page via nav button
- [ ] Navigate to Prompts page via swipe gesture
- [ ] Filter by category; verify prompts update
- [ ] Filter by subcategory; verify prompts update
- [ ] Search for a prompt; verify results
- [ ] Toggle a favorite; refresh page; verify persists
- [ ] Copy a prompt; paste elsewhere; verify text
- [ ] Open drawer from Create page chat input
- [ ] Insert a prompt from drawer
- [ ] Verify drawer closes on insert
- [ ] Verify prompt appears in chat input
- [ ] Verify brackets render as chips
- [ ] Test on mobile; verify layout + functionality

---

## Common Issues & Solutions

### Prompts not loading
**Cause**: `prompts.json` path incorrect  
**Fix**: Ensure file is in `static/` folder  
**Access**: Fetch from `/prompts.json`

### Favorites not persisting
**Cause**: localStorage not being written  
**Fix**: Check `browser` guard in store  
**Debug**: `console.log(localStorage.getItem('favorites'))`

### Drawer not closing on insert
**Cause**: `isOpen` not being set to false  
**Fix**: Ensure `handleInsert` sets `isOpen = false`

### Chips not rendering in chat input
**Cause**: Bracket parsing regex issue  
**Fix**: Use `/\[([^\]]+)\]/g` to match `[content]`

### Filters not updating prompts
**Cause**: Reactive statement not triggering  
**Fix**: Use `$:` for computed filtered list

---

## Resources

- **Existing prompts.json**: Check current structure before coding
- **Phase 2 ChatInput**: Reference for bracket-chip implementation
- **SvelteKit routing**: https://kit.svelte.dev/docs/routing

---

## Commits

As you work, commit frequently:

```bash
git add .
git commit -m "Phase 4: Add PromptCard and PromptFilters components"
git commit -m "Phase 4: Implement Prompts page with filters"
git commit -m "Phase 4: Add favorites system with localStorage"
git commit -m "Phase 4: Add PromptDrawer with insert functionality"
git commit -m "Phase 4: Connect drawer to Create page chat input"
git push origin svelte-refactor
```

---

## Checkpoint Submission

When Phase 4 is complete, submit:

```markdown
# Phase 4 Checkpoint: Prompt Library Integration

## What Was Built
- ✓ Prompts page with full library browsing
- ✓ Category + subcategory filters
- ✓ Search functionality ([All] [Search] [Favourites])
- ✓ Favorites system (localStorage)
- ✓ Copy prompt functionality
- ✓ Prompt shortcut drawer in Create page
- ✓ Insert prompt into chat input
- ✓ Bracket-chip rendering in chat input

## Proof of Functionality
- [x] Local dev runs without errors
- [x] Prompts page accessible via nav + swipe
- [x] Filters and search work correctly
- [x] Favorites persist on refresh
- [x] Drawer opens from Create page
- [x] Insert closes drawer + adds prompt to input
- [x] Brackets render as chips
- [x] Mobile layout functional

## Blockers or Questions
[List any issues or questions]

## Ready for Phase 5
Yes
```

---

## Proceed to Phase 5 When

- [ ] All deliverables complete
- [ ] Checkpoint submitted
- [ ] Project Lead reviews locally
- [ ] Project Lead confirms: "Ready for Phase 5"

**No guessing**. Wait for explicit approval before starting Phase 5.

---

## Notes from Project Lead

[Space for Dan to add implementation notes before coding begins]

---

**Last Updated**: Dec 18, 2025  
**Current Status**: Ready for notes/implementation  
**Approval Gate**: Project Lead sign-off required for Phase 5
