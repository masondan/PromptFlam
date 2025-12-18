# PromptFlam Icon Reference Table

**Directory**: `public/icons/`  
**Naming**: `icon-{name}.svg`  
**Source**: Feather Icons (https://feathericons.com/) or equivalent

---

## PRIORITY 1: Navigation Icons (Footer Tabs)

| Function | Filename | Reference URL / Suggestion |
|----------|----------|---------------------------|
| Create/Chat | `icon-create.svg` | [Feather: MessageCircle](https://feathericons.com/?s=message) or [Feather: MessageSquare](https://feathericons.com/?s=message-square) |
| Prompts/Library | `icon-prompts.svg` | [Feather: Grid](https://feathericons.com/?s=grid) or [Feather: BookOpen](https://feathericons.com/?s=book) |
| Edit/Text Editor | `icon-edit.svg` | [Feather: Edit2](https://feathericons.com/?s=edit) or [Feather: FileText](https://feathericons.com/?s=file-text) |
| Archive | `icon-archive.svg` | [Feather: Archive](https://feathericons.com/?s=archive) |

---

## PRIORITY 2: Chat/Create Page Essential

| Function | Filename | Reference URL / Suggestion |
|----------|----------|---------------------------|
| Send Message | `icon-send.svg` | [Feather: Send](https://feathericons.com/?s=send) |
| Insert/Add Prompt | `icon-plus.svg` | [Feather: Plus](https://feathericons.com/?s=plus) |
| Menu (Three-dot) | `icon-menu.svg` | [Feather: MoreVertical](https://feathericons.com/?s=more-vertical) |
| Close/Dismiss | `icon-close.svg` | [Feather: X](https://feathericons.com/?s=x) |

---

## PRIORITY 3: Prompt Library Actions

| Function | Filename | Reference URL / Suggestion |
|----------|----------|---------------------------|
| Search | `icon-search.svg` | [Feather: Search](https://feathericons.com/?s=search) |
| Copy | `icon-copy.svg` | [Feather: Copy](https://feathericons.com/?s=copy) |
| Favorite/Star | `icon-star.svg` | [Feather: Star](https://feathericons.com/?s=star) (unfilled) or [Feather: Heart](https://feathericons.com/?s=heart) |

---

## PRIORITY 4: Edit Page - Text Formatting

| Function | Filename | Reference URL / Suggestion |
|----------|----------|---------------------------|
| Bold | `icon-bold.svg` | [Feather: Bold](https://feathericons.com/?s=bold) |
| Italic | `icon-italic.svg` | [Feather: Italic](https://feathericons.com/?s=italic) |
| Underline | `icon-underline.svg` | [Feather: Underline](https://feathericons.com/?s=underline) |
| Text Size | `icon-type.svg` | [Feather: Type](https://feathericons.com/?s=type) |
| Download | `icon-download.svg` | [Feather: Download](https://feathericons.com/?s=download) |
| Save | `icon-save.svg` | [Feather: Save](https://feathericons.com/?s=save) |

---

## PRIORITY 5: Archive & Deletion

| Function | Filename | Reference URL / Suggestion |
|----------|----------|---------------------------|
| Delete/Trash | `icon-delete.svg` | [Feather: Trash2](https://feathericons.com/?s=trash) |
| Share | `icon-share.svg` | [Feather: Share2](https://feathericons.com/?s=share) |
| Refresh/Redo | `icon-refresh.svg` | [Feather: RefreshCw](https://feathericons.com/?s=refresh) |
| Info/Sources | `icon-info.svg` | [Feather: Info](https://feathericons.com/?s=info) |

---

## PRIORITY 6: Advanced Features (Phase 7+)

| Function | Filename | Reference URL / Suggestion |
|----------|----------|---------------------------|
| Expand | `icon-expand.svg` | [Feather: ChevronDown](https://feathericons.com/?s=chevron-down) |
| Collapse | `icon-collapse.svg` | [Feather: ChevronUp](https://feathericons.com/?s=chevron-up) |
| Link/Source | `icon-link.svg` | [Feather: ExternalLink](https://feathericons.com/?s=external-link) |
| Settings | `icon-settings.svg` | [Feather: Settings](https://feathericons.com/?s=settings) |

---

## PRIORITY 7: Miscellaneous

| Function | Filename | Reference URL / Suggestion |
|----------|----------|---------------------------|
| Back/Arrow | `icon-back.svg` | [Feather: ArrowLeft](https://feathericons.com/?s=arrow-left) |
| Loading (Spinner) | CSS animation | Use CSS keyframes (no icon needed) |

---

## Notes

- **Provide Priority 1 + 2 first** (Navigation + Chat essentials) for Phase 1-2 foundations
- **Priority 3-5 can follow** as features are built in Phases 3-5
- **Priority 6-7** are for later phases; lower urgency
- All icons should be **24x24px or 32x32px** for consistency
- Ensure icons have **consistent stroke weight** across the set (Feather uses 2px by default, which works well)
- Consider providing both **filled and outline variants** for Favorite/Star (selected vs. unselected state)

---

## How I'll Use These

Once you provide SVG files to `public/icons/`, I will:
1. Import them in Svelte components: `import { IconName } from '$lib/icons.js'`
2. Create a reusable `Icon.svelte` component for consistent sizing/styling
3. Reference them in navigation, buttons, and action menus

This approach keeps the codebase clean and maintainable.
