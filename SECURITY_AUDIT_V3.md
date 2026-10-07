# Targeted security audit — V2 freeze and V3 preparation

Date: 2026-10-07

## Scope and result

Tracked files, Git history, deployment configuration, frontend authentication, backend configuration and package dependencies were checked before creating V3. No active or historical high-confidence production credential, database URL with remote credentials, private key, GitHub token or cloud API token was found. Only `.env.example` was historically tracked; its values are documented local placeholders.

The V2 source commit `6d4b2285c2f7a1e24b941f8885089c3ff8f551ca` was frozen as annotated tag `v2.0.0`. `main` and `v1.0.0` were not changed.

## Repository controls checked

- GitHub Secret Scanning: enabled.
- GitHub Push Protection: enabled.
- Open secret-scanning alerts: 0 at audit time.
- Dependabot security updates: disabled; the alerts API was not available to the current token.
- Branch protection for `main`: not available/configured through the current repository API response.
- Production npm dependencies: 0 known vulnerabilities after the V3 dependency update.
- Full npm dependency tree: 0 known vulnerabilities after updating Wrangler and overriding its transitive patched `sharp` release.

Recommended GitHub UI actions:

1. Open **Repository → Settings → Code security and analysis**.
2. Enable **Dependabot alerts** and **Dependabot security updates**.
3. Open **Repository → Settings → Branches → Add branch protection rule**.
4. Protect `main` and require a pull request plus passing checks before merge.

## V3 security changes

- Removed production bearer tokens from `localStorage`; sessions now use opaque HttpOnly cookies backed by D1.
- Added PBKDF2-SHA-256 password hashing with random salts.
- Added same-origin write protection, server-side RBAC, parameterized queries, bounded JSON input and rate limiting.
- Added generic authentication errors and generic internal server errors.
- Added CSP and standard browser security headers.
- Expanded ignored secret files to `.env.*`, `.dev.vars`, and `.wrangler`, while preserving safe examples.
- Removed production proxy dependencies on Render FastAPI and GeoServer.

## Residual operational requirement

The temporary `ADMIN_BOOTSTRAP_SECRET` must be added through Cloudflare secrets, used once, and removed immediately after the first ADMIN is created. It must never be committed or pasted into chat.
