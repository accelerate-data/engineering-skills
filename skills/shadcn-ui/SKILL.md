---
name: shadcn-ui
description: shadcn/ui component library with Tailwind CSS 4. Use when adding new components, customizing variants, building UI layouts, or debugging component issues.
---

# shadcn/ui Skill

Use this skill when implementing UI with shadcn/ui in an existing React application.

## Design-System Constraints

- Use shadcn/ui components only for new component primitives.
- Use `lucide-react` only for icons.
- Prefer existing design tokens and CSS variables over raw Tailwind palette colors.
- Match the repository's existing typography, spacing, radius, and state styles.
- Use the local frontend design reference in `references/frontend-design.md` when making visual decisions.

## Add Components

```bash
npx shadcn@latest add button input card dialog dropdown-menu
```

## Component Usage Pattern

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ExamplePanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Run</Button>
      </CardContent>
    </Card>
  );
}
```

## Variant Customization

Edit the local shadcn component source and keep variants token-driven.

- Prefer existing semantic tokens from the target repository.
- Do not introduce new visual token names from inside this skill.
- Use the separate design-system skill for color, typography, and brand-specific decisions.

## Common Commands

```bash
npx tsc --noEmit
npm test
```

## UI Review Checklist

- Spacing uses 4px scale.
- Typography uses configured tokens or existing project styles.
- State colors come from design-system tokens when available.
- Keyboard focus and disabled states are clear.
- No extra UI library imports were introduced.
