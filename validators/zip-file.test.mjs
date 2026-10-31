// SPDX-License-Identifier: Apache-2.0
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,symlink,open,rename} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildZip} from '../scripts/zip-fixture-builder.mjs';
import {readBoundedZip} from './zip.mjs';
import {openBoundedZipFile,fileCrc32} from './zip-file.mjs';
import {readOex,withOexFile,withOexFileHandle,writeOex,writeOexFile} from './package.mjs';

async function fixture(bytes,run){const dir=await mkdtemp(join(tmpdir(),'exhibitos-zip-file-'));try{const path=join(dir,'input.oex');await writeFile(path,bytes);await run(path,dir);}finally{await rm(dir,{recursive:true,force:true});}}
const original=await readFile(new URL('../oex/v1/examples/synthetic.oex',import.meta.url));
test('file reader verifies original OEX and bounds access to callback lifetime',async()=>fixture(original,async path=>{
 const expected=await readOex(original);let captured;
 await withOexFile(path,async actual=>{captured=actual.files;assert.deepEqual(actual.manifest,expected.manifest);assert.deepEqual(actual.exhibition,expected.exhibition);for(const [name,bytes] of expected.files)assert.deepEqual(await actual.files.get(name),bytes);});
 await assert.rejects(()=>captured.get('manifest.json'),/ZIP_INPUT_CHANGED/);
}));
test('file ZIP reader agrees with in-memory reader on stored and deflated entries',async()=>{
 const archive=buildZip([{name:'first.txt',data:'contents'},{name:'folder/second.txt',data:'a range of distinct characters 123456789',method:8}]);
 await fixture(archive,async path=>{const f=await openBoundedZipFile(path);try{const old=readBoundedZip(archive);assert.deepEqual([...f.keys()],[...old.keys()]);for(const [name,data] of old)assert.deepEqual(await f.get(name),data);}finally{await f.close();}});
});
test('file reader rejects changed bytes, local-header mismatch, unsafe names and symlinks',async()=>{
 const corrupted=Buffer.from(original),old=readBoundedZip(original),first=[...old.keys()][0],n=Buffer.byteLength(first);corrupted[30+n]^=1;
 await fixture(corrupted,async path=>assert.rejects(()=>withOexFile(path,()=>{}),/ZIP_CRC_MISMATCH/));
 const mismatch=Buffer.from(original);mismatch[6]^=1;await fixture(mismatch,async path=>assert.rejects(()=>openBoundedZipFile(path),/ZIP_LOCAL_CENTRAL_MISMATCH/));
 const unsafe=buildZip([{name:'../escape',data:'x'}]);await fixture(unsafe,async path=>assert.rejects(()=>openBoundedZipFile(path),/ZIP_UNSAFE_PATH/));
 await fixture(original,async(path,dir)=>{const link=join(dir,'link.oex');await symlink(path,link);await assert.rejects(()=>openBoundedZipFile(link));});
});
test('file reader refuses a changed snapshot before it returns an entry',async()=>fixture(original,async path=>{
 const f=await openBoundedZipFile(path);try{const handle=await open(path,'r+');await handle.write(Buffer.from([0]),0,1,30);await handle.close();await assert.rejects(()=>f.get('manifest.json'),/ZIP_INPUT_CHANGED/);}finally{await f.close();}
}));

