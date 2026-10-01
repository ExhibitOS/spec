// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ExhibitOS contributors
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';
import gltfValidator from 'gltf-validator';
import { readBoundedZip } from './zip.mjs';
import { validateExhibition,revisionHash } from './exhibition.mjs';
import { validateRights } from './artwork.mjs';
export const OEX_VERSION='1.0.0-draft.1',OED_VERSION='1.0.0-draft.1';
const [manifestSchema,deploymentSchema]=await Promise.all(['../oex/v1/manifest.schema.json','../oed/v1/deployment.schema.json'].map(async name=>JSON.parse(await readFile(new URL(name,import.meta.url),'utf8'))));
const ajv=new Ajv2020({strict:true,allErrors:true,validateFormats:true,coerceTypes:false,useDefaults:false,removeAdditional:false});addFormats(ajv,['uuid','date-time']);
const validateManifest=ajv.compile(manifestSchema),validateDeployment=ajv.compile(deploymentSchema),validateUtc=ajv.compile(manifestSchema.properties.createdAt);
const issue=(code,path,message)=>({code,path,message});
const result=errors=>({valid:errors.length===0,errors:errors.slice(0,100)});
const schemaErrors=validate=>validate.errors.slice(0,100).map(error=>issue('SCHEMA_INVALID',error.instancePath,error.keyword));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function parseJson(bytes) {if(!bytes||bytes.length>1048576)throw new Error('JSON_DOCUMENT_LIMIT');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
export function validateOexManifest(document) {
  if(document?.formatVersion!==OEX_VERSION)return result([issue('UNSUPPORTED_VERSION','/formatVersion','Expected '+OEX_VERSION)]);
  try{revisionHash(document);}catch(error){return result([issue(['NON_JSON_VALUE','JSON_LIMIT','DOCUMENT_LIMIT'].includes(error.message)?error.message:'INVALID_INPUT','','Expected bounded plain JSON')]);}
  if(!validateManifest(document))return result(schemaErrors(validateManifest));
  const errors=[];
  if(!Number.isFinite(Date.parse(document.createdAt)))errors.push(issue('INVALID_UTC_TIME','/createdAt','Expected a finite UTC instant'));
  const paths=new Set(),ids=new Set();
  document.assets.forEach((asset,i)=>{
    if(paths.has(asset.path.toLowerCase()))errors.push(issue('DUPLICATE_ASSET_PATH',`/assets/${i}/path`,'Package paths must be unique'));paths.add(asset.path.toLowerCase());
    if(ids.has(asset.id.toLowerCase()))errors.push(issue('DUPLICATE_ASSET_ID',`/assets/${i}/id`,'Package asset IDs must be unique'));ids.add(asset.id.toLowerCase());
    if(asset.path!=='assets/'+asset.artifactPath)errors.push(issue('ASSET_LAYOUT_MISMATCH',`/assets/${i}/path`,'Asset path must be assets/ plus artifact-relative path'));
    for(const field of ['rightsReferences','provenanceReferences'])if(new Set(asset[field]).size!==asset[field].length)errors.push(issue('DUPLICATE_REFERENCE',`/assets/${i}/${field}`,'Reference pointers must be unique'));
  });
  return result(errors);
}
export function packageAssetManifest(revision) {
  const map=new Map();
  revision.artworks.forEach((artwork,index)=>artwork.assets.forEach(asset=>{
    const id=asset.id.toLowerCase();let entry=map.get(id);
    if(!entry){entry={id:asset.id,path:'assets/'+asset.path,artifactPath:asset.path,mime:asset.mime,bytes:asset.bytes,sha256:asset.sha256,rightsReferences:[],provenanceReferences:[]};map.set(id,entry);}
    entry.rightsReferences.push(`exhibition.json#/artworks/${index}/rights`);entry.provenanceReferences.push(`exhibition.json#/artworks/${index}/provenance`);
  }));
  for(const entry of map.values()){entry.rightsReferences=[...new Set(entry.rightsReferences)];entry.provenanceReferences=[...new Set(entry.provenanceReferences)];}
  return [...map.values()].sort((a,b)=>a.id.toLowerCase()<b.id.toLowerCase()?-1:a.id.toLowerCase()>b.id.toLowerCase()?1:0);
}
export function validateExportRights(rights,at) {
  const checked=validateRights(rights);if(!checked.valid)return checked;
  const errors=[],time=typeof at==='string'&&validateUtc(at)?Date.parse(at):NaN;
  if(!Number.isFinite(time))errors.push(issue('INVALID_EXPORT_TIME','/createdAt','Expected a finite instant'));
  if(!rights.permissions.export)errors.push(issue('EXPORT_PERMISSION_REQUIRED','/rights/permissions/export','Package export needs explicit export permission'));
  if(rights.validFrom&&time<Date.parse(rights.validFrom))errors.push(issue('RIGHTS_NOT_YET_VALID','/rights/validFrom','Export grant has not begun'));
  if(rights.expiresAt&&time>=Date.parse(rights.expiresAt))errors.push(issue('RIGHTS_EXPIRED','/rights/expiresAt','Export grant has expired'));
  return result(errors);
}
export async function validateOex(bytes) {
  try {
    const files=readBoundedZip(bytes);
    const manifest=parseJson(files.get('manifest.json')),checked=validateOexManifest(manifest);if(!checked.valid)return checked;
    if([...files.keys()][0]!=='manifest.json')return result([issue('MANIFEST_ORDER','','manifest.json must be the first ZIP file')]);
    const expectedNames=['manifest.json','exhibition.json',...manifest.assets.map(asset=>asset.path)];
    if(files.size!==expectedNames.length||expectedNames.some(name=>!files.has(name)))return result([issue('ARCHIVE_LAYOUT_MISMATCH','','Only manifest, exhibition and declared asset files are permitted')]);
    const exhibitionBytes=files.get('exhibition.json');
    if(exhibitionBytes.length!==manifest.exhibition.bytes||hash(exhibitionBytes)!==manifest.exhibition.sha256)return result([issue('EXHIBITION_FILE_MISMATCH','/exhibition','Exhibition exact bytes/hash must match manifest')]);
    const revision=parseJson(exhibitionBytes),semantic=validateExhibition(revision);if(!semantic.valid)return semantic;
    const errors=[],exportTime=Date.parse(manifest.createdAt);
    if(exportTime<Date.parse(revision.createdAt))errors.push(issue('EXPORT_BEFORE_REVISION','/createdAt','Export cannot precede the embedded exhibition snapshot'));
    revision.artworks.forEach((artwork,index)=>{if(exportTime<Date.parse(artwork.createdAt))errors.push(issue('EXPORT_BEFORE_ARTWORK_REVISION',`/artworks/${index}/createdAt`,'Export cannot precede an embedded artwork snapshot'));});
    if(revision.id!==manifest.exhibition.id||revision.revisionId!==manifest.exhibition.revisionId||revisionHash(revision)!==manifest.exhibition.revisionSha256)errors.push(issue('EXHIBITION_REVISION_MISMATCH','/exhibition','Manifest must bind the exact declared revision'));
    if(revision.mediaAssets.length)errors.push(issue('MEDIA_PACKAGE_UNSUPPORTED','/mediaAssets','This draft packages Artwork GLB/images; audio package verification is pending'));
    if(revisionHash(packageAssetManifest(revision))!==revisionHash(manifest.assets))errors.push(issue('ASSET_MANIFEST_MISMATCH','/assets','Manifest inventory/rights/provenance pointers must match embedded snapshots exactly'));
    revision.artworks.forEach((artwork,index)=>errors.push(...validateExportRights(artwork.rights,manifest.createdAt).errors.map(error=>({...error,path:`/artworks/${index}`+error.path}))));
    for(const [index,asset]of manifest.assets.entries()) {
      const data=files.get(asset.path),path=`/assets/${index}`;
      if(data.length!==asset.bytes){errors.push(issue('ASSET_SIZE_MISMATCH',path,'Asset byte count differs'));continue;}
      if(hash(data)!==asset.sha256){errors.push(issue('ASSET_HASH_MISMATCH',path,'Asset exact SHA-256 differs'));continue;}
      const signature={'model/gltf-binary':()=>data.toString('ascii',0,4)==='glTF','image/png':()=>data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'image/jpeg':()=>data[0]===255&&data[1]===216&&data[2]===255,'image/webp':()=>data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP'}[asset.mime];
      if(!signature()){errors.push(issue('MIME_SIGNATURE_MISMATCH',path,'Asset signature differs from MIME'));continue;}
      if(asset.mime==='model/gltf-binary') {const report=await gltfValidator.validateBytes(new Uint8Array(data),{uri:asset.path,maxIssues:100,externalResourceFunction:()=>Promise.reject(new Error('EXTERNAL_RESOURCE_REJECTED'))});if(report.issues.numErrors)errors.push(issue('GLB_INVALID',path,'GLB conformance failed'));}
    }
    return result(errors);
  }catch(error){return result([issue(/^ZIP_[A-Z_]+$|^JSON_DOCUMENT_LIMIT$/.test(error.message)?error.message:'PACKAGE_INVALID','','Package rejected; no files extracted')]);}
}
export function validateOed(document) {
  if(document?.schemaVersion!==OED_VERSION)return result([issue('UNSUPPORTED_VERSION','/schemaVersion','Expected '+OED_VERSION)]);
  try{revisionHash(document);}catch(error){return result([issue(['NON_JSON_VALUE','JSON_LIMIT','DOCUMENT_LIMIT'].includes(error.message)?error.message:'INVALID_INPUT','','Expected bounded plain JSON')]);}
  if(!validateDeployment(document))return result(schemaErrors(validateDeployment));
  const errors=[];
  if(!Number.isFinite(Date.parse(document.createdAt)))errors.push(issue('INVALID_UTC_TIME','/createdAt','Expected a finite UTC instant'));
  const refs=new Set();document.secretRefs.forEach((reference,index)=>{if(refs.has(reference.id))errors.push(issue('DUPLICATE_SECRET_REF',`/secretRefs/${index}/id`,'Reference IDs must be unique'));refs.add(reference.id);});
  const uses=[['/storage/metadata/passwordSecretRef',document.storage.metadata.passwordSecretRef]];
  if(document.target.type==='generic-ssh')uses.push(['/target/sshKeySecretRef',document.target.sshKeySecretRef]);
  if(document.runtime.registrySecretRef!==undefined)uses.push(['/runtime/registrySecretRef',document.runtime.registrySecretRef]);
  if(document.storage.assets.type==='s3-compatible')uses.push(['/storage/assets/accessKeySecretRef',document.storage.assets.accessKeySecretRef],['/storage/assets/secretKeySecretRef',document.storage.assets.secretKeySecretRef]);
  const used=new Set();for(const [path,id]of uses){if(!refs.has(id))errors.push(issue('MISSING_SECRET_REF',path,'Secret reference must resolve'));used.add(id);}
  document.secretRefs.forEach((reference,index)=>{if(!used.has(reference.id))errors.push(issue('UNUSED_SECRET_REF',`/secretRefs/${index}`,'Only referenced secret locators are permitted'));});
  return result(errors);
}
export function adaptOexManifest(document,targetVersion) {
  if(targetVersion!==OEX_VERSION)return result([issue('UNSUPPORTED_TARGET_VERSION','','No adapter is registered for that target')]);
  const checked=validateOexManifest(document);if(!checked.valid)return checked;
  return {...checked,adapter:'identity-only-no-migration',document:structuredClone(document)};
}
