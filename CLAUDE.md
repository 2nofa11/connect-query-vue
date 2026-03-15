# Vite+ (`vp`) — Unified Toolchain

Global CLI wrapping Vite, Vitest, tsdown, Oxlint, Oxfmt. Run `vp help` or `vp <cmd> --help`.

## Key Commands
| Category | Commands |
|----------|----------|
| Setup | `vp install` (`i`), `vp create`, `vp env` |
| Develop | `vp dev`, `vp check`, `vp lint`, `vp fmt`, `vp test` |
| Build | `vp build`, `vp pack`, `vp preview` |
| Deps | `vp add`, `vp remove`, `vp update`, `vp outdated`, `vp why` |
| Run | `vp run <script>`, `vp exec`, `vp dlx` |

## Rules (MUST follow)
- **Never use `pnpm`/`npm`/`npx` directly** — always use `vp`
- **No `vp vitest` or `vp oxlint`** — use `vp test` and `vp lint`
- **Don't install Vitest/Oxlint/Oxfmt/tsdown** — they're bundled in Vite+
- **Import from `vite-plus`** not `vite`/`vitest`: `import { defineConfig } from 'vite-plus'`, `import { expect, test } from 'vite-plus/test'`
- **Use `vp dlx`** instead of `npx`/`pnpm dlx`
- **Type-aware linting**: `vp lint --type-aware` (no extra install needed)
- **Conflicting scripts**: use `vp run test` if `test` script conflicts with built-in

## Agent Checklist
- [ ] `vp install` before starting
- [ ] `vp check` and `vp test` before finishing
<!--VITE PLUS END-->

# Submodule: connect-query-es

Git submodule at `./connect-query-es/` — upstream: https://github.com/connectrpc/connect-query-es

## Key Packages
| Package | Path | Role |
|---------|------|------|
| `@connectrpc/connect-query-core` | `packages/connect-query-core/` | Core logic (non-hook functions) used as a dependency in this project |
| `@connectrpc/connect-query` | `packages/connect-query/` | React adapter (reference implementation) |
| `test-utils` | `packages/test-utils/` | Test utilities — installed as `"test-utils": "file:connect-query-es/packages/test-utils"` |
| `protoc-gen-connect-query` | `packages/protoc-gen-connect-query/` | Protobuf code generator |

## Notes
- This project (`connect-query-vue`) is a **Vue adapter** built on top of `connect-query-core`
- When referencing core API behavior, check `connect-query-es/packages/connect-query-core/`
- The React adapter in `connect-query-es/packages/connect-query/` serves as the reference for Vue port
- `connect-query-es` uses its own package manager (`npm`) and build system (Turborepo) — do not run `vp` inside it

# Project Rules

- **NEVER use `npm` or `npx` directly.** All package management must go through `vp`.
- **GitHub Actions** must also use `vp`. Install with `curl -fsSL https://vite.plus | bash`.
