// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWorkspaceMaterial} from './workspace-material.mjs';
const validate=value=>validateWorkspaceMaterial(value).valid;
const material=()=>({id:'11111111-1111-4111-8111-111111111111',version:1,kind:'floor',name:'Synthetic material',rights:{holder:'Example',ownership:'owner',licenseId:'CC0-1.0',creditLine:'Synthetic',permissions:{display:true,download:true,export:true,commercial:true}},provenance:'Synthetic test fixture',maps:{color:{mime:'image/png',bytes:100,sha256:'a'.repeat(64),width:1254,height:1254,colorSpace:'srgb'}}});
test('accepts bounded floor or wall descriptors with color-only or optional linear data maps',()=>{const v=material();assert.equal(validate(v),true,JSON.stringify(validate.errors));v.kind='wall';v.maps.normal={...v.maps.color,colorSpace:'linear',normalY:'up'};v.maps.roughness={...v.maps.color,colorSpace:'linear'};assert.equal(validate(v),true,JSON.stringify(validate.errors));});
test('rejects missing rights/color, paths, wrong role semantics and unknown inputs',()=>{for(const change of [v=>delete v.rights,v=>delete v.maps.color,v=>v.maps.color.path='../outside',v=>v.maps.color.colorSpace='linear',v=>v.maps.normal={...v.maps.color,colorSpace:'linear'},v=>v.maps.ao={...v.maps.color},v=>v.maps.color.sha256='bad',v=>v.kind='furniture']){const v=material();change(v);assert.equal(validate(v),false);}});

test('rejects oversized maps and inverted rights time without validating the binary',()=>{const a=material();a.maps.color.width=2049;a.maps.color.height=2049;assert.equal(validateWorkspaceMaterial(a).errors[0].code,'PNG_PIXEL_LIMIT_EXCEEDED');const b=material();b.rights.validFrom='2026-11-05T00:00:00Z';b.rights.expiresAt='2026-11-04T00:00:00Z';assert.equal(validateWorkspaceMaterial(b).errors[0].code,'RIGHTS_TIME_RANGE');});

test('binding validation enforces exact material versions, typed targets, uniqueness and no unused descriptors',async()=>{
 const {validateWorkspaceMaterialBindings}=await import('./workspace-material.mjs'),m=material(),surface='22222222-2222-4222-8222-222222222222',binding={surfaceId:surface,materialId:m.id,materialVersion:1,repeatMeters:[2,2],rotation:0},value={version:1,materials:[m],bindings:[binding]},surfaces=[{id:surface,type:'floor'}];
 assert.equal(validateWorkspaceMaterialBindings(value,surfaces).valid,true);
 for(const edit of [v=>v.bindings.push({...binding,surfaceId:surface.toUpperCase()}),v=>v.bindings[0].materialVersion=2,v=>v.bindings[0].surfaceId='33333333-3333-4333-8333-333333333333',v=>v.materials.push(structuredClone(m)),v=>v.bindings.splice(0),v=>v.bindings[0].repeatMeters=[0,2]]){const changed=structuredClone(value);edit(changed);assert.equal(validateWorkspaceMaterialBindings(changed,surfaces).valid,false);}
 assert.equal(validateWorkspaceMaterialBindings(value,[{id:surface,type:'wall'}]).valid,false);
});

test('portable resource paths are derived canonically from immutable IDs and hashes',async()=>{
 const {packageWorkspaceMaterialManifest,WORKSPACE_MATERIAL_NAMESPACE}=await import('./workspace-material.mjs'),m=material(),surface='22222222-2222-4222-8222-222222222222';const exhibition={surfaces:[{id:surface,type:'floor'}],extensions:{[WORKSPACE_MATERIAL_NAMESPACE]:{version:1,materials:[m],bindings:[{surfaceId:surface,materialId:m.id,materialVersion:1,repeatMeters:[2,2],rotation:0}]}}};
 const [entry]=packageWorkspaceMaterialManifest(exhibition);assert.equal(entry.artifactPath,`workspace-materials/${m.id}/1/color-${'a'.repeat(64)}.png`);assert.equal(entry.path,'resources/'+entry.artifactPath);assert.equal(entry.sha256,m.maps.color.sha256);assert.deepEqual(packageWorkspaceMaterialManifest({surfaces:[],extensions:{}}),[]);
 exhibition.extensions[WORKSPACE_MATERIAL_NAMESPACE].bindings=[];assert.throws(()=>packageWorkspaceMaterialManifest(exhibition));
});
