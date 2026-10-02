// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readOex,writeOex,validateOex,OEX_VERSION,OEX_MEDIA_VERSION,OexError,packageMediaAssetManifest,adaptOexManifest} from '../index.mjs';
import {createMediaExample} from '../scripts/generate-media-oex.mjs';
import {buildZip} from '../scripts/zip-fixture-builder.mjs';
import {readBoundedZip} from './zip.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const sample=await createMediaExample();
async function rejects(operation,code){await assert.rejects(operation,error=>error instanceof OexError&&error.code===code);}
test('draft2 media fixture deterministic and public draft1 bytes remain supported',async()=>{
 assert.equal(OEX_VERSION,'1.0.0-draft.1');assert.equal(OEX_MEDIA_VERSION,'1.0.0-draft.2');
 assert.equal(hash(sample.archive),'28b74acc1444d15f8a64a307350b784b4b86279cbd2ed5a31939ff3e57188f66');
 assert.deepEqual(sample.archive,await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url)));
 const original=await readFile(new URL('../oex/v1/examples/synthetic.oex',import.meta.url));assert.equal(hash(original),'747c11f09ec64a656466bbf14453a304b550afcf4c88daba845d3e1c6b45c72f');assert.equal((await readOex(original)).manifest.formatVersion,OEX_VERSION);
 const decoded=await readOex(new Uint8Array(sample.archive));assert.equal(decoded.manifest.formatVersion,OEX_MEDIA_VERSION);assert.deepEqual(decoded.files.get('assets/media/synthetic/audio.wav'),sample.wav);assert.deepEqual(decoded.manifest.assets,packageMediaAssetManifest(decoded.exhibition));
 const media=decoded.manifest.assets.find(a=>a.kind==='media');assert.deepEqual(media.provenanceReferences,[]);assert.deepEqual(media.rightsReferences,['exhibition.json#/mediaAssets/0/rights']);
 assert.deepEqual(await writeOex(sample.revision,new Map([...sample.assets].reverse()),sample.options),sample.archive);
});
test('writer refuses missing/extra files, mismatches, malformed source and invalid options',async()=>{
 await rejects(()=>writeOex(sample.revision,new Map(),sample.options),'ARCHIVE_LAYOUT_MISMATCH');
 const extra=new Map(sample.assets);extra.set('extra.dat',Buffer.from('x'));await rejects(()=>writeOex(sample.revision,extra,sample.options),'ARCHIVE_LAYOUT_MISMATCH');
 const changed=new Map(sample.assets);changed.set('media/synthetic/audio.wav',Buffer.alloc(sample.wav.length));await rejects(()=>writeOex(sample.revision,changed,sample.options),'ASSET_HASH_MISMATCH');
 await rejects(()=>writeOex(sample.revision,sample.assets,{...sample.options,createdAt:'garbage'}),'SCHEMA_INVALID');
 await rejects(()=>writeOex({...sample.revision,schemaVersion:'bad'},sample.assets,sample.options),'UNSUPPORTED_VERSION');
});
test('media creation grants/time checked, display permission independent',async()=>{
 for(const [update,code]of [[r=>r.permissions.export=false,'EXPORT_PERMISSION_REQUIRED'],[r=>r.expiresAt='2026-10-02T09:00:00Z','RIGHTS_EXPIRED'],[r=>r.validFrom='2026-10-03T09:00:00Z','RIGHTS_NOT_YET_VALID']]){const revision=structuredClone(sample.revision);update(revision.mediaAssets[0].rights);await rejects(()=>writeOex(revision,sample.assets,sample.options),code);}
 const revision=structuredClone(sample.revision);revision.mediaAssets[0].rights.permissions.display=false;assert.equal((await validateOex(await writeOex(revision,sample.assets,sample.options))).valid,true);
});
test('only exact bounded PCM16 WAV binary profile accepted',async()=>{
 for(const edit of [b=>b.writeUInt16LE(3,20),b=>b.writeUInt16LE(3,22),b=>b.writeUInt32LE(96000,24),b=>b.writeUInt32LE(1,28),b=>b.writeUInt16LE(8,34),b=>b.write('LIST',36),b=>b.writeUInt32LE(2,4),b=>b.writeUInt32LE(90000,40)]){
  const wav=Buffer.from(sample.wav);edit(wav);const revision=structuredClone(sample.revision);revision.mediaAssets[0].sha256=hash(wav);const assets=new Map(sample.assets);assets.set(revision.mediaAssets[0].path,wav);await rejects(()=>writeOex(revision,assets,sample.options),'AUDIO_INVALID');
 }
 const revision=structuredClone(sample.revision);revision.mediaAssets[0].mime='audio/mpeg';revision.mediaAssets[0].path='media/audio.mp3';const assets=new Map(sample.assets);assets.delete('media/synthetic/audio.wav');assets.set('media/audio.mp3',sample.wav);await rejects(()=>writeOex(revision,assets,sample.options),'SCHEMA_INVALID');
});
test('reader owns snapshot across asynchronous validation and returned files cannot mutate caller bytes',async()=>{
 const input=Buffer.from(sample.archive),pending=readOex(input);input.fill(0);const decoded=await pending;assert.deepEqual(decoded.files.get('assets/media/synthetic/audio.wav'),sample.wav);
 const original=Buffer.from(sample.archive),decoded2=await readOex(original);decoded2.files.get('assets/media/synthetic/audio.wav').fill(0);assert.deepEqual(original,sample.archive);
});
test('reader rejects traversal, duplicate names, expansion bomb, hidden extra layout and pointers before returning data',async()=>{
 const files=readBoundedZip(sample.archive),entries=[...files].map(([name,data])=>({name,data}));
 await rejects(()=>readOex(buildZip([...entries,{name:'../escape',data:'x'}])),'ZIP_UNSAFE_PATH');
 await rejects(()=>readOex(buildZip([...entries,{name:'ASSETS/media/synthetic/audio.wav',data:'x'}])),'ZIP_DUPLICATE_PATH');
 await rejects(()=>readOex(buildZip([{name:'manifest.json',data:Buffer.alloc(100000),method:8}])),'ZIP_RATIO_LIMIT');
 await rejects(()=>readOex(buildZip([...entries,{name:'hidden.json',data:'x'}])),'ARCHIVE_LAYOUT_MISMATCH');
 const manifest=JSON.parse(files.get('manifest.json'));manifest.assets.find(a=>a.kind==='media').provenanceReferences=['exhibition.json#/artworks/0/provenance'];entries[0].data=Buffer.from(JSON.stringify(manifest));await rejects(()=>readOex(buildZip(entries)),'ASSET_MANIFEST_MISMATCH');
 await rejects(()=>readOex('bad'),'ZIP_INPUT_TYPE');
});

test('identity compatibility never silently upgrades or downgrades profiles',async()=>{const {manifest}=await readOex(sample.archive);assert.equal(adaptOexManifest(manifest,OEX_MEDIA_VERSION).valid,true);assert.equal(adaptOexManifest(manifest,OEX_VERSION).valid,false);const old=(await readOex(await readFile(new URL('../oex/v1/examples/synthetic.oex',import.meta.url)))).manifest;assert.equal(adaptOexManifest(old,OEX_MEDIA_VERSION).valid,false);});
