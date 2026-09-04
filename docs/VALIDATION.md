# Validation evidence

Verified locally on 2026-09-04 UTC with Node.js 24.15.0, npm 11.12.1, Playwright 1.62.1, and Chrome for Testing 151.0.7922.34.

## Release gate

Command:

```bash
npm run release:check
```

Results:

- ESLint: passed.
- Unit, domain, UI, metadata, and WebMCP integration tests: **44/44 passed**.
- Coverage: **91.98% statements**, **85.95% branches**, **93.81% functions**, **95.18% lines**.
- TypeScript production build: passed.
- Browser journeys: **17/17 passed** across 1440 px desktop, 768 px tablet, and 375 px mobile profiles.
- Real browser WebMCP registration and execution: passed, including back-to-back constraint update and planning, dynamic tool removal, visible human approval, and single-use commit.
- Automated WCAG A/AA checks: no detected violations in the tested English and Arabic states.
- Keyboard-only completion of the human approval journey: passed in all three browser profiles.
- Responsive checks: no horizontal overflow in the three tested viewports.

## Production browser audits

Lighthouse 13.4.1 against the minified production build:

- Performance: **98/100**.
- Accessibility: **100/100**.
- Best Practices: **100/100**.
- SEO: **100/100**.
- First Contentful Paint: **1.8 s**.
- Largest Contentful Paint: **1.8 s**.
- Total Blocking Time: **0 ms**.
- Cumulative Layout Shift: **0.004**.

Chrome's agentic audits all passed:

- WebMCP tools registered: **1/1**, with all seven initial imperative tools discovered from the production page.
- WebMCP schema validity: **1/1**.
- Agent accessibility tree: **1/1**.
- `llms.txt`: **1/1**.

## Dependency and repository hygiene

- `npm ci --dry-run`: passed against the committed lockfile.
- Production and full cached-advisory `npm audit --offline`: **0 vulnerabilities**.
- Direct dependencies are pinned to exact versions.
- Gitleaks scan of the complete Git history: **no leaks found**.
- Additional worktree patterns found no private keys or common provider-token formats.
- Build output, coverage, browser reports, test results, screenshots, local files, and dependencies are excluded from Git.
- The only tracked binary is the deliberate 1.1 MB self-authored project preview used by the repository and social metadata; no generated test artifact is tracked.

Automated accessibility and secret scans reduce risk but are not substitutes for independent accessibility or security review.

The same release command is configured in `.github/workflows/ci.yml` with read-only repository permissions. Its hosted result becomes verifiable after the repository is published and the workflow completes.
