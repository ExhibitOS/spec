// SPDX-License-Identifier: Apache-2.0
// Structural and reference checks only. These do not establish ownership,
// resource availability, current permission or the contents of GLB bytes.
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {readFile} from 'node:fs/promises';
import {artworkFrameModel} from './artwork-frame-models.mjs';
import {validateRights} from './artwork.mjs';
const load=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const ajv=new Ajv2020({strict:true,allErrors:true,coerceTypes:false,useDefaults:false,removeAdditional:false});
addFormats(ajv,['uuid','date-time']);ajv.addSchema(await load('../schemas/artwork.json'));ajv.addSchema(await load('../schemas/workspace-furnishing.json'));
ajv.addSchema(await load('../schemas/workspace-furnishing-v2.json'));ajv.addSchema(await load('../schemas/workspace-furnishing-v3.json'));
ajv.addSchema(await load('../schemas/workspace-furnishing-v4.json'));ajv.addSchema(await load('../schemas/workspace-furnishing-v5.json'));
const validateV1=ajv.compile(await load('../schemas/workspace-furnishing-placements.json'));
const validateV2=ajv.compile(await load('../schemas/workspace-furnishing-placements-v2.json'));
const validateV3=ajv.compile(await load('../schemas/workspace-furnishing-placements-v3.json'));
const validateV4=ajv.compile(await load('../schemas/workspace-furnishing-placements-v4.json'));
const validateV5=ajv.compile(await load('../schemas/workspace-furnishing-placements-v5.json'));
const THIN_BRASS_SHA256='4b14e45ccf14ed38eea90c50553733a0b97b1671b9ec377d900e5a947545f8b4';
export const WORKSPACE_FURNISHING_NAMESPACE='org.exhibitos.studio/workspace-furnishings';
export function validateWorkspaceFurnishings(value,exhibition){
 const validate=value?.version===1?validateV1:value?.version===2?validateV2:value?.version===3?validateV3:value?.version===4?validateV4:value?.version===5?validateV5:validateV1;
 if(!validate(value))return {valid:false,errors:validate.errors.slice(0,100).map(e=>({code:'FURNISHING_SCHEMA',path:e.instancePath,message:e.keyword}))};
 if(!Array.isArray(exhibition?.rooms))return {valid:false,errors:[{code:'FURNISHING_ROOMS',path:'',message:'Expected rooms'}]};
 const errors=[],ids=new Set(),rooms=new Map(),known=new Map(),used=new Set();
 for(const collection of ['rooms','surfaces','openings','placements','lights','mediaAssets','artworks'])for(const entity of Array.isArray(exhibition[collection])?exhibition[collection]:[]){if(!entity||typeof entity!=='object')continue;for(const id of [entity.id,entity.revisionId,...(Array.isArray(entity.assets)?entity.assets.map(a=>a?.id):[])])if(typeof id==='string')ids.add(id.toLowerCase());}
 const extensions=exhibition.extensions??{},builtin=extensions['org.exhibitos.studio/furnishing-visuals']?.assets,benches=extensions['org.exhibitos.studio/benches']?.benches,materials=extensions['org.exhibitos.studio/workspace-materials']?.materials;
 for(const id of [extensions['org.exhibitos.viewer/space-still']?.asset?.id,...(Array.isArray(builtin)?builtin.map(x=>x?.id):[]),...(Array.isArray(benches)?benches.map(x=>x?.id):[]),...(Array.isArray(materials)?materials.map(x=>x?.id):[])])if(typeof id==='string')ids.add(id.toLowerCase());
 for(const room of exhibition.rooms)if(room&&typeof room.id==='string')rooms.set(room.id,room);
 for(const [i,item] of value.furnishings.entries()){
  if(ids.has(item.id)||known.has(item.id))errors.push({code:'FURNISHING_DUPLICATE',path:'/furnishings/'+i,message:'Duplicate identity'});
  ids.add(item.id);known.set(item.id,item);
  if(item.name.trim()!==item.name||item.provenance.trim()!==item.provenance||item.name.length>120||item.provenance.length>1024)errors.push({code:'FURNISHING_TEXT',path:'/furnishings/'+i,message:'Text must be trimmed and within UTF-16 limits'});
  for(const error of validateRights(item.rights).errors)errors.push({...error,path:'/furnishings/'+i+error.path});
 }
 for(const [i,p] of value.placements.entries()){
  const room=rooms.get(p.roomId),d=room?.dimensions,position=p.position;
  if(ids.has(p.id))errors.push({code:'FURNISHING_DUPLICATE',path:'/placements/'+i,message:'Duplicate identity'});ids.add(p.id);
  if(!known.has(p.furnishingId)||known.get(p.furnishingId)?.kind==='artwork-frame'||!d||![d.width,d.height,d.depth,...position,p.yaw,p.scale].every(Number.isFinite)||[d.width,d.height,d.depth].some(n=>n<=0)||Math.abs(position[0])>d.width/2||position[1]<0||position[1]>d.height||Math.abs(position[2])>d.depth/2)errors.push({code:'FURNISHING_REFERENCE',path:'/placements/'+i,message:'Missing room-visual furnishing or invalid room-local position'});
  used.add(p.furnishingId);
 }
 const attached=new Set();
 for(const [i,a] of (value.frameAttachments??[]).entries()){
  const path='/frameAttachments/'+i,source=known.get(a.furnishingId),placement=(Array.isArray(exhibition.placements)?exhibition.placements:[]).find(p=>p?.id===a.placementId),art=(Array.isArray(exhibition.artworks)?exhibition.artworks:[]).find(x=>x?.revisionId===a.artworkRevisionId);
  if(attached.has(a.placementId)||!placement||!art||placement.artworkRevisionId!==a.artworkRevisionId||placement.assetId!==a.assetId||art.primaryAssetId!==a.assetId){errors.push({code:'FRAME_TARGET_STALE',path,message:'Expected a unique image placement and its exact artwork revision and asset'});continue;}
  attached.add(a.placementId);
  if(!source||source.kind!=='artwork-frame'||(value.version===4?(source.model.sha256!==THIN_BRASS_SHA256||source.model.bytes!==7892):!artworkFrameModel(source.model.sha256,source.model.bytes))||a.modelSha256!==source.model.sha256){errors.push({code:'FRAME_ASSET_UNSUPPORTED',path,message:'Expected a fixed source supported by the selected profile'});continue;}
  used.add(a.furnishingId);
  if(art.artworkType!=='image'||art.schemaVersion!=='1.0.0-draft.1'||!art.dimensions||![art.dimensions.width,art.dimensions.height].every(Number.isFinite)||Math.abs(art.dimensions.width-.6)>1e-6||Math.abs(art.dimensions.height-.8)>1e-6)errors.push({code:'FRAME_SIZE_UNSUPPORTED',path,message:'Expected a 0.6 by 0.8 metre image plane'});
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
