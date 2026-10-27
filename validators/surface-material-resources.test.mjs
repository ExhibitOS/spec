// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {crc32} from '../scripts/generate-fixtures.mjs';
import {readOex,writeOex,revisionHash,validateOexManifest,adaptOexManifest} from '../index.mjs';
import {OEX_SURFACE_MATERIAL_VERSION as V,MATERIAL_NAMESPACE as NS,SURFACE_MATERIAL_PACKS,selectedSurfaceMaterialPacks,packageSurfaceMaterialManifest,surfaceMaterialNotice} from './surface-material-resources.mjs';
import {validSpaceStillPng,validSurfaceMaterialPng} from './space-still-png.mjs';
const original=await readOex(await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url)));
const binding=id=>({pack:{id,version:1},repeatMeters:[1,1],rotation:0,normalScale:1});
function revision(){const e=structuredClone(original.exhibition),surface=e.surfaces.find(s=>s.type==='wall');e.extensions={...e.extensions,[NS]:{version:1,surfaces:{},surfaceTextures:{[surface.id]:binding('museum-matte-paint')}}};return e;}
function manifest(e=revision()){
 const bytes=Buffer.from(JSON.stringify(e)+'\n');return {...structuredClone(original.manifest),formatVersion:V,exhibition:{...original.manifest.exhibition,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),revisionSha256:revisionHash(e)},materialResources:packageSurfaceMaterialManifest(e)};
}
test('only selected known roles and exact notices are portable; metadata and originals are not expanded',()=>{
 const e=revision(),before=structuredClone(e),resources=packageSurfaceMaterialManifest(e);
 assert.equal(resources.length,4);assert.deepEqual(resources.map(r=>r.role).sort(),['color','normal','notice','roughness']);assert.deepEqual(e,before);
 assert.equal(selectedSurfaceMaterialPacks(e)[0],SURFACE_MATERIAL_PACKS[0]);
 for(const p of SURFACE_MATERIAL_PACKS){const text=Buffer.from(surfaceMaterialNotice(p));assert.equal(text.length,p.notice.bytes);assert.equal(createHash('sha256').update(text).digest('hex'),p.notice.sha256);for(const f of Object.values(p.maps)){assert.equal(f.width,2048);assert.equal(f.height,2048);}}
 assert.doesNotMatch(JSON.stringify(resources),/Height|master\.blend|\/Volumes\/|file:\/\//);
 const legacy=structuredClone(e);delete legacy.extensions[NS].surfaceTextures;assert.deepEqual(packageSurfaceMaterialManifest(legacy),[]);
});
test('closed binding types, roles, surface references and versions reject coercion and arbitrary paths',()=>{
 for(const patch of [{pack:{id:['museum-matte-paint'],version:1}},{pack:{id:'unknown',version:1}},{pack:{id:'museum-matte-paint',version:2}},{normalScale:NaN},{repeatMeters:[0,1]},{rotation:4},{height:.1},{path:'private/source.png'}]){const e=revision(),id=Object.keys(e.extensions[NS].surfaceTextures)[0];Object.assign(e.extensions[NS].surfaceTextures[id],patch);assert.throws(()=>packageSurfaceMaterialManifest(e),/SURFACE_MATERIAL_INVALID/);}
 for(const type of ['floor',['wall']]){const e=revision(),id=Object.keys(e.extensions[NS].surfaceTextures)[0];e.surfaces.find(s=>s.id===id).type=type;assert.throws(()=>packageSurfaceMaterialManifest(e));}
 const e=revision(),map=e.extensions[NS].surfaceTextures,id=Object.keys(map)[0],canonical='aaaaaaaa-0000-4000-8000-000000000001';e.surfaces.find(s=>s.id===id).id=canonical;delete map[id];map[canonical]=binding('museum-matte-paint');map[canonical.toUpperCase()]=structuredClone(map[canonical]);assert.throws(()=>packageSurfaceMaterialManifest(e));
});
test('scalar and texture maps share the unchanged 64-surface namespace limit',()=>{
 const e=revision();e.surfaces=[];e.extensions[NS]={version:1,surfaces:{},surfaceTextures:{}};
 for(let i=0;i<65;i++){const id=`a0000000-0000-4000-8000-${i.toString(16).padStart(12,'0')}`;e.surfaces.push({id,type:'wall'});if(i<33)e.extensions[NS].surfaces[id]={color:'#ffffff',roughness:1,metalness:0};else e.extensions[NS].surfaceTextures[id]=binding('museum-matte-paint');}
 assert.ok(Buffer.byteLength(JSON.stringify(e.extensions[NS]))<16384);assert.throws(()=>packageSurfaceMaterialManifest(e));
 delete e.extensions[NS].surfaces[e.surfaces[0].id];assert.equal(packageSurfaceMaterialManifest(e).length,4);
});
test('profile7 manifest requires exact descriptors, safe paths, roles and explicit identity adaptation',()=>{
 const m=manifest();assert.equal(validateOexManifest(m).valid,true);assert.equal(adaptOexManifest(m,V).valid,true);assert.equal(adaptOexManifest(m,'1.0.0-draft.6').valid,false);
 for(const edit of [m=>m.materialResources[0].role='height',m=>m.materialResources[0].packVersion=2,m=>m.materialResources[0].path='resources/../private',m=>m.materialResources[0].sha256='0'.repeat(64),m=>m.materialResources.push(m.materialResources[0]),m=>delete m.materialResources]){const changed=structuredClone(m);edit(changed);assert.equal(validateOexManifest(changed).valid,false);}
});
test('writes require all selected exact bytes, while ordinary fixture bytes retain profile2',async()=>{
 const e=revision(),assets=new Map(original.manifest.assets.map(a=>[a.artifactPath,original.files.get(a.path)]));
 await assert.rejects(writeOex(e,assets,{createdAt:original.manifest.createdAt,generator:original.manifest.generator}),err=>err.code==='ARCHIVE_LAYOUT_MISMATCH');
 for(const f of packageSurfaceMaterialManifest(e))assets.set(f.artifactPath,new Uint8Array(f.bytes));
 await assert.rejects(writeOex(e,assets,{createdAt:original.manifest.createdAt,generator:original.manifest.generator}),err=>err.code==='SURFACE_MATERIAL_INTEGRITY');
 const plain=new Map(original.manifest.assets.map(a=>[a.artifactPath,original.files.get(a.path)]));const bytes=await writeOex(original.exhibition,plain,{createdAt:original.manifest.createdAt,generator:original.manifest.generator});assert.equal((await readOex(bytes)).manifest.formatVersion,'1.0.0-draft.2');assert.deepEqual(bytes,await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url)));
});
function png(w,h,channels=3,srgb=false){
 const chunk=(type,data)=>{const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(type,4);data.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,-4)),b.length-4);return b;},header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=channels===3?2:6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),...(srgb?[chunk('sRGB',Buffer.from([0]))]:[]),chunk('IDAT',deflateSync(Buffer.alloc((w*channels+1)*h))),chunk('IEND',Buffer.alloc(0))]);
}
test('RGB material profile independently allows exact2K while cover limits, metadata and alpha stay bounded',()=>{
 const map=png(2048,2048);assert.equal(validSurfaceMaterialPng(map),true);assert.equal(validSpaceStillPng(map),false);
 assert.equal(validSurfaceMaterialPng(png(4096,1)),false);assert.equal(validSurfaceMaterialPng(png(1,1,4)),false);assert.equal(validSurfaceMaterialPng(png(1,1,3,true)),false);assert.equal(validSpaceStillPng(png(1,1,3,true)),true);
});
