// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWorkspaceFurnishings} from './workspace-furnishing.mjs';
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture(){const room={id:id(1),dimensions:{width:6,height:3,depth:8}},exhibition={rooms:[room]},descriptor={id:id(2),version:1,kind:'pedestal',name:'Synthetic plinth',rights:{holder:'Synthetic',ownership:'owner',licenseId:'CC0-1.0',creditLine:'Synthetic',permissions:{display:true,download:true,export:true,commercial:true}},provenance:'Synthetic fixture',model:{mime:'model/gltf-binary',bytes:100,sha256:'a'.repeat(64)}},value={version:1,furnishings:[descriptor],placements:[{id:id(3),roomId:room.id,furnishingId:descriptor.id,furnishingVersion:1,position:[1,0,0],yaw:0,scale:1}]};return {exhibition,value};}
test('accepts a visual placement referencing a declared workspace furnishing',()=>{const f=fixture();assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);});
test('enforces product-compatible UTF-16 name and provenance limits',()=>{
 for(const [field,text,valid] of [['name','😀'.repeat(60),true],['name','😀'.repeat(61),false],['provenance','😀'.repeat(512),true],['provenance','😀'.repeat(513),false],['name','x'.repeat(120),true],['name','x'.repeat(121),false],['provenance','x'.repeat(1024),true],['provenance','x'.repeat(1025),false]]){const f=fixture();f.value.furnishings[0][field]=text;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,valid,`${field} ${text.length}`);}
});
test('rejects aliases, dangling references, unused descriptors, and out-of-room positions',()=>{
 for(const edit of [f=>f.value.placements[0].id=f.exhibition.rooms[0].id,f=>f.value.placements[0].furnishingId=id(4),f=>f.value.placements[0].position=[4,0,0],f=>f.value.placements[0].scale=0,f=>f.value.furnishings[0].model.sha256='z'.repeat(64),f=>f.value.furnishings[0].name=' x ']){const f=fixture();edit(f);assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);}
});
test('rejects a workspace furnishing identity shared with other extension assets',()=>{
 for(const extension of [f=>({'org.exhibitos.viewer/space-still':{asset:{id:f.value.furnishings[0].id}}}),f=>({'org.exhibitos.studio/furnishing-visuals':{assets:[{id:f.value.furnishings[0].id}]}}),f=>({'org.exhibitos.studio/benches':{benches:[{id:f.value.placements[0].id}]}}),f=>({'org.exhibitos.studio/workspace-materials':{materials:[{id:f.value.furnishings[0].id}]}})]){const f=fixture();f.exhibition.extensions=extension(f);assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);}
});
test('stool requires the explicit visual placements v2 contract',()=>{
 const f=fixture();f.value.furnishings[0].kind='stool';assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
 f.value.version=2;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);
 f.value.furnishings[0].kind='unknown';assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
 f.value.furnishings[0].kind='stool';f.value.version=4;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
});
test('room-visual kinds require v3 and retain earlier kinds and poses',()=>{
 for(const kind of ['partition','info-stand','barrier','display-case']){
  const f=fixture();f.value.furnishings[0].kind=kind;
  for(const version of [1,2]){f.value.version=version;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false,kind+' v'+version);}
  f.value.version=3;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true,kind);
 }
 for(const kind of ['pedestal','bench','stool']){const f=fixture();f.value.version=3;f.value.furnishings[0].kind=kind;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true,kind);}
 const f=fixture();f.value.version=3;f.value.furnishings[0].kind='unknown';assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
});

