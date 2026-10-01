// SPDX-License-Identifier: Apache-2.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,mkdtemp,writeFile,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { buildZip } from '../scripts/zip-fixture-builder.mjs';
import { createOexExample } from '../scripts/generate-oex-example.mjs';
import { readBoundedZip,ZIP_LIMITS } from './zip.mjs';
import { validateOex,validateOexManifest,validateOed,adaptOexManifest,packageAssetManifest,validateExportRights } from './package.mjs';
import { revisionHash } from './exhibition.mjs';
const archive=await readFile(new URL('../oex/v1/examples/synthetic.oex',import.meta.url)),originalFiles=readBoundedZip(archive);
const manifest=JSON.parse(originalFiles.get('manifest.json')),revision=JSON.parse(originalFiles.get('exhibition.json'));
const local=JSON.parse(await readFile(new URL('../oed/v1/examples/local.json',import.meta.url))),ssh=JSON.parse(await readFile(new URL('../oed/v1/examples/ssh.json',import.meta.url)));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const has=(checked,code)=>{assert.equal(checked.valid,false);assert.ok(checked.errors.some(error=>error.code===code),JSON.stringify(checked.errors));};
const entries=()=>[...originalFiles].map(([name,data])=>({name,data}));
const zipFails=(items,code)=>assert.throws(()=>readBoundedZip(buildZip(items)),new RegExp(code));
function repack({changeRevision,changeManifest,changeEntries}={}) {
  const r=structuredClone(revision),m=structuredClone(manifest);changeRevision?.(r);
  const bytes=Buffer.from(JSON.stringify(r,null,2)+'\n');m.exhibition.id=r.id;m.exhibition.revisionId=r.revisionId;m.exhibition.bytes=bytes.length;m.exhibition.sha256=hash(bytes);m.exhibition.revisionSha256=revisionHash(r);m.assets=packageAssetManifest(r);changeManifest?.(m);
  const items=[{name:'manifest.json',data:Buffer.from(JSON.stringify(m,null,2)+'\n')},{name:'exhibition.json',data:bytes},...m.assets.map(asset=>({name:asset.path,data:originalFiles.get(asset.path)}))];changeEntries?.(items);return buildZip(items);
}
test('original OEX fixture is deterministic, hash-pinned and contains exact synthetic bytes and license terms',async()=>{
  assert.equal(hash(archive),'747c11f09ec64a656466bbf14453a304b550afcf4c88daba845d3e1c6b45c72f');
  const generated=await createOexExample();assert.deepEqual(generated.archive,archive);assert.deepEqual(generated.manifestBytes,originalFiles.get('manifest.json'));
  assert.deepEqual(await validateOex(archive),{valid:true,errors:[]});
  for(const asset of manifest.assets)assert.deepEqual(originalFiles.get(asset.path),await readFile(new URL('../fixtures/synthetic/'+asset.artifactPath,import.meta.url)));
  assert.equal(revision.revision,2);assert.notEqual(revision.revisionId,JSON.parse(await readFile(new URL('../oes/v1/examples/exhibition.json',import.meta.url))).revisionId);
  assert.equal(revision.extensions['org.exhibitos/apache-license'].text,await readFile(new URL('../LICENSES/Apache-2.0.txt',import.meta.url),'utf8'));
  assert.equal(revision.extensions['org.exhibitos/cc0-license'].text,await readFile(new URL('../LICENSES/CC0-1.0.txt',import.meta.url),'utf8'));
});
for(const name of ['../escape.glb','/absolute.glb','C:/absolute.glb','assets\\escape.glb','assets/%2e%2e/file.glb','assets/CON.glb','assets/file.'])test('ZIP rejects path '+name,()=>zipFails([{name,data:'x'}],'ZIP_UNSAFE_PATH'));
test('ZIP rejects exact and case-insensitive duplicate paths',()=>{
  zipFails([{name:'a.json',data:'a'},{name:'a.json',data:'b'}],'ZIP_DUPLICATE_PATH');zipFails([{name:'a.json',data:'a'},{name:'A.json',data:'b'}],'ZIP_DUPLICATE_PATH');
});
test('ZIP rejects symlinks, special files and encrypted/data-descriptor flags',()=>{
  zipFails([{name:'a.glb',data:'x',attributes:0xa1ff0000}],'ZIP_SYMLINK');zipFails([{name:'a.glb',data:'x',attributes:0x41ed0010}],'ZIP_SPECIAL_FILE');
  for(const flags of [1,8])zipFails([{name:'a.glb',data:'x',flags}],'ZIP_UNSUPPORTED_FEATURE');
});
test('ZIP compares every local/central name, method, flags, size and CRC field',()=>{
  const baseline=buildZip([{name:'a.json',data:'hello'}]);
  for(const offset of [6,8,14,18,22,30]){
    const changed=Buffer.from(baseline);changed[offset]^=1;assert.throws(()=>readBoundedZip(changed),/ZIP_LOCAL_CENTRAL_MISMATCH/);
  }
});
test('ZIP rejects CRC corruption, local offsets, prefixes and trailing bytes',()=>{
  const baseline=buildZip([{name:'a.json',data:'hello'}]),changed=Buffer.from(baseline);changed[36]^=1;assert.throws(()=>readBoundedZip(changed),/ZIP_CRC_MISMATCH/);
  const central=baseline.readUInt32LE(baseline.length-6),wrongOffset=Buffer.from(baseline);wrongOffset.writeUInt32LE(1,central+42);assert.throws(()=>readBoundedZip(wrongOffset),/ZIP_LOCAL_LAYOUT/);
  assert.throws(()=>readBoundedZip(Buffer.concat([baseline,Buffer.from('tail')])),/ZIP_END_RECORD/);
  assert.throws(()=>readBoundedZip(Buffer.concat([Buffer.from('prefix'),baseline])),/ZIP_CENTRAL_BOUNDS/);
});
test('ZIP store and bounded deflate succeed; ratio bombs and dishonest expanded sizes fail',()=>{
  const data=Buffer.from('a normal compressed entry with enough varied characters 1234567890');
  assert.deepEqual(readBoundedZip(buildZip([{name:'data.json',data,method:8}])).get('data.json'),data);
  zipFails([{name:'bomb.json',data:Buffer.alloc(1048576),method:8}],'ZIP_RATIO_LIMIT');
  const varying=Buffer.from(Array.from({length:1000},(_,i)=>(i*73+i*i)%256));zipFails([{name:'dishonest.json',data:varying,method:8,declaredSize:100}],'ZIP_DEFLATE_LIMIT_OR_INVALID');
});
test('ZIP caps archive bytes, files, per-file size and aggregate expanded declarations before extraction',()=>{
  assert.throws(()=>readBoundedZip(Buffer.alloc(ZIP_LIMITS.archiveBytes+1)),/ZIP_ARCHIVE_LIMIT/);
  zipFails(Array.from({length:257},(_,i)=>({name:`file${i}.json`,data:'x'})),'ZIP_FILE_LIMIT');
  zipFails([{name:'large.json',data:'x',declaredSize:ZIP_LIMITS.fileBytes+1}],'ZIP_SIZE_LIMIT');
  zipFails([0,1,2].map(index=>({name:`large${index}.json`,data:Buffer.alloc(1048576),declaredSize:104857600})),'ZIP_EXPANDED_LIMIT');
});
test('OEX rejects undeclared files, changed bytes/hash, wrong MIME and unsupported package versions',async()=>{
  has(await validateOex(buildZip([...entries(),{name:'capture-info.json',data:'private raw data'}])),'ARCHIVE_LAYOUT_MISMATCH');
  has(await validateOex(repack({changeEntries:items=>{items[2].data=Buffer.from(items[2].data);items[2].data[0]^=1;}})),'ASSET_HASH_MISMATCH');
  has(await validateOex(repack({changeManifest:m=>{m.exhibition.sha256='0'.repeat(64);}})),'EXHIBITION_FILE_MISMATCH');
  has(await validateOex(repack({changeRevision:r=>{r.artworks[0].assets[0].bytes=100;}})),'ASSET_SIZE_MISMATCH');
  const forged=Buffer.from(originalFiles.get('assets/sculpture.glb'));forged[0]^=1;
  has(await validateOex(repack({changeRevision:r=>{r.artworks[0].assets[0].sha256=hash(forged);},changeEntries:items=>{items.find(entry=>entry.name==='assets/sculpture.glb').data=forged;}})),'MIME_SIGNATURE_MISMATCH');
  const invalidGlb=Buffer.from(originalFiles.get('assets/sculpture.glb'));invalidGlb.writeUInt32LE(99,4);
  has(await validateOex(repack({changeRevision:r=>{r.artworks[0].assets[0].sha256=hash(invalidGlb);},changeEntries:items=>{items.find(entry=>entry.name==='assets/sculpture.glb').data=invalidGlb;}})),'GLB_INVALID');
  has(await validateOex(repack({changeManifest:m=>{m.formatVersion='2.0.0';}})),'UNSUPPORTED_VERSION');
  has(await validateOex(repack({changeManifest:m=>{m.oesExhibitionVersion='2.0.0';}})),'SCHEMA_INVALID');
});
test('OEX assets inventory is semantic across object key order and exact across references',async()=>{
  const reversed=repack({changeManifest:m=>{m.assets=m.assets.map(asset=>Object.fromEntries(Object.entries(asset).reverse()));}});
  assert.equal((await validateOex(reversed)).valid,true);
  has(await validateOex(repack({changeManifest:m=>{m.assets[0].rightsReferences=['exhibition.json#/artworks/99/rights'];}})),'ASSET_MANIFEST_MISMATCH');
  has(await validateOex(repack({changeManifest:m=>{m.assets.reverse();}})),'ASSET_MANIFEST_MISMATCH');
});
test('OEX export rights are independent of display and checked at inclusive/exclusive grant boundaries',async()=>{
  assert.equal((await validateOex(repack({changeRevision:r=>{r.artworks.forEach(artwork=>{artwork.rights.permissions.display=false;});}}))).valid,true);
  has(await validateOex(repack({changeRevision:r=>{r.artworks[0].rights.permissions.export=false;}})),'EXPORT_PERMISSION_REQUIRED');
  assert.equal((await validateOex(repack({changeRevision:r=>{r.artworks[0].rights.validFrom=manifest.createdAt;}}))).valid,true);
  has(await validateOex(repack({changeRevision:r=>{r.artworks[0].rights.expiresAt=manifest.createdAt;}})),'RIGHTS_EXPIRED');
  has(validateExportRights(revision.artworks[0].rights,'2016-12-31T23:59:60Z'),'INVALID_EXPORT_TIME');
  has(validateExportRights(revision.artworks[0].rights,'2026-02-30T00:00:00Z'),'INVALID_EXPORT_TIME');
});
test('OED secret-free local/SSH examples validate and never resolve credentials or provision',()=>{
  assert.deepEqual(validateOed(local),{valid:true,errors:[]});assert.deepEqual(validateOed(ssh),{valid:true,errors:[]});
});
const deploymentNegatives=[
  ['raw password',d=>{d.storage.metadata.password='fake-not-real';},'SCHEMA_INVALID'],
  ['raw token',d=>{d.runtime.token='fake-not-real';},'SCHEMA_INVALID'],
  ['raw secret value',d=>{d.secretRefs[0].value='fake-not-real';},'SCHEMA_INVALID'],
  ['shell command',d=>{d.runtime.command=['curl','example.invalid'];},'SCHEMA_INVALID'],
  ['missing secret reference',d=>{d.storage.metadata.passwordSecretRef='missing';},'MISSING_SECRET_REF'],
  ['duplicate secret reference',d=>{d.secretRefs.push(structuredClone(d.secretRefs[0]));},'DUPLICATE_SECRET_REF'],
  ['unused secret locator',d=>{d.secretRefs.push({id:'unused',source:'environment',variable:'EXHIBITOS_UNUSED'});},'UNUSED_SECRET_REF'],
  ['mutable image tag',d=>{d.runtime.image='ghcr.io/exhibitos/platform:latest';},'SCHEMA_INVALID'],
  ['unknown version',d=>{d.schemaVersion='2.0.0';},'UNSUPPORTED_VERSION'],
  ['leap second',d=>{d.createdAt='2016-12-31T23:59:60Z';},'SCHEMA_INVALID'],
];
for(const [name,change,code]of deploymentNegatives)test('OED rejects '+name,()=>{const document=structuredClone(local);change(document);has(validateOed(document),code);});
test('compatibility fixture executes identity only; no unsupported source or target migration is invented',async()=>{
  const fixture=JSON.parse(await readFile(new URL('../fixtures/compatibility/oex-adapter-cases.json',import.meta.url)));
  for(const entry of fixture.cases){const source=structuredClone(manifest);source.formatVersion=entry.sourceVersion;const checked=adaptOexManifest(source,entry.targetVersion);if(entry.expected==='identity-only-no-migration'){assert.equal(checked.valid,true);assert.equal(checked.adapter,entry.expected);assert.deepEqual(checked.document,source);assert.notEqual(checked.document,source);}else has(checked,entry.expected);}
});
test('package CLI rejects invalid archives with structured errors and nonzero exit',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'exhibitos-package-cli-'));
  try{const filename=join(directory,'invalid.oex');await writeFile(filename,buildZip([{name:'../escape.glb',data:'x'}]));const output=spawnSync(process.execPath,[new URL('./package-cli.mjs',import.meta.url).pathname,'oex',filename],{encoding:'utf8'});assert.equal(output.status,1);assert.equal(JSON.parse(output.stdout).errors[0].code,'ZIP_UNSAFE_PATH');}finally{await rm(directory,{recursive:true,force:true});}
});