test('file writer preserves exact assets, advertises the new identity and cleans up changed data',async()=>fixture(original,async(path,dir)=>{
 const {exhibition,files}=await readOex(original),assetPaths=[...files.keys()].filter(name=>name.startsWith('assets/')).map(name=>name.slice(7)),assets=new Map(assetPaths.map(name=>[name,files.get('assets/'+name)]));
 const options={createdAt:'2026-10-03T00:00:00Z',generator:{name:'fixture',version:'1'}};
 const expected=await writeOex(exhibition,assets,options),destination=join(dir,'output.oex');
 const result=await writeOexFile(exhibition,{paths:assetPaths,get:async name=>assets.get(name)},destination,options);
 const written=await readFile(destination);assert.equal(result.bytes,written.length);
 const owned=await open(destination,'r');try{await withOexFileHandle(owned,async result=>assert.equal(result.manifest.formatVersion,'1.0.0-draft.9'));assert.ok((await owned.stat()).isFile());}finally{await owned.close();}
 const oldEntries=readBoundedZip(expected),newEntries=readBoundedZip(written);assert.equal(JSON.parse(newEntries.get('manifest.json')).formatVersion,'1.0.0-draft.9');
 for(const [name,bytes] of oldEntries)if(name!=='manifest.json')assert.deepEqual(newEntries.get(name),bytes);
 await assert.rejects(()=>readOex(written),/UNSUPPORTED_VERSION/);
 await assert.rejects(()=>writeOexFile(exhibition,{paths:assetPaths,get:async name=>assets.get(name)},destination,options),/EEXIST/);
 const bad=join(dir,'bad.oex');await assert.rejects(()=>writeOexFile(exhibition,{paths:assetPaths,get:async name=>{const bytes=Buffer.from(assets.get(name));bytes[0]^=1;return bytes;}},bad,options),/ASSET_HASH_MISMATCH/);
 await assert.rejects(()=>readFile(bad),/ENOENT/);
}));

test('file profile explicitly permits the larger exhibition inventory while legacy semantics stay bounded',async()=>{
 const {exhibition}=await readOex(original);const revision=structuredClone(exhibition);
 for(let j=0;j<revision.artworks.length;j++)for(let i=0;i<5;i++)revision.artworks[j].assets.push({id:`aaaaaaaa-aaaa-4aaa-8aaa-${String(j*5+i+1).padStart(12,'0')}`,path:`synthetic/large-${j}-${i}.png`,role:'preview',mime:'image/png',bytes:32*1024*1024,sha256:'1'.repeat(64)});
 const {validateExhibition,validateLifecycle,sealDraft}=await import('./exhibition.mjs');
 const draft=JSON.parse(await readFile(new URL('../oes/v1/examples/draft.json',import.meta.url)));draft.candidate=revision;draft.exhibitionId=revision.id;
 assert.ok(validateLifecycle(draft).errors.some(error=>error.code==='ASSET_TOTAL_LIMIT'));
 assert.deepEqual(validateLifecycle(draft,undefined,{archiveProfile:'bounded-file-v1'}),{valid:true,errors:[]});
 assert.equal(sealDraft(draft,{archiveProfile:'bounded-file-v1'}).valid,true);
 assert.ok(validateExhibition(revision).errors.some(error=>error.code==='ASSET_TOTAL_LIMIT'));
 assert.deepEqual(validateExhibition(revision,{archiveProfile:'bounded-file-v1'}),{valid:true,errors:[]});
 assert.ok(validateExhibition(revision,{archiveProfile:'unknown'}).errors.some(error=>error.code==='UNSUPPORTED_ARCHIVE_PROFILE'));
});

