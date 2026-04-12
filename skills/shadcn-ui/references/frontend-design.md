# Frontend Design Reference

Use this reference when the target repository does not provide a stronger local design policy.

## Core Rules

- Prefer semantic tokens and CSS variables over hardcoded palette classes.
- Match the existing radius, spacing, typography, and elevation system before introducing new values.
- Reuse existing UI primitives before adding new patterns or wrappers.
- Keep component states explicit: default, hover, active, focus, disabled, error, and success when relevant.
- Favor accessible contrast and visible focus styling over minimal or decorative treatments.

## Color Rules

- If the repo has tokens such as `--primary`, `--border`, `--background`, or semantic aliases, use those first.
- Avoid raw utility colors like `text-green-500` or `bg-red-600` when a token-based equivalent exists.
- Use semantic intent names for variants and states: `default`, `secondary`, `destructive`, `success`, `warning`.
- Keep success, error, and warning styling readable in both filled and subtle variants.

## Typography Rules

- Follow the existing type scale before introducing a new size.
- Use stronger heading contrast than body text when the design system supports it.
- Preserve readable line length and line height in cards, modals, and tables.

## Layout Rules

- Use a consistent spacing scale, typically 4px-based.
- Prefer composition with `Card`, `Dialog`, `Sheet`, `Popover`, and `DropdownMenu` before custom containers.
- Keep alignment predictable across related controls, especially forms and table toolbars.
- Avoid crowding: if content feels dense, increase spacing before shrinking text.

## Interaction Rules

- Focus states must remain visible for keyboard users.
- Disabled states should look disabled without becoming unreadable.
- Error states should be communicated by more than color alone when practical.
- Destructive actions should be visually distinct and harder to trigger accidentally.

## Review Questions

- Does this reuse the repo's existing tokens instead of inventing new colors?
- Does the component fit the surrounding UI without introducing a parallel visual language?
- Are focus, disabled, and error states obvious?
- Is the layout clean on both narrow and wide screens?