test('ZIP rejects file/directory prefix collisions in both orders and case folds, while nested siblings are valid',()=>{
  for(const names of [['assets/sculpture.glb','assets/sculpture.glb/painting.png'],['assets/sculpture.glb/painting.png','assets/sculpture.glb'],['ASSETS/SCULPTURE.GLB','assets/sculpture.glb/painting.png'],['ASSETS/SCULPTURE.GLB/painting.png','assets/sculpture.glb']])zipFails(names.map(name=>({name,data:'x'})),'ZIP_PATH_PREFIX_COLLISION');
  assert.equal(readBoundedZip(buildZip([{name:'assets/models/a.glb',data:'x'},{name:'assets/models/b.glb',data:'y'}])).size,2);
});
test('OEX export time cannot precede exhibition or artwork snapshots even when historic rights would permit that date',async()=>{
  const ancientRights=r=>r.artworks.forEach(artwork=>{artwork.rights.validFrom='2019-01-01T00:00:00Z';artwork.rights.expiresAt='2021-01-01T00:00:00Z';});
  has(await validateOex(repack({changeRevision:ancientRights,changeManifest:m=>{m.createdAt='2020-01-01T00:00:00Z';}})),'EXPORT_BEFORE_REVISION');
  has(await validateOex(repack({changeRevision:r=>{r.artworks[0].createdAt='2026-10-01T04:00:00Z';}})),'EXPORT_BEFORE_ARTWORK_REVISION');
  assert.equal((await validateOex(repack({changeRevision:r=>{r.artworks.forEach(artwork=>{artwork.createdAt=manifest.createdAt;});}}))).valid,true);
});

test('ZIP deflate payload cannot hide unused trailing compressed bytes',()=>{
  const baseline=buildZip([{name:'entry.json',data:Buffer.from('plain compressible entry 1234567890'),method:8}]);
  const end=baseline.length-22,central=baseline.readUInt32LE(end+16),changed=Buffer.concat([baseline.subarray(0,central),Buffer.from([0]),baseline.subarray(central)]);
  changed.writeUInt32LE(baseline.readUInt32LE(18)+1,18);
  changed.writeUInt32LE(baseline.readUInt32LE(central+20)+1,central+1+20);
  changed.writeUInt32LE(central+1,changed.length-6);
  assert.throws(()=>readBoundedZip(changed),/ZIP_DEFLATE_TRAILING_DATA/);
});
