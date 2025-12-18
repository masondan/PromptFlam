# Phase 3.5: Bracket-Chip Component Implementation

**Objective**: Build interactive bracket-chip rendering for the chat input. Prompts with `[square brackets]` will render as visual, editable chips rather than plain text. This enables the quick-edit workflow (single-tap highlight/delete/overwrite) that users expect from v1.

**Status**: Pre-Phase 4 blocker  
**Approval Required Before Phase 4**: Project Lead (Dan Mason)

---

## Why This Phase Exists

Phase 4 inserts prompts like `[AUDIENCE: journalists]` into the chat input. Without bracket rendering and interaction:
- Users see raw text: `[AUDIENCE: journalists]`
- Quick-edit feature (tap to select/delete) doesn't exist
- Phase 4 ships incomplete relative to v1 design
- Future phases (5+) would need rework

**Build it now, properly, once** — before Phase 4 depends on it.

---

## What to Build

A **bracket-chip system** for the chat input that:
1. Detects `[content]` patterns in the textarea
2. Renders them as interactive visual chips
3. Allows users to single-tap a chip to select it
4. Allows users to delete/overwrite selected chips
5. Sends clean text (without brackets) to the API

### Visual Behavior (Reference v1 Design)
- **Brackets not visible** in final text sent to API
- **Chips appear as styled badges** in the input (e.g., background color, padding, rounded corners)
- **Single tap** on chip = highlight/select it (visual change)
- **Delete key** when chip selected = remove the chip and its content
- **Type when chip selected** = replace the chip with typed text
- **Smooth UX** — no jarring re-renders

---

## Deliverables (Non-Negotiable)

- [ ] New component: `BracketChipInput.svelte` (or similar) that replaces `ChatInput.svelte` textarea
- [ ] Bracket parsing logic (regex to find `[...]` patterns)
- [ ] Visual chip rendering with styling
- [ ] Chip selection/focus state (visual highlight)
- [ ] Delete/overwrite interaction handling
- [ ] Text reconstruction for API calls (strips brackets, preserves chip content)
- [ ] Integration into `/src/routes/+page.svelte` (Create page)
- [ ] Keyboard navigation (Tab, arrow keys work)
- [ ] Mobile touch support (tap to select)
- [ ] localStorage persistence (partial input preserved across sessions)
- [ ] No console errors or warnings
- [ ] Manual testing of all interactions
- [ ] `npm run dev` works without breaking existing features

---

## Architecture & Design Approach

### Data Structure

Use a **parallel data model** approach (simpler than contenteditable):

```javascript
// Store raw text + chip metadata
let inputValue = 'Hello [AUDIENCE: journalists] write about [TOPIC: AI]';
let chips = [
  { id: 'chip-1', start: 6, end: 32, content: 'AUDIENCE: journalists' },
  { id: 'chip-2', start: 39, end: 57, content: 'TOPIC: AI' }
];
let selectedChipId = null;
```

**Why this works**:
- Plain text for API (remove chips, send content only)
- Structured metadata for rendering
- Easy undo/redo later
- Clear separation of concerns

### Component Architecture

```
src/lib/components/
├── BracketChipInput.svelte    (NEW) - Main input with chip rendering
├── ChipBadge.svelte           (NEW) - Individual chip display + interactions
└── (ChatInput.svelte retired for this phase)
```

---

## Key Files to Create/Modify

### Create
- `src/lib/components/BracketChipInput.svelte` — Main input component
- `src/lib/components/ChipBadge.svelte` — Individual chip UI + interactions
- `src/lib/utils/chipParser.js` — Bracket parsing logic (reusable)

### Modify
- `src/routes/+page.svelte` — Replace `ChatInput` with `BracketChipInput`
- `src/lib/components/index.js` — Export new components

### No Changes
- `ChatInput.svelte` — Keep it; may revert or simplify later

---

## Implementation Guide

### Step 1: Create Chip Parser Utility

**File**: `src/lib/utils/chipParser.js`

