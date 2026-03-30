/**
 * Tests for modules/ai-panel-bg.js — procedural SVG background generator.
 * Run: node tests/ai-panel-bg.test.js
 */

import {
  buildSpinePoints,
  smoothPath,
  buildBranch,
  buildTendril,
  buildSubBranch,
  microRing,
  dotCluster,
  dashMarks,
  branchOpacity,
  branchWidth,
  nodeRadius,
  nodeOpacity,
  generatePanelBackground,
} from '../modules/ai-panel-bg.js';

import assert from 'node:assert/strict';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

console.log('\nbuildSpinePoints');

test('returns default 7 points', () => {
  const pts = buildSpinePoints();
  assert.equal(pts.length, 7);
});

test('first point is near bottom', () => {
  const pts = buildSpinePoints(7, 375, 48);
  assert.equal(pts[0].y, 375);
});

test('points ascend vertically', () => {
  const pts = buildSpinePoints();
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].y < pts[i - 1].y, `point ${i} should be above point ${i - 1}`);
  }
});

test('spacing controls vertical gap', () => {
  const pts = buildSpinePoints(3, 400, 50);
  assert.equal(pts[0].y - pts[1].y, 50);
  assert.equal(pts[1].y - pts[2].y, 50);
});

test('points cluster near horizontal center', () => {
  const pts = buildSpinePoints();
  for (const pt of pts) {
    assert.ok(Math.abs(pt.x - 170) < 10, `x=${pt.x} should be near center 170`);
  }
});

console.log('\nsmoothPath');

test('returns empty string for < 2 points', () => {
  assert.equal(smoothPath([]), '');
  assert.equal(smoothPath([{ x: 0, y: 0 }]), '');
});

test('starts with M command', () => {
  const d = smoothPath([{ x: 10, y: 20 }, { x: 30, y: 40 }]);
  assert.ok(d.startsWith('M10,20'));
});

test('contains Q commands for each subsequent point', () => {
  const pts = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 20 }];
  const d = smoothPath(pts);
  assert.equal((d.match(/Q/g) || []).length, 2);
});

console.log('\nbuildBranch');

test('starts at the origin point', () => {
  const origin = { x: 170, y: 300 };
  const pts = buildBranch(origin, 1, 0, 6);
  assert.equal(pts[0].x, origin.x);
  assert.equal(pts[0].y, origin.y);
});

test('extends right for dir=+1', () => {
  const pts = buildBranch({ x: 170, y: 300 }, 1, 0, 6);
  const tip = pts[pts.length - 1];
  assert.ok(tip.x > 170, `tip.x=${tip.x} should be > 170`);
});

test('extends left for dir=-1', () => {
  const pts = buildBranch({ x: 170, y: 300 }, -1, 0, 6);
  const tip = pts[pts.length - 1];
  assert.ok(tip.x < 170, `tip.x=${tip.x} should be < 170`);
});

test('deeper branches are shorter', () => {
  const shallow = buildBranch({ x: 170, y: 300 }, 1, 0, 6);
  const deep = buildBranch({ x: 170, y: 300 }, 1, 5, 6);
  const shallowReach = Math.abs(shallow[shallow.length - 1].x - 170);
  const deepReach = Math.abs(deep[deep.length - 1].x - 170);
  assert.ok(shallowReach > deepReach, `shallow reach ${shallowReach} > deep reach ${deepReach}`);
});

console.log('\nbuildTendril');

test('returns 3 points starting from tip', () => {
  const tip = { x: 50, y: 300 };
  const tendril = buildTendril(tip, -1);
  assert.equal(tendril.length, 3);
  assert.equal(tendril[0], tip);
});

console.log('\nopacity/width/radius helpers');

test('branchOpacity decreases with depth', () => {
  assert.ok(branchOpacity(0, 6) > branchOpacity(5, 6));
});

test('branchWidth decreases with depth', () => {
  assert.ok(branchWidth(0, 6) > branchWidth(5, 6));
});

test('nodeRadius decreases with depth', () => {
  assert.ok(nodeRadius(0, 6) > nodeRadius(5, 6));
});

test('nodeOpacity decreases with depth', () => {
  assert.ok(nodeOpacity(0, 6) > nodeOpacity(5, 6));
});

console.log('\ngeneratePanelBackground');

test('returns valid SVG string', () => {
  const svg = generatePanelBackground();
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.endsWith('</svg>'));
});

