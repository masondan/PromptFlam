# TODO: Reposition Favourite Buttons in PromptFlam

## Task Overview
Move favourite buttons from individual prompts to subcategory titles, change logic to favourite entire subcategories, make hearts larger and red when active, centre remaining buttons under prompts.

## Steps to Complete

### 1. Update Favourite Logic in script.js
- [x] Change favourites storage from individual prompt IDs to subcategory identifiers (e.g., "Text-Blog").
- [x] Update toggleFavourite function to handle subcategories.
- [x] Update applyFilters to filter by favourited subcategories.

### 2. Modify HTML Generation in displayPrompts Function
- [x] Add favourite button to subcategory-title row (left: title, right: heart button).
- [x] Remove favourite buttons from individual task-item action-buttons.
- [x] Centre the remaining copy and back-to-top buttons under each prompt.

### 3. Update CSS in style.css
- [x] Style subcategory-title as flex row with space-between.
- [x] Make subcategory favourite buttons larger (e.g., 32px).
- [x] Change active heart color from purple (#4B0082) to red.
- [x] Ensure action-buttons are centred under prompts.

### 4. Update Tooltip Text in script.js
- [x] Change tooltip step 2 to reflect tapping heart next to subcategory title.

### 5. Testing and Validation
- [ ] Test favourite functionality per subcategory.
- [ ] Verify button positions and styling.
- [ ] Test on dev server.
- [ ] Commit and deploy for live testing.
