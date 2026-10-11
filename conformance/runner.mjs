// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateArtwork,validateArtworkFiles } from '../validators/artwork.mjs';
import { validateExhibition,validateExhibitionFiles,validateLifecycle } from '../validators/exhibition.mjs';
import { validateOex,validateOed } from '../validators/package.mjs';
import { validateSpatialProgram, spatialScopeFor } from '../validators/spatial-scripting.mjs';
const root=new URL('../',import.meta.url);
const fixtures=new Set(['oes/v1/examples/spatial-program.json','oes/v1/examples/spatial-exhibition.json','oes/v1/examples/sculpture.json','oes/v1/examples/painting.json','oes/v1/examples/exhibition.json','oes/v1/examples/draft.json','oes/v1/examples/publication.json','oes/v1/examples/freeze.json','oex/v1/examples/media-manifest.json','oex/v1/examples/synthetic-media.oex','fixtures/synthetic/audio.wav','oex/v1/examples/manifest.json','oex/v1/examples/synthetic.oex','oed/v1/examples/local.json','oed/v1/examples/ssh.json','fixtures/synthetic/sculpture.glb','fixtures/synthetic/painting.png','fixtures/synthetic/manifest.json','fixtures/synthetic/reference-scene.json']);
export function fixtureURL(path){if(!fixtures.has(path))throw new Error('UNKNOWN_FIXTURE');return new URL(path,root);}
export function schemaURL(name){if(!['artwork','exhibition','lifecycle','oex','oex-media','oed','spatial-scripting'].includes(name))throw new Error('UNKNOWN_SCHEMA');return new URL('schemas/'+name+'.json',root);}
export async function runConformance(){
 const cases=[],errors=[];
 async function check(id,operation,expected=true,code){try{const checked=await operation();const valid=checked.valid===expected&&(!code||checked.errors.some(e=>e.code===code));cases.push({id,valid});if(!valid)errors.push({code:'CONFORMANCE_FAILED',path:id,message:'Unexpected acceptance or missing rejection code'});}catch{cases.push({id,valid:false});errors.push({code:'CONFORMANCE_FAILED',path:id,message:'Fixture or consumer validation failed'});}}
 const json=async path=>JSON.parse(await readFile(fixtureURL(path),'utf8'));
 const sculpture=await json('oes/v1/examples/sculpture.json'),painting=await json('oes/v1/examples/painting.json'),exhibition=await json('oes/v1/examples/exhibition.json'),publication=await json('oes/v1/examples/publication.json');
 const assetRoot=fileURLToPath(new URL('fixtures/synthetic/',root));
 await check('artwork-model-files',()=>validateArtworkFiles(sculpture,assetRoot));
 await check('artwork-image-files',()=>validateArtworkFiles(painting,assetRoot));
 await check('exhibition-files',()=>validateExhibitionFiles(exhibition,assetRoot));
 await check('publication',()=>validateLifecycle(publication,exhibition));
 await check('freeze',async()=>validateLifecycle(await json('oes/v1/examples/freeze.json'),exhibition,{publication}));
 await check('oex-binary',async()=>validateOex(await readFile(fixtureURL('oex/v1/examples/synthetic.oex'))));
 await check('oed-local',async()=>validateOed(await json('oed/v1/examples/local.json')));
 await check('oed-ssh',async()=>validateOed(await json('oed/v1/examples/ssh.json')));
 await check('reject-unknown-artwork-version',()=>validateArtwork({...sculpture,schemaVersion:'2.0.0'}),false,'UNSUPPORTED_VERSION');
 const scaled=structuredClone(sculpture);scaled.transform.scale[0]=0;
 await check('reject-zero-scale',()=>validateArtwork(scaled),false);
 const rights=structuredClone(sculpture);rights.rights.permissions.display=false;
 await check('reject-publication-rights',()=>validateArtwork(rights,{publicationTime:publication.publishedAt}),false);
 const dangling=structuredClone(exhibition);dangling.placements[0].roomId='ffffffff-ffff-4fff-8fff-ffffffffffff';
 await check('reject-dangling-room',()=>validateExhibition(dangling),false);
 await check('reject-leap-second',()=>validateArtwork(sculpture,{publicationTime:'2016-12-31T23:59:60Z'}),false);
 await check('reject-corrupted-oex',async()=>{const bytes=await readFile(fixtureURL('oex/v1/examples/synthetic.oex'));bytes[bytes.length-1]^=1;return validateOex(bytes);},false);
 const secret=await json('oed/v1/examples/local.json');secret.token='synthetic-forbidden-literal';
 await check('reject-raw-credential-field',()=>validateOed(secret),false,'SCHEMA_INVALID');
 const spatial=await json('oes/v1/examples/spatial-exhibition.json');
 await check('spatial-profile',()=>validateExhibition(spatial));
 const unsafe=structuredClone(spatial);unsafe.extensions['org.exhibitos.runtime/spatial-scripting'].version=2;
 await check('reject-spatial-version',()=>validateExhibition(unsafe),false,'SPATIAL_SCRIPTING_INVALID');
 const escaped=await json('oes/v1/examples/spatial-program.json');escaped.rules[0].actions[0].lightId='ffffffff-ffff-4fff-8fff-ffffffffffff';
 await check('reject-spatial-scope',()=>validateSpatialProgram(escaped,spatialScopeFor(spatial)),false,'SPATIAL_SCRIPTING_INVALID');
 return {valid:errors.length===0,cases,errors};
}
