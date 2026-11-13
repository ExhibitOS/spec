// SPDX-License-Identifier: Apache-2.0
// Synthetic identity/asset metadata only. No original artwork or private fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import {frameImageFootprintForArtwork,frameImageContactFit,frameAttachmentMetricFit,qualifiedFrameAttachmentTransform,workspaceFitGeometry} from './workspace-fit-models.mjs';
import {validateWorkspaceFurnishings,WORKSPACE_FURNISHING_NAMESPACE} from './workspace-furnishing.mjs';
const id=n=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const pose={position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]};
function fixture(){
 const source={id:id(2),version:1,kind:'artwork-frame',name:'Synthetic frame',provenance:'Synthetic metadata',model:{mime:'model/gltf-binary',bytes:100,sha256:'a'.repeat(64)},rights:{holder:'Synthetic',ownership:'owner',licenseId:'CC0-1.0',creditLine:'Synthetic',permissions:{display:true,download:true,export:true,commercial:true}},fit:{version:1,sourceSha256:'a'.repeat(64),sourceBytes:100,geometry:{profile:'straight-miter-ring-v1',openingWidth:.6,openingHeight:.8,imagePlaneZ:-.012}}};
 const art={revisionId:id(5),primaryAssetId:id(6),schemaVersion:'1.0.0-draft.1',artworkType:'image',dimensions:{width:.934,height:.732},transform:structuredClone(pose),assets:[{id:id(6),mime:'image/png',bytes:100,sha256:'b'.repeat(64)}]},placement={id:id(4),roomId:id(1),artworkRevisionId:art.revisionId,assetId:art.primaryAssetId,transform:structuredClone(pose)};
 const row={placementId:placement.id,artworkRevisionId:art.revisionId,assetId:art.primaryAssetId,furnishingId:source.id,furnishingVersion:1,modelSha256:source.model.sha256,imageFit:{version:1,profile:'contain-contact-v1',sourceSha256:'b'.repeat(64),pixelWidth:2048,pixelHeight:1630}},value={version:10,furnishings:[source],placements:[],frameAttachments:[row],openingAttachments:[]};
 return {source,art,placement,row,value,candidate:{rooms:[{id:id(1),dimensions:{width:6,height:3,depth:8},transform:structuredClone(pose)}],artworks:[art],placements:[placement],extensions:{[WORKSPACE_FURNISHING_NAMESPACE]:value}}};
}
test('canonical primary footprint and exact contact stay independent of coarse/full bitmap rounding',()=>{
 const f=fixture(),pixels=structuredClone(f.art.assets),dimensions=structuredClone(f.art.dimensions),model=structuredClone(f.source),geometry=workspaceFitGeometry(f.source);
 assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,true);
 const footprint=frameImageFootprintForArtwork(f.candidate,f.art),corners=frameImageContactFit(f.candidate,f.row,f.art,geometry);
 assert.deepEqual(footprint,{width:.732*2048/1630,height:.732});
 assert.ok(Math.abs(geometry.openingWidth+2*corners.cornerX-footprint.width)<1e-12);
 assert.ok(Math.abs(geometry.openingHeight+2*corners.cornerY-footprint.height)<1e-12);
 for(const tier of [{width:512,height:408},{width:2048,height:1630}]){assert.notEqual(tier.width,0);assert.deepEqual(frameImageFootprintForArtwork(f.candidate,f.art),footprint);}
 assert.deepEqual(f.art.assets,pixels);assert.deepEqual(f.art.dimensions,dimensions);assert.deepEqual(f.source,model);
});
test('legacy rows keep legacy fallback while v9 rejects an issued imageFit field',()=>{
 const f=fixture();f.value.version=9;assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,false);assert.throws(()=>frameImageFootprintForArtwork(f.candidate,f.art),/FRAME_IMAGE_FIT_INVALID/);
 delete f.row.imageFit;assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,true);assert.equal(frameImageFootprintForArtwork(f.candidate,f.art),undefined);assert.equal(frameImageContactFit(f.candidate,f.row,f.art,workspaceFitGeometry(f.source)),undefined);
 f.value.version=10;assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,true);
});
test('new metadata fails closed for stale binding, malformed bounds, unmeasured source or unsupported target',()=>{
 for(const mutate of [f=>f.row.imageFit.sourceSha256='c'.repeat(64),f=>f.row.assetId=id(10),f=>f.row.artworkRevisionId=id(11),f=>f.row.imageFit.pixelWidth=0,f=>f.row.imageFit.pixelHeight=1.5,f=>f.row.imageFit.pixelWidth=8193,f=>{f.row.imageFit.pixelWidth=8192;f.row.imageFit.pixelHeight=8192;},f=>f.row.imageFit.extra=true,f=>delete f.source.fit,f=>f.art.dimensions.width=.1,f=>f.art.assets[0].mime='image/jpeg']){
  const f=fixture();mutate(f);assert.throws(()=>frameImageFootprintForArtwork(f.candidate,f.art),/FRAME_IMAGE_FIT_/);assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,false);
 }
});
test('all records for one immutable primary must agree; conflicting rows never win by order',()=>{
 const f=fixture(),placement={...structuredClone(f.placement),id:id(12)},row={...structuredClone(f.row),placementId:placement.id};f.candidate.placements.push(placement);f.value.frameAttachments.push(row);
 assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,true);assert.deepEqual(frameImageFootprintForArtwork(f.candidate,f.art),{width:.732*2048/1630,height:.732});
 row.imageFit.pixelWidth=2047;for(const reverse of [false,true]){if(reverse)f.value.frameAttachments.reverse();assert.throws(()=>frameImageFootprintForArtwork(f.candidate,f.art),/FRAME_IMAGE_FIT_CONFLICT/);assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,false);}
});
test('mixed legacy records are explicit and contact helper refuses a forged selected row or geometry',()=>{
 const f=fixture(),placement={...structuredClone(f.placement),id:id(12)},legacy={...structuredClone(f.row),placementId:placement.id};delete legacy.imageFit;f.candidate.placements.push(placement);f.value.frameAttachments.push(legacy);
 assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,true);assert.equal(frameImageContactFit(f.candidate,legacy,f.art,workspaceFitGeometry(f.source)),undefined);
 assert.throws(()=>frameImageContactFit(f.candidate,{...f.row,imageFit:{...f.row.imageFit,pixelWidth:1}},f.art,workspaceFitGeometry(f.source)),/FRAME_IMAGE_FIT_STALE/);
 assert.throws(()=>frameImageContactFit(f.candidate,f.row,f.art,{...workspaceFitGeometry(f.source),imagePlaneZ:0}),/FRAME_IMAGE_FIT_STALE/);
});
test('metric namespace10 placement fit preserves source geometry and contact pixels for positive XY scales',()=>{
 for(const scale of [[1.000709099666411,1,1],[.9906979398504822,1,1],[1.2,.8,1]]){
  const f=fixture();f.placement.transform.scale=scale;f.placement.transform.rotation=[0,Math.SQRT1_2,0,Math.SQRT1_2];f.art.transform.position=[.02,.03,.04];
  const before=JSON.stringify(f.candidate),g=workspaceFitGeometry(f.source),footprint=frameImageFootprintForArtwork(f.candidate,f.art),fit=frameAttachmentMetricFit(f.candidate,f.row,f.art,g);
  assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,true);assert.equal(fit.rigidFrame,true);
  assert.ok(Math.abs(g.openingWidth+2*fit.cornerX-footprint.width*scale[0])<1e-12);assert.ok(Math.abs(g.openingHeight+2*fit.cornerY-footprint.height*scale[1])<1e-12);
  assert.deepEqual(qualifiedFrameAttachmentTransform(f.candidate,f.placement,f.art,g,10),{scaleX:scale[0],scaleY:scale[1],rigidFrame:true});assert.equal(JSON.stringify(f.candidate),before);
 }
});
test('metric legacy-gap fit and unit-scale fallback retain their explicit numerical paths',()=>{
 const f=fixture(),g=workspaceFitGeometry(f.source);assert.deepEqual(frameAttachmentMetricFit(f.candidate,f.row,f.art,g),{...frameImageContactFit(f.candidate,f.row,f.art,g),rigidFrame:false});
 delete f.row.imageFit;f.placement.transform.scale=[1.1,.9,1];const fit=frameAttachmentMetricFit(f.candidate,f.row,f.art,g);
 assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,true);assert.ok(Math.abs(g.openingWidth+2*fit.cornerX-(f.art.dimensions.width*1.1+.006))<1e-12);
 assert.ok(Math.abs(g.openingHeight+2*fit.cornerY-(f.art.dimensions.height*.9+.006))<1e-12);
 f.value.version=9;assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,false);assert.equal(frameAttachmentMetricFit(f.candidate,f.row,f.art,g),undefined);
});
test('unsupported transforms remain rejected rather than falling back to a stretched frame',()=>{
 for(const mutate of [f=>f.placement.transform.scale=[0,1,1],f=>f.placement.transform.scale=[-1,1,1],f=>f.placement.transform.scale=[NaN,1,1],f=>f.placement.transform.scale=[1,1,1.01],f=>f.placement.transform.scale=[.1,1,1],f=>f.placement.transform.scale=[10,1,1],f=>f.art.transform.scale=[1.01,1,1],f=>f.candidate.rooms[0].transform.scale=[1,1.01,1],f=>f.art.transform.rotation=[0,0,Math.sin(Math.PI/8),Math.cos(Math.PI/8)],f=>delete f.source.fit]){
  const f=fixture();f.placement.transform.scale=[1.1,1,1];mutate(f);const g=workspaceFitGeometry(f.source);
  assert.equal(validateWorkspaceFurnishings(f.value,f.candidate).valid,false);assert.equal(qualifiedFrameAttachmentTransform(f.candidate,f.placement,f.art,g,10),undefined);
  if(g)assert.equal(frameAttachmentMetricFit(f.candidate,f.row,f.art,g),undefined);
 }
});
test('effective contact footprint must remain inside the existing metric limits',()=>{
 const f=fixture(),g=workspaceFitGeometry(f.source);f.art.dimensions={width:.5,height:.6};f.row.imageFit.pixelWidth=2000;f.row.imageFit.pixelHeight=1600;f.placement.transform.scale=[1,.9,1];
 assert.ok(qualifiedFrameAttachmentTransform(f.candidate,f.placement,f.art,g,10));assert.equal(frameAttachmentMetricFit(f.candidate,f.row,f.art,g),undefined);
 assert.ok(validateWorkspaceFurnishings(f.value,f.candidate).errors.some(e=>e.code==='FRAME_IMAGE_FIT_UNSUPPORTED'));
});
