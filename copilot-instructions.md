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

## End of Instructions
