# Design System

## 1. Product feel
Modern, calm, compact, data-oriented, and uncluttered. Use whitespace and typographic hierarchy instead of decorative cards everywhere.

## 2. Reference direction
- Functional patterns: Pipedrive goals and sales dashboards.
- Reporting hierarchy: HubSpot goal progress reports.
- Target configuration: Zoho CRM target meters.
- Visual restraint: Attio.
- Permission and audit discipline: Salesforce concepts.

Do not copy logos, proprietary illustrations, or exact branded screens.

## 3. Layout
- Desktop: persistent left navigation, compact top bar, content area with a clear page title and primary action.
- Mobile: responsive navigation and a single-column dashboard; daily entry must remain usable on a phone.
- Use a consistent max-width for data-heavy pages and avoid excessive horizontal scrolling.
- Keep the main daily action prominent.

## 4. Navigation
Admin:
- Overview
- Daily Sales
- Targets
- Team
- Reports
- Settings

Representative:
- My Performance
- Enter Sales
- My History
- My Profile

Platform operations should be a separate protected area.

## 5. Dashboard hierarchy
1. Page title, selected period, and one primary action.
2. Four or fewer top-level KPI summaries: actual, target, attainment, gap.
3. One primary trend visualization.
4. A ranked or tabular performance breakdown.
5. Secondary details and submission status.

Avoid multiple charts that convey the same information. Every chart must answer a specific operational question.

## 6. Visual tokens
Define tokens centrally and keep them themeable:
- Background: neutral off-white or neutral dark surface according to theme.
- Surface: white/near-white in light theme; elevated neutral in dark theme.
- Text: high-contrast primary and muted secondary.
- Accent: one restrained brand color for primary actions and selected states.
- Success/warning/danger: reserved for semantic status, never decoration.
- Borders: subtle neutral; use spacing before adding card borders.
- Radius: consistent small-to-medium radius.
- Shadows: minimal; use elevation sparingly.

Do not hardcode colors in individual components. Use CSS variables or the chosen UI framework's theme tokens.

## 7. Components
- KPI summary
- Target progress bar
- Date range filter
- Metric selector
- Searchable/filterable table
- Status badge
- Empty state
- Loading skeleton
- Error state with retry where safe
- Confirmation dialog
- Form field with inline validation
- Toast/notification
- Pagination
- Accessible chart with a data-table alternative

## 8. Interaction rules
- One primary action per page where possible.
- Use explicit units and currency labels.
- Show date range and timezone context.
- Never rely on color alone to convey attainment or status.
- Keep filters visible and easy to clear.
- Preserve table filters when returning from a record detail view.
- Confirm destructive actions.
- Provide a clear result after saving, including validation errors.
- Avoid optimistic updates for financially consequential changes unless rollback behavior is robust.

## 9. Accessibility and responsiveness
- Keyboard navigable controls and visible focus.
- Semantic headings, labels, and table headers.
- Adequate contrast and target sizes.
- Screen-reader labels for icon-only buttons.
- Respect reduced-motion preferences.
- Test at narrow mobile, tablet, and desktop widths.
- Charts need accessible summaries or tabular alternatives.

## 10. UI quality bar
A page is not complete merely because it renders. It must include loading, empty, error, success, validation, and permission-denied states as applicable.
