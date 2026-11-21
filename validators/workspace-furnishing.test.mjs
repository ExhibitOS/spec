// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWorkspaceFurnishings} from './workspace-furnishing.mjs';
import {qualifiedModularPortalTarget,workspaceFitGeometry} from './workspace-fit-models.mjs';
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture(){const room={id:id(1),dimensions:{width:6,height:3,depth:8}},exhibition={rooms:[room]},descriptor={id:id(2),version:1,kind:'pedestal',name:'Synthetic plinth',rights:{holder:'Synthetic',ownership:'owner',licenseId:'CC0-1.0',creditLine:'Synthetic',permissions:{display:true,download:true,export:true,commercial:true}},provenance:'Synthetic fixture',model:{mime:'model/gltf-binary',bytes:100,sha256:'a'.repeat(64)}},value={version:1,furnishings:[descriptor],placements:[{id:id(3),roomId:room.id,furnishingId:descriptor.id,furnishingVersion:1,position:[1,0,0],yaw:0,scale:1}]};return {exhibition,value};}
test('accepts a visual placement referencing a declared workspace furnishing',()=>{const f=fixture();assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);});
test('preserves optional plain-baseboard metadata without relaxing portal fit or closed wall fields',()=>{
 const make=()=>{
  const f=fixture(),item=f.value.furnishings[0],pose={position:[0,1.5,0],rotation:[0,0,0,1],scale:[1,1,1]};
  item.kind='portal-finish';item.model={mime:'model/gltf-binary',bytes:164044,sha256:'385a3a6d5266a5dda5b3fc6e51fd14e0b990e29de66ee27a80b634a93ef2591b'};
  f.exhibition.rooms[0].transform=structuredClone(pose);f.exhibition.surfaces=[{id:id(4),roomId:id(1),type:'wall',transform:structuredClone(pose)}];
  f.exhibition.openings=[{id:id(5),surfaceId:id(4),type:'door',dimensions:{width:2.4,height:2.6},offset:[0,-.2]}];
  f.value={version:6,furnishings:[item],placements:[],frameAttachments:[],openingAttachments:[{openingId:id(5),furnishingId:item.id,furnishingVersion:1,modelSha256:item.model.sha256}]};
  const wall={surfaceId:id(4),depth:.2,preset:'plain',trimWidth:.02,baseboardHeight:.04,ceilingBand:false};
  f.exhibition.extensions={'org.exhibitos.studio/architectural-finishes':{version:1,walls:[wall]}};return {...f,wall};
 };
 for(const flag of [undefined,false,true]){const f=make();if(flag!==undefined)f.wall.plainBaseboard=flag;const before=structuredClone(f);assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);assert.deepEqual(f,before);}
 for(const mutate of [f=>{f.wall.plainBaseboard='true';},f=>{f.wall.plainBaseboard=true;f.wall.preset='painted-edge';},f=>{f.wall.plainBaseboard=true;f.wall.depth=.12;},f=>{f.wall.plainBaseboard=true;f.wall.extra=true;}]){const f=make();mutate(f);assert.ok(validateWorkspaceFurnishings(f.value,f.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));}
});
test('v6 binds only the exact fixed portal to a compatible floor-aligned door',()=>{
 const sha='385a3a6d5266a5dda5b3fc6e51fd14e0b990e29de66ee27a80b634a93ef2591b';
 const make=()=>{const f=fixture(),item=f.value.furnishings[0];item.kind='portal-finish';item.model.sha256=sha;item.model.bytes=164044;const pose={position:[0,1.5,0],rotation:[0,0,0,1],scale:[1,1,1]};f.exhibition.rooms[0].transform=structuredClone(pose);f.exhibition.surfaces=[{id:id(4),roomId:id(1),type:'wall',transform:structuredClone(pose)}];f.exhibition.openings=[{id:id(5),surfaceId:id(4),type:'door',dimensions:{width:2.4,height:2.6},offset:[0,-.2]}];f.value={version:6,furnishings:[item],placements:[],frameAttachments:[],openingAttachments:[{openingId:id(5),furnishingId:item.id,furnishingVersion:1,modelSha256:sha}]};return f;};
 const ok=make();assert.equal(validateWorkspaceFurnishings(ok.value,ok.exhibition).valid,true);
 for(const [mutate,code] of [[f=>f.value.openingAttachments[0].openingId=id(9),'PORTAL_TARGET_STALE'],[f=>f.exhibition.openings[0].type='window','PORTAL_TARGET_STALE'],[f=>f.exhibition.openings[0].dimensions.width=2.3,'PORTAL_SIZE_UNSUPPORTED'],[f=>f.exhibition.openings[0].offset[1]=0,'PORTAL_TRANSFORM_UNSUPPORTED'],[f=>f.exhibition.surfaces[0].transform.scale=[2,1,1],'PORTAL_TRANSFORM_UNSUPPORTED'],[f=>f.value.furnishings[0].model.bytes++,'PORTAL_ASSET_UNSUPPORTED'],[f=>f.value.openingAttachments[0].modelSha256='0'.repeat(64),'PORTAL_ASSET_UNSUPPORTED'],[f=>f.value.openingAttachments.push({...f.value.openingAttachments[0]}),'PORTAL_TARGET_STALE']]){const f=make();mutate(f);assert.ok(validateWorkspaceFurnishings(f.value,f.exhibition).errors.some(e=>e.code===code),code);}
 const old=make();old.value.version=5;assert.equal(validateWorkspaceFurnishings(old.value,old.exhibition).valid,false);
 const empty=make();empty.value.openingAttachments=[];assert.equal(validateWorkspaceFurnishings(empty.value,empty.exhibition).valid,false);
 const thick=make();thick.exhibition.extensions={'org.exhibitos.studio/architectural-finishes':{version:1,walls:[{surfaceId:id(4),depth:.12,preset:'plain',trimWidth:.04,baseboardHeight:.1,ceilingBand:false}]}};assert.ok(validateWorkspaceFurnishings(thick.value,thick.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));thick.exhibition.extensions['org.exhibitos.studio/architectural-finishes'].walls[0].depth=.2;assert.equal(validateWorkspaceFurnishings(thick.value,thick.exhibition).valid,true);
 thick.exhibition.extensions['org.exhibitos.studio/architectural-finishes'].walls.push({...thick.exhibition.extensions['org.exhibitos.studio/architectural-finishes'].walls[0],surfaceId:id(4).toUpperCase(),depth:.12});assert.ok(validateWorkspaceFurnishings(thick.value,thick.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));
 const malformed=make();malformed.exhibition.extensions={'org.exhibitos.studio/architectural-finishes':{version:1,walls:{}}};assert.ok(validateWorkspaceFurnishings(malformed.value,malformed.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));
 const duplicate=make();duplicate.exhibition.openings.push({...duplicate.exhibition.openings[0],id:id(5).toUpperCase()});assert.ok(validateWorkspaceFurnishings(duplicate.value,duplicate.exhibition).errors.some(e=>e.code==='PORTAL_TARGET_STALE'));
 const missing=make();missing.exhibition.openings={};assert.ok(validateWorkspaceFurnishings(missing.value,missing.exhibition).errors.some(e=>e.code==='PORTAL_TARGET_STALE'));
 const moved=make();moved.exhibition.surfaces.push({...structuredClone(moved.exhibition.surfaces[0]),id:id(7)});moved.exhibition.openings[0].surfaceId=id(7);assert.equal(validateWorkspaceFurnishings(moved.value,moved.exhibition).valid,true);
});
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
 for(const mutate of [f=>f.value.version=4,f=>f.value.furnishings[0].model.bytes++,f=>f.value.frameAttachments[0].modelSha256='a'.repeat(64),f=>f.exhibition.artworks[0].dimensions.height=.6,f=>f.exhibition.artworks[0].dimensions.depth=.025,f=>f.exhibition.placements[0].transform.scale=[1,2,1],f=>f.exhibition.placements[0].assetId=id(9)]){const f=make();mutate(f);assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);}
});


