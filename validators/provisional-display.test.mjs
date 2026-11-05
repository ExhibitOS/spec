// SPDX-License-Identifier: Apache-2.0
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateArtwork} from './artwork.mjs';
import {validateExhibition,validateLifecycle,revisionHash,assetInventory} from './exhibition.mjs';
import {validateOex,writeOex} from './package.mjs';
import {readBoundedZip} from './zip.mjs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {buildZip} from '../scripts/zip-fixture-builder.mjs';

const files=readBoundedZip(await readFile(new URL('../oex/v1/examples/synthetic.oex',import.meta.url)));
const source=JSON.parse(files.get('exhibition.json'));
const sourceManifest=JSON.parse(files.get('manifest.json'));
function candidate(){
 const exhibition=structuredClone(source);exhibition.schemaVersion='1.0.0-draft.2';
 const artwork=exhibition.artworks.find(a=>a.artworkType==='sculpture');assert(artwork);
 artwork.schemaVersion='1.0.0-draft.2';artwork.units='unknown';artwork.dimensions={width:2,height:4,depth:6};artwork.transform={position:[0,0,0],rotation:[0,0,0,1],scale:[.1,.1,.1]};
 artwork.extensions={...artwork.extensions,'org.exhibitos.studio/display-reference':{version:1,status:'provisional-uncalibrated',assetSha256:artwork.assets.find(a=>a.id===artwork.primaryAssetId).sha256,rawBounds:{min:[-1,-2,-3],max:[1,2,3]},referenceHeightMeters:.4,catalogueDimensions:{width:.3,height:.4,depth:.5,unit:'m'},axisMapping:'unverified'}};
 return {exhibition,artwork};
}
test('qualified unknown units use explicit v2 while legacy v1 remains valid',async()=>{
 const {exhibition,artwork}=candidate();assert.equal(validateArtwork(artwork).valid,true);assert.equal(validateExhibition(exhibition).valid,true);assert.equal(validateExhibition(source).valid,true);
 const legacy=structuredClone(exhibition);legacy.schemaVersion='1.0.0-draft.1';assert.equal(validateExhibition(legacy).valid,false);
 const oldSchema=JSON.parse(await readFile(new URL('../oes/v1/artwork.schema.json',import.meta.url)));const ajv=new Ajv2020({strict:true});addFormats(ajv,['uuid','date-time']);assert.equal(ajv.compile(oldSchema)(artwork),false);
 const draft={schemaVersion:'1.0.0-draft.2',id:'50000000-0000-4000-8000-000000000099',exhibitionId:exhibition.id,kind:'exhibition-draft',editVersion:1,createdAt:exhibition.createdAt,updatedAt:exhibition.createdAt,candidate:exhibition};assert.equal(validateLifecycle(draft).valid,true);draft.schemaVersion='1.0.0-draft.1';assert.equal(validateLifecycle(draft).valid,false);
});
test('qualification, exact asset binding, raw extents and A are all required',()=>{
 const {artwork}=candidate();for(const mutate of [a=>delete a.extensions['org.exhibitos.studio/display-reference'],a=>a.extensions['org.exhibitos.studio/display-reference'].assetSha256='0'.repeat(64),a=>a.extensions['org.exhibitos.studio/display-reference'].axisMapping='confirmed',a=>a.dimensions.height=3,a=>a.transform.scale[1]=.2,a=>a.transform.position[1]=1,a=>a.extensions['org.exhibitos.studio/display-reference'].rawBounds.max[1]=-2,a=>{a.provenance.scaleConversion={sourceUnit:'meter',multiplierToMeters:1,appliedToAssetIds:[a.primaryAssetId],bakedIntoGeometry:true};}]){const bad=structuredClone(artwork);mutate(bad);assert.equal(validateArtwork(bad).valid,false);}
});
test('v2 exhibition produces a v11 OEX and preserves the qualifier and bytes',async()=>{
 const {exhibition,artwork}=candidate();const assets=new Map(sourceManifest.assets.map(a=>[a.artifactPath,files.get(a.path)]));
 const archive=await writeOex(exhibition,assets,{createdAt:'2026-10-02T00:00:00Z',generator:{name:'synthetic test',version:'1'}});assert.equal((await validateOex(archive)).valid,true);
 const entries=readBoundedZip(archive),manifest=JSON.parse(entries.get('manifest.json')),restored=JSON.parse(entries.get('exhibition.json'));assert.equal(manifest.formatVersion,'1.0.0-draft.11');assert.equal(manifest.oesArtworkVersion,'1.0.0-draft.2');assert.equal(manifest.oesExhibitionVersion,'1.0.0-draft.2');assert.deepEqual(restored.artworks.find(a=>a.id===artwork.id),artwork);
 for(const asset of manifest.assets)assert.deepEqual(entries.get(asset.path),assets.get(asset.artifactPath));
 const corrupted={...manifest,oesArtworkVersion:'1.0.0-draft.1'};
 const bad=buildZip([...entries].map(([name,data])=>({name,data:name==='manifest.json'?Buffer.from(JSON.stringify(corrupted)):data})));
 assert.equal((await validateOex(bad)).valid,false);
});

test('v2 freeze declares the v2 profile and rejects a stale v1 declaration',async()=>{
 const {exhibition}=candidate();
 const freeze=JSON.parse(await readFile(new URL('../oes/v1/examples/freeze.json',import.meta.url)));
 const publication=JSON.parse(await readFile(new URL('../oes/v1/examples/publication.json',import.meta.url)));
 for(const entry of [freeze,publication]){entry.schemaVersion='1.0.0-draft.2';entry.exhibitionId=exhibition.id;entry.revisionId=exhibition.revisionId;entry.revisionSha256=revisionHash(exhibition);}
 publication.publishedAt=exhibition.createdAt;freeze.frozenAt=exhibition.createdAt;freeze.assets=assetInventory(exhibition);freeze.specVersions.oesArtwork='1.0.0-draft.2';freeze.specVersions.oesExhibition='1.0.0-draft.2';
 assert.deepEqual(validateLifecycle(freeze,exhibition,{publication}),{valid:true,errors:[]});
 freeze.specVersions.oesArtwork='1.0.0-draft.1';assert.equal(validateLifecycle(freeze,exhibition,{publication}).valid,false);
});
