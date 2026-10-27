// SPDX-License-Identifier: Apache-2.0
import shape from './space-still-schema.mjs';
export const SPACE_STILL_NAMESPACE='org.exhibitos.viewer/space-still';
export const MAX_SPACE_STILL_BYTES=8*1024*1024;
export const MAX_SPACE_STILL_PIXELS=2097152;
export const MAX_SPACE_STILL_DIMENSION=2048;
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const key=value=>value.toLowerCase();
const safePath=value=>value.split('/').every(part=>part!=='.'&&part!=='..'&&!part.endsWith('.')&&!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
function utc(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:[0-5]\d(?:\.\d{1,3})?Z$/.test(value))return false;
 const time=Date.parse(value);return Number.isFinite(time)&&new Date(time).toISOString().slice(0,19)===value.slice(0,19);
}
/** Portable metadata only. Actual binary decoding, authorization and source
 * provenance are separate producer/consumer qualifications. No values are fixed up. */
export function validateSpaceStillInventory(exhibition,{publicationTime}={}){
 const errors=[],fail=(path,message)=>errors.push({code:'SPACE_STILL_INVALID',path:'/extensions/org.exhibitos.viewer~1space-still'+path,message});
 const extensions=exhibition?.extensions;
 if(!object(extensions)||!Object.hasOwn(extensions,SPACE_STILL_NAMESPACE))return {valid:true,errors};
 const value=extensions[SPACE_STILL_NAMESPACE];
 if(!shape(value))return {valid:false,errors:shape.errors.slice(0,32).map(error=>({code:'SPACE_STILL_INVALID',path:'/extensions/org.exhibitos.viewer~1space-still'+error.instancePath,message:error.keyword}))};
 const asset=value.asset,entrance=extensions['org.exhibitos.viewer/entrance'];
 if(!safePath(asset.path))fail('/asset/path','Expected one safe relative PNG path');
 if(!object(entrance)||entrance.version!==1||typeof entrance.imageAssetId!=='string'||key(entrance.imageAssetId)!==key(asset.id)||typeof entrance.imageAlt!=='string'||!entrance.imageAlt.trim()||entrance.imageAlt.length>2048)fail('/asset/id','Still must be the explicitly described entrance image');
 const others=[...(Array.isArray(exhibition.artworks)?exhibition.artworks.flatMap(art=>Array.isArray(art?.assets)?art.assets:[]):[]),...(Array.isArray(exhibition.mediaAssets)?exhibition.mediaAssets:[])];
 if(others.some(other=>typeof other?.id==='string'&&key(other.id)===key(asset.id)||typeof other?.path==='string'&&key(other.path)===key(asset.path)))fail('/asset/id','Space still must have distinct inventory, not an artwork or audio alias');
 const identities=[exhibition.id,exhibition.revisionId,...['rooms','surfaces','openings','placements','lights','navigation','audioZones','annotations','scripts'].flatMap(name=>Array.isArray(exhibition[name])?exhibition[name].map(item=>item?.id):[]),...(Array.isArray(exhibition.artworks)?exhibition.artworks.flatMap(art=>[art?.id,art?.revisionId]):[])];
 if(identities.some(id=>typeof id==='string'&&key(id)===key(asset.id)))fail('/asset/id','Still inventory must have its own unique identity');
 for(const field of ['validFrom','expiresAt'])if(asset.rights[field]!==undefined&&!utc(asset.rights[field]))fail('/asset/rights/'+field,'Expected a finite UTC timestamp');
 const rights=asset.rights;
 if(rights.validFrom&&rights.expiresAt&&Date.parse(rights.validFrom)>=Date.parse(rights.expiresAt))fail('/asset/rights/expiresAt','Expiry must follow validFrom');
 if(publicationTime!==undefined){
  if(!utc(publicationTime))fail('/asset/rights','Invalid publication time');
  else if(!rights.permissions.display||(rights.validFrom&&Date.parse(publicationTime)<Date.parse(rights.validFrom))||(rights.expiresAt&&Date.parse(publicationTime)>=Date.parse(rights.expiresAt)))fail('/asset/rights','Current display permission required');
 }
 return {valid:errors.length===0,errors,...(errors.length?{}:{asset:structuredClone(asset)})};
}
export function spaceStillFor(exhibition){const checked=validateSpaceStillInventory(exhibition);if(!checked.valid)throw Error('SPACE_STILL_INVALID');return checked.asset;}
