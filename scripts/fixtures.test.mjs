// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ExhibitOS contributors
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { sculpture, painting, crc32, referenceScene } from './generate-fixtures.mjs';
import { checkIntegrity, checkScene } from './check-fixtures.mjs';
const manifest = JSON.parse(await readFile(new URL('../fixtures/synthetic/manifest.json',import.meta.url),'utf8'));

test('mutated bytes and truncated files fail the committed integrity contract', () => {
  const asset=manifest.assets[0], bytes=sculpture();
  const altered=Buffer.from(bytes); altered[altered.length-1]^=1;
  assert.throws(() => checkIntegrity(asset,altered),/HASH_MISMATCH/);
  assert.throws(() => checkIntegrity(asset,bytes.subarray(1)),/SIZE_MISMATCH/);
  assert.throws(() => checkIntegrity({...asset,sha256:'g'.repeat(64)},bytes));
});
test('cube has 12 outward triangles, explicit normals, meter bounds and identity TRS', () => {
  const bytes=sculpture(); assert.equal(bytes.readUInt32LE(8),bytes.length);
  const jsonLength=bytes.readUInt32LE(12), json=JSON.parse(bytes.subarray(20,20+jsonLength));
  const bin=bytes.subarray(28+jsonLength);
  assert.deepEqual(json.accessors[0].min,[-.5,0,-.5]); assert.deepEqual(json.accessors[0].max,[.5,1,.5]);
  assert.deepEqual(json.nodes,[{mesh:0}]); assert.equal(json.accessors[2].count/3,12);
  const vector=(offset,index)=>[0,1,2].map(axis=>bin.readFloatLE(offset+index*12+axis*4));
  const all=Array.from({length:24},(_,i)=>vector(0,i));
  for(let axis=0;axis<3;axis++) {
    assert.equal(Math.min(...all.map(v=>v[axis])),json.accessors[0].min[axis]);
    assert.equal(Math.max(...all.map(v=>v[axis])),json.accessors[0].max[axis]);
    assert.equal(json.accessors[0].max[axis]-json.accessors[0].min[axis],1);
  }
  for(let i=0;i<36;i+=3) {
    const indices=[0,1,2].map(j=>bin.readUInt16LE(576+(i+j)*2));
    const [a,b,c]=indices.map(index=>vector(0,index)), normal=vector(288,indices[0]);
    const u=b.map((v,j)=>v-a[j]), v=c.map((n,j)=>n-a[j]);
    const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    assert.equal(Math.hypot(...normal),1); assert.equal(cross.reduce((sum,n,j)=>sum+n*normal[j],0),1);
    indices.forEach(index=>assert.deepEqual(vector(288,index),normal));
  }
});
test('PNG checksums, pixels and fixed zlib stored blocks decode consistently', () => {
  const bytes=painting(); assert.deepEqual(bytes.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
  const types=[], data=[];
  for(let offset=8;offset<bytes.length;) {
    const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);
    const payload=bytes.subarray(offset+8,offset+8+length); types.push(type);
    assert.equal(crc32(bytes.subarray(offset+4,offset+8+length)),bytes.readUInt32BE(offset+8+length));
    if(type==='IHDR') { assert.equal(payload.readUInt32BE(0),256);assert.equal(payload.readUInt32BE(4),256); assert.equal(payload[9],2); }
    if(type==='IDAT') data.push(payload);
    offset+=length+12;
  }
  assert.deepEqual(types,['IHDR','sRGB','IDAT','IEND']);
  const raw=inflateSync(Buffer.concat(data)); assert.equal(raw.length,256*769);
  const colors=[[22,79,99],[245,176,65],[204,75,62],[241,230,202]];
  for(let y=0;y<256;y++) { assert.equal(raw[y*769],0);
    for(let x=0;x<256;x++) assert.deepEqual([...raw.subarray(y*769+1+x*3,y*769+4+x*3)],colors[(Math.floor(x/64)+Math.floor(y/64))%4]);
  }
});

test('reference scene links only manifest assets, hashes, rights and room', () => {
  const scene=JSON.parse(referenceScene()); checkScene(scene,manifest);
  const wrongHash=structuredClone(scene); wrongHash.assets[0].sha256='0'.repeat(64);
  assert.throws(()=>checkScene(wrongHash,manifest),/SCENE_HASH_MISMATCH/);
  const dangling=structuredClone(scene); dangling.placements[0].assetId='missing';
  assert.throws(()=>checkScene(dangling,manifest),/MISSING_PLACEMENT_ASSET/);
});
