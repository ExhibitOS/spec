// SPDX-License-Identifier: Apache-2.0
// Structural and reference checks only. These do not establish ownership,
// resource availability, current permission or the contents of GLB bytes.
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {readFile} from 'node:fs/promises';
import {portalFinishModel,pairedPortalFit} from './portal-finish-models.mjs';
import {artworkFrameFit,artworkFrameModel} from './artwork-frame-models.mjs';
import {qualifiedFrameTargetFit,qualifiedModularPortalTarget,qualifiedRectangularPortalTarget,qualifiedPortalWallFit,workspaceFitGeometry} from './workspace-fit-models.mjs';
import {validateRights} from './artwork.mjs';
const load=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const ajv=new Ajv2020({strict:true,allErrors:true,coerceTypes:false,useDefaults:false,removeAdditional:false});
addFormats(ajv,['uuid','date-time']);ajv.addSchema(await load('../schemas/artwork.json'));ajv.addSchema(await load('../schemas/workspace-furnishing.json'));
ajv.addSchema(await load('../schemas/workspace-furnishing-v2.json'));ajv.addSchema(await load('../schemas/workspace-furnishing-v3.json'));
ajv.addSchema(await load('../schemas/workspace-furnishing-v4.json'));ajv.addSchema(await load('../schemas/workspace-furnishing-v5.json'));ajv.addSchema(await load('../schemas/workspace-furnishing-v6.json'));
const validateV1=ajv.compile(await load('../schemas/workspace-furnishing-placements.json'));
const validateV2=ajv.compile(await load('../schemas/workspace-furnishing-placements-v2.json'));
const validateV3=ajv.compile(await load('../schemas/workspace-furnishing-placements-v3.json'));
const validateV4=ajv.compile(await load('../schemas/workspace-furnishing-placements-v4.json'));
const validateV5=ajv.compile(await load('../schemas/workspace-furnishing-placements-v5.json'));
const validateV6=ajv.compile(await load('../schemas/workspace-furnishing-placements-v6.json'));
ajv.addSchema(await load('../schemas/workspace-furnishing-v7.json'));
const validateV7=ajv.compile(await load('../schemas/workspace-furnishing-placements-v7.json'));
ajv.addSchema(await load('../schemas/workspace-furnishing-v9.json'));
const validateV9=ajv.compile(await load('../schemas/workspace-furnishing-placements-v9.json'));
const THIN_BRASS_SHA256='4b14e45ccf14ed38eea90c50553733a0b97b1671b9ec377d900e5a947545f8b4';
export const WORKSPACE_FURNISHING_NAMESPACE='org.exhibitos.studio/workspace-furnishings';
export function validateWorkspaceFurnishings(value,exhibition){
 const validate=value?.version===9?validateV9:value?.version===1?validateV1:value?.version===2?validateV2:value?.version===3?validateV3:value?.version===4?validateV4:value?.version===5?validateV5:value?.version===6?validateV6:value?.version===7?validateV7:validateV1;
 if(!validate(value))return {valid:false,errors:validate.errors.slice(0,100).map(e=>({code:'FURNISHING_SCHEMA',path:e.instancePath,message:e.keyword}))};
 if(!Array.isArray(exhibition?.rooms))return {valid:false,errors:[{code:'FURNISHING_ROOMS',path:'',message:'Expected rooms'}]};
 const errors=[],ids=new Set(),rooms=new Map(),known=new Map(),used=new Set(),fits=new Map();
 for(const collection of ['rooms','surfaces','openings','placements','lights','mediaAssets','artworks'])for(const entity of Array.isArray(exhibition[collection])?exhibition[collection]:[]){if(!entity||typeof entity!=='object')continue;for(const id of [entity.id,entity.revisionId,...(Array.isArray(entity.assets)?entity.assets.map(a=>a?.id):[])])if(typeof id==='string')ids.add(id.toLowerCase());}
 const extensions=exhibition.extensions??{},builtin=extensions['org.exhibitos.studio/furnishing-visuals']?.assets,benches=extensions['org.exhibitos.studio/benches']?.benches,materials=extensions['org.exhibitos.studio/workspace-materials']?.materials;
 for(const id of [extensions['org.exhibitos.viewer/space-still']?.asset?.id,...(Array.isArray(builtin)?builtin.map(x=>x?.id):[]),...(Array.isArray(benches)?benches.map(x=>x?.id):[]),...(Array.isArray(materials)?materials.map(x=>x?.id):[])])if(typeof id==='string')ids.add(id.toLowerCase());
 for(const room of exhibition.rooms)if(room&&typeof room.id==='string')rooms.set(room.id,room);
 for(const [i,item] of value.furnishings.entries()){
  if(ids.has(item.id)||known.has(item.id))errors.push({code:'FURNISHING_DUPLICATE',path:'/furnishings/'+i,message:'Duplicate identity'});
  ids.add(item.id);known.set(item.id,item);
  if(item.fit!==undefined){const geometry=workspaceFitGeometry(item);if(geometry)fits.set(item.id,geometry);else errors.push({code:'FURNISHING_FIT_BINDING',path:'/furnishings/'+i+'/fit',message:'Fit must bind to the exact source and kind'});}
  if(item.name.trim()!==item.name||item.provenance.trim()!==item.provenance||item.name.length>120||item.provenance.length>1024)errors.push({code:'FURNISHING_TEXT',path:'/furnishings/'+i,message:'Text must be trimmed and within UTF-16 limits'});
  for(const error of validateRights(item.rights).errors)errors.push({...error,path:'/furnishings/'+i+error.path});
 }
 if(value.version===9&&![...fits.values()].some(f=>f.profile==='straight-miter-ring-v1'))errors.push({code:'FURNISHING_FIT_REQUIRED',path:'/furnishings',message:'Profile v9 requires a source-bound straight miter frame'});
 if(value.version===7&&fits.size===0)errors.push({code:'FURNISHING_FIT_REQUIRED',path:'/furnishings',message:'Profile v7 requires a source-bound fit'});
 for(const [i,p] of value.placements.entries()){
  const room=rooms.get(p.roomId),d=room?.dimensions,position=p.position;
  if(ids.has(p.id))errors.push({code:'FURNISHING_DUPLICATE',path:'/placements/'+i,message:'Duplicate identity'});ids.add(p.id);
  if(!known.has(p.furnishingId)||['artwork-frame','portal-finish'].includes(known.get(p.furnishingId)?.kind)||!d||![d.width,d.height,d.depth,...position,p.yaw,p.scale].every(Number.isFinite)||[d.width,d.height,d.depth].some(n=>n<=0)||Math.abs(position[0])>d.width/2||position[1]<0||position[1]>d.height||Math.abs(position[2])>d.depth/2)errors.push({code:'FURNISHING_REFERENCE',path:'/placements/'+i,message:'Missing room-visual furnishing or invalid room-local position'});
  used.add(p.furnishingId);
 }
 const openingIds=new Set();
 for(const [i,a] of (value.openingAttachments??[]).entries()){
  const path='/openingAttachments/'+i,source=known.get(a.furnishingId),same=(x,y)=>typeof x==='string'&&typeof y==='string'&&x.toLowerCase()===y.toLowerCase();
  const openings=Array.isArray(exhibition.openings)?exhibition.openings.filter(o=>same(o?.id,a.openingId)):[],opening=openings[0],walls=Array.isArray(exhibition.surfaces)?exhibition.surfaces.filter(s=>same(s?.id,opening?.surfaceId)):[],wall=walls[0],roomRows=exhibition.rooms.filter(r=>same(r?.id,wall?.roomId)),room=roomRows[0];
  if(openingIds.has(a.openingId.toLowerCase())||openings.length!==1||opening.type!=='door'||walls.length!==1||wall.type!=='wall'||roomRows.length!==1){errors.push({code:'PORTAL_TARGET_STALE',path,message:'Expected a unique existing door and wall'});continue;}openingIds.add(a.openingId.toLowerCase());
  const fit=fits.get(a.furnishingId);
  const modular=fit?.profile==='modular-portal-v1'||fit?.profile==='rectangular-portal-v1';
  const model=modular?{width:opening.dimensions?.width,height:opening.dimensions?.height,paired:false}:fit?.profile==='continuous-portal-v1'?{width:fit.openingWidth,height:fit.openingHeight,paired:false}:source&&portalFinishModel(source.model.sha256,source.model.bytes);
  if(!source||source.kind!=='portal-finish'||!model||a.modelSha256!==source.model.sha256){errors.push({code:'PORTAL_ASSET_UNSUPPORTED',path,message:'Expected a qualified or fixed portal model'});continue;}used.add(a.furnishingId);
  if(!opening.dimensions||![opening.dimensions.width,opening.dimensions.height].every(Number.isFinite)||Math.abs(opening.dimensions.width-model.width)>1e-6||Math.abs(opening.dimensions.height-model.height)>1e-6)errors.push({code:'PORTAL_SIZE_UNSUPPORTED',path,message:'Expected the fixed model opening dimensions'});
  const level=t=>Array.isArray(t?.scale)&&t.scale.length===3&&t.scale.every(n=>n===1)&&Array.isArray(t.rotation)&&t.rotation.length===4&&t.rotation.every(Number.isFinite)&&t.rotation[0]===0&&t.rotation[2]===0&&Math.abs(t.rotation[1]**2+t.rotation[3]**2-1)<=1e-6;
  if(![wall.transform,room.transform].every(level)||!Array.isArray(opening.offset)||opening.offset.length!==2||!opening.offset.every(Number.isFinite)||!Array.isArray(wall.transform?.position)||wall.transform.position.length!==3||!wall.transform.position.every(Number.isFinite)||Math.abs(wall.transform.position[1]+opening.offset[1]-model.height/2)>1e-6)errors.push({code:'PORTAL_TRANSFORM_UNSUPPORTED',path,message:'Expected level unit-scale wall and room with a floor-aligned door'});
  const ext=exhibition.extensions?.['org.exhibitos.studio/architectural-finishes'];let finish;
  if(ext!==undefined){
   const valid=ext&&typeof ext==='object'&&!Array.isArray(ext)&&Object.keys(ext).sort().join(',')==='version,walls'&&ext.version===1&&Array.isArray(ext.walls)&&ext.walls.length<=8;
   const seen=new Set();let malformed=!valid;
   if(valid)for(const f of ext.walls){const keys=f&&typeof f==='object'&&!Array.isArray(f)?Object.keys(f).sort().join(','):'';const id=typeof f?.surfaceId==='string'?f.surfaceId.toLowerCase():'';if(keys!=='baseboardHeight,ceilingBand,depth,preset,surfaceId,trimWidth'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)||seen.has(id)||![f.depth,f.trimWidth,f.baseboardHeight].every(Number.isFinite)||f.depth<.02||f.depth>.2||f.trimWidth<.02||f.trimWidth>.08||f.baseboardHeight<.04||f.baseboardHeight>.15||!['plain','painted-edge','dark-edge'].includes(f.preset)||typeof f.ceilingBand!=='boolean')malformed=true;seen.add(id);if(same(id,wall.id))finish=f;}
   if(malformed)errors.push({code:'PORTAL_WALL_DEPTH_UNSUPPORTED',path,message:'Expected valid, unique architectural wall finishes'});
  }
  if(fit?.profile==='rectangular-portal-v1'?!qualifiedRectangularPortalTarget(fit,exhibition,opening.id):fit?.profile==='modular-portal-v1'?!qualifiedModularPortalTarget(fit,exhibition,opening.id):fit?.profile==='continuous-portal-v1'?!qualifiedPortalWallFit(fit,opening,wall,finish,exhibition.openings):model.paired?!pairedPortalFit(exhibition,opening.id):finish&&Math.abs(finish.depth-.2)>1e-6)errors.push({code:'PORTAL_WALL_DEPTH_UNSUPPORTED',path,message:'Expected the fixed model wall finish and reveal'});
 }
 const attached=new Set();
 for(const [i,a] of (value.frameAttachments??[]).entries()){
  const path='/frameAttachments/'+i,source=known.get(a.furnishingId),placement=(Array.isArray(exhibition.placements)?exhibition.placements:[]).find(p=>p?.id===a.placementId),art=(Array.isArray(exhibition.artworks)?exhibition.artworks:[]).find(x=>x?.revisionId===a.artworkRevisionId);
  if(attached.has(a.placementId)||!placement||!art||placement.artworkRevisionId!==a.artworkRevisionId||placement.assetId!==a.assetId||art.primaryAssetId!==a.assetId){errors.push({code:'FRAME_TARGET_STALE',path,message:'Expected a unique image placement and its exact artwork revision and asset'});continue;}
  attached.add(a.placementId);
  const fit=fits.get(a.furnishingId),qualified=fit&&['straight-ring-v1','straight-miter-ring-v1'].includes(fit.profile)?fit:undefined;
  const frame=source&&artworkFrameModel(source.model.sha256,source.model.bytes);
  if(!source||source.kind!=='artwork-frame'||!frame&&!qualified||(value.version===4&&source.model.sha256!==THIN_BRASS_SHA256)||a.modelSha256!==source.model.sha256){errors.push({code:'FRAME_ASSET_UNSUPPORTED',path,message:'Expected a fixed source supported by the selected profile'});continue;}
  used.add(a.furnishingId);
  if(art.artworkType!=='image'||art.schemaVersion!=='1.0.0-draft.1'||!art.dimensions||!(qualified?qualifiedFrameTargetFit(qualified,art.dimensions.width,art.dimensions.height):artworkFrameFit(frame,art.dimensions.width,art.dimensions.height)))errors.push({code:'FRAME_SIZE_UNSUPPORTED',path,message:'Expected the fixed model image plane dimensions'});
  if(art.dimensions&&Object.hasOwn(art.dimensions,'depth'))errors.push({code:'FRAME_DEPTH_UNSUPPORTED',path,message:'Only a depth-unspecified image plane is supported'});
  if(![art.transform,placement.transform,rooms.get(placement.roomId)?.transform].every(t=>Array.isArray(t?.scale)&&t.scale.length===3&&t.scale.every(n=>n===1)))errors.push({code:'FRAME_TRANSFORM_UNSUPPORTED',path,message:'Expected unit-scale artwork, placement and room transforms'});
  const installations=exhibition.extensions?.['org.exhibitos.studio/installation']?.placements;
  if(Array.isArray(installations)&&installations.some(b=>typeof b?.placementId==='string'&&b.placementId.toLowerCase()===a.placementId.toLowerCase()&&b.frame&&b.frame.kind!=='none'))errors.push({code:'FRAME_PROCEDURAL_CONFLICT',path,message:'A procedural frame already occupies the placement'});
 }
 for(const id of known.keys())if(!used.has(id))errors.push({code:'FURNISHING_UNUSED',path:'/furnishings',message:'Every descriptor must be placed'});
 return {valid:errors.length===0,errors:errors.slice(0,100)};
}

/** Derive canonical paths from validated descriptor identities, never from a
 * caller-supplied storage path. This inventory does not grant access to bytes. */
export function packageWorkspaceFurnishingManifest(exhibition){
 const extension=exhibition?.extensions?.[WORKSPACE_FURNISHING_NAMESPACE];if(extension===undefined)return [];
 const checked=validateWorkspaceFurnishings(extension,exhibition);if(!checked.valid)throw Error(checked.errors[0]?.code??'FURNISHING_INVALID');
 return extension.furnishings.map(item=>{const artifactPath=`workspace-furnishings/${item.id}/${item.version}/model-${item.model.sha256}.glb`;return {furnishingId:item.id,furnishingVersion:item.version,path:'resources/'+artifactPath,artifactPath,mime:item.model.mime,bytes:item.model.bytes,sha256:item.model.sha256};}).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}
