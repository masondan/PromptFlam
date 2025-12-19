# Phase 6: Notepad Page

**Objective**: Build text editor for refining and exporting draft content.  
**Status**: Pending Phase 5 Approval  
**Approval Required Before Phase 7**: Project Lead (Dan Mason)

---

## What to Build

A dedicated Edit page with a rich text editor where users can:
- Create and edit draft content with a title
- Apply text formatting (Bold, Italic, Underline, Text Size)
- Auto-save drafts to localStorage
- Download drafts as .txt files
- Copy content to clipboard
- Clear draft content
- Load previously saved drafts from archive

---

## Deliverables

### A. Edit Page Structure
- [ ] Edit page route (`/routes/edit/+page.svelte`)
- [ ] Page layout: title input + content area + toolbar
- [ ] Formatting toolbar with B/I/U buttons and text size control
- [ ] Action buttons: Save, Download, Copy, Clear
- [ ] Draft list/selector (for loading saved drafts)
- [ ] Empty state: "No drafts yet" (when drafts are empty)

### B. Text Editor Functionality
- [ ] Title input field (editable)
- [ ] Rich text content area (editable with formatting)
- [ ] Character count display
- [ ] Placeholder text: "Start writing or paste text..."
- [ ] Focus/blur state styling

### C. Formatting Toolbar
- [ ] Visual feedback for active formatting
- [ ] Toolbar styling matches app design (minimalist, pale grey buttons)
- [ ] See design brief for details

### D. Draft Actions
- [ ] **Save Draft**: Auto-save on every content change (debounced, 2s delay)
- [ ] **Download**: Export current draft as .txt file with title as filename
- [ ] **Copy**: Copy all draft content to clipboard with toast feedback
- [ ] **Clear**: Clear current draft with confirmation dialog
- [ ] **Load Draft**: Select from list of saved drafts on Archive page; replaces current content

### E. Draft Persistence
- [ ] Drafts stored in `drafts` store (array of objects)
- [ ] Each draft has: id (timestamp), title, content, timestamp
- [ ] Auto-save on content/title change (debounced)
- [ ] Drafts persist across sessions via localStorage
- [ ] Max 10 drafts stored (oldest deleted when exceeded)

---

## Key Files

### Create
- `src/routes/edit/+page.svelte` - Main edit page with editor UI
- `src/lib/components/FormattingToolbar.svelte` - B/I/U/Size toolbar
- `src/lib/components/DraftList.svelte` - (Optional) Sidebar with draft list

### Modify
- `src/lib/stores.js` - Already has `drafts` store; may need to enhance
- `src/routes/+layout.svelte` - Ensure edit page is accessible from header navigation

---

## Icons Used

From `static/icons/`:
- Bold (icon-bold.svg) - Formatting toolbar
- Italic (icon-italic.svg) - Formatting toolbar
- Underline (icon-underline.svg) - Formatting toolbar
- Type (icon-type.svg) - Text size control
- Save (icon-save.svg) - Save draft button
- Download (icon-download.svg) - Download button
- Copy (icon-copy.svg) - Copy button
- Trash (icon-trash.svg) - Clear/delete button
- Close (icon-close.svg) - Clear confirmation or close
- Edit (icon-edit.svg) - Edit draft indicator

---

## Implementation Notes

### Text Formatting Strategy

For simplicity, use native browser selection API with `document.execCommand()` or `contentEditable` div:

**Option 1: contentEditable div (Recommended)**
```svelte
<div 
  contenteditable="true" 
  class="editor"
  on:input={handleInput}
  bind:textContent={draftContent}
/>
```

**Option 2: contentEditable with command buttons**
```javascript
function toggleBold() {
  document.execCommand('bold', false, null);
  editor.focus();
}
```

Both work in all modern browsers. Choose based on complexity preference.

### Auto-Save with Debounce

```javascript
let saveTimeout;
function handleInput() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveDraft();
  }, 2000); // Save 2 seconds after typing stops
}
```

### Download as .txt File

