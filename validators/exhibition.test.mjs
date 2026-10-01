// SPDX-License-Identifier: Apache-2.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,mkdtemp,writeFile,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { validateExhibition,validateExhibitionFiles,validateLifecycle,validateLifecycleFiles,sealDraft,revisionHash,assetInventory } from './exhibition.mjs';
const load=async name=>JSON.parse(await readFile(new URL(`../oes/v1/examples/${name}.json`,import.meta.url),'utf8'));
const reference=await load('exhibition'),draft=await load('draft'),publication=await load('publication'),freeze=await load('freeze');
const root=new URL('../fixtures/synthetic/',import.meta.url).pathname;
const id=n=>'60000000-0000-4000-8000-'+String(n).padStart(12,'0');
const mutate=change=>{const document=structuredClone(reference);change(document);return document;};
const has=(checked,code)=>{assert.equal(checked.valid,false);assert.ok(checked.errors.some(error=>error.code===code),JSON.stringify(checked.errors));};
const negatives=[
  ['unknown version',r=>{r.schemaVersion='2.0.0';},'UNSUPPORTED_VERSION'],
  ['dangling room',r=>{r.placements[0].roomId=id(1);},'MISSING_ROOM'],
  ['dangling artwork snapshot',r=>{r.placements[0].artworkRevisionId=id(1);},'MISSING_ARTWORK_REVISION'],
  ['dangling placement asset',r=>{r.placements[0].assetId=id(1);},'MISSING_PLACEMENT_ASSET'],
  ['cross-artwork display asset',r=>{r.placements[0].assetId=r.artworks[1].primaryAssetId;},'MISSING_PLACEMENT_ASSET'],
  ['duplicate placement ID',r=>{r.placements[1].id=r.placements[0].id;},'DUPLICATE_ID'],
  ['zero placement scale',r=>{r.placements[0].transform.scale[0]=0;},'SCHEMA_INVALID'],
  ['non-unit placement quaternion',r=>{r.placements[0].transform.rotation=[0,0,0,.5];},'QUATERNION_NOT_NORMALIZED'],
  ['room scale',r=>{r.rooms[0].transform.scale=[2,2,2];},'NON_RIGID_SPACE'],
  ['position outside room',r=>{r.placements[0].transform.position=[99,0,0];},'POSITION_OUTSIDE_ROOM'],
  ['surface owner room',r=>{r.surfaces[0].roomId=id(1);},'MISSING_ROOM'],
  ['opening owner surface',r=>{r.openings[0].surfaceId=id(1);},'MISSING_SURFACE'],
  ['opening bounds',r=>{r.openings[0].dimensions.width=100;},'OPENING_OUTSIDE_SURFACE'],
  ['door endpoint',r=>{delete r.openings[0].exterior;r.openings[0].connectsToOpeningId=id(1);},'DANGLING_DOOR'],
  ['door endpoint missing',r=>{delete r.openings[0].exterior;},'DOOR_ENDPOINT_REQUIRED'],
  ['window with door connection',r=>{r.openings[0].type='window';},'WINDOW_CONNECTION'],
  ['light room',r=>{r.lights[0].roomId=id(1);},'MISSING_ROOM'],
  ['light target',r=>{r.lights[0].targetPlacementId=id(1);},'MISSING_LIGHT_TARGET'],
  ['light intensity unit',r=>{r.lights[0].unit='lux';},'LIGHT_UNIT'],
  ['spot beam missing',r=>{r.lights[0].type='spot';},'LIGHT_PARAMETERS'],
  ['navigation room',r=>{r.navigation[0].waypoints[0].roomId=id(1);},'MISSING_ROOM'],
  ['unexpected navigation door',r=>{r.navigation[0].waypoints[0].viaOpeningId=r.openings[0].id;},'UNEXPECTED_ROUTE_DOOR'],
  ['accessibility missing route',r=>{r.accessibility.routeIds=[id(1)];},'MISSING_ACCESSIBLE_ROUTE'],
  ['accessibility missing placement',r=>{r.accessibility.artworkDescriptions[0].placementId=id(1);},'MISSING_ACCESSIBILITY_PLACEMENT'],
  ['missing text alternative',r=>{r.accessibility.artworkDescriptions.pop();},'MISSING_ACCESSIBILITY_DESCRIPTION'],
  ['enabled script',r=>{r.scripts[0].enabled=true;},'SCHEMA_INVALID'],
  ['arbitrary JavaScript',r=>{r.scripts[0].code='fetch("https://example.com")';},'SCHEMA_INVALID'],
  ['script dangling action',r=>{r.scripts[0].actions[0].targetId=id(1);},'SCRIPT_ACTION_REFERENCE'],
  ['script dangling trigger',r=>{r.scripts[0].trigger.roomId=id(1);},'SCRIPT_TRIGGER_REFERENCE'],
  ['annotation dangling placement',r=>{r.annotations[0].placementId=id(1);},'MISSING_ANNOTATION_PLACEMENT'],
  ['leap second creation',r=>{r.createdAt='2016-12-31T23:59:60Z';},'SCHEMA_INVALID'],
  ['unknown core field',r=>{r.validated=true;},'SCHEMA_INVALID'],
  ['non-JSON extension value',r=>{r.extensions={'org.example/data':{value:NaN}};},'NON_JSON_VALUE'],
  ['extension size',r=>{r.extensions={'org.example/data':{text:'é'.repeat(9000)}};},'EXTENSION_LIMIT'],
];
for(const [name,change,code]of negatives)test(`exhibition rejects ${name}`,()=>has(validateExhibition(mutate(change)),code));
test('reference revision allows one artwork in multiple independently identified placements',async()=>{
  assert.equal(reference.placements[0].artworkRevisionId,reference.placements[1].artworkRevisionId);
  assert.notEqual(reference.placements[0].id,reference.placements[1].id);
  assert.deepEqual(validateExhibition(reference),{valid:true,errors:[]});
  assert.deepEqual(await validateExhibitionFiles(reference,root),{valid:true,errors:[]});
});
function twoRooms() {
  return mutate(r=>{
    const secondRoom=structuredClone(r.rooms[0]);secondRoom.id=id(10);secondRoom.transform.position=[0,0,8];r.rooms.push(secondRoom);
    const secondWall=structuredClone(r.surfaces[0]);secondWall.id=id(20);secondWall.roomId=secondRoom.id;secondWall.transform.position=[0,2,4];r.surfaces.push(secondWall);
    const secondDoor=structuredClone(r.openings[0]);secondDoor.id=id(30);secondDoor.surfaceId=secondWall.id;delete secondDoor.exterior;secondDoor.connectsToOpeningId=r.openings[0].id;
    delete r.openings[0].exterior;r.openings[0].connectsToOpeningId=secondDoor.id;r.openings.push(secondDoor);
    r.navigation[0].waypoints.push({roomId:secondRoom.id,position:[0,1.6,0],viaOpeningId:r.openings[0].id});
  });
}
test('reciprocal doors connect rooms and navigation must cross the matching graph edge',()=>{
  const r=twoRooms();assert.equal(validateExhibition(r).valid,true);
  const dangling=structuredClone(r);delete dangling.navigation[0].waypoints[2].viaOpeningId;has(validateExhibition(dangling),'INVALID_ROUTE_DOOR');
  const oneWay=structuredClone(r);oneWay.openings[1].connectsToOpeningId=id(99);has(validateExhibition(oneWay),'NON_RECIPROCAL_DOOR');
  const sameRoom=structuredClone(r);sameRoom.surfaces[1].roomId=r.rooms[0].id;has(validateExhibition(sameRoom),'DOOR_SAME_ROOM');
});
test('mutable draft seals an immutable independent copy; publication revalidates matching revision and hash',()=>{
  const sealed=sealDraft(draft);assert.equal(sealed.valid,true);assert.equal(sealed.validationScope,'document-only');
  assert.equal(Object.isFrozen(sealed.revision),true);assert.equal(Object.isFrozen(sealed.revision.placements[0].transform),true);
  assert.throws(()=>{sealed.revision.title='changed';});assert.deepEqual(draft.candidate,reference);
  assert.deepEqual(validateLifecycle(publication,sealed.revision),{valid:true,errors:[]});
  has(validateLifecycle(publication,mutate(r=>{r.title='changed';})),'REVISION_HASH_MISMATCH');
  has(validateLifecycle(publication,mutate(r=>{r.revisionId=id(1);})),'REVISION_REFERENCE_MISMATCH');
  const forged=structuredClone(publication);forged.validated=true;has(validateLifecycle(forged,reference),'SCHEMA_INVALID');
  assert.equal(validateLifecycle(publication,draft).valid,false);
});
test('publication rights apply to every embedded artwork at the exact publication instant',()=>{
  for(const property of ['display','expired','future','leap']) {
    const r=mutate(r=>{const rights=r.artworks[1].rights;if(property==='display')rights.permissions.display=false;if(property==='expired')rights.expiresAt=publication.publishedAt;if(property==='future')rights.validFrom='2026-10-01T02:00:00Z';if(property==='leap')rights.expiresAt='2016-12-31T23:59:60Z';});
    const pointer=structuredClone(publication);pointer.revisionSha256=revisionHash(r);assert.equal(validateLifecycle(pointer,r).valid,false);
  }
});
test('publication and draft timestamps share restricted UTC rules and monotonic state times',()=>{
  const bad=structuredClone(publication);bad.publishedAt='2016-12-31T23:59:60Z';has(validateLifecycle(bad,reference),'SCHEMA_INVALID');
  const unpublished=structuredClone(publication);unpublished.status='unpublished';has(validateLifecycle(unpublished,reference),'PUBLICATION_STATUS');
  unpublished.unpublishedAt='2026-10-01T02:00:00Z';assert.equal(validateLifecycle(unpublished,reference).valid,true);
  const badDraft=structuredClone(draft);badDraft.updatedAt='2026-09-30T00:00:00Z';has(validateLifecycle(badDraft),'DRAFT_TIME_RANGE');
});
test('freeze binds exact revision, active publication, sorted asset hashes and environment pins',async()=>{
  assert.deepEqual(validateLifecycle(freeze,reference,{publication}),{valid:true,errors:[]});
  assert.deepEqual(await validateLifecycleFiles(freeze,reference,root,{publication}),{valid:true,errors:[]});
  const wrongAsset=structuredClone(freeze);wrongAsset.assets[0].sha256='0'.repeat(64);has(validateLifecycle(wrongAsset,reference,{publication}),'FREEZE_ASSET_MISMATCH');
  const missingAsset=structuredClone(freeze);missingAsset.assets.pop();has(validateLifecycle(missingAsset,reference,{publication}),'FREEZE_ASSET_MISMATCH');
  const mutableTag=structuredClone(freeze);mutableTag.runtimeImageDigest='latest';has(validateLifecycle(mutableTag,reference,{publication}),'SCHEMA_INVALID');
  const wrongVersion=structuredClone(freeze);wrongVersion.specVersions.oesArtwork='2.0.0';has(validateLifecycle(wrongVersion,reference,{publication}),'SCHEMA_INVALID');
  const wrongPub=structuredClone(publication);wrongPub.id=id(1);has(validateLifecycle(freeze,reference,{publication:wrongPub}),'FREEZE_PUBLICATION_MISMATCH');
  has(validateLifecycle(freeze,reference),'PUBLICATION_REQUIRED');
  assert.deepEqual(freeze.assets,assetInventory(reference));
});
test('hash profile ignores object key order and binds array order and content; unsafe JSON is rejected',()=>{
  const reorder=value=>Array.isArray(value)?value.map(reorder):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).reverse().map(([key,value])=>[key,reorder(value)])):value;
  assert.equal(revisionHash(reference),revisionHash(reorder(reference)));
  assert.notEqual(revisionHash(reference),revisionHash(mutate(r=>{r.placements.reverse();})));
  has(validateExhibition(mutate(r=>{r.extensions={'org.example/data':{value:'\ud800'}};})),'NON_JSON_VALUE');
  const cycle=mutate(()=>{});cycle.extensions={'org.example/data':cycle};has(validateExhibition(cycle),'NON_JSON_VALUE');
});
test('document and binary validation are distinct; altered declared hash cannot prove file integrity',async()=>{
  const r=mutate(r=>{r.artworks[0].assets[0].sha256='0'.repeat(64);});
  const pointer=structuredClone(publication);pointer.revisionSha256=revisionHash(r);
  assert.equal(validateLifecycle(pointer,r).valid,true);
  has(await validateLifecycleFiles(pointer,r,root),'HASH_MISMATCH');
});
test('bounded audio metadata has no remote URL or autoplay and cannot claim audio binary verification',async()=>{
  const r=mutate(r=>{r.mediaAssets=[{id:id(200),path:'synthetic.mp3',mime:'audio/mpeg',bytes:1,sha256:'0'.repeat(64),rights:structuredClone(r.artworks[0].rights)}];r.audioZones=[{id:id(201),roomId:r.rooms[0].id,assetId:id(200),position:[0,1,0],radius:2,volume:.5,autoplay:false,transcript:'Synthetic test description; no actual audio.'}];});
  assert.equal(validateExhibition(r).valid,true);has(await validateExhibitionFiles(r,root),'MEDIA_BINARY_VALIDATION_UNSUPPORTED');
  const remote=structuredClone(r);remote.mediaAssets[0].url='https://example.com/audio.mp3';has(validateExhibition(remote),'SCHEMA_INVALID');
  const autoplay=structuredClone(r);autoplay.audioZones[0].autoplay=true;has(validateExhibition(autoplay),'SCHEMA_INVALID');
  const dangling=structuredClone(r);dangling.audioZones[0].assetId=id(299);has(validateExhibition(dangling),'MISSING_AUDIO_ASSET');
});
test('CLI validates reference files and rejects dangling door with machine-readable nonzero exit',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'oes-exhibition-cli-'));
  try{
    const filename=join(directory,'invalid.json');await writeFile(filename,JSON.stringify(mutate(r=>{delete r.openings[0].exterior;r.openings[0].connectsToOpeningId=id(1);}))); 
    const output=spawnSync(process.execPath,[new URL('./exhibition-cli.mjs',import.meta.url).pathname,'revision',filename],{encoding:'utf8'});
    assert.equal(output.status,1);assert.ok(JSON.parse(output.stdout).errors.some(error=>error.code==='DANGLING_DOOR'));
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('empty exhibitions still reject invalid publication timestamps and all non-JSON array shapes',()=>{
  const empty=mutate(r=>{r.artworks=[];r.placements=[];r.annotations=[];r.scripts=[];r.accessibility.artworkDescriptions=[];});
  assert.equal(validateExhibition(empty).valid,true);
  has(validateExhibition(empty,{publicationTime:'2016-12-31T23:59:60Z'}),'INVALID_PUBLICATION_TIME');
  for(const values of [Array(1),Object.assign([1],{extra:2})]){
    const r=mutate(r=>{r.extensions={'org.example/data':{values}};});
    has(validateExhibition(r),'NON_JSON_VALUE');assert.throws(()=>revisionHash(r),/NON_JSON_VALUE/);
  }
});

test('CLI explicitly empty asset roots fail closed for revision and publication',()=>{
  const cli=new URL('./exhibition-cli.mjs',import.meta.url).pathname;
  const referencePath=new URL('../oes/v1/examples/exhibition.json',import.meta.url).pathname;
  const publicationPath=new URL('../oes/v1/examples/publication.json',import.meta.url).pathname;
  for(const args of [['revision',referencePath,'--assets',''],['publication',publicationPath,'--revision',referencePath,'--assets','']]){
    const output=spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
    assert.equal(output.status,1);assert.equal(JSON.parse(output.stdout).errors[0].code,'USAGE');
  }
});
test('forbidden options are rejected by presence even with an empty string value',()=>{
  const cli=new URL('./exhibition-cli.mjs',import.meta.url).pathname;
  const referencePath=new URL('../oes/v1/examples/exhibition.json',import.meta.url).pathname;
  const draftPath=new URL('../oes/v1/examples/draft.json',import.meta.url).pathname;
  const publicationPath=new URL('../oes/v1/examples/publication.json',import.meta.url).pathname;
  for(const args of [['revision',referencePath,'--revision',''],['revision',referencePath,'--publication',''],['draft',draftPath,'--at',''],['draft',draftPath,'--revision',''],['publication',publicationPath,'--revision',referencePath,'--publication','']]){
    const output=spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
    assert.equal(output.status,1);assert.equal(JSON.parse(output.stdout).errors[0].code,'USAGE');
  }
});