test('contains xmlns attribute', () => {
  const svg = generatePanelBackground();
  assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
});

test('contains defs with gradients and filters', () => {
  const svg = generatePanelBackground();
  assert.ok(svg.includes('<defs>'));
  assert.ok(svg.includes('radialGradient'));
  assert.ok(svg.includes('linearGradient'));
  assert.ok(svg.includes('feGaussianBlur'));
  assert.ok(svg.includes('</defs>'));
});

test('contains spine path', () => {
  const svg = generatePanelBackground();
  assert.ok(svg.includes('<path'));
  assert.ok(svg.includes('stroke="#50c8ff"'));
});

test('contains amber traces', () => {
  const svg = generatePanelBackground();
  assert.ok(svg.includes('stroke="#c8a03c"'));
});

test('contains junction nodes', () => {
  const svg = generatePanelBackground();
  assert.ok(svg.includes('<circle'));
  assert.ok(svg.includes('fill="#50c8ff"'));
});

test('contains core element with glow filter', () => {
  const svg = generatePanelBackground();
  assert.ok(svg.includes('filter="url(#pb-glow)"'));
});

test('mask wraps content', () => {
  const svg = generatePanelBackground();
  assert.ok(svg.includes('mask="url(#pb-vm)"'));
});

test('respects groupOpacity option', () => {
  const svg = generatePanelBackground({ groupOpacity: 0.3 });
  assert.ok(svg.includes('opacity="0.3"'));
});

test('respects branchLevels option', () => {
  const small = generatePanelBackground({ branchLevels: 3 });
  const large = generatePanelBackground({ branchLevels: 8 });
  // More branches = more SVG content
  assert.ok(large.length > small.length, 'more branch levels should produce more SVG');
});

test('contains micro ring artifacts', () => {
  const svg = generatePanelBackground();
  // micro rings have stroke but no fill
  assert.ok(svg.includes('fill="none" stroke="#50c8ff" stroke-width="0.3"'));
});

test('contains dash marks', () => {
  const svg = generatePanelBackground();
  assert.ok(svg.includes('<line'));
});

test('contains sub-branch paths', () => {
  const svg = generatePanelBackground();
  // sub-branches produce more path elements than basic branches alone
  const pathCount = (svg.match(/<path /g) || []).length;
  assert.ok(pathCount > 20, `expected many paths from sub-branches, got ${pathCount}`);
});

test('contains spine-adjacent spore dots', () => {
  const svg = generatePanelBackground();
  // more spore circles than before
  const circleCount = (svg.match(/<circle /g) || []).length;
  assert.ok(circleCount > 40, `expected many circles, got ${circleCount}`);
});

console.log('\nbuildSubBranch');

test('returns 3 points starting from origin', () => {
  const origin = { x: 100, y: 250 };
  const pts = buildSubBranch(origin, 1, 0, 6);
  assert.equal(pts.length, 3);
  assert.equal(pts[0].x, origin.x);
  assert.equal(pts[0].y, origin.y);
});

test('sub-branch is shorter than primary branch', () => {
  const origin = { x: 170, y: 300 };
  const primary = buildBranch(origin, 1, 0, 6);
  const sub = buildSubBranch(origin, 1, 0, 6);
  const primaryReach = Math.abs(primary[primary.length - 1].x - 170);
  const subReach = Math.abs(sub[sub.length - 1].x - 170);
  assert.ok(subReach < primaryReach, `sub reach ${subReach} < primary ${primaryReach}`);
});

console.log('\nmicroRing');

test('returns an SVG circle element with stroke', () => {
  const el = microRing(100, 200, 5, 0.1);
  assert.ok(el.includes('<circle'));
  assert.ok(el.includes('fill="none"'));
  assert.ok(el.includes('stroke="#50c8ff"'));
  assert.ok(el.includes('cx="100"'));
});

console.log('\ndotCluster');

test('returns correct number of dots', () => {
  const result = dotCluster(100, 200, 5, 10, 0.5, 0.1);
  const count = (result.match(/<circle /g) || []).length;
  assert.equal(count, 5);
});

console.log('\ndashMarks');

test('returns correct number of lines', () => {
  const result = dashMarks(100, 200, 8, 5, 0.1);
  const count = (result.match(/<line /g) || []).length;
  assert.equal(count, 8);
});

// Summary
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
