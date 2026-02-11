# GitHub Copilot Instructions for Web Banking Application

## Purpose

These instructions guide GitHub Copilot when generating code for a
secure, modern web-based banking application built with HTML, CSS,
Vanilla JavaScript, and Firebase.\
The app serves customers, bank employees, and administrators with full
banking functionality.

------------------------------------------------------------------------

## 1. Technology Stack

-   HTML5
-   CSS3 (plain CSS, no frameworks)
-   Vanilla JavaScript (ES6+)
-   Firebase (Auth, Firestore, Storage)
-   No bundler (plain HTML files)
-   Feature-based architecture

------------------------------------------------------------------------

## 2. Project Structure

Copilot must follow this folder structure:

    public/
      index.html
      assets/
        css/
          global.css
          themes.css
        js/
          main.js
        images/

    src/
      core/
        firebase.js
        auth.js
        api.js
        utils.js
        errorHandler.js

      features/
        auth/
          login.html
          register.html
          auth.js
          auth.css
        dashboard/
          dashboard.html
          dashboard.js
          dashboard.css
        transfers/
          transfers.html
          transfers.js
          transfers.css
        accounts/
          accounts.html
          accounts.js
          accounts.css
        loans/
          loans.html
          loans.js
          loans.css
        admin/
          admin.html
          admin.js
          admin.css

      components/
        sidebar.js
        topbar.js
        modal.js
        card.js

------------------------------------------------------------------------

## 3. UI & Styling Rules

-   Modern fintech design (clean, professional, minimal).
-   Support both light and dark themes with a theme switcher.
-   CSS files only (no inline styles).
-   Dashboard layout with sidebar + topbar.
-   Responsive design (mobile-first).
-   Use subtle transitions and animations (hover, fade, slide).

------------------------------------------------------------------------

## 4. HTML & Template Rules

-   Separate HTML files per feature (dashboard.html, admin.html, etc.).
-   Avoid inline JavaScript in HTML.
-   Use semantic HTML5 elements.
-   Use data attributes for JS bindings when appropriate.

------------------------------------------------------------------------

## 5. JavaScript Coding Rules

### 5.1 Language Style

-   Use ES6 modules (import / export).
-   Prefer async/await over .then().
-   Use "use strict" in all modules.
-   Use camelCase for file names and variables.

### 5.2 Error Handling

-   Use try/catch for Firebase and async calls.
-   Centralized global error handler in core/errorHandler.js.
-   Display user-friendly error messages in UI.

### 5.3 Comments & Documentation

-   Use JSDoc for modules and public functions.
-   Comment only complex logic and security-critical code.

------------------------------------------------------------------------

## 6. Firebase & Security Rules

Copilot must: - NEVER store API keys or secrets directly in frontend
code. - Use Firebase Security Rules for Firestore and Storage. -
Sanitize all user input. - Avoid using innerHTML for dynamic content
(prefer DOM APIs). - Enforce role-based UI access (customer, employee,
admin). - Hide admin features unless role == admin.

------------------------------------------------------------------------

## 7. Authentication & Authorization

-   Use Firebase Auth for login/register.
-   Enforce role-based UI rendering.
-   Protect admin and employee features from customers.
-   Store roles securely in Firestore.

------------------------------------------------------------------------

## 8. Performance Rules

Copilot must: - Lazy load feature modules when possible. -
Debounce/throttle user inputs (search, forms). - Avoid unnecessary DOM
reflows. - Avoid heavy loops on the main thread.

------------------------------------------------------------------------

## 9. Refactoring Rules

Copilot should: - Split large JS files into feature modules. - Extract
reusable UI components (sidebar, cards, charts). - Avoid deeply nested
callbacks. - Keep functions small and readable.

------------------------------------------------------------------------

## 10. Testing Rules

-   Generate test stubs for JavaScript modules.
-   Use Jest for unit tests.
-   Focus on core business logic and Firebase wrappers.

------------------------------------------------------------------------