```javascript
/**
 * Parse text for [bracket] patterns and return chip metadata
 * @param {string} text - Input text
 * @returns {object} { cleanText: string, chips: array }
 * 
 * Example:
 * const { cleanText, chips } = parseChips('Hello [AUDIENCE: journalists]');
 * // cleanText: 'Hello AUDIENCE: journalists'
 * // chips: [{ id: 'chip-1', start: 6, end: 32, content: 'AUDIENCE: journalists' }]
 */
export function parseChips(text) {
  const chips = [];
  const bracketRegex = /\[([^\]]+)\]/g;
  let match;
  let cleanText = text;
  let offset = 0;

  while ((match = bracketRegex.exec(text)) !== null) {
    const bracketContent = match[1];
    const start = match.index - offset;
    const end = start + bracketContent.length;

    chips.push({
      id: `chip-${Date.now()}-${Math.random()}`,
      start,
      end,
      content: bracketContent,
      originalStart: match.index,
      originalEnd: match.index + match[0].length
    });

    // Remove brackets from clean text
    cleanText = cleanText.replace(`[${bracketContent}]`, bracketContent);
    offset += 2; // Account for removed [ and ]
  }

  return { cleanText, chips };
}

/**
 * Reconstruct text with brackets from chips array
 * @param {string} text - Plain text
 * @param {array} chips - Chips array
 * @returns {string} Text with brackets
 */
export function reconstructWithBrackets(text, chips) {
  if (!chips.length) return text;

  let result = text;
  // Sort by position descending to avoid offset issues
  const sorted = [...chips].sort((a, b) => b.start - a.start);

  sorted.forEach(chip => {
    // Insert brackets around chip content
    const before = result.substring(0, chip.start);
    const after = result.substring(chip.end);
    result = `${before}[${chip.content}]${after}`;
  });

  return result;
}

/**
 * Find which chip (if any) is at the cursor position
 * @param {number} cursorPos - Cursor position in text
 * @param {array} chips - Chips array
 * @returns {string|null} Chip ID or null
 */
export function getChipAtCursor(cursorPos, chips) {
  return chips.find(chip => cursorPos >= chip.start && cursorPos <= chip.end)?.id || null;
}
```

### Step 2: Create ChipBadge Component

**File**: `src/lib/components/ChipBadge.svelte`

```svelte
<script>
  export let chip;
  export let isSelected = false;
  export let onDelete;
  export let onSelect;

  function handleClick(e) {
    e.stopPropagation();
    onSelect?.(chip.id);
  }

  function handleDelete(e) {
    e.stopPropagation();
    onDelete?.(chip.id);
  }
</script>

<span 
  class="chip"
  class:selected={isSelected}
  on:click={handleClick}
  role="button"
  tabindex="0"
  aria-label="Bracket chip: {chip.content}"
  on:keydown={(e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleDelete(e);
    }
  }}
>
  <span class="chip-content">{chip.content}</span>
  {#if isSelected}
    <button 
      class="chip-delete"
      on:click={handleDelete}
      aria-label="Delete chip"
      type="button"
    >
      ×
    </button>
  {/if}
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--color-chip-bg, #e8f4f8);
    border: 1px solid var(--color-chip-border, #b3dce8);
    border-radius: 16px;
    padding: 4px 10px;
    margin: 0 2px;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s ease;
    font-size: 0.9em;
  }

  .chip:hover {
    background: var(--color-chip-bg-hover, #d1ecf4);
  }

  .chip.selected {
    background: var(--color-chip-bg-selected, #a8dfe8);
    border-color: var(--color-chip-border-selected, #5fa8b8);
    outline: 2px solid var(--color-chip-outline, #5fa8b8);
    outline-offset: 1px;
  }

  .chip-content {
    font-weight: 500;
    color: var(--color-chip-text, #0d5a66);
  }

  .chip-delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 50%;
    color: var(--color-chip-text, #0d5a66);
    cursor: pointer;
    font-size: 1.2em;
    line-height: 1;
    padding: 0;
    transition: background 0.15s ease;
  }

  .chip-delete:hover {
    background: rgba(0, 0, 0, 0.2);
  }
</style>
```

