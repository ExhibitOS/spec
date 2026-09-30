// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ExhibitOS contributors
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import validator from 'gltf-validator';
import { generated } from './generate-fixtures.mjs';

export function checkIntegrity(asset, bytes) {
  assert.equal(bytes.length,asset.bytes,`SIZE_MISMATCH: ${asset.path}`);
  assert.match(asset.sha256,/^[0-9a-f]{64}$/);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,`HASH_MISMATCH: ${asset.path}`);
}
export function checkScene(scene,manifest) {
  assert.equal(scene.status,'synthetic-baseline-not-oes');
  assert.equal(scene.units,manifest.units); assert.equal(scene.coordinates,manifest.coordinates);
  assert.equal(scene.rightsReference,'manifest.json#/rights');
  assert.deepEqual(scene.room.dimensions,{width:12,depth:8,height:4});
  assert.equal(scene.placements.length,2); assert.equal(scene.lightCandidates.length,4);
  assert.equal(new Set(scene.assets.map(asset=>asset.id)).size,scene.assets.length);
  for(const asset of scene.assets) {
    const source=manifest.assets.find(entry=>entry.path===asset.path);
    assert.ok(source,'MISSING_SCENE_ASSET'); assert.equal(asset.sha256,source.sha256,'SCENE_HASH_MISMATCH');
  }
  for(const placement of scene.placements) {
    assert.equal(placement.roomId,scene.room.id,'MISSING_SCENE_ROOM');
    assert.ok(scene.assets.some(asset=>asset.id===placement.assetId),'MISSING_PLACEMENT_ASSET');
    assert.deepEqual(placement.rotation,[0,0,0,1]); assert.deepEqual(placement.scale,[1,1,1]);
    placement.position.forEach((n,axis)=>assert.ok(n>=scene.room.bounds.min[axis]&&n<=scene.room.bounds.max[axis]));
  }
}
export async function checkFixtures(directory) {
  const manifest = JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'));
  assert.equal(manifest.fixtureVersion,'1.0.0');
  assert.equal(manifest.units,'meter'); assert.equal(manifest.coordinates,'right-handed-y-up');
  assert.equal(manifest.rights.license,'CC0-1.0');
  for (const permission of ['display','download','export','commercial']) assert.equal(manifest.rights[permission],true);
  assert.deepEqual(manifest.rights.scope,['sculpture.glb','painting.png','manifest.json','reference-scene.json']);
  assert.equal(manifest.rights.expiresAt,null); assert.deepEqual(manifest.provenance.thirdPartyInputs,[]);
  assert.equal(manifest.provenance.realArtwork,false); assert.equal(manifest.provenance.rawCapture,false);
  assert.equal(manifest.provenance.scaleConversionApplied,false);
  const expected = generated();
  assert.deepEqual([...manifest.assets,manifest.scene].map(asset => asset.path),Object.keys(expected));
  for (const asset of [...manifest.assets,manifest.scene]) {
    const bytes = await readFile(resolve(directory,asset.path)); checkIntegrity(asset,bytes);
    assert.deepEqual(bytes,expected[asset.path],`REPRODUCIBILITY_MISMATCH: ${asset.path}`);
    if (asset.path.endsWith('.glb')) {
      const report = await validator.validateBytes(new Uint8Array(bytes),{uri:asset.path,maxIssues:100});
      assert.equal(report.issues.numErrors,0,JSON.stringify(report.issues));
      assert.equal(report.issues.numWarnings,0,JSON.stringify(report.issues));
      console.log(`Khronos ${report.validatorVersion}: ${asset.path}: 0 errors, 0 warnings`);
    }
  }
  const scene = JSON.parse(await readFile(resolve(directory,manifest.scene.path),'utf8'));
  checkScene(scene,manifest);
  console.log('Exact hash, size, rights and deterministic generation checks passed.');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkFixtures(resolve(process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)),'../fixtures/synthetic')));
}