test('v4 pins a reviewed fixed frame to one exact planar artwork placement',()=>{
 const make=()=>{
  const f=fixture(),item=f.value.furnishings[0],sha='4b14e45ccf14ed38eea90c50553733a0b97b1671b9ec377d900e5a947545f8b4';
  item.kind='artwork-frame';item.model.bytes=7892;item.model.sha256=sha;
  f.value={version:4,furnishings:[item],placements:[],frameAttachments:[{placementId:id(4),artworkRevisionId:id(5),assetId:id(6),furnishingId:item.id,furnishingVersion:1,modelSha256:sha}]};
  f.exhibition.rooms[0].transform={scale:[1,1,1]};f.exhibition.placements=[{id:id(4),roomId:f.exhibition.rooms[0].id,artworkRevisionId:id(5),assetId:id(6),transform:{scale:[1,1,1]}}];
  f.exhibition.artworks=[{revisionId:id(5),primaryAssetId:id(6),schemaVersion:'1.0.0-draft.1',artworkType:'image',dimensions:{width:.6,height:.8},transform:{scale:[1,1,1]}}];return f;
 };
 const good=make();assert.equal(validateWorkspaceFurnishings(good.value,good.exhibition).valid,true);
 for(const [mutate,code] of [
  [f=>f.exhibition.artworks[0].dimensions.height=.6,'FRAME_SIZE_UNSUPPORTED'],
  [f=>f.exhibition.artworks[0].dimensions.depth=.01,'FRAME_DEPTH_UNSUPPORTED'],
  [f=>f.exhibition.placements[0].transform.scale=[2,1,1],'FRAME_TRANSFORM_UNSUPPORTED'],
  [f=>f.exhibition.placements[0].assetId=id(9),'FRAME_TARGET_STALE'],
  [f=>f.value.frameAttachments[0].modelSha256='b'.repeat(64),'FRAME_ASSET_UNSUPPORTED'],
  [f=>f.exhibition.extensions={'org.exhibitos.studio/installation':{placements:[{placementId:id(4),frame:{kind:'flat'}}]}},'FRAME_PROCEDURAL_CONFLICT'],
  [f=>{const p='10000000-0000-4000-8000-0000000000a4';f.exhibition.placements[0].id=p;f.value.frameAttachments[0].placementId=p;f.exhibition.extensions={'org.exhibitos.studio/installation':{placements:[{placementId:p.toUpperCase(),frame:{kind:'flat'}}]}};},'FRAME_PROCEDURAL_CONFLICT'],
  [f=>f.value.frameAttachments.push({...f.value.frameAttachments[0]}),'FRAME_TARGET_STALE'],
 ]){const f=make();mutate(f);const result=validateWorkspaceFurnishings(f.value,f.exhibition);assert.equal(result.valid,false,code);assert.ok(result.errors.some(e=>e.code===code),code);}
});

test('v5 binds ordinary source records without broadening v4',async()=>{
 const {artworkFrameModel}=await import('./artwork-frame-models.mjs'),sha='b3f0bf2e6dbe659b1484ea6425848ad96b88d0be4b61ca82f5a4694462a7e03e';
 const make=()=>{const f=fixture(),item=f.value.furnishings[0];item.kind='artwork-frame';item.model.bytes=196160;item.model.sha256=sha;f.value={version:5,furnishings:[item],placements:[],frameAttachments:[{placementId:id(4),artworkRevisionId:id(5),assetId:id(6),furnishingId:item.id,furnishingVersion:1,modelSha256:sha}]};f.exhibition.rooms[0].transform={scale:[1,1,1]};f.exhibition.placements=[{id:id(4),roomId:f.exhibition.rooms[0].id,artworkRevisionId:id(5),assetId:id(6),transform:{scale:[1,1,1]}}];f.exhibition.artworks=[{revisionId:id(5),primaryAssetId:id(6),schemaVersion:'1.0.0-draft.1',artworkType:'image',dimensions:{width:.6,height:.8},transform:{scale:[1,1,1]}}];return f;};
 assert.equal(artworkFrameModel(sha,196160)?.imagePlaneZ,-.034);assert.equal(artworkFrameModel(sha,196161),undefined);
 const ok=make();assert.equal(validateWorkspaceFurnishings(ok.value,ok.exhibition).valid,true);
 for(const mutate of [f=>f.value.version=4,f=>f.value.furnishings[0].model.bytes++,f=>f.value.frameAttachments[0].modelSha256='a'.repeat(64),f=>f.exhibition.artworks[0].dimensions.height=.6,f=>f.exhibition.artworks[0].dimensions.depth=.025,f=>f.exhibition.placements[0].transform.scale=[1,2,1],f=>f.exhibition.placements[0].assetId=id(9),f=>{f.value.furnishings[0].model.sha256='d4bdc4201fe2e8866652350915799a346ba07cf73078fec9f7f6e275287e918a';f.value.furnishings[0].model.bytes=152056;f.value.frameAttachments[0].modelSha256=f.value.furnishings[0].model.sha256;}]){const f=make();mutate(f);assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);}
});


