// Run: npm run test:yacht
import assert from "node:assert/strict";
import { buildYacht } from "./geometry.ts";

const cloud = buildYacht();
assert.ok(cloud.count > 40000, `expected a dense cloud, got ${cloud.count}`);
for (const arr of [cloud.colors, cloud.sizes, cloud.seeds, cloud.kinds]) {
  assert.equal(arr.length % cloud.count, 0, "attribute arrays must match the point count");
}
assert.ok(cloud.positions.every(Number.isFinite), "no NaN/Infinity positions");

// The boat itself (kind 0) must stay inside its hull envelope.
for (let i = 0; i < cloud.count; i++) {
  if (cloud.kinds[i] !== 0) continue;
  const [x, y, z] = cloud.positions.subarray(i * 3, i * 3 + 3);
  assert.ok(x > -3.5 && x < 3.3 && y > -0.5 && y < 2.8 && Math.abs(z) < 1.2, `boat point ${i} out of bounds: ${x},${y},${z}`);
}

// Seeded: the same yacht on every load.
assert.deepEqual(buildYacht().positions.slice(0, 300), cloud.positions.slice(0, 300));

console.log(`✓ yacht cloud: ${cloud.count} points, bounded and deterministic`);