### Step 3: Create BracketChipInput Component

**File**: `src/lib/components/BracketChipInput.svelte`

```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  import { Icon } from '$lib/components';
  import ChipBadge from './ChipBadge.svelte';
  import { parseChips, reconstructWithBrackets, getChipAtCursor } from '$lib/utils/chipParser.js';

  export let value = '';
  export let isLoading = false;
  export let placeholder = 'Tap ☆ to add a library prompt';

  const dispatch = createEventDispatcher();

  let textareaEl;
  let chips = [];
  let selectedChipId = null;
  let cursorPos = 0;

  $: hasContent = value.trim().length > 0;
  $: canSend = hasContent && !isLoading;

  // Parse chips whenever value changes
  $: {
    const { cleanText, chips: parsed } = parseChips(value);
    chips = parsed;
  }

  function handleInput(e) {
    value = e.target.value;
    autoResize();
  }

  function handleClick(e) {
    cursorPos = textareaEl?.selectionStart ?? 0;
    selectedChipId = getChipAtCursor(cursorPos, chips);
  }

  function handleKeydown(e) {
    // Send on Enter (Shift+Enter = newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Delete/Backspace on selected chip
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedChipId) {
      e.preventDefault();
      handleDeleteChip(selectedChipId);
      return;
    }

    // Clear selection on any other key
    selectedChipId = null;
  }

  function handleDeleteChip(chipId) {
    const chipToDelete = chips.find(c => c.id === chipId);
    if (!chipToDelete) return;

    // Remove chip content from text
    const before = value.substring(0, chipToDelete.originalStart);
    const after = value.substring(chipToDelete.originalEnd);
    value = before + after;
    selectedChipId = null;
  }

  function handleSelectChip(chipId) {
    selectedChipId = selectedChipId === chipId ? null : chipId;
  }

  function autoResize() {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    const maxHeight = window.innerHeight * 0.4;
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, maxHeight) + 'px';
  }

  function handleSend() {
    if (!canSend) return;
    // Send with original brackets preserved (API will handle them)
    dispatch('send', { message: value.trim() });
    value = '';
    selectedChipId = null;
    if (textareaEl) {
      textareaEl.style.height = 'auto';
    }
  }

  function handlePromptDrawer() {
    dispatch('openPromptDrawer');
  }

  function handleStop() {
    dispatch('stop');
  }
</script>

<div class="input-drawer">
  <div class="input-container">
    <button
      class="prompt-button"
      on:click={handlePromptDrawer}
      aria-label="Open prompt library"
      type="button"
    >
      <Icon name="prompts" size={22} />
    </button>

    <div class="input-with-chips">
      <div class="chips-display">
        {#each chips as chip (chip.id)}
          <ChipBadge
            {chip}
            isSelected={selectedChipId === chip.id}
            onSelect={handleSelectChip}
            onDelete={handleDeleteChip}
          />
        {/each}
      </div>

      <textarea
        bind:this={textareaEl}
        value={value.replace(/\[([^\]]+)\]/g, '$1')}
        on:input={handleInput}
        on:click={handleClick}
        on:keydown={handleKeydown}
        {placeholder}
        rows="1"
        aria-label="Message input"
      ></textarea>
    </div>

    {#if isLoading}
      <button
        class="send-button busy"
        on:click={handleStop}
        aria-label="Stop generating"
        type="button"
      >
        <Icon name="busy-fill" size={22} />
      </button>
    {:else}
      <button
        class="send-button"
        class:active={canSend}
        on:click={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        type="button"
      >
        <Icon name={canSend ? 'send-fill' : 'send'} size={22} />
      </button>
    {/if}
  </div>
</div>

<style>
  .input-drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-bg);
    padding: var(--spacing-md);
    padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
    z-index: var(--z-input-drawer);
  }

  .input-container {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-sm);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm) var(--spacing-md);
    box-shadow: var(--shadow-input);
  }

  .prompt-button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: var(--color-icon-default);
    transition: color 0.15s;
  }

  .prompt-button:hover {
    color: var(--color-icon-active);
  }

  .input-with-chips {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .chips-display {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-height: 0;
  }

  textarea {
    flex: 1;
    min-height: 24px;
    max-height: 40vh;
    line-height: 1.5;
    padding: 6px 0;
    overflow-y: auto;
    border: none;
    background: transparent;
    outline: none;
  }

  textarea::placeholder {
    color: var(--color-border);
  }

  .send-button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: var(--color-icon-default);
    transition: color 0.15s;
  }

  .send-button.active {
    color: var(--color-icon-active);
  }

  .send-button.busy {
    color: var(--color-icon-active);
  }

  .send-button:hover:not(:disabled) {
    color: var(--color-icon-active);
  }
</style>
```

