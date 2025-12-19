# Phase 5: Archive Page

**Objective**: Build unified archive for saved AI chats and notes with auto-save and auto-cleanup.  
**Status**: Current Phase  
**Approval Required Before Phase 6**: Project Lead (Dan Mason)

---

## What to Build

A single Archive page with two tabs (Chats | Notes) displaying saved sessions. Items auto-save during use and auto-cleanup after 30 days or when exceeding 10 items per tab.

---

## Deliverables

### A. Archive Page Structure
- [ ] Archive page route (`/routes/archive/+page.svelte`)
- [ ] Two-tab interface: "Chats" tab + "Notes" tab
- [ ] Tab switching (active tab highlighted)
- [ ] Empty states: "No saved chats yet" / "No saved notes yet"

### B. Archive Item Display
- [ ] List of saved items (most recent first)
- [ ] Preview text (first 50-100 characters, max 2 lines, truncated)
- [ ] Timestamp (relative: "2 hours ago", "Yesterday", etc.)
- [ ] Three-dot menu per item: Download | Share | Delete

### C. Item Actions
- [ ] **Tap item**: Restore to Create page (chats) or Notepad page (notes), replacing current session
- [ ] **Download**: Export as .txt file
- [ ] **Share**: System share API with clipboard fallback
- [ ] **Delete**: Remove single item with confirmation
- [ ] **Clear All**: Button per tab to delete all items (with confirmation)

### D. Auto-Save (Create & Notepad pages)
- [ ] Chat messages auto-save to `archiveChats` on every message
- [ ] Notes auto-save to `archiveNotes` on content change (debounced)
- [ ] Updates existing archive entry if session ongoing; creates new entry on "New Chat"

### E. Auto-Cleanup
- [ ] Delete items older than 30 days (runs on app init)
- [ ] Keep max 10 chats + 10 notes (delete oldest when exceeded)
- [ ] Cleanup runs silently (no user notification)

---

## Key Files

### Create
- `src/routes/archive/+page.svelte` - Main archive page with tabs
- `src/lib/components/ArchiveItem.svelte` - Individual item card with menu

### Modify
- `src/lib/stores.js` - Already has `archiveChats`, `archiveNotes`, `cleanupOldArchives()`
- `src/routes/+page.svelte` - Add auto-save for chat messages
- `src/routes/notepad/+page.svelte` - Add auto-save for notes
- `src/routes/+layout.svelte` - Call `cleanupOldArchives()` on mount

---

## Icons Used

From `static/icons/`:
More (three dot menu) icon-more.svg
Copy (in more menu) icon-copy.svg
Download (in more menu) icon-download.svg
Trash (in more menu) icon-trash.svg
Share (in more menu) icon-share.svg
Time (clock icon for timestamp) icon-time.svg
Circle (inactive radio button) icon-circle.svg
Radio (active radio button) icon-radio.svg
Select All (selects all archive list) icon-select-all.svg

---

## Implementation Notes

### Tab Component
Simple toggle between two views. Use CSS class for active state.

### Relative Timestamps
Use helper function to convert timestamp to "2 hours ago", "Yesterday", "Dec 15", etc.

### Three-Dot Menu
Dropdown positioned near button. Closes on outside click or action.

### Share Fallback
```javascript
async function handleShare(text) {
  if (navigator.share) {
    await navigator.share({ text });
  } else {
    await navigator.clipboard.writeText(text);
    // Show "Copied" feedback
  }
}
```

### Auto-Save Strategy
- **Chats**: Save entire `chatMessages` array to `archiveChats` after each AI response
- **Notes**: Debounce saves (e.g., 2 seconds after typing stops)
- Use session ID to update existing entry vs creating new

---

### Design notes

- The Archive page inherits the same clean, minimalist look as other pages in the app.
- The layout, functions and styles of both Chats and Notes is the same
- Review the visuals in info/ carefully.

**See info/archive1.png for default layout**
- The Archive Page has two tabs: Chats and Notes. The text tabs are aligned LEFT below the header navigation. Inactive tab is #999999. Active tab is #555555 with #555555 line underscore.
- Aligned RIGHT on the Chats/Notes row is a Select All button (icon-select-all.svg). Inactive colour: #999999. Active colour: #555555
- When the page is scrolled, the tab row moves up with the archive listing.
- Saved Chats and Notes appear as a list. Heading/Title = two lines max with [...] if required. Body text = two lines max with [...] if required.
- Under each archive listing is a timestamp. This is aligned left. Colour: #999999. With clock icon (icon-time.svg) followed by the timestamp [icon][timestamp]
- Fine separator lines separate archive listings. 1px #999999.
- Archive headings are indented to allow for a three-dot menu (icon-more.svg). Inactive colour #999999. Active colour #555555 (Body text is justified full width)

