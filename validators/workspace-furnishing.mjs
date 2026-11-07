// SPDX-License-Identifier: Apache-2.0
// Structural and reference checks only. These do not establish ownership,
// resource availability, current permission or the contents of GLB bytes.
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {readFile} from 'node:fs/promises';
import {validateRights} from './artwork.mjs';
const load=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const ajv=new Ajv2020({strict:true,allErrors:true,coerceTypes:false,useDefaults:false,removeAdditional:false});
addFormats(ajv,['uuid','date-time']);ajv.addSchema(await load('../schemas/artwork.json'));ajv.addSchema(await load('../schemas/workspace-furnishing.json'));
ajv.addSchema(await load('../schemas/workspace-furnishing-v2.json'));ajv.addSchema(await load('../schemas/workspace-furnishing-v3.json'));
const validateV1=ajv.compile(await load('../schemas/workspace-furnishing-placements.json'));
const validateV2=ajv.compile(await load('../schemas/workspace-furnishing-placements-v2.json'));
const validateV3=ajv.compile(await load('../schemas/workspace-furnishing-placements-v3.json'));
export const WORKSPACE_FURNISHING_NAMESPACE='org.exhibitos.studio/workspace-furnishings';
export function validateWorkspaceFurnishings(value,exhibition){
 const validate=value?.version===1?validateV1:value?.version===2?validateV2:value?.version===3?validateV3:validateV1;
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
  if(!known.has(p.furnishingId)||!d||![d.width,d.height,d.depth,...position,p.yaw,p.scale].every(Number.isFinite)||[d.width,d.height,d.depth].some(n=>n<=0)||Math.abs(position[0])>d.width/2||position[1]<0||position[1]>d.height||Math.abs(position[2])>d.depth/2)errors.push({code:'FURNISHING_REFERENCE',path:'/placements/'+i,message:'Missing furnishing or invalid room-local position'});
  used.add(p.furnishingId);
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
