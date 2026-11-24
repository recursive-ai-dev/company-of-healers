// DOM handles shared by render/ui/main. Importing this module requires a browser
// document; pure-logic tests must not import it.
export const $ = id => document.getElementById(id);

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');

/** Viewport transform: world (1600x900) -> canvas pixels. */
export const V = { s: 1, ox: 0, oy: 0, w: 0, h: 0, dpr: 1 };

/** Drag-select state (world coordinates). */
export const drag = { active: false, moved: false, sx: 0, sy: 0, cx: 0, cy: 0, id: null };
