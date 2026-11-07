// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {readOex,writeOex,writeOexFile,withOexFile,validateOexManifest,adaptOexManifest} from '../index.mjs';
import {WORKSPACE_FURNISHING_NAMESPACE,packageWorkspaceFurnishingManifest} from './workspace-furnishing.mjs';
import {WORKSPACE_MATERIAL_NAMESPACE,packageWorkspaceMaterialManifest} from './workspace-material.mjs';
import {buildZip} from '../scripts/zip-fixture-builder.mjs';
import {crc32} from '../scripts/generate-fixtures.mjs';
const original=await readOex(await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url)));
const model=await readFile(new URL('../fixtures/synthetic/sculpture.glb',import.meta.url));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const options={createdAt:original.manifest.createdAt,generator:original.manifest.generator};
function fixture(){
 const e=structuredClone(original.exhibition),furnishing={id:'70000000-0000-4000-8000-000000000001',version:1,kind:'pedestal',name:'Synthetic',rights:{holder:'Synthetic',ownership:'owner',licenseId:'CC0-1.0',creditLine:'Synthetic',permissions:{display:true,download:true,export:true,commercial:true}},provenance:'Synthetic fixture',model:{mime:'model/gltf-binary',bytes:model.length,sha256:digest(model)}};
 e.extensions[WORKSPACE_FURNISHING_NAMESPACE]={version:1,furnishings:[furnishing],placements:[{id:'70000000-0000-4000-8000-000000000002',roomId:e.rooms[0].id,furnishingId:furnishing.id,furnishingVersion:1,position:[1,0,0],yaw:0,scale:1}]};
 const [entry]=packageWorkspaceFurnishingManifest(e),assets=new Map(original.manifest.assets.map(a=>[a.artifactPath,original.files.get(a.path)]));assets.set(entry.artifactPath,model);return {e,furnishing,entry,assets};
}
test('workspace furnishing profile round trips exact model and explicit version',async()=>{const f=fixture(),archive=await writeOex(f.e,f.assets,options),value=await readOex(archive);assert.equal(value.manifest.formatVersion,'1.0.0-draft.13');assert.deepEqual(value.manifest.workspaceFurnishingResources,[f.entry]);assert.deepEqual(value.files.get(f.entry.path),model);assert.equal(validateOexManifest(value.manifest).valid,true);assert.equal(adaptOexManifest(value.manifest,'1.0.0-draft.12').valid,false);});
test('multiple poses share one registered GLB resource',async()=>{const f=fixture(),extension=f.e.extensions[WORKSPACE_FURNISHING_NAMESPACE];extension.placements.push({...extension.placements[0],id:'70000000-0000-4000-8000-000000000004',position:[-1,0,0],yaw:1});const value=await readOex(await writeOex(f.e,f.assets,options));assert.equal(value.manifest.workspaceFurnishingResources.length,1);assert.deepEqual(value.exhibition.extensions[WORKSPACE_FURNISHING_NAMESPACE].placements.map(p=>p.position),[[1,0,0],[-1,0,0]]);});
test('rejects changed bytes, absent export grant, malformed GLB and old profile relabel',async()=>{const f=fixture(),wrong=new Map(f.assets);wrong.set(f.entry.artifactPath,Buffer.alloc(model.length));await assert.rejects(writeOex(f.e,wrong,options));const noGrant=structuredClone(f.e);noGrant.extensions[WORKSPACE_FURNISHING_NAMESPACE].furnishings[0].rights.permissions.export=false;await assert.rejects(writeOex(noGrant,f.assets,options));const bad=structuredClone(f.e),bytes=Buffer.alloc(model.length);bad.extensions[WORKSPACE_FURNISHING_NAMESPACE].furnishings[0].model.sha256=digest(bytes);const entry=packageWorkspaceFurnishingManifest(bad)[0],assets=new Map(original.manifest.assets.map(a=>[a.artifactPath,original.files.get(a.path)]));assets.set(entry.artifactPath,bytes);await assert.rejects(writeOex(bad,assets,options));const decoded=await readOex(await writeOex(f.e,f.assets,options)),manifest=structuredClone(decoded.manifest);manifest.formatVersion='1.0.0-draft.2';delete manifest.workspaceFurnishingResources;const files=[...decoded.files].filter(([name])=>name!==f.entry.path).map(([name,data])=>({name,data:name==='manifest.json'?JSON.stringify(manifest):data}));await assert.rejects(readOex(buildZip(files)),error=>error.code==='WORKSPACE_FURNISHING_PROFILE_REQUIRED');});
test('bounded file profile retains the same furnishing inventory',async()=>{const f=fixture(),dir=await mkdtemp(join(tmpdir(),'workspace-furnishing-oex-')),path=join(dir,'test.oex');try{await writeOexFile(f.e,{paths:[...f.assets.keys()],get:async p=>f.assets.get(p)},path,options);await withOexFile(path,async value=>{assert.equal(value.manifest.formatVersion,'1.0.0-draft.13');assert.equal(value.manifest.archiveProfile,'bounded-file-v1');assert.deepEqual(value.manifest.workspaceFurnishingResources,[f.entry]);});}finally{await rm(dir,{recursive:true,force:true});}});
test('workspace furnishings and workspace materials retain both independent inventories',async()=>{
 const f=fixture(),chunk=(name,body)=>{const t=Buffer.from(name),out=Buffer.alloc(body.length+12);out.writeUInt32BE(body.length);t.copy(out,4);body.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,body])),body.length+8);return out;},header=Buffer.alloc(13);header.writeUInt32BE(2);header.writeUInt32BE(2,4);header[8]=8;header[9]=2;const image=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.alloc(14))),chunk('IEND',Buffer.alloc(0))]);
 const material={id:'70000000-0000-4000-8000-000000000003',version:1,kind:'wall',name:'Synthetic wall',rights:f.furnishing.rights,provenance:'Synthetic fixture',maps:{color:{mime:'image/png',bytes:image.length,sha256:digest(image),width:2,height:2,colorSpace:'srgb'}}};f.e.extensions[WORKSPACE_MATERIAL_NAMESPACE]={version:1,materials:[material],bindings:[{surfaceId:f.e.surfaces[0].id,materialId:material.id,materialVersion:1,repeatMeters:[2,2],rotation:0}]};const [entry]=packageWorkspaceMaterialManifest(f.e);f.assets.set(entry.artifactPath,image);const value=await readOex(await writeOex(f.e,f.assets,options));assert.equal(value.manifest.formatVersion,'1.0.0-draft.13');assert.deepEqual(value.manifest.workspaceMaterialResources,[entry]);assert.deepEqual(value.manifest.workspaceFurnishingResources,[f.entry]);
});
test('stool profile is explicit and cannot be relabelled as draft.13',async()=>{
 const f=fixture();f.e.extensions[WORKSPACE_FURNISHING_NAMESPACE].version=2;f.e.extensions[WORKSPACE_FURNISHING_NAMESPACE].furnishings[0].kind='stool';
 const output=await readOex(await writeOex(f.e,f.assets,options));assert.equal(output.manifest.formatVersion,'1.0.0-draft.14');assert.deepEqual(output.files.get(f.entry.path),model);assert.equal(adaptOexManifest(output.manifest,'1.0.0-draft.13').valid,false);
 const manifest=structuredClone(output.manifest);manifest.formatVersion='1.0.0-draft.13';const files=[...output.files].map(([name,data])=>({name,data:name==='manifest.json'?JSON.stringify(manifest):data}));await assert.rejects(readOex(buildZip(files)),error=>error.code==='WORKSPACE_FURNISHING_PROFILE_REQUIRED');
});
test('stool profile supports the bounded file archive without changing prior profile',async()=>{
 const f=fixture();f.e.extensions[WORKSPACE_FURNISHING_NAMESPACE].version=2;f.e.extensions[WORKSPACE_FURNISHING_NAMESPACE].furnishings[0].kind='stool';const dir=await mkdtemp(join(tmpdir(),'stool-v2-oex-')),path=join(dir,'test.oex');
 try{await writeOexFile(f.e,{paths:[...f.assets.keys()],get:async p=>f.assets.get(p)},path,options);await withOexFile(path,async value=>{assert.equal(value.manifest.formatVersion,'1.0.0-draft.14');assert.equal(value.manifest.archiveProfile,'bounded-file-v1');assert.deepEqual(await value.files.get(f.entry.path),model);});}finally{await rm(dir,{recursive:true,force:true});}
});
test('room-visual v3 round trips each new kind and refuses earlier profile relabelling',async()=>{
 for(const kind of ['partition','info-stand','barrier','display-case']){
  const f=fixture(),ext=f.e.extensions[WORKSPACE_FURNISHING_NAMESPACE];ext.version=3;ext.furnishings[0].kind=kind;
  const output=await readOex(await writeOex(f.e,f.assets,options));assert.equal(output.manifest.formatVersion,'1.0.0-draft.15');assert.deepEqual(output.files.get(f.entry.path),model);assert.equal(adaptOexManifest(output.manifest,'1.0.0-draft.14').valid,false);
  const manifest=structuredClone(output.manifest);manifest.formatVersion='1.0.0-draft.14';const files=[...output.files].map(([name,data])=>({name,data:name==='manifest.json'?JSON.stringify(manifest):data}));await assert.rejects(readOex(buildZip(files)),error=>error.code==='WORKSPACE_FURNISHING_PROFILE_REQUIRED');
 }
});
test('room-visual bounded file preserves v3, stool and both visual poses',async()=>{
 const f=fixture(),ext=f.e.extensions[WORKSPACE_FURNISHING_NAMESPACE];ext.version=3;ext.furnishings[0].kind='stool';ext.placements.push({...ext.placements[0],id:'70000000-0000-4000-8000-000000000004',position:[-1,0,0]});const dir=await mkdtemp(join(tmpdir(),'room-visual-v3-oex-')),path=join(dir,'test.oex');
 try{await writeOexFile(f.e,{paths:[...f.assets.keys()],get:async p=>f.assets.get(p)},path,options);await withOexFile(path,async value=>{assert.equal(value.manifest.formatVersion,'1.0.0-draft.15');assert.equal(value.manifest.archiveProfile,'bounded-file-v1');assert.deepEqual(await value.files.get(f.entry.path),model);assert.equal(value.exhibition.extensions[WORKSPACE_FURNISHING_NAMESPACE].placements.length,2);});}finally{await rm(dir,{recursive:true,force:true});}
});
test('v4 retains room visuals without frame rows and cannot be relabelled as v3',async()=>{
 const f=fixture(),ext=f.e.extensions[WORKSPACE_FURNISHING_NAMESPACE];ext.version=4;ext.frameAttachments=[];
 const output=await readOex(await writeOex(f.e,f.assets,options));assert.equal(output.manifest.formatVersion,'1.0.0-draft.16');assert.deepEqual(output.exhibition.extensions[WORKSPACE_FURNISHING_NAMESPACE].frameAttachments,[]);assert.deepEqual(output.files.get(f.entry.path),model);
 const manifest=structuredClone(output.manifest);manifest.formatVersion='1.0.0-draft.15';const files=[...output.files].map(([name,data])=>({name,data:name==='manifest.json'?JSON.stringify(manifest):data}));await assert.rejects(readOex(buildZip(files)),error=>error.code==='WORKSPACE_FURNISHING_PROFILE_REQUIRED');
});
