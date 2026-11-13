// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateWorkspaceFurnishings,WORKSPACE_FURNISHING_NAMESPACE,packageWorkspaceFurnishingManifest} from './workspace-furnishing.mjs';
import {readOex,writeOex,adaptOexManifest} from '../index.mjs';
const fixture=JSON.parse(await readFile(new URL('../fixtures/rail-v11/exhibition.json',import.meta.url),'utf8'));
const fresh=()=>structuredClone(fixture);
test('current v11 rail validates measured source, complete matrix, attachment bijection and all corners',()=>{
 assert.equal(validateWorkspaceFurnishings(fixture.extensions[WORKSPACE_FURNISHING_NAMESPACE],fixture).valid,true);
 const good=fresh(),r=good.extensions[WORKSPACE_FURNISHING_NAMESPACE].furnishings.find(x=>x.kind==='ceiling-rail');
 r.model.sha256='b'.repeat(64);r.model.bytes=200000;r.fit.sourceSha256=r.model.sha256;r.fit.sourceBytes=r.model.bytes;
 assert.equal(validateWorkspaceFurnishings(good.extensions[WORKSPACE_FURNISHING_NAMESPACE],good).valid,true,'original hash and bytes are not an eligibility list');
 for(const change of [e=>e.ceilingAttachments=[],e=>e.ceilingAttachments.push({...e.ceilingAttachments[0]}),e=>e.placements[0].position[0]+=.01,e=>e.placements[0].scale=2,e=>e.ceilingAttachments[0].gap=-.1,e=>e.furnishings.find(x=>x.kind==='ceiling-rail').fit.sourceSha256='c'.repeat(64),e=>e.furnishings.find(x=>x.kind==='ceiling-rail').fit.geometry.max[1]=.01,e=>e.furnishings.find(x=>x.kind==='ceiling-rail').fit.geometry.min[0]=-100]){
  const e=fresh(),ext=e.extensions[WORKSPACE_FURNISHING_NAMESPACE];change(ext);assert.equal(validateWorkspaceFurnishings(ext,e).valid,false);
 }
});
test('current passive rail resources round trip through explicit OEX draft23 with all preceding resources',async()=>{
 const original=await readOex(await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url))),e=fresh();
 const paths=new Set([...e.artworks.flatMap(a=>a.assets.map(a=>a.path)),...e.mediaAssets.map(a=>a.path)]),assets=new Map(original.manifest.assets.filter(a=>paths.has(a.artifactPath)).map(a=>[a.artifactPath,original.files.get(a.path)]));
 const rail=await readFile(new URL('../fixtures/rail-v11/linear-track.glb',import.meta.url)),entry=packageWorkspaceFurnishingManifest(e).find(x=>x.sha256==='1ba64842de525166018e941074852a3e041d07adf605674c7d7fadb02693a09e');assets.set(entry.artifactPath,rail);
 const output=await readOex(await writeOex(e,assets,{createdAt:'2026-11-14T00:00:00.000Z',generator:{name:'Synthetic rail conformance',version:'1'}}));
 assert.equal(output.manifest.formatVersion,'1.0.0-draft.23');assert.deepEqual(output.exhibition.extensions[WORKSPACE_FURNISHING_NAMESPACE],e.extensions[WORKSPACE_FURNISHING_NAMESPACE]);assert.deepEqual(output.files.get(entry.path),rail);
 assert.equal(adaptOexManifest(output.manifest,'1.0.0-draft.23').valid,true);assert.equal(adaptOexManifest(output.manifest,'1.0.0-draft.22').valid,false);
});