## 11. Prohibited Behaviors

Copilot must NOT: - Embed secrets in frontend code. - Use inline CSS or
inline JavaScript. - Use eval() or unsafe dynamic code execution. - Use
innerHTML with unsanitized input. - Create monolithic JS files instead
of modules.

------------------------------------------------------------------------

Concise rules for building accessible, fast, delightful UIs. Use MUST/SHOULD/NEVER to guide decisions.

## Interactions

### Keyboard

- MUST: Full keyboard support per [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/)
- MUST: Visible focus rings (`:focus-visible`; group with `:focus-within`)
- MUST: Manage focus (trap, move, return) per APG patterns
- NEVER: `outline: none` without visible focus replacement

### Targets & Input

- MUST: Hit target ≥24px (mobile ≥44px); if visual <24px, expand hit area
- MUST: Mobile `<input>` font-size ≥16px to prevent iOS zoom
- NEVER: Disable browser zoom (`user-scalable=no`, `maximum-scale=1`)
- MUST: `touch-action: manipulation` to prevent double-tap zoom
- SHOULD: Set `-webkit-tap-highlight-color` to match design

### Forms

- MUST: Hydration-safe inputs (no lost focus/value)
- NEVER: Block paste in `<input>`/`<textarea>`
- MUST: Loading buttons show spinner and keep original label
- MUST: Enter submits focused input; in `<textarea>`, ⌘/Ctrl+Enter submits
- MUST: Keep submit enabled until request starts; then disable with spinner
- MUST: Accept free text, validate after—don't block typing
- MUST: Allow incomplete form submission to surface validation
- MUST: Errors inline next to fields; on submit, focus first error
- MUST: `autocomplete` + meaningful `name`; correct `type` and `inputmode`
- SHOULD: Disable spellcheck for emails/codes/usernames
- SHOULD: Placeholders end with `…` and show example pattern
- MUST: Warn on unsaved changes before navigation
- MUST: Compatible with password managers & 2FA; allow pasting codes
- MUST: Trim values to handle text expansion trailing spaces
- MUST: No dead zones on checkboxes/radios; label+control share one hit target

### State & Navigation

- MUST: URL reflects state (deep-link filters/tabs/pagination/expanded panels)
- MUST: Back/Forward restores scroll position
- MUST: Links use `<a>`/`<Link>` for navigation (support Cmd/Ctrl/middle-click)
- NEVER: Use `<div onClick>` for navigation

### Feedback

- SHOULD: Optimistic UI; reconcile on response; on failure rollback or offer Undo
- MUST: Confirm destructive actions or provide Undo window
- MUST: Use polite `aria-live` for toasts/inline validation
- SHOULD: Ellipsis (`…`) for options opening follow-ups ("Rename…") and loading states ("Loading…")

### Touch & Drag

- MUST: Generous targets, clear affordances; avoid finicky interactions
- MUST: Delay first tooltip; subsequent peers instant
- MUST: `overscroll-behavior: contain` in modals/drawers
- MUST: During drag, disable text selection and set `inert` on dragged elements
- MUST: If it looks clickable, it must be clickable

### Autofocus

- SHOULD: Autofocus on desktop with single primary input; rarely on mobile

## Animation

- MUST: Honor `prefers-reduced-motion` (provide reduced variant or disable)
- SHOULD: Prefer CSS > Web Animations API > JS libraries
- MUST: Animate compositor-friendly props (`transform`, `opacity`) only
- NEVER: Animate layout props (`top`, `left`, `width`, `height`)
- NEVER: `transition: all`—list properties explicitly
- SHOULD: Animate only to clarify cause/effect or add deliberate delight
- SHOULD: Choose easing to match the change (size/distance/trigger)
- MUST: Animations interruptible and input-driven (no autoplay)
- MUST: Correct `transform-origin` (motion starts where it "physically" should)
- MUST: SVG transforms on `<g>` wrapper with `transform-box: fill-box`

