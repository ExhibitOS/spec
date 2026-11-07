// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWorkspaceFurnishings} from './workspace-furnishing.mjs';
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture(){const room={id:id(1),dimensions:{width:6,height:3,depth:8}},exhibition={rooms:[room]},descriptor={id:id(2),version:1,kind:'pedestal',name:'Synthetic plinth',rights:{holder:'Synthetic',ownership:'owner',licenseId:'CC0-1.0',creditLine:'Synthetic',permissions:{display:true,download:true,export:true,commercial:true}},provenance:'Synthetic fixture',model:{mime:'model/gltf-binary',bytes:100,sha256:'a'.repeat(64)}},value={version:1,furnishings:[descriptor],placements:[{id:id(3),roomId:room.id,furnishingId:descriptor.id,furnishingVersion:1,position:[1,0,0],yaw:0,scale:1}]};return {exhibition,value};}
test('accepts a visual placement referencing a declared workspace furnishing',()=>{const f=fixture();assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);});
test('enforces product-compatible UTF-16 name and provenance limits',()=>{
 for(const [field,text,valid] of [['name','😀'.repeat(60),true],['name','😀'.repeat(61),false],['provenance','😀'.repeat(512),true],['provenance','😀'.repeat(513),false],['name','x'.repeat(120),true],['name','x'.repeat(121),false],['provenance','x'.repeat(1024),true],['provenance','x'.repeat(1025),false]]){const f=fixture();f.value.furnishings[0][field]=text;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,valid,`${field} ${text.length}`);}
});
test('rejects aliases, dangling references, unused descriptors, and out-of-room positions',()=>{
 for(const edit of [f=>f.value.placements[0].id=f.exhibition.rooms[0].id,f=>f.value.placements[0].furnishingId=id(4),f=>f.value.placements[0].position=[4,0,0],f=>f.value.placements[0].scale=0,f=>f.value.furnishings[0].model.sha256='z'.repeat(64),f=>f.value.furnishings[0].name=' x ']){const f=fixture();edit(f);assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);}
});
test('rejects a workspace furnishing identity shared with other extension assets',()=>{
 for(const extension of [f=>({'org.exhibitos.viewer/space-still':{asset:{id:f.value.furnishings[0].id}}}),f=>({'org.exhibitos.studio/furnishing-visuals':{assets:[{id:f.value.furnishings[0].id}]}}),f=>({'org.exhibitos.studio/benches':{benches:[{id:f.value.placements[0].id}]}}),f=>({'org.exhibitos.studio/workspace-materials':{materials:[{id:f.value.furnishings[0].id}]}})]){const f=fixture();f.exhibition.extensions=extension(f);assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);}
});
test('stool requires the explicit visual placements v2 contract',()=>{
 const f=fixture();f.value.furnishings[0].kind='stool';assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
 f.value.version=2;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,true);
 f.value.furnishings[0].kind='unknown';assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
 f.value.furnishings[0].kind='stool';f.value.version=3;assert.equal(validateWorkspaceFurnishings(f.value,f.exhibition).valid,false);
});
