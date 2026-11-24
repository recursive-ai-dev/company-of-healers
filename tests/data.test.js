import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLES, DIFFS, WAVES, BOONS, ENEMY_DEF, ENEMY_LABELS,
  CAMPAIGN_WAVES, waveFor, endlessWave, waveScale, waveCompText,
  computeScore, rankFor,
} from '../js/data.js';

test('campaign has five authored waves ending with the boss', () => {
  assert.equal(WAVES.length, 5);
  assert.equal(CAMPAIGN_WAVES, 5);
  assert.ok(WAVES[4].spawns.some(s => s.type === 'boss'));
});

test('every spawn type has a definition and label', () => {
  for (const w of WAVES) {
    for (const s of w.spawns) {
      assert.ok(ENEMY_DEF[s.type], `missing ENEMY_DEF for ${s.type}`);
      assert.ok(ENEMY_LABELS[s.type], `missing label for ${s.type}`);
      assert.ok(s.n >= 1 && s.at >= 0, 'spawn counts/times must be positive');
    }
  }
});

test('roles are four distinct healers with unique keys', () => {
  assert.equal(ROLES.length, 4);
  assert.equal(new Set(ROLES.map(r => r.key)).size, 4);
  assert.equal(new Set(ROLES.map(r => r.id)).size, 4);
  for (const r of ROLES) {
    assert.ok(r.cost > 0 && r.cd > 0 && r.range > 0, `${r.id} needs cost/cd/range`);
  }
});

test('boons have unique ids and text', () => {
  assert.equal(new Set(BOONS.map(b => b.id)).size, BOONS.length);
  for (const b of BOONS) assert.ok(b.n && b.d && b.icon, `boon ${b.id} incomplete`);
});

test('waveFor returns authored waves then endless waves', () => {
  assert.equal(waveFor(0), WAVES[0]);
  assert.equal(waveFor(4), WAVES[4]);
  const e1 = waveFor(5);
  assert.ok(e1.name && e1.spawns.length > 0);
  assert.ok(!e1.spawns.some(s => s.type === 'boss'), 'first endless wave is not a boss wave');
});

test('every third endless wave is a boss wave', () => {
  // waveFor(7) is endless e=3, waveFor(10) is e=6.
  assert.ok(waveFor(7).spawns.some(s => s.type === 'boss'));
  assert.ok(waveFor(10).spawns.some(s => s.type === 'boss'));
  assert.ok(!waveFor(8).spawns.some(s => s.type === 'boss'));
});

test('endless waves scale in size and difficulty', () => {
  const husks = w => w.spawns.filter(s => s.type === 'husk').reduce((a, s) => a + s.n, 0);
  assert.ok(husks(endlessWave(4)) > husks(endlessWave(1)), 'later endless waves must be bigger');
  assert.equal(waveScale(0), 1);
  assert.equal(waveScale(4), 1);
  assert.ok(waveScale(5) > 1 && waveScale(9) > waveScale(5), 'scale must grow in endless');
});

test('waveCompText summarises composition', () => {
  const text = waveCompText(WAVES[0]);
  assert.match(text, /Husks/);
  assert.equal(waveCompText({ spawns: [{ type: 'boss', n: 1 }, { type: 'acolyte', n: 1 }] }), '1 Blightfather · 1 Hex Acolyte');
  assert.equal(waveCompText({ spawns: [] }), '');
});

test('computeScore rewards mercy, kills, and endless depth', () => {
  const base = { healed: 1000, kills: 50, soldiersLost: 0, riftsSealed: 3 };
  const campaign = computeScore(base, 5, 0.8, 4);
  const endless = computeScore(base, 5, 0.8, 7);
  assert.ok(endless > campaign, 'endless waves must add score');
  const lossy = computeScore({ ...base, soldiersLost: 5 }, 0, 0.1, 4);
  assert.ok(lossy < campaign, 'losing soldiers must cost score');
  assert.ok(computeScore(base, 5, 0.8, 4) >= 0, 'score never negative');
});

test('rankFor thresholds', () => {
  assert.equal(rankFor(0, false), 'The Vale Remembers');
  assert.equal(rankFor(9999, false), 'The Vale Remembers');
  assert.equal(rankFor(1500, true), 'Saint of the Vale');
  assert.equal(rankFor(1000, true), 'Lantern of Mercy');
  assert.equal(rankFor(650, true), 'Steadfast Mender');
  assert.equal(rankFor(100, true), 'Weary Pilgrim');
});

test('difficulties are ordered by threat', () => {
  assert.ok(DIFFS.pilgrim.hp < DIFFS.penitent.hp && DIFFS.penitent.hp < DIFFS.martyr.hp);
  assert.ok(DIFFS.pilgrim.faith > DIFFS.martyr.faith);
});
