// Pure game data + pure rules. No DOM access — safe to import in Node tests.
export const PAL={heal:'#5fe3a1',gold:'#ffc857',cyan:'#5fd6ff',violet:'#b48cff',blight:'#c44dff',acid:'#a8f04d',
  danger:'#ff5f5f',bone:'#e9dfc6',dim:'#9db09b',steel:'#9aa6b2',blightDark:'#4a2a5e'};

export const ROLES=[
 {id:'mender', name:'Sister Marra', role:'Mender', pron:'She', color:PAL.heal, dark:'#1d4a34', key:'Q',
  ability:'Mend Soul', cost:18, cd:5, range:185, x:405,y:385,
  icon:'<path d="M12 3v18M12 3l4 3M12 3L8 6"/><circle cx="12" cy="14" r="3.4"/><path d="M10.4 14h3.2M12 12.4v3.2"/>'},
 {id:'chanter', name:'Brother Ilex', role:'Chanter', pron:'He', color:PAL.gold, dark:'#4a3a14', key:'W',
  ability:'Hymn of Dawn', cost:30, cd:11, range:135, x:365,y:450,
  icon:'<path d="M12 3a6 6 0 0 1 6 6v4l2 3H4l2-3V9a6 6 0 0 1 6-6z"/><path d="M10 19a2 2 0 0 0 4 0"/>'},
 {id:'purifier', name:'Father Cindre', role:'Purifier', pron:'He', color:PAL.cyan, dark:'#173a4a', key:'E',
  ability:'Consecrate', cost:34, cd:13, range:175, x:405,y:515,
  icon:'<path d="M12 3c2 3.5 5 5.5 5 9a5 5 0 0 1-10 0c0-2 1-3.6 2-5 .4 1.2 1 2 2 2.6C10.6 7.6 11 5.4 12 3z"/><path d="M12 21v-3"/>'},
 {id:'warden', name:'Dame Vessa', role:'Warden', pron:'She', color:PAL.violet, dark:'#33254d', key:'R',
  ability:'Aegis of Mercy', cost:28, cd:14, range:160, x:330,y:450,
  icon:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M12 7.5v7M9.2 11h5.6"/>'}
];

export const DIFFS={
 pilgrim:{label:'Pilgrim', hp:.8, dmg:.8, count:.8, faith:1.15},
 penitent:{label:'Penitent', hp:1, dmg:1, count:1, faith:1},
 martyr:{label:'Martyr', hp:1.3, dmg:1.25, count:1.25, faith:.9}
};

export const WAVES=[
 {name:'First Whispers', sub:'Husks shamble from the eastern rift',
  spawns:[{at:2,type:'husk',n:7,rift:0,spread:22}]},
 {name:'The Hungry Dark', sub:'Stalkers hunt your healers — keep them moving',
  spawns:[{at:2,type:'husk',n:8,rift:0,spread:26},{at:8,type:'stalker',n:4,rift:1,spread:20}]},
 {name:'Rotting Tide', sub:'Spitters siege from afar · the bloated burst into rot',
  spawns:[{at:2,type:'husk',n:8,rift:2,spread:30},{at:6,type:'spitter',n:3,rift:0,spread:18},
          {at:14,type:'bloated',n:2,rift:1,spread:16},{at:20,type:'acolyte',n:2,rift:0,spread:14},{at:24,type:'stalker',n:3,rift:2,spread:14}]},
 {name:'The Gloaming', sub:'Every rift screams at once — hold the line',
  spawns:[{at:2,type:'husk',n:12,rift:0,spread:34},{at:6,type:'stalker',n:5,rift:1,spread:22},
          {at:12,type:'spitter',n:4,rift:2,spread:20},{at:20,type:'acolyte',n:2,rift:1,spread:16},{at:26,type:'bloated',n:3,rift:0,spread:18}]},
 {name:'The Blightfather', sub:'The father of rot comes to claim the chapel',
  spawns:[{at:3,type:'boss',n:1,rift:0,spread:0},{at:6,type:'husk',n:6,rift:1,spread:30},
          {at:14,type:'stalker',n:4,rift:2,spread:24},{at:30,type:'spitter',n:2,rift:0,spread:16},{at:34,type:'acolyte',n:2,rift:1,spread:14},
          {at:40,type:'husk',n:4,rift:2,spread:20}]}
];

export const BOONS=[
 {id:'bread', n:"Pilgrim's Bread", d:'+2 guardsmen join the defensive line.',
  icon:'<path d="M4 13c0-4 3.5-7 8-7s8 3 8 7c0 2-1.5 3-3 3H7c-1.5 0-3-1-3-3z"/><path d="M9 10v3M12 9.5v3.5M15 10v3"/>'},
 {id:'vigor', n:'Litany of Vigor', d:'All healing rites are 25% stronger.',
  icon:'<path d="M12 3c2 3.5 5 5.5 5 9a5 5 0 0 1-10 0c0-2 1-3.6 2-5 .4 1.2 1 2 2 2.6C10.6 7.6 11 5.4 12 3z"/>'},
 {id:'alms', n:'Alms of the Faithful', d:'Faith flows +1.2 per second.',
  icon:'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5h5"/>'},
 {id:'swift', n:'Swift Sandals', d:'Your healers move 20% faster.',
  icon:'<path d="M7 4v8l-3 4v3h13v-3l-6-4V4"/><path d="M7 8h4"/>'},
 {id:'rites', n:'Shortened Rites', d:'Rite cooldowns are 20% shorter.',
  icon:'<path d="M7 3h10M7 21h10M8 3c0 5 3 6 4 7 1-1 4-2 4-7M8 21c0-5 3-6 4-7 1 1 4 2 4 7"/>'},
 {id:'corner', n:'Cornerstone', d:'The chapel gains +120 max strength and is fully restored.',
  icon:'<path d="M4 20h16M6 20v-9l6-5 6 5v9"/><path d="M10 20v-4h4v4"/>'},
 {id:'candle', n:'Vigil Candle', d:'Revive a fallen healer. If none have fallen, fully mend the company and grant +30 vigor.',
  icon:'<path d="M10 10h4v10h-4z"/><path d="M12 3c1 1.6 2 2.4 2 3.6a2 2 0 0 1-4 0C10 5.4 11 4.6 12 3z"/><path d="M8 20h8"/>'},
 {id:'tithe', n:"Widow's Tithe", d:'+40 Faith now, and +25 maximum Faith.',
  icon:'<path d="M4 10h16v9H4z"/><path d="M4 10l2-4h12l2 4M12 10v9M8 13.5h8"/>'},
 {id:'nova', n:'Dawn Nova', d:'At the next assault, each foe is struck by 60 dawnfire as it emerges.',
  icon:'<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.5 4.5l3 3M16.5 16.5l3 3M19.5 4.5l-3 3M7.5 16.5l-3 3"/>'},
 {id:'secondwind', n:'Second Wind', d:'The company endures — healers gain +25 max health and are fully mended.',
  icon:'<path d="M12 3v18M12 3l4 3M12 3L8 6"/><circle cx="12" cy="14" r="3.4"/><path d="M10.4 14h3.2M12 12.4v3.2"/>'},
 {id:'aegis', n:'Chapel Aegis', d:'A shield of dawn settles over the chapel — 150 strength for 25 seconds.',
  icon:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><circle cx="12" cy="11" r="2.5"/>'}
];

export const ENEMY_DEF={
 husk:{hp:55,spd:42,dmg:9,cd:1.1,r:14},
 stalker:{hp:30,spd:95,dmg:7,cd:.8,r:11},
 spitter:{hp:40,spd:36,dmg:10,cd:2.3,r:13,range:235},
 bloated:{hp:130,spd:26,dmg:14,cd:1.4,r:20},
 boss:{hp:1600,spd:18,dmg:30,cd:1.6,r:34},
 acolyte:{hp:45,spd:55,dmg:8,cd:1.6,r:12,range:260}
};

/** Display names for wave-composition previews. */
export const ENEMY_LABELS={husk:'Husks',stalker:'Stalkers',spitter:'Spitters',bloated:'Bloated',boss:'Blightfather',acolyte:'Hex Acolytes'};
const ENEMY_SINGULAR={husk:'Husk',stalker:'Stalker',spitter:'Spitter',bloated:'Bloated',boss:'Blightfather',acolyte:'Hex Acolyte'};

export const SOLDIER_POSTS=[[540,300],[560,450],[540,600],[480,375],[480,525],[600,225],[600,675],[450,450],[625,375],[625,525],[560,150],[560,750]];
export const TORCHES=[[615,255],[615,645]];
/* ================= PURE RULES (unit-tested) ================= */

/** Authored wave count (the canonical campaign). */
export const CAMPAIGN_WAVES = WAVES.length;

const ENDLESS_NAMES = ['The Deepening Dark','Rot Ascendant','The Hollow Choir','The Unending Night','Ashes of the Vale','The Second Gloaming'];

/**
 * Generated endless wave `e` (1-based: e=1 is the first wave after the campaign).
 * Every 3rd endless wave is a boss wave. Counts scale with e.
 */
export function endlessWave(e) {
  const n = Math.max(1, Math.floor(e));
  const name = ENDLESS_NAMES[(n - 1) % ENDLESS_NAMES.length];
  if (n % 3 === 0) {
    return { name: 'The Blightfather Returns', sub: 'A greater rot stirs — endless wave ' + n,
      spawns: [{ at: 3, type: 'boss', n: 1, rift: 0, spread: 0 },
        { at: 6, type: 'husk', n: 6 + n, rift: 1, spread: 30 },
        { at: 16, type: 'stalker', n: 3 + n, rift: 2, spread: 24 },
        { at: 30, type: 'acolyte', n: 2, rift: 0, spread: 16 }] };
  }
  const spawns = [
    { at: 2, type: 'husk', n: 8 + 2 * n, rift: n % 3, spread: 30 },
    { at: 6, type: 'stalker', n: 3 + n, rift: (n + 1) % 3, spread: 22 },
    { at: 12, type: 'spitter', n: 2 + Math.floor(n / 2), rift: (n + 2) % 3, spread: 18 },
    { at: 20, type: 'bloated', n: 1 + Math.floor(n / 2), rift: n % 3, spread: 16 },
  ];
  if (n >= 2) spawns.push({ at: 16, type: 'acolyte', n: 2 + Math.floor(n / 2), rift: (n + 1) % 3, spread: 16 });
  return { name, sub: 'The vigil deepens — endless wave ' + n, spawns };
}

/** Wave definition for 0-based index i (authored, then endless). */
export function waveFor(i) {
  if (i < WAVES.length) return WAVES[i];
  return endlessWave(i - WAVES.length + 1);
}

/** HP/damage scale for wave index i (1 for authored waves, grows in endless). */
export function waveScale(i) {
  if (i < WAVES.length) return 1;
  return 1 + 0.12 * (i - WAVES.length + 1);
}

/** "8 Husks · 4 Stalkers" preview text for a wave definition. */
export function waveCompText(wave) {
  const counts = {};
  for (const s of wave.spawns) counts[s.type] = (counts[s.type] || 0) + s.n;
  return Object.entries(counts)
    .map(([t, n]) => n + ' ' + ((n === 1 ? ENEMY_SINGULAR[t] : ENEMY_LABELS[t]) || t))
    .join(' · ');
}

/** Vigil score. `waveIdx` is the last wave reached (0-based, -1 = none). */
export function computeScore(stats, soldiersAlive, chapelPct, waveIdx) {
  const endlessBonus = Math.max(0, (waveIdx ?? -1) - (CAMPAIGN_WAVES - 1)) * 150;
  return Math.max(0, Math.round(
    stats.healed * .4 + stats.kills * 12 + soldiersAlive * 100 +
    chapelPct * 250 + stats.riftsSealed * 80 - stats.soldiersLost * 30 + endlessBonus));
}

export function rankFor(score, win) {
  if (!win) return 'The Vale Remembers';
  if (score >= 1400) return 'Saint of the Vale';
  if (score >= 1000) return 'Lantern of Mercy';
  if (score >= 650) return 'Steadfast Mender';
  return 'Weary Pilgrim';
}
