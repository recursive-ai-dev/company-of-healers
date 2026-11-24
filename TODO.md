# Company of Healers — TODO.md

Execution ledger. See PLAN.md for requirements, DECISIONS.md for rationale.

## Done

- [x] Audit original single-file build; catalogued boon-soldier, rite-waste, and shield-expiry bugs.
- [x] Establish PLAN.md, DECISIONS.md, and TODO.md; extract CSS and split the game into 11 ES modules.
- [x] Fix unconditional free soldier from every boon, Mender rite spending on full-HP allies, and chapel shield expiry.
- [x] Add hex acolyte (ranged siege targeting, visuals, authored/endless wave placement).
- [x] Add Dawn Nova (next-wave on-spawn damage), Second Wind, and Chapel Aegis; preserve strong Aegis shields when Warden casts.
- [x] Add endless waves, post-victory continuation, scaling and periodic boss waves, unbounded Roman wave labels.
- [x] Preview next wave's composition in the boon overlay and respite HUD.
- [x] Add 19 zero-dependency `node:test` tests for pure rules and helpers.
- [x] Write README.md; bundle locally licensed fonts so offline previews have no external font dependency.
- [x] Decouple simulation time from frame rate for slow devices.
- [x] Verify module syntax, rule tests, simulated DOM progression, and a real Chromium preview.

## Possible follow-up slices

- [ ] Add lightweight visual-regression screenshots at desktop and mobile sizes in CI once browser tooling is available.
- [ ] Profile canvas draw calls on low-end devices; consider caching static glow layers or lowering rendering resolution adaptively.
- [ ] Introduce more choices with trade-offs in later endless waves, preserving the focus on defense and mercy.

## Verification log

- `npm test`: 19/19 passing (Node.js 22).
- `node --check` for each of `js/*.js`: all pass; import graph has no cycles.
- HTTP: `/`, `/css/style.css`, `/js/main.js`, `/js/waves.js` return 200 from the preview server on port 8000.
- Simulated DOM/canvas smoke: boot → start → combat → acolyte render → Mender full-health guard → boon choice (no extra soldier) → Dawn Nova against next-wave husk → victory → endless wave → Chapel Aegis/Warden shield preservation; passed.
- Headless Chromium on the live preview: 4 cards boot, local fonts load, begin/horn starts combat, Space pauses/resumes, 5 wave/boon transitions, end overlay, endless continuation and next endless boon; **zero page/console/request errors** after local fonts were bundled.