test('file ZIP structural rejection matches legacy reader for duplicate, prefix, flags and special files',async()=>{
 const cases=[
  [[{name:'a',data:'x'},{name:'A',data:'y'}],'ZIP_DUPLICATE_PATH'],
  [[{name:'a',data:'x'},{name:'a/b',data:'y'}],'ZIP_PATH_PREFIX_COLLISION'],
  [[{name:'a/b',data:'x'},{name:'a',data:'y'}],'ZIP_PATH_PREFIX_COLLISION'],
  [[{name:'a',data:'x',flags:8}],'ZIP_UNSUPPORTED_FEATURE'],
  [[{name:'a',data:'x',attributes:0xa1ff0000}],'ZIP_SYMLINK'],
  [[{name:'a',data:'x',attributes:0x41ed0010}],'ZIP_SPECIAL_FILE'],
  [[{name:'a',data:Buffer.alloc(100000),method:8}],'ZIP_RATIO_LIMIT']
 ];
 for(const [entries,code] of cases){const archive=buildZip(entries);assert.throws(()=>readBoundedZip(archive),new RegExp(code));await fixture(archive,async path=>assert.rejects(()=>openBoundedZipFile(path),new RegExp(code)));}
});
test('file reader rejects parallel entry allocation and profile rejects an oversized asset',async()=>fixture(original,async path=>{
 const f=await openBoundedZipFile(path);try{const first=f.get('manifest.json');await assert.rejects(()=>f.get('exhibition.json'),/ZIP_CONCURRENT_READ/);await first;}finally{await f.close();}
 const {exhibition}=await readOex(original);exhibition.artworks[0].assets[0].bytes=32*1024*1024+1;
 const {validateExhibition}=await import('./exhibition.mjs');assert.ok(validateExhibition(exhibition,{archiveProfile:'bounded-file-v1'}).errors.some(error=>error.code==='ASSET_FILE_LIMIT'));
}));

test('writer does not accept a replaced destination path or delete the replacement',async()=>fixture(original,async(_path,dir)=>{
 const {exhibition,files}=await readOex(original),paths=[...files.keys()].filter(name=>name.startsWith('assets/')).map(name=>name.slice(7)),destination=join(dir,'output.oex');let changed=false;
 const source={paths,get:async name=>{if(!changed){changed=true;await rename(destination,join(dir,'moved.oex'));await writeFile(destination,original);}return files.get('assets/'+name);}};
 await assert.rejects(()=>writeOexFile(exhibition,source,destination,{createdAt:'2026-10-03T00:00:00Z',generator:{name:'fixture',version:'1'}}),/ZIP_INPUT_CHANGED/);
 assert.deepEqual(await readFile(destination),original);
}));

test('file-backed OEX exceeds the legacy archive cap without allocating an archive-sized map',async()=>fixture(original,async(_path,dir)=>{
 const parsed=await readOex(original),revision=structuredClone(parsed.exhibition),size=23*1024*1024;
 // Contract checks PNG signature only; padded bytes are not a decoded image fixture.
 const synthetic=index=>{const data=Buffer.alloc(size);Buffer.from([137,80,78,71,13,10,26,10]).copy(data);data[8]=index;return data;};
 const added=new Map();
 for(let i=0;i<3;i++){const path=`synthetic/padded-${i}.png`,data=synthetic(i);revision.artworks[1].assets.push({id:`bbbbbbbb-bbbb-4bbb-8bbb-${String(i+1).padStart(12,'0')}`,path,role:'preview',mime:'image/png',bytes:size,sha256:createHash('sha256').update(data).digest('hex')});added.set(path,i);}
 const paths=[...parsed.files.keys()].filter(name=>name.startsWith('assets/')).map(name=>name.slice(7)).concat([...added.keys()]);
 const destination=join(dir,'large.oex'),options={createdAt:'2026-10-03T00:00:00Z',generator:{name:'synthetic-test',version:'1'}};
 const written=await writeOexFile(revision,{paths,get:async name=>added.has(name)?synthetic(added.get(name)):parsed.files.get('assets/'+name)},destination,options);
 assert.ok(written.bytes>64*1024*1024);
 await withOexFile(destination,async result=>{assert.equal(result.exhibition.artworks[1].assets.length,revision.artworks[1].assets.length);});
 const archive=await readFile(destination);await assert.rejects(()=>readOex(archive),/ZIP_ARCHIVE_LIMIT/);
 // Forge a legacy identity while retaining the large ZIP; it must not inherit
 // the newer profile's larger archive allowance.
 const legacy=Buffer.from(archive),nameLength=legacy.readUInt16LE(26),start=30+nameLength,length=legacy.readUInt32LE(22),json=legacy.subarray(start,start+length),needle=Buffer.from('1.0.0-draft.9'),pos=json.indexOf(needle);assert.ok(pos>=0);json[pos+needle.length-1]=0x32;
 const crc=fileCrc32(json),central=legacy.readUInt32LE(legacy.length-6);legacy.writeUInt32LE(crc,14);legacy.writeUInt32LE(crc,central+16);
 const forged=join(dir,'forged-legacy.oex');await writeFile(forged,legacy);await assert.rejects(()=>withOexFile(forged,async()=>{}),/ZIP_ARCHIVE_LIMIT/);
}));