test('black float record admits only its exact bytes and existing flat image profile',async()=>{
 const {artworkFrameModel}=await import('./artwork-frame-models.mjs'),sha='d4bdc4201fe2e8866652350915799a346ba07cf73078fec9f7f6e275287e918a';
 const model=artworkFrameModel(sha,152056);assert.deepEqual(model,{id:'black-float-frame',version:1,sha256:sha,bytes:152056,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-.037,depth:.045});assert.equal(artworkFrameModel(sha,152057),undefined);assert.equal(artworkFrameModel('0'.repeat(64),152056),undefined);
 const make=()=>{const f=fixture(),item=f.value.furnishings[0];item.kind='artwork-frame';item.model.bytes=152056;item.model.sha256=sha;f.value={version:5,furnishings:[item],placements:[],frameAttachments:[{placementId:id(4),artworkRevisionId:id(5),assetId:id(6),furnishingId:item.id,furnishingVersion:1,modelSha256:sha}]};f.exhibition.rooms[0].transform={scale:[1,1,1]};f.exhibition.placements=[{id:id(4),roomId:f.exhibition.rooms[0].id,artworkRevisionId:id(5),assetId:id(6),transform:{scale:[1,1,1]}}];f.exhibition.artworks=[{revisionId:id(5),primaryAssetId:id(6),schemaVersion:'1.0.0-draft.1',artworkType:'image',dimensions:{width:.6,height:.8},transform:{scale:[1,1,1]}}];return f;};
 const accepted=make();assert.equal(validateWorkspaceFurnishings(accepted.value,accepted.exhibition).valid,true);
 for(const change of [f=>f.value.version=4,f=>f.value.furnishings[0].model.bytes++,f=>f.value.frameAttachments[0].modelSha256='0'.repeat(64),f=>f.exhibition.artworks[0].dimensions.width=.61,f=>f.exhibition.artworks[0].dimensions.depth=.025,f=>f.exhibition.rooms[0].transform.scale=[1,2,1]]){const f=make();change(f);assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);}
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

test('measured straight-ring frame fits two image sizes without relaxing legacy bounds',async()=>{
 const {artworkFrameFit,artworkFrameModel}=await import('./artwork-frame-models.mjs');
 const model=artworkFrameModel('a96b4942c2cd10b25fe1b33001443e1824fc125bc258f28a68547d38d8c54362',3380);
 for(const [width,height] of [[.934,.732],[.8,.6]]){
  const fit=artworkFrameFit(model,width,height);
  assert.ok(Math.abs(model.openingWidth+2*fit.cornerX-width-.006)<1e-9);
  assert.ok(Math.abs(model.openingHeight+2*fit.cornerY-height-.006)<1e-9);
 }
 assert.equal(artworkFrameFit(model,.799,.6),undefined);
});

test('asymmetric pale portal requires the measured reciprocal finished walls',async()=>{
 const {pairedPortalFit}=await import('./portal-finish-models.mjs');
 const pose=(position,rotation=[0,0,0,1])=>({position,rotation,scale:[1,1,1]});
 const doc={rooms:[{id:id(1),transform:pose([0,0,0])},{id:id(2),transform:pose([0,0,-7])}],surfaces:[
  {id:id(3),type:'wall',roomId:id(1),transform:pose([0,2,-1.99])},
  {id:id(4),type:'wall',roomId:id(2),transform:pose([0,2,4.99],[0,1,0,0])},
 ],openings:[
  {id:id(5),type:'door',surfaceId:id(3),offset:[0,-.5],dimensions:{width:2.4,height:3},connectsToOpeningId:id(6)},
  {id:id(6),type:'door',surfaceId:id(4),offset:[0,-.5],dimensions:{width:2.4,height:3},connectsToOpeningId:id(5)},
 ],extensions:{'org.exhibitos.studio/architectural-finishes':{version:1,walls:[
  {surfaceId:id(3),depth:.12,preset:'plain'},
  {surfaceId:id(4),depth:.12,preset:'dark-edge'},
 ]}}};
 assert.equal(pairedPortalFit(doc,id(5)),true);
 assert.equal(pairedPortalFit(doc,id(6)),false);
 const {qualifiedRectangularPortalTarget}=await import('./workspace-fit-models.mjs');
 const fitted=structuredClone(doc);for(const wall of fitted.surfaces)wall.dimensions={width:6,height:4};
 const measured={profile:'rectangular-portal-v1',openingWidth:1.2,openingHeight:2.2,minZ:-.09,maxZ:.06};
 assert.deepEqual(qualifiedRectangularPortalTarget(measured,fitted,id(5)),{width:2.4,height:3,minZ:-.082,maxZ:.06});
 assert.equal(qualifiedRectangularPortalTarget(measured,fitted,id(6)),undefined);
 fitted.openings.push({id:id(8),surfaceId:id(4),type:'window',dimensions:{width:1,height:1},offset:[1.72,0]});
 assert.equal(qualifiedRectangularPortalTarget(measured,fitted,id(5)),undefined);
 for(const mutate of [
  d=>{d.openings[1].connectsToOpeningId=id(7);},
  d=>{d.surfaces[1].transform.position[2]+=.01;},
  d=>{d.surfaces[1].transform.rotation=[0,Math.cos(.00025),0,Math.sin(.00025)];},
  d=>{d.openings[1].dimensions.height=2.6;},
  d=>{d.extensions['org.exhibitos.studio/architectural-finishes'].walls[0].depth=.2;},
 ]){const bad=structuredClone(doc);mutate(bad);assert.equal(pairedPortalFit(bad,id(5)),false);}
});

test('v7 binds measured frame geometry to the source across two image sizes',()=>{
 const f=fixture(),item=f.value.furnishings[0],sha=item.model.sha256;
 item.kind='artwork-frame';
 item.fit={version:1,sourceSha256:sha,sourceBytes:item.model.bytes,geometry:{profile:'straight-ring-v1',openingWidth:.806,openingHeight:.606,imagePlaneZ:-.012}};
 const transform={scale:[1,1,1]};
 f.exhibition.rooms[0].transform=transform;
 f.exhibition.placements=[{id:id(4),roomId:id(1),artworkRevisionId:id(5),assetId:id(6),transform}];
 f.exhibition.artworks=[{revisionId:id(5),primaryAssetId:id(6),schemaVersion:'1.0.0-draft.1',artworkType:'image',dimensions:{width:.8,height:.6},transform}];
 f.value={version:7,furnishings:[item],placements:[],openingAttachments:[],frameAttachments:[{placementId:id(4),artworkRevisionId:id(5),assetId:id(6),furnishingId:item.id,furnishingVersion:1,modelSha256:sha}]};
 assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);
 f.exhibition.artworks[0].dimensions={width:1,height:.8};
 assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);
 item.fit.sourceBytes++;
 assert.ok(validateWorkspaceFurnishings(f.value,f.exhibition).errors.some(e=>e.code==='FURNISHING_FIT_BINDING'));
 item.fit.sourceBytes--;
 f.value.version=6;
 assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
});

