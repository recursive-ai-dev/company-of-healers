# Company of Healers — DECISIONS.md

Append-oriented architectural decision record. Status: Proposed / Accepted /
Superseded / Deprecated.

## D1 — Split the single file into ES modules (Accepted)

- **Decision:** Extract `index.html` into shell + `css/style.css` + `js/*.js`
  ES modules, loaded via `<script type="module">`. No bundler, no runtime dependencies.
- **Context:** The whole game lived in one 1,800-line `index.html`, making
  review, testing, and extension error-prone.
- **Alternatives:** Keep one file; use classic scripts sharing globals; add a bundler.
- **Rationale:** ES modules give explicit imports/exports, Node-testable pure
  modules, and zero build step. Classic scripts keep globals implicit; a
  bundler adds tooling the project does not need.
- **Consequences:** Serve over HTTP (modules are blocked under `file://` CORS).
  Shared primitives live in `state.js` and DOM handles in `dom.js`; moving
  terminal transitions into state prevents combat/wave import cycles.

## D2 — State singleton `G` mutated in place (Accepted)

- **Decision:** `state.js` exports a mutable `G`; `reset()` re-initialises its
  fields rather than rebinding a new object.
- **Context:** Every module reads/writes the same run state.
- **Alternatives:** Rebind `export let G`; class instance; event bus/store.
- **Rationale:** In-place mutation keeps imports stable and matches the
  original code shape, minimising refactor risk.
- **Consequences:** Tests must reset between cases. Only best-score/mute
  persist; a run is not saved mid-vigil.

## D3 — Endless mode as post-victory continuation (Accepted)

- **Decision:** After Wave V victory the end screen offers "Continue — Endless
  Vigil". `waveFor(i)` returns authored waves for `i < 5` and generated waves
  beyond; counts/composition scale, a scaled boss appears every 3rd wave.
- **Context:** A five-wave run ends quickly; replayability needs depth without
  authoring 20 more waves.
- **Alternatives:** Unlock endless from title; hand-author 10 waves; pure random waves.
- **Rationale:** Post-victory continuation preserves the authored arc; fixed
  generated templates stay readable and fair.
- **Consequences:** Endless deaths record score/best. Roman labels extend
  beyond V; generated waves use one deterministic template per index.

## D4 — Hex acolyte as the new enemy (Accepted)

- **Decision:** Add one ranged siege caster that targets the chapel, unless
  a guardsman intercepts it nearby.
- **Context:** Spitters already pressure the line; the chapel lacked dedicated
  ranged threats.
- **Alternatives:** Another melee hunter; debuff enemy; no new enemy.
- **Rationale:** The caster forces positioning trade-offs and reuses projectiles.
- **Consequences:** New draw and target branches; Wave III onward and endless.

## D5 — Fix boon/rite/shield bugs (Accepted)

- **Decision:** Remove the stray unconditional `addSoldier()` at the end of
  `applyBoon`; Mender's rite refuses a full-HP target without Faith/cooldown
  expense. Chapel shields decay at expiry; Warden cannot reduce a stronger
  Chapel Aegis or shorten its remaining duration.
- **Context:** Hidden free guardsmen distorted the original boon economy; rites
  and shield timers contradicted their descriptions.
- **Alternatives:** Treat the bugs as undocumented buffs.
- **Rationale:** Make rules legible and upgrades meaningful.
- **Consequences:** Runs are slightly harder than the buggy original build.

## D6 — Pure rules, zero-dependency tests (Accepted)

- **Decision:** Score/rank, wave generation, previews, and math helpers are
  pure functions with `node:test` tests; browser rendering/flow are verified
  in a live Chromium preview and simulated DOM smoke.
- **Context:** No test infrastructure existed.
- **Alternatives:** Browser-only manual tests; jsdom as a permanent dependency.
- **Rationale:** Built-in tests cover regression-prone rules without installing
  dependencies. Real browser validation covers integration.
- **Consequences:** `util.js` and `data.js` never touch `document` at import time.

## D7 — Make offline rendering reliable (Accepted)

- **Decision:** Bundle the three OFL-licensed typefaces as local WOFF2 assets;
  cap long-tab frame deltas at .25s and update simulation in ≤.05s substeps.
- **Context:** Headless preview could not reach Google Fonts, producing a
  console error. Software canvas rendering on the test machine ran below 20
  FPS; the previous .05s delta cap slowed game time drastically.
- **Alternatives:** Use system fallback fonts; allow unbounded frame deltas;
  retain the original .05s per-frame cap.
- **Rationale:** Local fonts preserve art direction without network access.
  Substeps preserve gameplay pace and stable collision/damage calculations.
- **Consequences:** Seven small WOFF2 files and three SIL Open Font License
  texts live under `assets/fonts`; very long frame stalls still cap at .25s
  to avoid simulation spirals.

## D8 — Dawn Nova resolves on the next assault (Accepted)

- **Decision:** Mark the next wave for 60 dawnfire damage on each enemy as it
  spawns; the mark expires naturally with that wave index.
- **Context:** Blessings are picked only between waves, when there are no
  enemies; an instant area attack at selection time would do nothing.
- **Alternatives:** Leave it ineffective; pre-spawn enemies during respite.
- **Rationale:** The boon now has an observable tactical effect without
  changing the wave cadence. It is potent against minor enemies but not a
  boss-killer.
- **Consequences:** Each arrival gets a brief gold burst; new wave data and
  boon description explicitly say it triggers on the next assault.