test('file ZIP rejects local header mismatches, offsets, tails and deflate trailing bytes',async()=>{
 const baseline=buildZip([{name:'a.json',data:'hello'}]);
 for(const offset of [6,8,14,18,22,30]){const changed=Buffer.from(baseline);changed[offset]^=1;await fixture(changed,async path=>assert.rejects(()=>openBoundedZipFile(path),/ZIP_LOCAL_CENTRAL_MISMATCH/));}
 const central=baseline.readUInt32LE(baseline.length-6),wrong=Buffer.from(baseline);wrong.writeUInt32LE(1,central+42);
 await fixture(wrong,async path=>assert.rejects(()=>openBoundedZipFile(path),/ZIP_LOCAL_LAYOUT/));
 await fixture(Buffer.concat([baseline,Buffer.from('tail')]),async path=>assert.rejects(()=>openBoundedZipFile(path),/ZIP_END_RECORD/));
 const compressed=buildZip([{name:'entry.json',data:Buffer.from('plain compressible entry 1234567890'),method:8}]),offset=compressed.readUInt32LE(compressed.length-6),tail=Buffer.concat([compressed.subarray(0,offset),Buffer.from([0]),compressed.subarray(offset)]);
 tail.writeUInt32LE(compressed.readUInt32LE(18)+1,18);tail.writeUInt32LE(compressed.readUInt32LE(offset+20)+1,offset+21);tail.writeUInt32LE(offset+1,tail.length-6);
 await fixture(tail,async path=>{const f=await openBoundedZipFile(path);try{await assert.rejects(()=>f.get('entry.json'),/ZIP_DEFLATE_TRAILING_DATA/);}finally{await f.close();}});
});
test('file profile refuses a >32MiB entry that legacy ZIP accepts',async()=>{
 const data=Buffer.alloc(32*1024*1024+1,7),archive=buildZip([{name:'legacy.bin',data}]);
 assert.equal(readBoundedZip(archive).get('legacy.bin').length,data.length);
 await fixture(archive,async path=>assert.rejects(()=>openBoundedZipFile(path),/ZIP_SIZE_LIMIT/));
});

