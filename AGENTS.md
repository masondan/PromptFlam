# PromptFlam - Agent Instructions

## Build/Dev Commands
- **Dev server**: `npm run dev` (starts live-server)
- **No tests, no build, no lint**: This is a simple static HTML/JS/CSS app

## Architecture
- **Type**: Vanilla JavaScript single-page web app (no framework)
- **Structure**: `index.html` (main), `script.js` (app logic), `style.css` (styling), `prompts.json` (data)
- **Key components**: Splash screen, tooltip onboarding, custom dropdown selects, search, category/subcategory filtering, favourites system
- **Data**: All prompts loaded from `prompts.json` with structure: `{id, category, subCategory, task, prompt}`
- **Storage**: LocalStorage for favourites (`promptflamFavourites`) and tooltip state (`promptflamTooltipSeen`)

## Code Style
- Use vanilla JavaScript ES6+ (no frameworks/libraries except live-server for dev)
- Event delegation pattern for dynamic content (see `promptListContainer.addEventListener`)
- Custom select dropdowns (not native `<select>` elements)
- Use `querySelector`/`getElementById` for DOM selection, `addEventListener` for events
- HTML strings built with template literals and injected via `.innerHTML`
- Arrow functions for event handlers and callbacks
- Store state in top-level variables (`allPrompts`, `favourites`, `showingFavourites`)
- No TypeScript, no build step - keep it simple and browser-ready
