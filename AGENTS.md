# Space One development

Read `docs/DESIGN_SYSTEM.md` before changing UI.

- Use the installed `@usecase-ui/svelte` components and existing Tailwind/daisyUI naming.
- Keep theme decisions in `usecase.theme.json`; use semantic surface, color, type, spacing, radius, and motion tokens.
- Preserve Space One's content, original media, editorial character, accessibility, and business workflows.
- Use plain headings inside cards, consistent label spacing, and theme-sized fields. Do not add decorative fieldset legends or page-specific control-height systems.
- Keep native form behavior and explicit submit button types when using library components.
- Work mobile-first; inspect populated and empty states, overflow, keyboard operation, and touch targets.
- npm and package-lock.json are authoritative. Do not mix package managers in the same node_modules tree.
- Validate with npm run check, npm test, and relevant browser tests. The UI test server is isolated and local; never use a production database or email binding for fixture creation.
- Do not deploy or change backend configuration as a side effect of UI work.
