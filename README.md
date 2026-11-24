# Company of Healers

*A dark-fantasy strategy of mercy.* Command four healers of the Pale Lantern and keep the Last Chapel of Vey standing through five assaults. The garrison fights; your company heals, shields, consecrates, and revives. Every life kept burning is a blow against the night.

## Play locally

Requires a modern browser and a local HTTP server (ES modules do **not** work from `file://`). No build step or runtime dependencies.

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Or run `npm start` (requires Node.js and Python 3). Tests: `npm test` (Node.js 18+; no install required).

## The vigil

Choose **Pilgrim**, **Penitent**, or **Martyr** on the title screen. Prepare your positions during each respite, then face five authored waves, ending with the Blightfather. Between assaults, choose one of three blessings. After victory, you can finish the run or continue into an **Endless Vigil**, where enemy counts and strength grow; every third endless wave brings another Blightfather. Score and per-difficulty bests are saved in your browser (`coh_best`). Mute preference uses `coh_mute`.

### Controls

| Action | Control |
| --- | --- |
| Select healer(s) | Click or drag; `1`–`4` selects an individual, `A` selects all |
| Move / focus-heal / revive | Right-click with selected healer(s) (or touch-hold; tap with a selection to command) |
| Rites | `Q` Marra's Mend Soul; `W` Ilex's Hymn of Dawn; `E` Cindre's Consecrate; `R` Vessa's Aegis of Mercy |
| Sound the horn | Horn button in respite: start the next wave early and gain 10 Faith |
| Pause | `Space` or `Esc` |
| Sound / speed | `M` mute; `F` toggle 1×/2× |

Healers channel their passive gifts while stationary. Moving interrupts their channel. Faith regenerates and is also earned through healing and defeating enemies. The hex acolyte arrives in later waves: it fires at the chapel from range unless the garrison intercepts it. Boon **Dawn Nova** burns each enemy as it enters the **next** assault (not at selection time); **Chapel Aegis** grants a 25-second shield, and **Second Wind** restores and strengthens living healers. Pilgrim's Bread alone grants guardsmen; other boons do not secretly add soldiers.

## Architecture

`index.html` and `css/style.css` provide the interface. `js/main.js` initializes the game and runs the frame loop. Data and pure rules live in `js/data.js` and `js/util.js`; the simulation is split into `state`, `combat`, `waves`, `update`, `render`, `audio`, `ui`, and `dom` modules. No bundler or third-party runtime dependencies. See [PLAN.md](PLAN.md) for the product specification, [DECISIONS.md](DECISIONS.md) for design rationale, and [TODO.md](TODO.md) for the execution ledger.

Run `npm test` for pure-rule unit tests; `node --check js/*.js` is not supported by Node directly, so use `for f in js/*.js; do node --check "$f"; done` to syntax-check all modules.
