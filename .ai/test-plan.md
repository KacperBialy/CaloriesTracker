```markdown
# Test Plan for CaloriesTracker

## 1. Introduction and Testing Objectives  
**Project Overview:**  
CaloriesTracker is a web application built with Astro 5, TypeScript 5, React 19, Tailwind 4, and Shadcn/ui. It uses Supabase for backend storage and exposes RESTful API endpoints under `/src/pages/api`.  

**Objectives:**  
- Verify correctness of core features: user authentication, calorie logging, data visualization.  
- Ensure UI components render and behave as expected across devices.  
- Validate API endpoints and database interactions.  
- Maintain code quality, performance, and accessibility standards.  

---

## 2. Scope of Tests  
- **In scope:**  
  - Client-side React components (forms, charts, lists)  
  - Astro layouts and pages  
  - API routes (CRUD operations for calories, user sessions)  
  - Supabase integration (client instantiation, types)  
  - Utility libraries in `/src/lib`  
  - Tailwind-driven styling and responsive breakpoints  
  - Middleware (e.g. auth guard)  

- **Out of scope:**  
  - Third-party services outside Supabase  
  - Browser compatibility prior to evergreen browsers  

---

## 3. Types of Tests to Be Performed  
1. **Unit Tests**  
   - Component logic (form validation, state updates)  
   - Pure functions in `/src/lib`  
2. **Integration Tests**  
   - React components with child components and hooks  
   - API route handlers with mock Supabase clients  
3. **End-to-End (E2E) Tests**  
   - User flows: sign up, log in, add/edit/delete calorie entries, view charts  
4. **Performance Tests**  
   - Time to interactive and Lighthouse scores on key pages  
5. **Accessibility Tests**  
   - Automated audits (axe, Lighthouse) on forms and charts  

---

## 4. Test Scenarios for Key Functionalities  

| Feature                             | Scenario                                                                                 |
|-------------------------------------|------------------------------------------------------------------------------------------|
| User Authentication                 | - Sign up with valid/invalid data<br/>- Log in/out flows<br/>- Session expiration       |
| Calorie Entry CRUD                  | - Create entry with valid/invalid inputs<br/>- Edit and delete existing entries         |
| Data Visualization                  | - Chart renders correct data ranges<br/>- Responsive behavior at mobile/tablet/desktop   |
| API Error Handling                  | - 404 on non-existent entry<br/>- 401 on unauthorized access                             |
| Form Validation                     | - Required fields enforcement<br/>- Number boundary checks (e.g. positive calories)     |
| Supabase Integration                | - Client initialization<br/>- Correct typing for DTOs and entities                      |

---

## 5. Test Environment  
- **Local Development:** Node.js 20, npm 10  
- **Test Runner:** Vitest for unit/integration, Playwright for E2E  
- **Browsers (E2E):** Chromium
- **Mocking:** msw (Mock Service Worker) for API stubs  
- **CI Pipeline:** GitHub Actions on push to `main`  

---

## 6. Testing Tools  
- **Unit & Integration:** Vitest + Testing Library (React) + jsdom  
- **E2E:** Playwright  
- **Linting & Type Checking:** ESLint, TypeScript  
- **Accessibility:** axe-core, Lighthouse CLI  
- **Performance:** Lighthouse CI, WebPageTest integrations  

---

## 7. Test Schedule  

| Phase                   | Duration     | Owners      |
|-------------------------|--------------|-------------|
| Test Plan Review        | 2 days       | QA Lead     |
| Test Implementation     | 1 week       | Dev & QA    |
| E2E Suite Development   | 1 week       | QA Engineer |
| Test Execution & Fixes  | Ongoing      | Dev & QA    |
| Regression Runs         | Every Sprint | QA Team     |

---

## 8. Test Acceptance Criteria  
- 100% of unit tests pass; ≥ 80% code coverage on `/src/lib` and components  
- Integration tests cover all API routes with both success and error paths  
- No high-severity defects open at release time  

---
