# Pinned Umami tracker fixture

`script.js` is the real Umami browser tracker, not a mock.

## Provenance

- Upstream repository: <https://github.com/umami-software/umami>
- Source tag: [`v3.4.1`](https://github.com/umami-software/umami/tree/v3.4.1)
- Source file: [`src/tracker/index.ts`](https://github.com/umami-software/umami/blob/v3.4.1/src/tracker/index.ts)
- License: MIT (see [`LICENSE`](./LICENSE), copied from the tagged release)
- Upstream build configuration: [`rollup.tracker.config.js`](https://github.com/umami-software/umami/blob/v3.4.1/rollup.tracker.config.js)

## Preparation

The release publishes the tracker only as a build artifact, so this fixture is generated from the tagged source with the same source substitutions and IIFE format as the upstream Rollup build. It is not minified (upstream additionally runs terser); minification does not change tracker behavior. No tracker logic is modified.

```sh
# Run from the repository root.

# 1. Download the tagged source (SHA-256: 0684f4c6896f53695fe6c0ae1122f70f0e12e6e8a3d1ea21ad2556653525d6a7)
curl -fsSL https://raw.githubusercontent.com/umami-software/umami/v3.4.1/src/tracker/index.ts -o /tmp/umami-tracker-v3.4.1.ts

# 2. Erase types (the same job as the upstream TypeScript build step)
pnpm exec tsc /tmp/umami-tracker-v3.4.1.ts \
  --target es2022 \
  --module esnext \
  --moduleResolution bundler \
  --skipLibCheck \
  --outDir /tmp/umami-tracker-build

# 3. Apply the upstream Rollup `replace` plugin substitutions and drop the empty module export
sed \
  -e "s|'__COLLECT_API_HOST__'|''|g" \
  -e "s|__COLLECT_API_ENDPOINT__|/api/send|g" \
  -e "/^export {};$/d" \
  /tmp/umami-tracker-build/umami-tracker-v3.4.1.js > /tmp/umami-tracker-build/script.js

# 4. Prepend the provenance banner used by the committed fixture
{
  printf '%s\n' '/*! Umami tracker v3.4.1 | MIT License | https://github.com/umami-software/umami/blob/v3.4.1/src/tracker/index.ts */'
  cat /tmp/umami-tracker-build/script.js
} > playground/fixtures/production/tracker/script.js
```

The current `script.js` has SHA-256 `e9e2fe762d09ec34ec6cb3a7f1e875740bb0eacc7ee33f1fbcae1a2dfef77c6e`.

Tests serve this file through Playwright request interception. They never fetch a moving Umami cloud script and never send analytics traffic to an external service.