test('v7 mounts an exact measured continuous portal on its plain centred wall',()=>{
 for(const [width,height,depth] of [[2.4,2.6,.2],[1.4,2.2,.12]]){
  const f=fixture(),item=f.value.furnishings[0],sha=item.model.sha256;
  item.kind='portal-finish';
  item.fit={version:1,sourceSha256:sha,sourceBytes:item.model.bytes,geometry:{profile:'continuous-portal-v1',openingWidth:width,openingHeight:height,minZ:-depth/2,maxZ:depth/2}};
  const transform={position:[0,1.5,0],rotation:[0,0,0,1],scale:[1,1,1]};
  f.exhibition.rooms[0].transform=transform;
  f.exhibition.surfaces=[{id:id(4),roomId:id(1),type:'wall',dimensions:{width:6,height:3},transform}];
  const opening={id:id(5),surfaceId:id(4),type:'door',dimensions:{width,height},offset:[0,height/2-1.5]};
  f.exhibition.openings=[opening];
  const finish={surfaceId:id(4),depth,preset:'plain',trimWidth:.04,baseboardHeight:.1,ceilingBand:false};
  f.exhibition.extensions={'org.exhibitos.studio/architectural-finishes':{version:1,walls:[finish]}};
  f.value={version:7,furnishings:[item],placements:[],frameAttachments:[],openingAttachments:[{openingId:opening.id,furnishingId:item.id,furnishingVersion:1,modelSha256:sha}]};
  assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);
  finish.depth-=.02;
  assert.ok(validateWorkspaceFurnishings(f.value,f.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));
  finish.depth=depth;
  opening.connectsToOpeningId=id(7);
  assert.ok(validateWorkspaceFurnishings(f.value,f.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));
  delete opening.connectsToOpeningId;
  const adjacent={id:id(8),surfaceId:id(4),type:'window',dimensions:{width:1,height:1},offset:[width/2+.52,0]};
  f.exhibition.openings.push(adjacent);
  assert.ok(validateWorkspaceFurnishings(f.value,f.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));
  adjacent.offset[0]+=0.05;
  assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);
  opening.offset[0]=(6-width)/2-.01;
  assert.ok(validateWorkspaceFurnishings(f.value,f.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));
 }
});