```javascript
function downloadDraft() {
  const text = `${draft.title}\n\n${draft.content}`;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${draft.title || 'draft'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Copy to Clipboard with Feedback

```javascript
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(draftContent);
    showToast('Copied to clipboard');
  } catch (error) {
    console.error('Copy failed:', error);
    showToast('Failed to copy');
  }
}
```

### Character Count

```javascript
$: charCount = draftContent.length;
$: wordCount = draftContent.split(/\s+/).filter(w => w).length;
```

---

## Design Considerations

### Layout
- Editor fills most of screen, leaving space for toolbar at top
- Formatting toolbar floats or is fixed above editor on mobile
- Draft list sidebar (desktop) or collapsible drawer (mobile)
- Minimize visual clutter (minimalist design)

### Colors & Styling
- Title input: larger font, placeholder text (#999)
- Content area: clean white background, dark text
- Toolbar buttons: pale grey (#f5f5f5) with dark text (#555)
- Active buttons: darker grey (#ddd) or highlight color
- Toast notifications: small, non-intrusive (top or bottom)

### Responsive Design
- Desktop: Editor on left, draft list sidebar on right
- Tablet: Full-width editor, draft list below (collapsible)
- Mobile: Full-width editor, draft list as drawer accessed via button

---

## Definition of Done

- [ ] Edit page accessible from header navigation
- [ ] User can type, format text (B/I/U/Size)
- [ ] Drafts auto-save on content change (debounced)
- [ ] Download creates .txt file with correct content
- [ ] Copy to clipboard works with toast feedback
- [ ] Clear draft removes content with confirmation
- [ ] Previously saved drafts load correctly
- [ ] Draft list displays all saved drafts
- [ ] Delete draft removes from list
- [ ] localStorage limits respected (max 20 drafts)
- [ ] Mobile layout works correctly
- [ ] `npm run dev` works without errors
- [ ] No console errors
- [ ] Empty state displays when no drafts

---

## Testing Checklist

- [ ] Navigate to Edit page via header
- [ ] Type content in editor
- [ ] Verify auto-save works (check localStorage)
- [ ] Apply formatting: Bold, Italic, Underline
- [ ] Change text size
- [ ] Verify formatting persists on save/reload
- [ ] Click Download; verify .txt file has correct content
- [ ] Click Copy; verify toast appears and clipboard has content
- [ ] Create multiple drafts; verify all appear in draft list
- [ ] Click draft in list; verify it loads
- [ ] Delete draft; verify removed from list
- [ ] Click Clear; verify confirmation and content cleared
- [ ] Reload page; verify drafts still there (localStorage)
- [ ] Test on mobile (formatting toolbar accessibility)

---

## Commits

```bash
git add .
git commit -m "Phase 6: Add Edit page with text editor"
git commit -m "Phase 6: Add FormattingToolbar component"
git commit -m "Phase 6: Add DraftList component and draft selection"
git commit -m "Phase 6: Implement auto-save and download functionality"
git push origin svelte-refactor
```

---

## Checkpoint Submission

When Phase 6 is complete, submit:

```markdown
# Phase 6 Checkpoint: Edit Page

## What Was Built
- ✓ Edit page with text editor
- ✓ Formatting toolbar (B/I/U/Size)
- ✓ Auto-save drafts
- ✓ Download as .txt
- ✓ Copy to clipboard
- ✓ Draft list/selector
- ✓ Clear and delete drafts
- ✓ localStorage persistence (max 20 drafts)

## Proof of Functionality
- [x] Local dev runs without errors
- [x] Editor functional (typing, formatting)
- [x] Drafts auto-save verified
- [x] Download/Copy/Clear work
- [x] Draft list loads and switches drafts
- [x] Mobile layout OK

## Blockers or Questions
[List any issues]

## Ready for Phase 7
Yes
```

---

**Last Updated**: Dec 19, 2025  
**Current Status**: Pending Phase 5 Approval  
**Approval Gate**: Project Lead sign-off required for Phase 7
