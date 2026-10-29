// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ExhibitOS contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FOOTSTEP_RESOURCE_NAMESPACE as N,FOOTSTEP_SAMPLES,footstepResourcesFor} from './footstep-resources.mjs';
import {readOex,validateOexManifest} from './package.mjs';
import {validateExhibition} from './exhibition.mjs';
import {createMediaExample} from '../scripts/generate-media-oex.mjs';
const doc=value=>({extensions:{[N]:value}});
test('legacy documents do not opt into new resource profile',()=>{
 assert.deepEqual(footstepResourcesFor({}),[]);
});
test('explicit canonical selection resolves only exact named family and shared notices',()=>{
 const selected=footstepResourcesFor(doc({version:1,families:['marble','wood']}));
 assert.equal(selected.filter(v=>v.role==='sample').length,5);
 assert.equal(selected.filter(v=>v.role==='notice').length,2);
 assert(selected.every(v=>v.family==='marble'||v.family==='wood'||v.family==='shared'));
 assert.equal(new Set(FOOTSTEP_SAMPLES.map(v=>v.sha256)).size,11);
});
test('rejects malformed, duplicated, unknown and noncanonical opt-ins',()=>{
 for(const value of [null,{}, {version:2,families:['wood']},{version:1,families:[]},{version:1,families:['tile','tile']},{version:1,families:['wood','tile']},{version:1,families:['unknown']},{version:1,families:['wood'],extra:true}])assert.throws(()=>footstepResourcesFor(doc(value)),/FOOTSTEP_RESOURCE_SELECTION/);
});
test('new manifest accepts only exact known resources and old schemas refuse the new field',async()=>{
 const sample=await createMediaExample(),old=(await readOex(sample.archive)).manifest;
 const resources=footstepResourcesFor(doc({version:1,families:['wood']}));
 const manifest={...old,formatVersion:'1.0.0-draft.8',footstepResources:resources};
 assert.equal(validateOexManifest(manifest).valid,true);
 assert.equal(validateOexManifest({...old,footstepResources:resources}).valid,false);
 const bad=structuredClone(manifest);bad.footstepResources[0].sha256='0'.repeat(64);
 assert.equal(validateOexManifest(bad).valid,false);
 const duplicate=structuredClone(manifest);duplicate.footstepResources.push(duplicate.footstepResources[0]);
 assert.equal(validateOexManifest(duplicate).valid,false);
});
test('invalid declarations fail exhibition validation rather than silently falling back',async()=>{
 const sample=await createMediaExample(),revision=structuredClone(sample.revision);
 revision.extensions={...revision.extensions,[N]:{version:1,families:['unknown']}};
 assert(validateExhibition(revision).errors.some(e=>e.code==='FOOTSTEP_RESOURCE_SELECTION'));
});