## Layout

- SHOULD: Optical alignment; adjust ±1px when perception beats geometry
- MUST: Deliberate alignment to grid/baseline/edges—no accidental placement
- SHOULD: Balance icon/text lockups (weight/size/spacing/color)
- MUST: Verify mobile, laptop, ultra-wide (simulate ultra-wide at 50% zoom)
- MUST: Respect safe areas (`env(safe-area-inset-*)`)
- MUST: Avoid unwanted scrollbars; fix overflows
- SHOULD: Flex/grid over JS measurement for layout

## Content & Accessibility

- SHOULD: Inline help first; tooltips last resort
- MUST: Skeletons mirror final content to avoid layout shift
- MUST: `<title>` matches current context
- MUST: No dead ends; always offer next step/recovery
- MUST: Design empty/sparse/dense/error states
- SHOULD: Curly quotes (" "); avoid widows/orphans (`text-wrap: balance`)
- MUST: `font-variant-numeric: tabular-nums` for number comparisons
- MUST: Redundant status cues (not color-only); icons have text labels
- MUST: Accessible names exist even when visuals omit labels
- MUST: Use `…` character (not `...`)
- MUST: `scroll-margin-top` on headings; "Skip to content" link; hierarchical `<h1>`–`<h6>`
- MUST: Resilient to user-generated content (short/avg/very long)
- MUST: Locale-aware dates/times/numbers (`Intl.DateTimeFormat`, `Intl.NumberFormat`)
- MUST: Accurate `aria-label`; decorative elements `aria-hidden`
- MUST: Icon-only buttons have descriptive `aria-label`
- MUST: Prefer native semantics (`button`, `a`, `label`, `table`) before ARIA
- MUST: Non-breaking spaces: `10&nbsp;MB`, `⌘&nbsp;K`, brand names

## Content Handling

- MUST: Text containers handle long content (`truncate`, `line-clamp-*`, `break-words`)
- MUST: Flex children need `min-w-0` to allow truncation
- MUST: Handle empty states—no broken UI for empty strings/arrays

## Performance

- SHOULD: Test iOS Low Power Mode and macOS Safari
- MUST: Measure reliably (disable extensions that skew runtime)
- MUST: Track and minimize re-renders (React DevTools/React Scan)
- MUST: Profile with CPU/network throttling
- MUST: Batch layout reads/writes; avoid reflows/repaints
- MUST: Mutations (`POST`/`PATCH`/`DELETE`) target <500ms
- SHOULD: Prefer uncontrolled inputs; controlled inputs cheap per keystroke
- MUST: Virtualize large lists (>50 items)
- MUST: Preload above-fold images; lazy-load the rest
- MUST: Prevent CLS (explicit image dimensions)
- SHOULD: `<link rel="preconnect">` for CDN domains
- SHOULD: Critical fonts: `<link rel="preload" as="font">` with `font-display: swap`

## Dark Mode & Theming

- MUST: `color-scheme: dark` on `<html>` for dark themes
- SHOULD: `<meta name="theme-color">` matches page background
- MUST: Native `<select>`: explicit `background-color` and `color` (Windows fix)

## Hydration

- MUST: Inputs with `value` need `onChange` (or use `defaultValue`)
- SHOULD: Guard date/time rendering against hydration mismatch

## Design

- SHOULD: Layered shadows (ambient + direct)
- SHOULD: Crisp edges via semi-transparent borders + shadows
- SHOULD: Nested radii: child ≤ parent; concentric
- SHOULD: Hue consistency: tint borders/shadows/text toward bg hue
- MUST: Accessible charts (color-blind-friendly palettes)
- MUST: Meet contrast—prefer [APCA](https://apcacontrast.com/) over WCAG 2
- MUST: Increase contrast on `:hover`/`:active`/`:focus`
- SHOULD: Match browser UI to bg
- SHOULD: Avoid dark color gradient banding (use background images when needed)

## End of Instructions