**See archive2.png and archive3.png for layout with active toolbar**
- When a three-dot menu is tapped next to any archive listing, a horizontal pill-style toolbar is displayed to the left of the three-dot menu. Background colour: #efefef 
- The menu consists of three text + one icon menu items. From left to right: [COPY][SHARE][DOWNLOAD][|][TRASH ICON]. Default colour for TEXT: #999999 Colour on mouseover/tap trigger #555555.
- Default colour of trash icon #999999. When tapped the trash icon turns purple #5422B0 and a confirmation button is displayed under the trash button. Pill style, background #purple #5422B0. White text [DELETE?] (see archive3.png)
- Note the small vertical separator to the left of the trash button.
- When an archive listing is deleted, other listings move smoothly up to fill the space.

**See archive4.png and archive5.png for bulk select/delete**
- When the select all button (icon-select-all.svg) is tapped it turns from default #999999 to active #555555. This triggers ...
- The archive listing is indented at the left side (leaving in place full width separator lines). Outline circle selectors are displayed aligned left to the left of headings - inactive colour #999999.
- When a circle (icon-circle.svg colour #999999) is tapped it becomes an active radio button (icon-radio.svg Colour #555555)
- at the same time a trash button (icon-trash.svg colour purple #5422B0) appears to the left of the select all button
- when one or more radio buttons then the trash button is tapped a confirmation button is displayed under the trash button. Pill style, background purple #5422B0. White text [DELETE?]
- When archive listings are deleted, other listings move smoothly up to fill the space.

---

## Definition of Done

- [ ] Archive page accessible from header navigation
- [ ] Both tabs display saved items with previews + timestamps
- [ ] Tap item restores to correct page (Create or Notepad)
- [ ] Download exports .txt correctly
- [ ] Share opens system dialog or copies to clipboard
- [ ] Delete removes item; Clear All removes all with confirmation
- [ ] Auto-save works for both chats and notes
- [ ] Auto-cleanup runs on app init
- [ ] Empty states display when no items
- [ ] Mobile layout works correctly
- [ ] `npm run dev` works without errors
- [ ] No console errors

---

## Testing Checklist

- [ ] Navigate to Archive page via header
- [ ] Switch between Chats and Notes tabs
- [ ] Verify empty state shows when no items
- [ ] Create a chat; verify it appears in Chats tab
- [ ] Create a note; verify it appears in Notes tab
- [ ] Tap archived chat; verify it loads in Create page
- [ ] Tap archived note; verify it loads in Notepad page
- [ ] Download an item; verify .txt file contents
- [ ] Share an item; verify share dialog or clipboard
- [ ] Delete an item; verify removed
- [ ] Clear All; verify confirmation + removal
- [ ] Test on mobile

---

## Commits

```bash
git add .
git commit -m "Phase 5: Add Archive page with tabs"
git commit -m "Phase 5: Add ArchiveItem component with menu"
git commit -m "Phase 5: Implement auto-save for chats and notes"
git commit -m "Phase 5: Add restore functionality"
git push origin svelte-refactor
```

---

## Checkpoint Submission

When Phase 5 is complete, submit:

```markdown
# Phase 5 Checkpoint: Archive Page

## What Was Built
- ✓ Archive page with Chats/Notes tabs
- ✓ Item display with preview + timestamp
- ✓ Three-dot menu (Download | Share | Delete)
- ✓ Tap to restore functionality
- ✓ Auto-save for chats and notes
- ✓ Auto-cleanup (30 days / max 10)
- ✓ Empty states

## Proof of Functionality
- [x] Local dev runs without errors
- [x] Both tabs functional
- [x] Restore works for both types
- [x] Download/Share/Delete work
- [x] Auto-save verified
- [x] Mobile layout OK

## Blockers or Questions
[List any issues]

## Ready for Phase 6
Yes
```

---

**Last Updated**: Dec 18, 2025  
**Current Status**: Ready for implementation  
**Approval Gate**: Project Lead sign-off required for Phase 6
