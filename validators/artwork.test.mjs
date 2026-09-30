// SPDX-License-Identifier: Apache-2.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,mkdtemp,writeFile,symlink,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { validateArtwork,validateArtworkFiles } from './artwork.mjs';
const sculpture=JSON.parse(await readFile(new URL('../oes/v1/examples/sculpture.json',import.meta.url),'utf8'));
const painting=JSON.parse(await readFile(new URL('../oes/v1/examples/painting.json',import.meta.url),'utf8'));
const root=new URL('../fixtures/synthetic/',import.meta.url).pathname;
const mutation=(change)=>{const document=structuredClone(sculpture);change(document);return document;};
const negatives=[
  ['unknown version',d=>{d.schemaVersion='2.0.0';},'UNSUPPORTED_VERSION'],
  ['zero scale',d=>{d.transform.scale[0]=0;},'SCHEMA_INVALID'],
  ['negative scale',d=>{d.transform.scale[0]=-1;},'SCHEMA_INVALID'],
  ['missing rights',d=>{delete d.rights;},'SCHEMA_INVALID'],
  ['bad hash',d=>{d.assets[0].sha256='a'.repeat(63);},'SCHEMA_INVALID'],
  ['zero dimension',d=>{d.dimensions.width=0;},'SCHEMA_INVALID'],
  ['missing sculpture depth',d=>{delete d.dimensions.depth;},'MISSING_DEPTH'],
  ['wrong coordinate units',d=>{d.units='centimeter';},'SCHEMA_INVALID'],
  ['bad UUID',d=>{d.id='artwork-one';},'SCHEMA_INVALID'],
  ['invalid UTC calendar',d=>{d.createdAt='2026-02-30T00:00:00Z';},'SCHEMA_INVALID'],
  ['timezone timestamp',d=>{d.createdAt='2026-10-01T02:00:00+02:00';},'SCHEMA_INVALID'],
  ['unknown core property',d=>{d.capturePrivateInfo={};},'SCHEMA_INVALID'],
  ['not unit quaternion',d=>{d.transform.rotation=[0,0,0,.5];},'QUATERNION_NOT_NORMALIZED'],
  ['missing primary reference',d=>{d.primaryAssetId='99999999-0000-4000-8000-000000000001';},'MISSING_PRIMARY_ASSET'],
  ['duplicate asset',d=>{d.assets.push(structuredClone(d.assets[0]));},'DUPLICATE_ASSET_ID'],
  ['path traversal',d=>{d.assets[0].path='../sculpture.glb';},'SCHEMA_INVALID'],
  ['absolute path',d=>{d.assets[0].path='/sculpture.glb';},'SCHEMA_INVALID'],
  ['encoded traversal',d=>{d.assets[0].path='%2e%2e/sculpture.glb';},'SCHEMA_INVALID'],
  ['missing license',d=>{delete d.rights.licenseId;},'SCHEMA_INVALID'],
  ['wrong role MIME',d=>{d.assets[0].role='image';},'ASSET_ROLE_MIME_MISMATCH'],
  ['wrong suffix',d=>{d.assets[0].path='sculpture.png';},'ASSET_EXTENSION_MISMATCH'],
  ['bad source conversion',d=>{d.provenance.scaleConversion={sourceUnit:'millimeter',multiplierToMeters:1,appliedToAssetIds:[d.primaryAssetId],bakedIntoGeometry:true};},'UNIT_CONVERSION_MISMATCH'],
  ['dangling provenance',d=>{d.provenance.events[0].sourceAssetIds=['99999999-0000-4000-8000-000000000001'];},'MISSING_PROVENANCE_ASSET'],
];
test('synthetic model and planar artwork validate with exact local binaries and publication rights',async()=>{
  for(const example of [sculpture,painting]) {
    const original=structuredClone(example);
    assert.deepEqual(validateArtwork(example),{valid:true,errors:[]});
    assert.deepEqual(await validateArtworkFiles(example,root,{publicationTime:'2026-10-01T00:00:00Z'}),{valid:true,errors:[]});
    assert.deepEqual(example,original,'validator must not mutate data');
  }
});
for(const [name,change,code] of negatives) test(`reject ${name}`,()=>{
  const result=validateArtwork(mutation(change)); assert.equal(result.valid,false);assert.ok(result.errors.some(error=>error.code===code));
});
test('namespaced optional extensions and recorded baked unit conversion are accepted',()=>{
  const document=mutation(d=>{d.extensions={'org.example/label':{custom:true}};d.provenance.scaleConversion={sourceUnit:'centimeter',multiplierToMeters:.01,appliedToAssetIds:[d.primaryAssetId],bakedIntoGeometry:true};});
  assert.equal(validateArtwork(document).valid,true);
});
test('private import can retain unavailable rights but publication requires a currently valid display grant',()=>{
  const document=mutation(d=>{d.rights.permissions.display=false;});
  assert.equal(validateArtwork(document).valid,true);
  assert.equal(validateArtwork(document,{publicationTime:'2026-10-01T00:00:00Z'}).errors[0].code,'DISPLAY_PERMISSION_REQUIRED');
  assert.equal(validateArtwork(document,{publicationTime:'2026-02-30T00:00:00Z'}).errors[0].code,'INVALID_PUBLICATION_TIME');
  document.rights.permissions.display=true;document.rights.validFrom='2026-10-02T00:00:00Z';
  assert.equal(validateArtwork(document,{publicationTime:'2026-10-01T00:00:00Z'}).errors[0].code,'RIGHTS_NOT_YET_VALID');
  delete document.rights.validFrom;document.rights.expiresAt='2026-10-01T00:00:00Z';
  assert.equal(validateArtwork(document,{publicationTime:'2026-10-01T00:00:00Z'}).errors[0].code,'RIGHTS_EXPIRED');
});
test('bounded asset checker rejects changed hash, missing file, symlink and forged PNG signature',async()=>{
  assert.equal((await validateArtworkFiles(mutation(d=>{d.assets[0].sha256='0'.repeat(64);}),root)).errors[0].code,'HASH_MISMATCH');
  assert.equal((await validateArtworkFiles(mutation(d=>{d.assets[0].path='missing.glb';}),root)).valid,false);
  const directory=await mkdtemp(join(tmpdir(),'oes-artwork-test-'));
  try {
    await symlink(join(root,'sculpture.glb'),join(directory,'sculpture.glb'));
    assert.equal((await validateArtworkFiles(sculpture,directory)).errors[0].code,'SYMLINK_REJECTED');
    const forged=Buffer.alloc(32),document=structuredClone(painting);
    document.assets[0].bytes=forged.length;document.assets[0].sha256=createHash('sha256').update(forged).digest('hex');
    await writeFile(join(directory,'painting.png'),forged);
    assert.equal((await validateArtworkFiles(document,directory)).errors[0].code,'MIME_SIGNATURE_MISMATCH');
  } finally {await rm(directory,{recursive:true,force:true});}
});
test('CLI rejects unsupported version with JSON error and nonzero status',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'oes-artwork-cli-'));
  try {
    const filename=join(directory,'unsupported.json');await writeFile(filename,JSON.stringify(mutation(d=>{d.schemaVersion='99.0.0';})));
    const result=spawnSync(process.execPath,[new URL('./artwork-cli.mjs',import.meta.url).pathname,filename],{encoding:'utf8'});
    assert.equal(result.status,1);assert.equal(JSON.parse(result.stdout).errors[0].code,'UNSUPPORTED_VERSION');
  } finally {await rm(directory,{recursive:true,force:true});}
});
