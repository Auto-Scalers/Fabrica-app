# 09. TLS certificate — `CN=Orca Runtime`

> **STATUS: ✅ IMPLEMENTED (2026-08-13).** `tls-certificate.ts` → `CN=Fabrica Runtime` + filenames `fabrica-tls-cert.pem`/`fabrica-tls-key.pem`; lint + `ws-transport.test.ts` pass.

## What it is
Fabrica generates a **local self-signed security certificate** so your own desktop↔remote-server connections are encrypted. The certificate's "common name" is currently `CN=Orca Runtime`. It surfaces when macOS/Windows shows a trust prompt, and in connection details.

## Where it lives
- `src/main/runtime/tls-certificate.ts:54` — `'/CN=Orca Runtime'`

## Visible to users?
Semi — shows up in TLS trust prompts and certificate viewers.

## The 0-users impact
Zero — self-signed certs are generated locally on first run per machine. No installed certs exist to migrate.

## Options

### Option A — Rename now to `CN=Fabrica Runtime` (Recommended)
Benefit: no "Orca" in security prompts. Trivial single-string change; certs regenerate automatically on each fresh install.
Tradeoff: for a *re-installed existing machine* the old cert would be recreated — irrelevant at 0 users.

### Option B — Keep `CN=Orca Runtime`
Benefit: zero effort.
Tradeoff: "Orca" shows up in the rare but visible trust prompt.

### Option C — Rename the whole cert bundle identity (keychain service, storage path) too ✅ DECIDED
Benefit: full consistency.
Tradeoff: certificate *storage* keys often derive from this CN — check nothing else keys off the string. At 0 users this is safe to do all at once.

## ✅ DECIDED
**Option C — rename the whole cert bundle identity** (CN, keychain service, and storage path) in one coordinated change. One line for the CN plus a check that nothing else derives a storage key from it — safe at 0 users, full consistency, no "Orca" left in security UI.

Effort: Low. Value: removes "Orca" from security UI.