test('v7 rectangular portal fits a newly measured source to two opening sizes without weakening the legacy profile',()=>{
 for(const [width,height,depth] of [[2.4,3,.12],[1.2,2.2,.2]]){
  const f=fixture(),item=f.value.furnishings[0];item.kind='portal-finish';
  item.fit={version:1,sourceSha256:item.model.sha256,sourceBytes:item.model.bytes,geometry:{profile:'rectangular-portal-v1',openingWidth:1.8,openingHeight:2.4,minZ:-.082,maxZ:.06}};
  const pose={position:[0,2,0],rotation:[0,0,0,1],scale:[1,1,1]};
  f.exhibition.rooms[0].transform={...pose,position:[0,0,0]};
  f.exhibition.surfaces=[{id:id(4),roomId:id(1),type:'wall',dimensions:{width:6,height:4},transform:pose}];
  f.exhibition.openings=[{id:id(5),surfaceId:id(4),type:'door',dimensions:{width,height},offset:[0,height/2-2]}];
  f.exhibition.extensions={'org.exhibitos.studio/architectural-finishes':{version:1,walls:[{surfaceId:id(4),depth,preset:'plain',trimWidth:.04,baseboardHeight:.1,ceilingBand:false}]}};
  f.value={version:7,furnishings:[item],placements:[],frameAttachments:[],openingAttachments:[{openingId:id(5),furnishingId:item.id,furnishingVersion:1,modelSha256:item.model.sha256}]};
  assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);
  item.fit.geometry.profile='continuous-portal-v1';
  assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
  item.fit.geometry.profile='rectangular-portal-v1';
  f.exhibition.openings.push({id:id(8),surfaceId:id(4),type:'window',dimensions:{width:1,height:1},offset:[width/2+.52,0]});
  assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
  f.exhibition.openings.pop();item.fit.sourceSha256='b'.repeat(64);
  assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
 }
});

