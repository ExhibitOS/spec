// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ExhibitOS contributors
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function sculpture() {
  // Each face is wound counterclockwise viewed from its outward normal.
  const faces = [
    [[0,0,1], [[-.5,0,.5],[.5,0,.5],[.5,1,.5],[-.5,1,.5]]],
    [[0,0,-1], [[.5,0,-.5],[-.5,0,-.5],[-.5,1,-.5],[.5,1,-.5]]],
    [[1,0,0], [[.5,0,.5],[.5,0,-.5],[.5,1,-.5],[.5,1,.5]]],
    [[-1,0,0], [[-.5,0,-.5],[-.5,0,.5],[-.5,1,.5],[-.5,1,-.5]]],
    [[0,1,0], [[-.5,1,.5],[.5,1,.5],[.5,1,-.5],[-.5,1,-.5]]],
    [[0,-1,0], [[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5]]],
  ];
  const positions = [], normals = [], indices = [];
  faces.forEach(([normal, corners], face) => {
    corners.forEach(corner => { positions.push(...corner); normals.push(...normal); });
    indices.push(...[0,1,2,0,2,3].map(index => face * 4 + index));
  });
  const binary = Buffer.alloc(648);
  positions.forEach((n,i) => binary.writeFloatLE(n, i*4));
  normals.forEach((n,i) => binary.writeFloatLE(n, 288+i*4));
  indices.forEach((n,i) => binary.writeUInt16LE(n, 576+i*2));
  const json = Buffer.from(JSON.stringify({
    asset: {version: '2.0', generator: 'ExhibitOS synthetic generator v1', copyright: 'CC0-1.0'},
    scene: 0, scenes: [{nodes: [0]}], nodes: [{mesh: 0}],
    meshes: [{primitives: [{attributes: {POSITION: 0, NORMAL: 1}, indices: 2, material: 0}]}],
    materials: [{pbrMetallicRoughness: {baseColorFactor: [0.1,0.45,0.65,1], metallicFactor: 0, roughnessFactor: 0.8}}],
    buffers: [{byteLength: binary.length}],
    bufferViews: [{buffer: 0, byteOffset: 0, byteLength: 288, target: 34962},
      {buffer: 0, byteOffset: 288, byteLength: 288, target: 34962},
      {buffer: 0, byteOffset: 576, byteLength: 72, target: 34963}],
    accessors: [{bufferView: 0, componentType: 5126, count: 24, type: 'VEC3', min: [-.5,0,-.5], max: [.5,1,.5]},
      {bufferView: 1, componentType: 5126, count: 24, type: 'VEC3'},
      {bufferView: 2, componentType: 5123, count: 36, type: 'SCALAR'}],
  }));
  const padded = Buffer.alloc(Math.ceil(json.length/4)*4, 0x20); json.copy(padded);
  const output = Buffer.alloc(12+8+padded.length+8+binary.length);
  output.writeUInt32LE(0x46546c67,0); output.writeUInt32LE(2,4); output.writeUInt32LE(output.length,8);
  output.writeUInt32LE(padded.length,12); output.writeUInt32LE(0x4e4f534a,16); padded.copy(output,20);
  const offset = 20+padded.length;
  output.writeUInt32LE(binary.length,offset); output.writeUInt32LE(0x004e4942,offset+4); binary.copy(output,offset+8);
  return output;
}

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, payload) {
  const output = Buffer.alloc(payload.length+12);
  output.writeUInt32BE(payload.length); output.write(type,4,4,'ascii'); payload.copy(output,8);
  output.writeUInt32BE(crc32(output.subarray(4,-4)),output.length-4); return output;
}
export function painting() {
  const size = 256, pixels = Buffer.alloc(size*(1+size*3));
  const colors = [[22,79,99],[245,176,65],[204,75,62],[241,230,202]];
  for (let y=0; y<size; y++) for (let x=0; x<size; x++) {
    const color = colors[(Math.floor(x/64)+Math.floor(y/64))%4];
    color.forEach((value,index) => { pixels[y*(1+size*3)+1+x*3+index]=value; });
  }
  // Explicit zlib stored blocks avoid library/version dependent compressed bytes.
  const blocks = [Buffer.from([0x78,0x01])];
  for (let offset=0; offset<pixels.length; offset+=65535) {
    const block = pixels.subarray(offset,offset+65535), header = Buffer.alloc(5);
    header[0] = offset+block.length === pixels.length ? 1 : 0;
    header.writeUInt16LE(block.length,1); header.writeUInt16LE(0xffff^block.length,3); blocks.push(header,block);
  }
  let a=1,b=0; for (const value of pixels) { a=(a+value)%65521; b=(b+a)%65521; }
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(((b<<16)|a)>>>0); blocks.push(checksum);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size); ihdr.writeUInt32BE(size,4); ihdr[8]=8; ihdr[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('sRGB',Buffer.from([0])),chunk('IDAT',Buffer.concat(blocks)),chunk('IEND',Buffer.alloc(0))]);
}
export const generated = () => ({'sculpture.glb': sculpture(), 'painting.png': painting()});
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = resolve(process.argv[2] ?? 'fixtures/synthetic');
  await mkdir(directory,{recursive:true});
  for (const [name,bytes] of Object.entries(generated())) await writeFile(resolve(directory,name),bytes);
  console.log(`Generated synthetic binaries in ${directory}; manifest is intentionally not rewritten.`);
}
