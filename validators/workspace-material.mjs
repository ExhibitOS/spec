// SPDX-License-Identifier: Apache-2.0
// Candidate descriptor validation only. This never checks ownership, permissions,
// actual image bytes, resource availability or grants authority to publish.
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {readFile} from 'node:fs/promises';
import {validateRights} from './artwork.mjs';
const load=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const ajv=new Ajv2020({strict:true,allErrors:true,coerceTypes:false,useDefaults:false,removeAdditional:false});
addFormats(ajv,['uuid','date-time']);ajv.addSchema(await load('../schemas/artwork.json'));
const materialSchema=await load('../schemas/workspace-material.json');ajv.addSchema(materialSchema);
const validate=ajv.getSchema(materialSchema.$id);
const validateBindings=ajv.compile(await load('../schemas/workspace-material-bindings.json'));
export function validateWorkspaceMaterial(value){
 if(!validate(value))return {valid:false,errors:validate.errors.slice(0,100).map(e=>({code:'MATERIAL_SCHEMA',path:e.instancePath,message:e.keyword}))};
 const errors=[];
 for(const [role,map] of Object.entries(value.maps))if(map.width*map.height>4*1024*1024)errors.push({code:'PNG_PIXEL_LIMIT_EXCEEDED',path:'/maps/'+role,message:'Maximum 4194304 pixels per map'});
 errors.push(...validateRights(value.rights).errors);
 return {valid:errors.length===0,errors};
}

/** Checks only descriptor/reference structure; server must separately verify the
 * workspace owner, persisted immutable bytes and current rights before use. */
export function validateWorkspaceMaterialBindings(value,surfaces){
 if(!validateBindings(value))return {valid:false,errors:validateBindings.errors.slice(0,100).map(e=>({code:'MATERIAL_BINDING_SCHEMA',path:e.instancePath,message:e.keyword}))};
 if(!Array.isArray(surfaces))return {valid:false,errors:[{code:'MATERIAL_SURFACES',path:'',message:'Expected surface inventory'}]};
 const errors=[],known=new Map(),used=new Set(),bound=new Set(),surfaceMap=new Map();
 for(const s of surfaces){if(!s||typeof s.id!=='string'||!['floor','wall','ceiling'].includes(s.type)||surfaceMap.has(s.id.toLowerCase()))return {valid:false,errors:[{code:'MATERIAL_SURFACES',path:'',message:'Invalid surface inventory'}]};surfaceMap.set(s.id.toLowerCase(),s.type);}
 for(const [i,m] of value.materials.entries()){const key=m.id.toLowerCase()+':'+m.version;if(known.has(key))errors.push({code:'MATERIAL_DUPLICATE',path:'/materials/'+i,message:'Duplicate material version'});known.set(key,m);for(const error of validateWorkspaceMaterial(m).errors)errors.push({...error,path:'/materials/'+i+error.path});}
 for(const [i,b] of value.bindings.entries()){const surface=b.surfaceId.toLowerCase(),key=b.materialId.toLowerCase()+':'+b.materialVersion,m=known.get(key);if(bound.has(surface))errors.push({code:'MATERIAL_DUPLICATE_SURFACE',path:'/bindings/'+i,message:'Duplicate target'});bound.add(surface);used.add(key);if(!m||surfaceMap.get(surface)!==m.kind)errors.push({code:'MATERIAL_REFERENCE',path:'/bindings/'+i,message:'Missing or mismatched target or material'});}
 for(const [key,m] of known)if(!used.has(key))errors.push({code:'MATERIAL_UNUSED',path:'/materials',message:'Unreferenced material '+m.id});
 return {valid:errors.length===0,errors:errors.slice(0,100)};
}

export const WORKSPACE_MATERIAL_NAMESPACE='org.exhibitos.studio/workspace-materials';
/** Inventory is derived from a validated snapshot, never caller paths. The
 * returned descriptor is not authority to read or disclose the bytes. */
export function packageWorkspaceMaterialManifest(exhibition){
 const extension=exhibition?.extensions?.[WORKSPACE_MATERIAL_NAMESPACE];if(extension===undefined)return [];
 const checked=validateWorkspaceMaterialBindings(extension,exhibition?.surfaces);if(!checked.valid)throw Error(checked.errors[0]?.code??'MATERIAL_BINDING_INVALID');
 if(!extension.bindings.length)throw Error('MATERIAL_BINDING_EMPTY');
 const entries=[];
 for(const material of extension.materials)for(const [role,map] of Object.entries(material.maps)){
  const artifactPath=`workspace-materials/${material.id.toLowerCase()}/${material.version}/${role}-${map.sha256}.png`;
  entries.push({materialId:material.id.toLowerCase(),materialVersion:material.version,role,path:'resources/'+artifactPath,artifactPath,mime:map.mime,bytes:map.bytes,sha256:map.sha256});
 }
 return entries.sort((a,b)=>a.path.localeCompare(b.path));
}