// Synthetic receipt metadata checks only; binary family qualification is the producer's job.
test('v9 source-bound miter frames preserve target bindings and reject older envelopes',async()=>{
 const {workspaceFitGeometry,qualifiedFrameTargetFit}=await import('./workspace-fit-models.mjs');
 const make=()=>{const f=fixture(),item=f.value.furnishings[0],transform={scale:[1,1,1]};item.kind='artwork-frame';item.fit={version:1,sourceSha256:item.model.sha256,sourceBytes:item.model.bytes,geometry:{profile:'straight-miter-ring-v1',openingWidth:.6,openingHeight:.8,imagePlaneZ:-.012}};
  f.exhibition.rooms[0].transform=transform;f.exhibition.placements=[{id:id(4),roomId:id(1),artworkRevisionId:id(5),assetId:id(6),transform}];f.exhibition.artworks=[{revisionId:id(5),primaryAssetId:id(6),schemaVersion:'1.0.0-draft.1',artworkType:'image',dimensions:{width:.934,height:.732},transform}];
  f.value={version:9,furnishings:[item],placements:[],openingAttachments:[],frameAttachments:[{placementId:id(4),artworkRevisionId:id(5),assetId:id(6),furnishingId:item.id,furnishingVersion:1,modelSha256:item.model.sha256}]};return f;};
 for(const [width,height] of [[.934,.732],[.8,.6],[.4,2]]){const f=make();f.exhibition.artworks[0].dimensions={width,height};assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);const g=workspaceFitGeometry(f.value.furnishings[0]),fit=qualifiedFrameTargetFit(g,width,height);assert.ok(Math.abs(g.openingWidth+2*fit.cornerX-width-.006)<1e-9);assert.ok(Math.abs(g.openingHeight+2*fit.cornerY-height-.006)<1e-9);}
 for(const version of [4,5,6,7,8]){const f=make();f.value.version=version;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);}
 for(const mutate of [f=>f.value.furnishings[0].fit.sourceBytes++,f=>f.value.furnishings[0].fit.sourceSha256='b'.repeat(64),f=>f.value.furnishings[0].fit.geometry.imagePlaneZ=0,f=>f.value.furnishings[0].fit.geometry.openingWidth=2.1,f=>f.value.frameAttachments[0].modelSha256='b'.repeat(64),f=>f.value.frameAttachments[0].artworkRevisionId=id(99),f=>f.exhibition.artworks[0].dimensions.width=.399,f=>f.exhibition.placements[0].transform={scale:[2,1,1]},f=>f.value.furnishings[0].fit.geometry.profile='straight-ring-v1']){const f=make();mutate(f);assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);}
});

test('portal validation admits twenty unique existing finished wall faces and refuses a twenty-first or duplicate',()=>{
 const f=fixture(),pose=(position,rotation=[0,0,0,1])=>({position,rotation,scale:[1,1,1]});
 f.exhibition.rooms=Array.from({length:6},(_,i)=>({id:id(100+i),dimensions:{width:6,height:3,depth:8},transform:pose([i*10,0,0])}));
 f.exhibition.surfaces=f.exhibition.rooms.flatMap((room,i)=>[
  {id:id(200+i*4),roomId:room.id,type:'wall',transform:pose([0,1.5,-4])},
  {id:id(201+i*4),roomId:room.id,type:'wall',transform:pose([3,1.5,0],[0,-Math.SQRT1_2,0,Math.SQRT1_2])},
  {id:id(202+i*4),roomId:room.id,type:'wall',transform:pose([0,1.5,4],[0,1,0,0])},
  {id:id(203+i*4),roomId:room.id,type:'wall',transform:pose([-3,1.5,0],[0,Math.SQRT1_2,0,Math.SQRT1_2])},
 ]);
 const source=f.value.furnishings[0];source.kind='portal-finish';source.fit={version:1,sourceSha256:source.model.sha256,sourceBytes:source.model.bytes,geometry:{profile:'continuous-portal-v1',openingWidth:2.4,openingHeight:2.6,minZ:-.06,maxZ:.06}};
 for(const wall of f.exhibition.surfaces)wall.dimensions={width:wall.id===id(201)||wall.id===id(203)?8:6,height:3};
 f.exhibition.openings=[{id:id(500),surfaceId:id(200),type:'door',dimensions:{width:2.4,height:2.6},offset:[0,-.2]}];
 f.value={version:7,furnishings:[source],placements:[],frameAttachments:[],openingAttachments:[{openingId:id(500),furnishingId:source.id,furnishingVersion:1,modelSha256:source.model.sha256}]};
 const finish=surface=>({surfaceId:surface.id,preset:'plain',depth:.12,trimWidth:.02,baseboardHeight:.04,ceilingBand:false});
 const rows=f.exhibition.surfaces.slice(0,20).map(finish);f.exhibition.extensions={'org.exhibitos.studio/architectural-finishes':{version:1,walls:rows}};
 const result=validateWorkspaceFurnishings(f.value,f.exhibition);assert.equal(result.valid,true,JSON.stringify(result));
 rows.push(finish(f.exhibition.surfaces[20]));assert.ok(validateWorkspaceFurnishings(f.value,f.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));
 rows.pop();rows[19]={...rows[0],surfaceId:rows[0].surfaceId.toUpperCase()};assert.ok(validateWorkspaceFurnishings(f.value,f.exhibition).errors.some(e=>e.code==='PORTAL_WALL_DEPTH_UNSUPPORTED'));
});