### Step 4: Update Create Page

**File**: `src/routes/+page.svelte` (modify imports and component)

Replace:
```svelte
import { ChatInput, ... } from '$lib/components';
```

With:
```svelte
import { BracketChipInput, ... } from '$lib/components';
```

Replace:
```svelte
<ChatInput 
	bind:value={inputValue}
	{isLoading}
	on:send={handleSend}
	on:openPromptDrawer={handleOpenPromptDrawer}
	on:stop={handleStop}
/>
```

With:
```svelte
<BracketChipInput 
	bind:value={inputValue}
	{isLoading}
	on:send={handleSend}
	on:openPromptDrawer={handleOpenPromptDrawer}
	on:stop={handleStop}
/>
```

### Step 5: Update Component Exports

**File**: `src/lib/components/index.js` (add)

```javascript
export { default as BracketChipInput } from './BracketChipInput.svelte';
export { default as ChipBadge } from './ChipBadge.svelte';
```

---

## Definition of Done

Phase 3.5 is complete when:

- [ ] `BracketChipInput.svelte` fully implemented
- [ ] `ChipBadge.svelte` fully implemented
- [ ] `chipParser.js` utility complete with all functions
- [ ] Bracket parsing detects `[...]` patterns correctly
- [ ] Chips render as visual badges in input
- [ ] Chip selection (single tap) highlights the chip
- [ ] Delete key removes selected chip
- [ ] Type when chip selected replaces chip content
- [ ] Textarea shows chip content without brackets (visual only)
- [ ] Final text sent to API preserves brackets: `Hello [AUDIENCE: journalists]`
- [ ] Keyboard navigation works (Tab, arrow keys)
- [ ] Mobile touch support works (tap to select chip)
- [ ] localStorage preserves input with chips across sessions
- [ ] `npm run dev` runs without errors
- [ ] No console errors or warnings
- [ ] Existing Create page functionality still works (chat, send, loading states)
- [ ] Mobile layout is responsive

---

## Testing Checklist

Perform these before marking Phase 3.5 complete:

### Text Input & Chip Parsing
- [ ] Type `Hello [AUDIENCE: journalists]` → chip renders correctly
- [ ] Type multiple chips: `[TOPIC: AI] and [FORMAT: article]` → both render
- [ ] Edit chip content: type after bracket → chip updates visually
- [ ] Chip content is visible without `[` `]` in textarea display

### Chip Selection & Deletion
- [ ] Tap a chip → chip highlights (visual change)
- [ ] Tap same chip again → chip unhighlights
- [ ] Press Delete key when chip selected → chip is removed from text
- [ ] Press Backspace when chip selected → chip is removed from text
- [ ] Type when chip selected → chip is replaced with typed text

