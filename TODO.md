# PromptFlam Improvements - TODO List

## TASK 1: Header & UI Improvements ✨
- [x] Replace logo with public/promptflam-logo.png
- [x] Increase search icon size to match logo height (45px)
- [x] Add semi-transparent header effect on scroll (70% opacity)
- [x] Remove strapline and disclaimer text section
- [x] Change category titles to purple (#4B0082)

## TASK 2: Favourites Functionality ❤️
- [x] Replace COPY text buttons with copy icons
- [x] Add heart buttons below each prompt (outline → filled states)
- [x] Add heart filter button in header (80% dropdown / 20% heart)
- [x] Implement localStorage for favourites persistence
- [x] Create favourites filtering logic
- [x] Style button layout: Heart (left), Copy (center)

## TASK 3: Back to Top Button ⬆️
- [x] Add back-to-top icon below each prompt
- [x] Update button layout: Heart (left), Copy (middle), Back-to-top (right)
- [x] Implement smooth scroll to top functionality

## TASK 4: Tooltip/Tutorial 💡
- [x] Create tooltip HTML structure
- [x] Style tooltip (adapted from PicFlam)
- [x] Add grey overlay
- [x] Implement 4-step navigation (arrows, dots, close)
- [x] Add tooltip content (Welcome → Favourites → Copy → Remember)
- [x] Show tooltip once only (localStorage)
- [x] Trigger after "Get Started" button

---

## Implementation Notes
- Favourites: Permanent storage using localStorage
- Tooltip: Show once only ever
- Header transparency: 70% opacity on scroll
- Dropdown/Heart split: 80%/20%
- Testing: All devices (user will test)
