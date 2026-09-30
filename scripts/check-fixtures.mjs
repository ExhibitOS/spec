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
export async function checkFixtures(directory) {
  const manifest = JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'));
  assert.equal(manifest.fixtureVersion,'1.0.0');
  assert.equal(manifest.units,'meter'); assert.equal(manifest.coordinates,'right-handed-y-up');
  assert.equal(manifest.rights.license,'CC0-1.0');
  for (const permission of ['display','download','export','commercial']) assert.equal(manifest.rights[permission],true);
  assert.deepEqual(manifest.rights.scope,['sculpture.glb','painting.png','manifest.json']);
  assert.equal(manifest.rights.expiresAt,null); assert.deepEqual(manifest.provenance.thirdPartyInputs,[]);
  assert.equal(manifest.provenance.realArtwork,false); assert.equal(manifest.provenance.rawCapture,false);
  assert.equal(manifest.provenance.scaleConversionApplied,false);
  const expected = generated();
  assert.deepEqual(manifest.assets.map(asset => asset.path),Object.keys(expected));
  for (const asset of manifest.assets) {
    const bytes = await readFile(resolve(directory,asset.path)); checkIntegrity(asset,bytes);
    assert.deepEqual(bytes,expected[asset.path],`REPRODUCIBILITY_MISMATCH: ${asset.path}`);
    if (asset.path.endsWith('.glb')) {
      const report = await validator.validateBytes(new Uint8Array(bytes),{uri:asset.path,maxIssues:100});
      assert.equal(report.issues.numErrors,0,JSON.stringify(report.issues));
      assert.equal(report.issues.numWarnings,0,JSON.stringify(report.issues));
      console.log(`Khronos ${report.validatorVersion}: ${asset.path}: 0 errors, 0 warnings`);
    }
  }
  console.log('Exact hash, size, rights and deterministic generation checks passed.');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkFixtures(resolve(process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)),'../fixtures/synthetic')));
}