test('source-bound modular portals fit the measured coincident plain/painted room boundary',()=>{
 const pose=(position,rotation=[0,0,0,1])=>({position,rotation,scale:[1,1,1]});
 const dimensions={width:4,height:4,depth:4};
 const rooms=[{id:id(1),dimensions,transform:pose([0,0,0])},{id:id(2),dimensions,transform:pose([0,0,-4])}];
 const surfaces=[{id:id(3),roomId:id(1),type:'wall',dimensions:{width:4,height:4},transform:pose([0,2,-2])},
  {id:id(4),roomId:id(2),type:'wall',dimensions:{width:4,height:4},transform:pose([0,2,2],[0,1,0,0])}];
 const openings=surfaces.map((wall,i)=>({id:id(5+i),surfaceId:wall.id,type:'door',
  offset:[0,-.5],dimensions:{width:2.4,height:3},connectsToOpeningId:id(6-i)}));
 const finish=surfaces.map((wall,i)=>({surfaceId:wall.id,preset:i?'painted-edge':'plain',
  depth:.12,trimWidth:.04,baseboardHeight:.04,ceilingBand:false}));
 const exhibition={rooms,surfaces,openings,extensions:{'org.exhibitos.studio/architectural-finishes':{version:1,walls:finish}}};
 const item=fixture().value.furnishings[0];
 Object.assign(item,{id:id(7),kind:'portal-finish',model:{mime:'model/gltf-binary',bytes:164044,
  sha256:'385a3a6d5266a5dda5b3fc6e51fd14e0b990e29de66ee27a80b634a93ef2591b'}});
 const parts={};
 for(const face of ['front','back','reveal'])for(const side of ['left','right','head']){
  const trim=face==='reveal'?.025:.04;
  const [minX,maxX]=side==='left'?[-1.2-trim,-1.2]:side==='right'?[1.2,1.2+trim]:[-1.2-trim,1.2+trim];
  const [minZ,maxZ]=face==='front'?[.1,.106]:face==='back'?[-.106,-.1]:[-.1,.1];
  parts[face+'-'+side]={node:Object.keys(parts).length,min:[minX,side==='head'?2.6:0,minZ],
   max:[maxX,side==='head'?2.6+trim:2.6,maxZ]};
 }
 item.fit={version:1,sourceSha256:item.model.sha256,sourceBytes:item.model.bytes,
  geometry:{profile:'modular-portal-v1',openingWidth:2.4,openingHeight:2.6,minZ:-.1,maxZ:.1,parts}};
 const value={version:11,furnishings:[item],placements:[],frameAttachments:[],ceilingAttachments:[],
  openingAttachments:[{openingId:id(5),furnishingId:item.id,furnishingVersion:1,modelSha256:item.model.sha256}]};
 const target=(doc,source=item)=>qualifiedModularPortalTarget(workspaceFitGeometry(source),doc,id(5),source);
 const expected={width:2.4,height:3,minZ:-.06,maxZ:.06};
 assert.deepEqual(target(exhibition),{...expected,coincidentPair:{hostSurfaceId:id(3),peerSurfaceId:id(4),hostSpan:[-2,2],peerSpan:[-2,2]}});
 assert.equal(validateWorkspaceFurnishings(value,exhibition).valid,true);
 assert.equal(qualifiedModularPortalTarget(workspaceFitGeometry(item),exhibition,id(5)),undefined);
 assert.equal(qualifiedModularPortalTarget(workspaceFitGeometry(item),exhibition,id(6),item),undefined);
 const wrongDigest=structuredClone(item);wrongDigest.model.sha256='a'.repeat(64);
 const wrongBytes=structuredClone(item);wrongBytes.fit.sourceBytes++;
 const wrongSection=structuredClone(item);wrongSection.fit.geometry.parts['front-left'].max[2]+=.002;
 for(const invalid of [wrongDigest,wrongBytes,wrongSection])assert.equal(target(exhibition,invalid),undefined);
 assert.equal(qualifiedModularPortalTarget(structuredClone(item.fit.geometry),exhibition,id(5),item),undefined);

 // The alternate geometry token describes a measured nine-rail source with
 // different clear dimensions and immutable source identity.
 const alternate=structuredClone(item);
 alternate.id=id(9);
 alternate.model={...item.model,bytes:1200,sha256:'a'.repeat(64)};
 const {geometry}=alternate.fit;
 alternate.fit.sourceSha256=alternate.model.sha256;
 alternate.fit.sourceBytes=alternate.model.bytes;
 geometry.openingWidth=1.1;
 geometry.openingHeight=2.2;
 for(const [role,part] of Object.entries(geometry.parts)){
  part.min[0]+=role.endsWith('-right')?-.65:.65;
  part.max[0]+=role.endsWith('-left')?.65:-.65;
  if(role.endsWith('-head'))part.min[1]-=.4;
  part.max[1]-=.4;
 }
 const alternativeValue={...value,furnishings:[alternate],openingAttachments:[{...value.openingAttachments[0],
  furnishingId:alternate.id,modelSha256:alternate.model.sha256}]};
 // Approved full walls: the two local offsets are both positive, but the
 // opposite wall normals place both openings at world X=11 and Z=-2.
 const full=structuredClone(exhibition);
 full.rooms[0].dimensions={width:10,depth:10,height:4};
 full.rooms[1].dimensions={width:11,depth:4,height:4};
 full.rooms[0].transform=pose([13,0,-7]);
 full.rooms[1].transform=pose([7.5,0,0]);
 full.surfaces[0].dimensions.width=10;
 full.surfaces[0].transform=pose([0,2,5],[0,1,0,0]);
 full.surfaces[1].dimensions.width=11;
 full.surfaces[1].transform=pose([0,2,-2]);
 full.openings[0].offset=[2,-.5];
 full.openings[1].offset=[3.5,-.5];
 assert.deepEqual(target(full),{...expected,coincidentPair:{hostSurfaceId:id(3),peerSurfaceId:id(4),hostSpan:[0,5],peerSpan:[.5,5.5]}});
 assert.equal(validateWorkspaceFurnishings(value,full).valid,true);
 for(const [width,height] of [[2.4,3],[2.2,2.8],[2.3,2.9]]){
  const resized=structuredClone(full);
  for(const cut of resized.openings){
   cut.dimensions={width,height};
   cut.offset[1]=(height-4)/2;
  }
  const before=structuredClone(resized);
  for(const [source,settings] of [[item,value],[alternate,alternativeValue]]){
   assert.deepEqual(target(resized,source),{...target(full),width,height});
   assert.equal(validateWorkspaceFurnishings(settings,resized).valid,true);
   assert.equal(qualifiedModularPortalTarget(workspaceFitGeometry(source),resized,id(6),source),undefined);
  }
  assert.deepEqual(resized,before);

  const remapped=structuredClone(resized);
  const settings=structuredClone(alternativeValue);
  const [host,peer]=remapped.openings;
  host.id=id(31);host.connectsToOpeningId=id(32);
  peer.id=id(32);peer.connectsToOpeningId=id(31);
  for(const [i,wall] of remapped.surfaces.entries()){
   wall.id=id(41+i);
   remapped.openings[i].surfaceId=wall.id;
   remapped.extensions['org.exhibitos.studio/architectural-finishes'].walls[i].surfaceId=wall.id;
  }
  settings.furnishings[0].id=id(51);
  Object.assign(settings.openingAttachments[0],{openingId:host.id,furnishingId:id(51)});
  const remappedSource=settings.furnishings[0];
  assert.deepEqual(qualifiedModularPortalTarget(workspaceFitGeometry(remappedSource),remapped,host.id,remappedSource),
   {...target(resized,alternate),coincidentPair:{...target(resized,alternate).coincidentPair,hostSurfaceId:id(41),peerSurfaceId:id(42)}});
  assert.equal(validateWorkspaceFurnishings(settings,remapped).valid,true);

  const fixedInset=structuredClone(resized);
  fixedInset.rooms[1].transform.position[2]+=.02;
  assert.equal(target(fixedInset,alternate)!==undefined,width===2.4);
 }
 for(const edit of [
  d=>{d.surfaces[1].dimensions.width-=1;},
  d=>{d.openings[1].offset[0]= -2;},
  d=>{d.rooms[1].transform.position[2]+=.01;},
  d=>{d.openings[0].offset[0]=.5;d.openings[1].offset[0]=5;},
  d=>{d.openings[0].offset[0]=1.21;d.openings[1].offset[0]=4.29;},
  d=>{for(const cut of d.openings){cut.dimensions.width=2.41;}},
  d=>{for(const cut of d.openings){cut.dimensions.height=2.19;cut.offset[1]=(2.19-4)/2;}},
 ]){
  const invalid=structuredClone(full);edit(invalid);assert.equal(target(invalid),undefined);
 }
 const inset=structuredClone(exhibition);
 inset.surfaces[0].transform.position[2]+=.01;
 inset.surfaces[1].transform.position[2]-=.01;
 assert.deepEqual(target(inset),{...expected,minZ:-.08});
 const structure='org.exhibitos.studio/paired-wall-structure';
 const workspace='org.exhibitos.studio/workspace-furnishings';
 const attachedInset=structuredClone(inset);
 attachedInset.extensions[workspace]=structuredClone(value);
 attachedInset.extensions[structure]={version:1,pairs:[{
  openingId:id(5),peerOpeningId:id(6),side:'positive-normal',extensionMeters:.04,
 }]};
 const mounted=attachedInset.extensions[workspace].furnishings[0];
 assert.deepEqual(target(attachedInset,mounted),{width:2.4,height:3,minZ:-.08,maxZ:.10,attachedExtent:.04});
 assert.equal(validateWorkspaceFurnishings(attachedInset.extensions[workspace],attachedInset).valid,true);
 const extendedCoincident=structuredClone(exhibition);
 extendedCoincident.extensions[workspace]=structuredClone(value);
 extendedCoincident.extensions[structure]=structuredClone(attachedInset.extensions[structure]);
 assert.equal(target(extendedCoincident),undefined);
 assert.equal(validateWorkspaceFurnishings(extendedCoincident.extensions[workspace],extendedCoincident).valid,false);
 const legacy='org.exhibitos.studio/furnishing-visuals';
 for(const hostId of [id(5),id(6)]){
  const ambiguous=structuredClone(attachedInset);
  ambiguous.extensions[legacy]={version:1,bindings:[{hostKind:'opening',hostId}]};
  assert.equal(target(ambiguous,ambiguous.extensions[workspace].furnishings[0]),undefined);
  assert.equal(validateWorkspaceFurnishings(ambiguous.extensions[workspace],ambiguous).valid,false);
 }
 const unrelatedLegacy=structuredClone(attachedInset);
 unrelatedLegacy.extensions[legacy]={version:1,bindings:[{hostKind:'opening',hostId:id(99)}]};
 assert.deepEqual(target(unrelatedLegacy,unrelatedLegacy.extensions[workspace].furnishings[0]),target(attachedInset,mounted));
 for(const deny of [
  d=>{d.extensions[structure].pairs[0].side='negative-normal';},
  d=>{d.extensions[structure].pairs[0].openingId=id(6);d.extensions[structure].pairs[0].peerOpeningId=id(5);},
  d=>{d.extensions[structure].pairs[0].revealFinish='painted-edge';},
  d=>{d.extensions[workspace].openingAttachments=[];},
  d=>{d.extensions[workspace].openingAttachments[0].modelSha256='0'.repeat(64);},
  d=>{d.extensions[workspace].openingAttachments.push({...d.extensions[workspace].openingAttachments[0],openingId:id(6)});},
  d=>{d.extensions[structure].pairs.push({...d.extensions[structure].pairs[0]});},
  d=>{d.extensions[structure].pairs[0].extensionMeters=.121;},
  d=>{d.openings[1].offset[0]+=.002;},
 ]){
  const invalid=structuredClone(attachedInset);deny(invalid);
  assert.equal(target(invalid,invalid.extensions[workspace].furnishings[0]),undefined);
 }
 const single=structuredClone(exhibition);delete single.openings[0].connectsToOpeningId;
 assert.deepEqual(target(single),expected);
 for(const mutate of [
  d=>{d.rooms[1].transform.position[2]-=.001;},
  d=>{d.openings[1].offset[0]+=.02;},
  d=>{d.openings[1].offset[1]+=.02;},
  d=>{d.openings[1].dimensions.height=2.9;},
  d=>{d.openings[0].dimensions.width-=.0000009;d.openings[1].dimensions.width+=.0000009;},
  d=>{for(const [i,opening] of d.openings.entries()){
   const change=i===0?-.0000009:.0000009;opening.dimensions.height+=change;opening.offset[1]+=change/2;
  }},
  d=>{delete d.openings[1].connectsToOpeningId;},
  d=>{d.surfaces[1].roomId=id(1);},
  d=>{d.surfaces[1].transform.rotation=[0,0,0,1];},
  d=>{d.surfaces[1].transform.rotation=[0,Math.cos(.01),0,Math.sin(.01)];},
  d=>{const yaw=.0005;d.surfaces[0].transform.rotation=[0,Math.sin(yaw/2),0,Math.cos(yaw/2)];
   d.surfaces[1].transform.rotation=[0,Math.sin((Math.PI+yaw)/2),0,Math.cos((Math.PI+yaw)/2)];},
  d=>{d.surfaces[1].dimensions.width=3.8;},
  d=>{d.extensions['org.exhibitos.studio/architectural-finishes'].walls[1].depth=.14;},
  d=>{d.extensions['org.exhibitos.studio/architectural-finishes'].walls[1].preset='plain';},
  d=>{d.openings.push({...d.openings[0],id:id(8),offset:[1.4,-1],dimensions:{width:.2,height:1}});},
 ]){const invalid=structuredClone(exhibition);mutate(invalid);assert.equal(target(invalid),undefined);}
});
