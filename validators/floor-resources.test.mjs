// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readOex,writeOex,revisionHash,validateOexManifest,adaptOexManifest} from '../index.mjs';
import {OEX_FLOOR_RESOURCE_VERSION as V,FLOOR_RESOURCE_PACKS,FLOOR_RESOURCE_FILES,selectedFloorResourcePacks,packageFloorResourceManifest,floorResourceNotice} from './floor-resources.mjs';
const original=await readOex(await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url)));
function revision(){const e=structuredClone(original.exhibition);e.extensions={...e.extensions,'org.exhibitos.studio/floors':{version:1,bindings:[{target:{kind:'room-base',roomId:e.rooms[0].id},preset:'wood',repeatMeters:[1.8,1.8],rotation:0}]}};e.surfaces=e.surfaces.filter(s=>s.type!=='floor');return e;}
function manifest(e=revision()){
 const bytes=Buffer.from(JSON.stringify(e)+'\n');return {...structuredClone(original.manifest),formatVersion:V,exhibition:{...original.manifest.exhibition,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),revisionSha256:revisionHash(e)},floorResources:packageFloorResourceManifest(e)};
}
test('selected known version packs include every exact map and notice, and inactive room bases load none',()=>{
 const e=revision(),before=structuredClone(e),resources=packageFloorResourceManifest(e);assert.equal(resources.length,4);assert.deepEqual([...new Set(resources.map(f=>f.packId))],['WoodFloor051']);assert.deepEqual(e,before);
 assert.equal(selectedFloorResourcePacks(e)[0],FLOOR_RESOURCE_PACKS[0]);
 for(const p of FLOOR_RESOURCE_PACKS){const text=Buffer.from(floorResourceNotice(p));assert.equal(text.length,p.notice.bytes);assert.equal(createHash('sha256').update(text).digest('hex'),p.notice.sha256);}
 e.surfaces.push({id:'11111111-1111-4111-8111-111111111111',type:'floor',roomId:e.rooms[0].id});assert.deepEqual(packageFloorResourceManifest(e),[]);
 for(const patch of [null,{version:2},{version:1,id:'Unknown'},{version:1,id:['WoodFloor051']}]){const v=revision();v.extensions['org.exhibitos.studio/floors'].bindings[0].texturePack=patch;assert.throws(()=>packageFloorResourceManifest(v),/FLOOR_RESOURCE_VERSION/);}
 const bad=revision();bad.extensions['org.exhibitos.studio/floors'].bindings[0].preset=['wood'];assert.throws(()=>packageFloorResourceManifest(bad),/FLOOR_RESOURCE_REFERENCE/);
});
test('profile5 is explicit and typed; descriptor, path, role, duplicate and unsupported version denials are closed',()=>{
 const m=manifest();assert.equal(validateOexManifest(m).valid,true);assert.equal(adaptOexManifest(m,V).valid,true);assert.equal(adaptOexManifest(m,'1.0.0-draft.4').valid,false);
 for(const edit of [m=>m.formatVersion='1.0.0-draft.99',m=>m.floorResources[0].role='displacement',m=>m.floorResources[0].packVersion=2,m=>m.floorResources[0].path='resources/../secret',m=>m.floorResources[0].artifactPath='/private/source',m=>m.floorResources[0].sha256='0'.repeat(64),m=>m.floorResources.push(m.floorResources[0]),m=>m.floorResources[0].mime='audio/wav']){const changed=structuredClone(m);edit(changed);assert.equal(validateOexManifest(changed).valid,false);}
 assert.equal(FLOOR_RESOURCE_FILES.length,17);assert.equal(FLOOR_RESOURCE_FILES.filter(f=>f.role==='ao').length,1);assert.equal(FLOOR_RESOURCE_FILES.find(f=>f.role==='ao').packId,'Carpet004');
});
test('new writes require the selected exact bytes; ordinary exports retain profile2 and frozen fixtures',async()=>{
 const e=revision(),assets=new Map(original.manifest.assets.map(a=>[a.artifactPath,original.files.get(a.path)]));
 await assert.rejects(writeOex(e,assets,{createdAt:original.manifest.createdAt,generator:original.manifest.generator}),error=>error.code==='ARCHIVE_LAYOUT_MISMATCH');
 for(const f of packageFloorResourceManifest(e))assets.set(f.artifactPath,new Uint8Array(f.bytes));
 await assert.rejects(writeOex(e,assets,{createdAt:original.manifest.createdAt,generator:original.manifest.generator}),error=>error.code==='FLOOR_RESOURCE_INTEGRITY');
 const plain=new Map(original.manifest.assets.map(a=>[a.artifactPath,original.files.get(a.path)]));const bytes=await writeOex(original.exhibition,plain,{createdAt:original.manifest.createdAt,generator:original.manifest.generator});assert.equal((await readOex(bytes)).manifest.formatVersion,'1.0.0-draft.2');assert.deepEqual(bytes,await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url)));
});
