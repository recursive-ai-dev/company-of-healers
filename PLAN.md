# Company of Healers — PLAN.md

Authoritative product specification. `DECISIONS.md` records how it is implemented;
`TODO.md` is the execution ledger.

## Vision

A dark-fantasy real-time strategy of mercy. The player commands **no swords** —
only four healers of the Company of the Pale Lantern — defending the Last Chapel
of Vey against the Blight across five waves, ending with the Blightfather.
Every life kept burning is a blow against the night. Mature, atmospheric,
restrained: mystery over shock.

## Core loop (shipped, must preserve)

1. Title screen → choose difficulty (Pilgrim / Penitent / Martyr) → Begin.
2. Respite phase: position healers, mend the company, sound the horn (+10 Faith,
   starts the wave early).
3. Combat phase: waves spawn from three rifts. Soldiers hold the line
   automatically; healers channel while stationary (Mender single-target,
   Chanter pulse, Purifier sear/field, Warden shield).
4. Between waves: choose 1 of 3 boons.
5. Victory: defeat the Blightfather (Wave V). Defeat: chapel falls or the whole
   company falls. Score + rank + per-difficulty best persisted in localStorage.

## Controls (shipped)

- Left-drag / click: select healers. `1–4`: select one. `A`: select company.
- Right-click (or touch-hold / tap with selection): move, focus-heal, revive.
- `Q W E R`: invoke each healer's rite at the cursor (costs Faith, cooldown).
- `Space`/`Esc`: pause. `M`: mute. `F`: 1×/2× speed. Touch supported.

## Architecture (target)

No build step, no dependencies. Static site, ES modules:

```
index.html          shell markup only (loads css + js/main.js)
css/style.css       all presentation
js/util.js          pure helpers (math, rng, colour) — unit-tested
js/data.js          pure game data + pure rules (waves, boons, score, endless)
js/dom.js           DOM handles (canvas, viewport, drag state)
js/audio.js         WebAudio synth SFX + ambience
js/state.js         game state singleton, factories, reset, FX/toast primitives
js/combat.js        healing/damage, rites (cast), commands
js/waves.js         wave spawning, boons, end-of-wave progression
js/update.js        per-frame simulation and healer AI
js/render.js        baked ground + all canvas drawing
js/ui.js            HUD/cards, overlays, input, run flow
js/main.js          init + main loop
tests/              node:test unit tests for pure modules
```

Rules: pure logic lives in `util`/`data` and is testable in Node without a DOM.
Modules communicate through the `G` state singleton and explicit imports only;
no module reaches into another's internals. `localStorage` keys (`coh_best`,
`coh_mute`) are stable for save compatibility.

## Requirements

- R1 Correctness: no free soldiers from boons; rites never spend Faith on a
  full-HP target; shields expire as documented; win/lose triggers fire once.
- R2 Content: 5 authored waves + endless mode after victory (procedural waves
  that scale in count and composition, boss every 3rd endless wave).
- R3 Enemies: husk, stalker, spitter, bloated, boss (shipped) + hex acolyte
  (ranged siege caster that pressures the chapel).
- R4 Boons: 8 shipped + Dawn Nova, Second Wind, Chapel Aegis.
- R5 Feedback: wave-composition preview before each assault; HUD wave label
  works in endless mode; score/rank/best unchanged in shape.
- R6 Verification: `node --test` passes; every module parses; the game boots
  and plays in a browser preview with no console errors.
- R7 Docs: this file, DECISIONS.md, TODO.md, README.md stay current.
- R8 Offline reliability: bundle locally licensed fonts; avoid external asset
  requests, and keep simulation time usable when rendering FPS is low.

## Non-goals

- No backend, accounts, or network play. No build tooling or npm dependencies.
- No new art pipeline: all visuals remain procedural canvas/SVG.
