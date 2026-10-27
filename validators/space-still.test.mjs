// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readOex,writeOex,OEX_SPACE_STILL_VERSION,SPACE_STILL_NAMESPACE as N,validateSpaceStillInventory,validateExhibition,assetInventory,adaptOexManifest} from '../index.mjs';
import {createSpaceStillExample} from '../scripts/generate-space-still-oex.mjs';
import {validSpaceStillPng} from './space-still-png.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),sample=await createSpaceStillExample();
test('explicit standalone still profile roundtrips exact bytes while old profile1/2 fixtures remain unchanged',async()=>{
 const decoded=await readOex(sample.archive);assert.equal(decoded.manifest.formatVersion,OEX_SPACE_STILL_VERSION);assert.deepEqual(decoded.files.get('assets/'+sample.revision.extensions[N].asset.path),sample.png);
 assert.equal(decoded.manifest.assets.filter(a=>a.kind==='space-still').length,1);assert.deepEqual(decoded.manifest.assets.find(a=>a.kind==='space-still').rightsReferences,['exhibition.json#/extensions/org.exhibitos.viewer~1space-still/asset/rights']);
 assert.deepEqual(await writeOex(sample.revision,sample.assets,sample.options),sample.archive);assert.equal(assetInventory(sample.revision).some(a=>a.id===sample.revision.extensions[N].asset.id),true);
 assert.equal(hash(await readFile(new URL('../oex/v1/examples/synthetic.oex',import.meta.url))),'747c11f09ec64a656466bbf14453a304b550afcf4c88daba845d3e1c6b45c72f');assert.equal(hash(await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url))),'28b74acc1444d15f8a64a307350b784b4b86279cbd2ed5a31939ff3e57188f66');
 assert.equal(adaptOexManifest(decoded.manifest,'1.0.0-draft.2').valid,false);assert.equal(adaptOexManifest(decoded.manifest,OEX_SPACE_STILL_VERSION).valid,true);
});
test('metadata remains closed, uniquely bound to entrance, audio-only references and unknown data are preserved',()=>{
 const source=structuredClone(sample.revision),before=structuredClone(source);source.extensions['example.org/preserved']={id:source.extensions[N].asset.id};assert.equal(validateExhibition(source).valid,true);assert.deepEqual(source.extensions[N],before.extensions[N]);
 for(const edit of [r=>r.extensions[N].version=2,r=>r.extensions[N].extra=true,r=>r.extensions[N].asset.mime='audio/wav',r=>r.extensions['org.exhibitos.viewer/entrance'].imageAssetId=r.artworks[0].primaryAssetId,r=>r.extensions[N].asset.id=r.rooms[0].id,r=>r.extensions[N].asset.path='../room.png',r=>r.extensions[N].asset.sha256='invalid']){const invalid=structuredClone(source);edit(invalid);assert.equal(validateSpaceStillInventory(invalid).valid,false);}
 const audio=structuredClone(source);audio.audioZones[0].assetId=audio.extensions[N].asset.id;assert.equal(validateExhibition(audio).valid,false);
 const alias=structuredClone(source);alias.extensions[N].asset.id=alias.artworks[0].primaryAssetId;alias.extensions['org.exhibitos.viewer/entrance'].imageAssetId=alias.extensions[N].asset.id;assert.equal(validateExhibition(alias).valid,false);
});
test('current display and export grants are distinct and stale/malformed PNG bytes are rejected',async()=>{
 const invalid=structuredClone(sample.revision);invalid.extensions[N].asset.rights.permissions.display=false;assert.equal(validateExhibition(invalid,{publicationTime:sample.options.createdAt}).valid,false);
 const exportDenied=structuredClone(sample.revision);exportDenied.extensions[N].asset.rights.permissions.export=false;await assert.rejects(writeOex(exportDenied,sample.assets,sample.options),error=>error.code==='EXPORT_PERMISSION_REQUIRED');
 assert.equal(validSpaceStillPng(sample.png),true);for(const bytes of [sample.png.subarray(0,20),Buffer.concat([sample.png,Buffer.from([0])]),Buffer.from(sample.png).fill(0,12,16)])assert.equal(validSpaceStillPng(bytes),false);
 const wrong=new Map(sample.assets);wrong.set(sample.revision.extensions[N].asset.path,Buffer.alloc(sample.png.length));await assert.rejects(writeOex(sample.revision,wrong,sample.options),error=>error.code==='ASSET_HASH_MISMATCH');
});
