import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, rand, randi, choice, dist, angLerp, hexA, roman, TAU } from '../js/util.js';

test('clamp bounds values', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(99, 0, 10), 10);
});

test('lerp interpolates', () => {
  assert.equal(lerp(0, 10, 0.5), 5);
  assert.equal(lerp(10, 20, 0), 10);
  assert.equal(lerp(10, 20, 1), 20);
});

test('rand/randi stay in range', () => {
  for (let i = 0; i < 200; i++) {
    const v = rand(2, 5);
    assert.ok(v >= 2 && v <= 5, `rand out of range: ${v}`);
    const w = rand();
    assert.ok(w >= 0 && w < 1, `rand() out of range: ${w}`);
    const k = randi(1, 6);
    assert.ok(Number.isInteger(k) && k >= 1 && k <= 6, `randi out of range: ${k}`);
  }
});

test('choice picks a member', () => {
  const arr = ['a', 'b', 'c'];
  for (let i = 0; i < 50; i++) assert.ok(arr.includes(choice(arr)));
});

test('dist is euclidean', () => {
  assert.equal(dist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(dist({ x: 1, y: 1 }, { x: 1, y: 1 }), 0);
});

test('angLerp takes the short way around', () => {
  const a = angLerp(0, Math.PI, 0.5);
  assert.ok(Math.abs(a - Math.PI / 2) < 1e-9);
  // Wrapping across -PI/PI boundary should not swing the long way.
  const b = angLerp(TAU - 0.1, 0.1, 0.5);
  assert.ok(Math.abs(b - TAU) < 0.2 || Math.abs(b) < 0.2, `unexpected angle ${b}`);
});

test('hexA builds rgba strings', () => {
  assert.equal(hexA('#ff0000', 0.5), 'rgba(255,0,0,0.5)');
  assert.equal(hexA('#000000', 1), 'rgba(0,0,0,1)');
});

test('roman numerals cover campaign and endless waves', () => {
  assert.equal(roman(1), 'I');
  assert.equal(roman(4), 'IV');
  assert.equal(roman(5), 'V');
  assert.equal(roman(6), 'VI');
  assert.equal(roman(9), 'IX');
  assert.equal(roman(14), 'XIV');
  assert.equal(roman(40), 'XL');
  assert.equal(roman(0), 'I'); // clamped to >= 1
});