### Send & API Integration
- [ ] Type message with chips → tap Send
- [ ] Verify in console: message sent with brackets intact
- [ ] AI responds normally (brackets don't break API)
- [ ] Message appears in chat with original brackets

### Persistence & Edge Cases
- [ ] Type message with chips → refresh page → chips and text persist
- [ ] Empty input → Send button disabled
- [ ] Only whitespace → Send button disabled
- [ ] Delete all chips → remaining text sends correctly
- [ ] Very long chip content → text wraps cleanly

### Mobile & Interaction
- [ ] Tap chip on mobile → selects and highlights
- [ ] Tap delete (×) on selected chip → removes chip
- [ ] Keyboard shortcuts work (Tab, arrow keys navigate)
- [ ] No layout shift when chips appear/disappear

### Existing Features Not Broken
- [ ] Open prompt drawer from Create page
- [ ] Insert prompt from drawer → text with brackets appears in input
- [ ] Chat history still displays correctly
- [ ] Loading states (thinking dots, send animation) work

---

## Common Issues & Solutions

### Chips not parsing
**Cause**: Regex or `parseChips()` function error  
**Debug**: `console.log(parseChips(value))` in component  
**Fix**: Check regex matches `[...]` and handles special characters

### Brackets appear in textarea
**Cause**: Textarea displaying `value` directly instead of `cleanText`  
**Fix**: Ensure textarea shows `value.replace(/\[([^\]]+)\]/g, '$1')`

### Chip selection not working
**Cause**: `selectedChipId` state not updating  
**Fix**: Check `handleSelectChip()` is called and `isSelected` binding is correct

### Delete not removing chip
**Cause**: `originalStart`/`originalEnd` positions incorrect  
**Fix**: Verify `parseChips()` calculates correct positions accounting for bracket removal

### API receiving clean text instead of brackets
**Cause**: Accidentally stripping brackets before send  
**Fix**: Ensure `handleSend()` dispatches `value` (with brackets), not `cleanText`

---

## Resources

- **Existing ChatInput component**: `src/lib/components/ChatInput.svelte` (reference for structure)
- **Create page integration**: `src/routes/+page.svelte`
- **Stores**: `src/lib/stores.js` (no changes needed)
- **Styles reference**: `src/app.css` for CSS variables

---

## Commits

As you work, commit frequently:

```bash
git add .
git commit -m "Phase 3.5: Create chipParser utility and ChipBadge component"
git commit -m "Phase 3.5: Implement BracketChipInput with chip rendering"
git commit -m "Phase 3.5: Add chip selection and delete interactions"
git commit -m "Phase 3.5: Integrate BracketChipInput into Create page"
git commit -m "Phase 3.5: Test bracket chips in chat input - all interactions working"
git push origin svelte-refactor
```

---

## Checkpoint Submission

When Phase 3.5 is complete, submit:

```markdown
# Phase 3.5 Checkpoint: Bracket-Chip Component

## What Was Built
- ✓ BracketChipInput component with chip rendering
- ✓ ChipBadge component for individual chip UI
- ✓ chipParser utility (parseChips, reconstructWithBrackets, getChipAtCursor)
- ✓ Chip selection and delete interactions
- ✓ Keyboard support (Delete, Backspace on selected chip)
- ✓ Mobile touch support (tap to select)
- ✓ Integration into Create page
- ✓ localStorage persistence of chips

## Proof of Functionality
- [x] Local dev runs without errors
- [x] Type `[AUDIENCE: journalists]` → chip renders with visual badge
- [x] Tap chip → highlights and shows delete button
- [x] Press Delete on selected chip → removes chip
- [x] Type when chip selected → replaces chip
- [x] Send message with chips → API receives brackets intact
- [x] AI responds normally to bracketed content
- [x] Refresh page → chips and text persist
- [x] Mobile layout functional
- [x] No console errors

## Testing Results
[Describe specific test cases you verified]

## Blockers or Questions
[List any issues or concerns, if none state "None"]

## Ready for Phase 4
Yes
```

---

## Proceed to Phase 4 When

- [ ] All deliverables complete
- [ ] All testing criteria passed
- [ ] Checkpoint submitted
- [ ] Project Lead reviews locally
- [ ] Project Lead confirms: "Ready for Phase 4"

**This is a blocker for Phase 4.** Bracket chips must work before implementing prompt insertion.

---

## Notes from Project Lead

[Space for Dan to add implementation notes/preferences before coding begins]

---

**Last Updated**: Dec 18, 2025  
**Current Status**: Ready for implementation  
**Approval Gate**: Project Lead sign-off required for Phase 4
