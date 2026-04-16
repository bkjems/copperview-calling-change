# Tests

End-to-end tests for the Calling Change Request form using [Playwright](https://playwright.dev).

## Setup

```bash
npm install
npx playwright install chromium
```

## Running Tests

Run all unit/integration tests (fetch is intercepted, no real emails sent):

```bash
npm test
```

Run the live submission test in headed mode (sends a real email):

```bash
npx playwright test tests/calling-change-live.spec.js --headed
```

## Test Files

- **calling-change.spec.js** — Main test suite (14 tests). Covers form population, ward-to-building auto-select, validation errors, submission with intercepted fetch, cancel behavior, and dark mode toggle.
- **calling-change-live.spec.js** — Single live test that submits to the real Apps Script endpoint. Run headed so you can watch it, then check your inbox for the email.
