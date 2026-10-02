// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ExhibitOS contributors
// Independently authored public contract validator; no platform implementation is imported.
import Ajv2020 from 'ajv/dist/2020.js';
import formats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { types } from 'node:util';
export const SPATIAL_SCRIPTING_NAMESPACE='org.exhibitos.runtime/spatial-scripting';
export const SPATIAL_SCRIPTING_VERSION=1;
const definition=JSON.parse(await readFile(new URL('../oes/v1/spatial-scripting.schema.json',import.meta.url),'utf8'));
const ajv=new Ajv2020({strict:true,allErrors:true});formats(ajv,['uuid','date-time']);
const accepts=ajv.compile(definition),acceptsEvent=ajv.compile({$ref:definition.$id+'#/$defs/event'});
const issue=(path,message)=>({code:'SPATIAL_SCRIPTING_INVALID',path,message});
const rejected=(message)=>({valid:false,errors:[issue('',message)]});
/** Node API plain-data guard. Proxies are rejected before invoking reflective traps. */
function jsonData(input,maxBytes=32768){
 let count=0,chars=0;const stack=new Set();
 function examine(value,depth){
  if(++count>8192||depth>12)throw Error('Structure exceeds limits');
  if(value===null||typeof value==='boolean')return;
  if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Nonfinite number');return;}
  if(typeof value==='string'){
   chars+=value.length;if(chars>maxBytes)throw Error('Text exceeds bounds');
   for(let n=0;n<value.length;n++){const c=value.charCodeAt(n);if(c>=0xd800&&c<=0xdbff){const next=value.charCodeAt(++n);if(!(next>=0xdc00&&next<=0xdfff))throw Error('Invalid Unicode');}else if(c>=0xdc00&&c<=0xdfff)throw Error('Invalid Unicode');}return;
  }
  if(typeof value!=='object'||types.isProxy(value)||stack.has(value))throw Error('Non-JSON input');
  const array=Array.isArray(value),prototype=Object.getPrototypeOf(value);
  if(prototype!==(array?Array.prototype:Object.prototype))throw Error('Nonplain object');
  const fields=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(fields);
  if(keys.length>(array?513:16)||keys.some(k=>typeof k!=='string'))throw Error('Object exceeds bounds');
  for(const key of keys){const descriptor=fields[key];if(!Object.hasOwn(descriptor,'value')||(key!=='length'||!array)&&!descriptor.enumerable)throw Error('Only enumerable data properties');}
  if(array&&(value.length>512||keys.length!==value.length+1||Array.from({length:value.length},(_,i)=>String(i)).some(k=>!Object.hasOwn(fields,k))))throw Error('Only bounded dense arrays');
  stack.add(value);for(const key of keys){if(array&&key==='length')continue;chars+=key.length;examine(fields[key].value,depth+1);}stack.delete(value);
 }
 examine(input,0);if(Buffer.byteLength(JSON.stringify(input))>maxBytes)throw Error('JSON exceeds byte limit');
}
const references={roomId:'rooms',zoneId:'zones',placementId:'placements',lightId:'lights',mediaAssetId:'mediaAssets'};
function semantics(program,scope){
 const errors=[],ids=new Set();
 const add=(path,message)=>{if(errors.length<32)errors.push(issue(path,message));};
 for(const [index,rule]of program.rules.entries()){
  const base='/rules/'+index;
  if(ids.has(rule.id))add(base+'/id','Rule IDs must be distinct');ids.add(rule.id);
  for(const [path,entry]of [[base+'/trigger',rule.trigger],...rule.actions.map((a,i)=>[base+'/actions/'+i,a])]){
   for(const [field,set]of Object.entries(references))if(Object.hasOwn(entry,field)&&!scope[set].has(entry[field]))add(path+'/'+field,'Exact reference must belong to this Exhibition');
   if(entry.type==='absolute_time'){const milliseconds=Date.parse(entry.atUtc);if(milliseconds<0||milliseconds>4102444800000||new Date(milliseconds).toISOString()!==entry.atUtc)add(path+'/atUtc','Unsupported or noncanonical UTC time');}
  }
 }
 return {valid:errors.length===0,errors};
}
export function validateSpatialProgram(program,scope){
 try{
  jsonData(program);
  if(!accepts(program))return {valid:false,errors:accepts.errors.slice(0,32).map(e=>issue(e.instancePath,e.keyword))};
  return semantics(program,scope);
 }catch{return rejected('Expected plain bounded program JSON and valid scope');}
}
export function validateSpatialEvent(event,scope){
 try{jsonData(event);if(!acceptsEvent(event))return rejected('Unsupported event shape');return semantics({rules:[{id:'event',trigger:event,actions:[]}]},scope);}catch{return rejected('Expected plain bounded event JSON and valid scope');}
}
export function parseSpatialProgram(json,scope){
 if(typeof json!=='string'||json.length>32768||Buffer.byteLength(json)>32768)return rejected('Program JSON exceeds32KiB');
 try{const program=JSON.parse(json),result=validateSpatialProgram(program,scope);return result.valid?{...result,program}:result;}catch{return rejected('Malformed program JSON');}
}
function scopeIds(exhibition,field){
 const descriptor=Object.getOwnPropertyDescriptor(exhibition,field);
 if(!descriptor||!Object.hasOwn(descriptor,'value')||!Array.isArray(descriptor.value)||types.isProxy(descriptor.value)||descriptor.value.length>4096)throw Error('Invalid scope data');
 const array=descriptor.value,ids=[];
 for(let i=0;i<array.length;i++){
  const member=Object.getOwnPropertyDescriptor(array,String(i));if(!member||!Object.hasOwn(member,'value'))throw Error('Sparse or accessor scope');
  const entity=member.value;if(!entity||typeof entity!=='object'||types.isProxy(entity))throw Error('Invalid entity');
  const id=Object.getOwnPropertyDescriptor(entity,'id');if(!id||!Object.hasOwn(id,'value')||typeof id.value!=='string')throw Error('Invalid entity ID');ids.push(id.value);
 }
 return ids;
}
export function spatialScopeFor(exhibition){
 if(!exhibition||typeof exhibition!=='object'||types.isProxy(exhibition))throw Error('Invalid Exhibition scope');
 return Object.fromEntries([['rooms','rooms'],['zones','audioZones'],['placements','placements'],['lights','lights'],['mediaAssets','mediaAssets']].map(([name,field])=>[name,new Set(scopeIds(exhibition,field))]));
}
export function validateSpatialProfile(exhibition){
 try{
  if(!exhibition||typeof exhibition!=='object'||types.isProxy(exhibition))return rejected('Invalid Exhibition data');
  const fields=Object.getOwnPropertyDescriptors(exhibition),descriptor=fields.extensions;
  if(!descriptor)return {valid:true,errors:[]};
  if(!Object.hasOwn(descriptor,'value')||!descriptor.value||types.isProxy(descriptor.value))return rejected('Invalid extensions data');
  const extensions=Object.getOwnPropertyDescriptors(descriptor.value),own=extensions[SPATIAL_SCRIPTING_NAMESPACE];
  if(!own)return {valid:true,errors:[]};
  if(!Object.hasOwn(own,'value'))return rejected('Accessor profile rejected');
  jsonData(own.value,16384);
  const result=validateSpatialProgram(own.value,spatialScopeFor(exhibition));
  return {valid:result.valid,errors:result.errors.map(e=>({...e,path:'/extensions/org.exhibitos.runtime~1spatial-scripting'+e.path}))};
 }catch{return rejected('Invalid embedded profile or exceeded16KiB');}
}