test('draft.9 composes synthetic media, still, furnishing and exact notice without loss',async()=>{
 const input=await readOex(await readFile(new URL('../oex/v1/examples/synthetic-space-still.oex',import.meta.url))),revision=structuredClone(input.exhibition);
 const id='a0000000-0000-4000-8000-000000000001',model=input.manifest.assets.find(a=>a.mime==='model/gltf-binary'),notice=Buffer.from('Synthetic CC0 fixture notice.\n'),digest=b=>createHash('sha256').update(b).digest('hex');
 revision.extensions['org.exhibitos.studio/furnishing-visuals']={version:1,assets:[{id,catalogId:'synthetic-fixture',catalogVersion:1,mime:model.mime,path:`furnishings/${id}/model.glb`,bytes:model.bytes,sha256:model.sha256,rights:{licenseId:'CC0-1.0',notice:{path:`furnishings/${id}/LICENSE-NOTICE.txt`,bytes:notice.length,sha256:digest(notice)}},provenance:{sourceSha256:model.sha256,recipe:'original-v1'}}],bindings:[{hostKind:'pedestal',hostId:revision.placements[0].id,assetId:id,pose:{position:[0,0,0],yaw:0,scale:1}}]};
 const assets=new Map(input.manifest.assets.map(asset=>[asset.artifactPath,input.files.get(asset.path)]));assets.set(`furnishings/${id}/model.glb`,input.files.get(model.path));assets.set(`furnishings/${id}/LICENSE-NOTICE.txt`,notice);
 await fixture(original,async(_path,dir)=>{const output=join(dir,'composed.oex'),options={createdAt:input.manifest.createdAt,generator:input.manifest.generator};
  await writeOexFile(revision,{paths:[...assets.keys()],get:async name=>assets.get(name)},output,options);
  await withOexFile(output,async result=>{assert.equal(result.manifest.formatVersion,'1.0.0-draft.9');assert.equal(result.manifest.assets.filter(asset=>asset.kind==='space-still').length,1);assert.equal(result.manifest.assets.filter(asset=>asset.kind==='media').length,1);assert.equal(result.manifest.assets.filter(asset=>asset.kind==='furnishing').length,1);assert.deepEqual(await result.files.get(`resources/furnishings/${id}/LICENSE-NOTICE.txt`),notice);});
  const missing=new Map(assets);missing.delete(`furnishings/${id}/LICENSE-NOTICE.txt`);await assert.rejects(()=>writeOexFile(revision,{paths:[...missing.keys()],get:async name=>missing.get(name)},join(dir,'missing.oex'),options),/ARCHIVE_LAYOUT_MISMATCH/);
  const denied=structuredClone(revision);denied.artworks[0].rights.permissions.export=false;await assert.rejects(()=>writeOexFile(denied,{paths:[...assets.keys()],get:async name=>assets.get(name)},join(dir,'denied.oex'),options),/EXPORT_PERMISSION_REQUIRED/);
 });
});

test('file reader keeps the legacy expanded-size cap despite a large-profile-capable parser',async()=>{
 const manifest=readBoundedZip(original).get('manifest.json'),payload=Buffer.alloc(1024*1024,3);
 const archive=buildZip([{name:'manifest.json',data:manifest},...Array.from({length:9},(_,i)=>({name:`assets/declared-${i}.bin`,data:payload,declaredSize:32*1024*1024}))]);
 assert.ok(archive.length<64*1024*1024);
 await fixture(archive,async path=>assert.rejects(()=>withOexFile(path,async()=>{}),/ZIP_EXPANDED_LIMIT/));
});

test('open-handle reader stays on the owned inode if its pathname is replaced',async()=>fixture(original,async(path,dir)=>{
 const handle=await open(path,'r');try{await rename(path,join(dir,'owned.oex'));await writeFile(path,Buffer.from('replacement'));await withOexFileHandle(handle,async result=>{assert.equal(result.exhibition.kind,'exhibition-revision');});assert.ok((await handle.stat()).isFile());}finally{await handle.close();}
}));

test('open-handle reader retains ownership on callback failure and rejects mutation during callback',async()=>fixture(original,async path=>{
 const h=await open(path,'r+');try{await assert.rejects(()=>withOexFileHandle(h,async()=>{throw Error('CALLBACK');}),/CALLBACK/);assert.ok((await h.stat()).isFile());await assert.rejects(()=>withOexFileHandle(h,async()=>{await h.write(Buffer.from([0]),0,1,30);}),/ZIP_INPUT_CHANGED/);assert.ok((await h.stat()).isFile());}finally{await h.close();}
}));

test('open-handle reader does not close an invalid archive handle',async()=>fixture(Buffer.from('not a zip'),async path=>{const h=await open(path,'r');try{await assert.rejects(()=>withOexFileHandle(h,async()=>{}));assert.ok((await h.stat()).isFile());}finally{await h.close();}}));

test('replacement during callback cannot redirect reads to a different archive',async()=>fixture(original,async(path,dir)=>{const h=await open(path,'r');try{await assert.rejects(()=>withOexFileHandle(h,async()=>{await rename(path,join(dir,'moved.oex'));await writeFile(path,Buffer.from('replacement'));}),/ZIP_INPUT_CHANGED/);assert.ok((await h.stat()).isFile());}finally{await h.close();}}));