test('fixed frame records bind each exact original digest and byte count',async()=>{
 const {artworkFrameModel}=await import('./artwork-frame-models.mjs');
 const entries=[
  ['4b14e45ccf14ed38eea90c50553733a0b97b1671b9ec377d900e5a947545f8b4',7892,'thin-brass-frame'],
  ['50b1caa7c100150f9872236e5866dec072ea2fa86747ce38e1cd3204aa6c5072',78732,'gallery-frame'],
  ['17c571accc4ed2554731d4ce89f3cad4faa66cf2bca83321ecd92ad2537093d9',101768,'black-aluminum-frame'],
  ['b21ee369bf9e2d958d9ff2c03cf2457bbd22669c7d1621c379bebcb6330a8c89',147640,'brushed-silver-frame'],
  ['dd8a991193788ec10868e2c9947855af4b5ca2630ae9c3aecaa6bd7fb8478d15',642804,'classical-gilt-frame'],
  ['f10da86d63586d113d363a64572fedd7b70f926ad525bc927ab53c4212fd57bd',177988,'dark-baroque-frame'],
  ['06ac605194e7aa870c4c9c68c17e00b6d1256c421aba6ed9b169e7f873b7b8d9',177500,'natural-oak-flat-frame'],
  ['369cca20f6afad83040a20a903afaa55034c4767bd09f88520c6a137cdde997d',14068,'neutral-linen-liner-frame'],
  ['b3f0bf2e6dbe659b1484ea6425848ad96b88d0be4b61ca82f5a4694462a7e03e',196160,'walnut-stepped-frame'],
  ['8c20559389f667ed97879776ec6fd53bfff1cbd4c174177988cf24fe3732e00b',8728,'white-gallery-box-frame'],
 ];
 for(const [sha,bytes,id] of entries){assert.equal(sha.length,64);assert.equal(artworkFrameModel(sha,bytes)?.id,id);assert.equal(artworkFrameModel(sha,bytes+1),undefined);}
 assert.equal(artworkFrameModel(entries.at(-1)[0]+'7',8728),undefined);
});


test('versioned tangent-omission candidates retain source identity and exact geometry',async()=>{
 const {artworkFrameModel}=await import('./artwork-frame-models.mjs');
 const candidates=[
  ['2fb941a9f6ed030638512e917e348a0a3000e29c1133fe3f9670268ff1c4169c',101720,'17c571accc4ed2554731d4ce89f3cad4faa66cf2bca83321ecd92ad2537093d9',101768],
  ['a0d0c0d3f02fea91b6a09273eec8d200248a16c8caf5139bd029b681af8eddcd',147592,'b21ee369bf9e2d958d9ff2c03cf2457bbd22669c7d1621c379bebcb6330a8c89',147640],
  ['5af789b1aa8e6aa410b40cf16e27c9e2000f87438f1fa52cb08bc46c19c75778',177476,'06ac605194e7aa870c4c9c68c17e00b6d1256c421aba6ed9b169e7f873b7b8d9',177500],
 ];
 for(const [sha,bytes,sourceSha,sourceBytes] of candidates){const model=artworkFrameModel(sha,bytes),source=artworkFrameModel(sourceSha,sourceBytes);assert.equal(model.version,2);assert.equal(model.id,source.id);assert.deepEqual(model.derivedFrom,{version:1,sha256:sourceSha,bytes:sourceBytes,recipe:'omit-unused-invalid-tangent-r1'});for(const key of ['openingWidth','openingHeight','front','wallAnchorZ','imagePlaneZ','depth'])assert.equal(model[key],source[key]);assert.equal(artworkFrameModel(sha,bytes+1),undefined);}
});
