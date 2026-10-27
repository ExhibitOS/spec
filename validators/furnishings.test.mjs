// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readOex,writeOex,validateExhibition,validateExhibitionFiles,validateOexManifest,packageCompleteAssetManifest} from '../index.mjs';
import {FURNISHING_NAMESPACE as NS,validateFurnishingInventory,packageFurnishingNoticeManifest} from './furnishings.mjs';
const original=await readOex(await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url)));
const id='a0000000-0000-4000-8000-000000000001';
const hash=b=>createHash('sha256').update(b).digest('hex');
const notice=Buffer.from('User-owned ExhibitOS model. CC0 1.0 Universal. https://creativecommons.org/publicdomain/zero/1.0/\n');
const model=original.manifest.assets.find(a=>a.mime==='model/gltf-binary');
function revision(){
 const e=structuredClone(original.exhibition);
 e.extensions={...e.extensions,[NS]:{version:1,assets:[{id,catalogId:'synthetic-fixture',catalogVersion:1,mime:model.mime,path:`furnishings/${id}/model.glb`,bytes:model.bytes,sha256:model.sha256,rights:{licenseId:'CC0-1.0',notice:{path:`furnishings/${id}/LICENSE-NOTICE.txt`,bytes:notice.length,sha256:hash(notice)}},provenance:{sourceSha256:model.sha256,recipe:'original-v1'}}],bindings:[{hostKind:'pedestal',hostId:e.placements[0].id,assetId:id,pose:{position:[0,0,0],yaw:0,scale:1}}]}};
 return e;
}
function files(e){const assets=new Map(original.manifest.assets.map(a=>[a.artifactPath,original.files.get(a.path)]));assets.set(e.extensions[NS].assets[0].path,original.files.get(model.path));assets.set(e.extensions[NS].assets[0].rights.notice.path,notice);return assets;}
const options={createdAt:original.manifest.createdAt,generator:original.manifest.generator};
test('opt-in furnishing inventory binds exact model and UTF8 notice and roundtrips without artwork coercion',async()=>{
 const e=revision(),before=structuredClone(e),bytes=await writeOex(e,files(e),options),decoded=await readOex(bytes);
 assert.equal(decoded.manifest.formatVersion,'1.0.0-draft.6');assert.equal(decoded.manifest.assets.find(a=>a.id===id).kind,'furnishing');
 assert.deepEqual(decoded.manifest.assets,packageCompleteAssetManifest(e));assert.deepEqual(decoded.manifest.furnishingNotices,packageFurnishingNoticeManifest(e));
 assert.equal(decoded.files.get('resources/'+e.extensions[NS].assets[0].rights.notice.path).equals(notice),true);
 assert.deepEqual(e,before);assert.equal(decoded.exhibition.artworks.length,original.exhibition.artworks.length);
 const roundtrip=await writeOex(decoded.exhibition,files(e),options);assert.equal(bytes.equals(roundtrip),true);
 assert.equal((await validateExhibitionFiles(e,new URL('../fixtures/synthetic',import.meta.url).pathname)).valid,false);
});
test('closed host references, used-only assets and safe notice paths reject item-specific corruption',()=>{
 for(const edit of [v=>v.assets[0].rights.notice.path='../private',v=>v.assets[0].rights.notice.bytes=0,v=>v.assets[0].rights.notice.sha256='x',v=>v.assets[0].provenance.sourceSha256='0'.repeat(64),v=>v.assets[0].id=v.bindings[0].hostId,v=>v.bindings[0].hostKind='artwork',v=>v.bindings[0].hostId=id,v=>v.bindings.push(v.bindings[0]),v=>v.bindings=[],v=>v.assets[0].rights.extra=true]){
  const e=revision();edit(e.extensions[NS]);assert.equal(validateFurnishingInventory(e).valid,false);assert.equal(validateExhibition(e).valid,false);
 }
 for(const [kind,rows]of [['light','lights'],['opening','openings']]){const e=revision();e.extensions[NS].bindings[0].hostKind=kind;e.extensions[NS].bindings[0].hostId=e[rows][0].id;assert.equal(validateFurnishingInventory(e).valid,true);}
});
test('missing, tampered and invalid UTF8 notices fail instead of producing an incomplete archive',async()=>{
 for(const mode of ['missing','tampered','invalid-utf8']){
  const e=revision(),assets=files(e),path=e.extensions[NS].assets[0].rights.notice.path;
  if(mode==='missing')assets.delete(path);
  else if(mode==='tampered')assets.set(path,Buffer.alloc(notice.length));
  else {const bad=Buffer.from([255]);assets.set(path,bad);Object.assign(e.extensions[NS].assets[0].rights.notice,{bytes:1,sha256:hash(bad)});}
  await assert.rejects(writeOex(e,assets,options));
 }
 const e=revision(),decoded=await readOex(await writeOex(e,files(e),options));
 for(const edit of [m=>m.formatVersion='1.0.0-draft.5',m=>m.furnishingNotices.push(m.furnishingNotices[0]),m=>m.furnishingNotices[0].assetId=m.assets[0].id,m=>m.furnishingNotices[0].path='resources/../secret',m=>m.furnishingNotices[0].extra=true]){const m=structuredClone(decoded.manifest);edit(m);assert.equal(validateOexManifest(m).valid,false);}
});
test('ordinary output retains original profile and exact frozen bytes',async()=>{
 const e=original.exhibition,assets=new Map(original.manifest.assets.map(a=>[a.artifactPath,original.files.get(a.path)]));
 const bytes=await writeOex(e,assets,options);assert.equal(bytes.equals(await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url))),true);
});
