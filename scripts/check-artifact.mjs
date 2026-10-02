// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const args=process.argv.slice(2);
if(args.length>1||(args.length===1&&args[0]!=='--offline'))throw new Error('Use: node scripts/check-artifact.mjs [--offline]');
const offline=args[0]==='--offline';
const npm=process.platform==='win32'?'npm.cmd':'npm';
const packageJson=JSON.parse(await readFile('package.json','utf8')),filename='exhibitos-spec-'+packageJson.version+'.tgz',path=resolve('dist',filename);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex'),original=digest(await readFile(path));
function run(command,args,cwd){const r=spawnSync(command,args,{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stderr+'\n'+r.stdout);return r.stdout;}
const [packed]=JSON.parse(run(npm,['pack','--ignore-scripts','--json','--pack-destination','dist']));
assert.equal(digest(await readFile(path)),original,'Repeated pack must reproduce exact bytes');
for(const file of packed.files){assert.ok(!/AGENTS|test|operations|node_modules|\.git|\.env|dist\//.test(file.path),'Unexpected distributed file '+file.path);}
const consumer=await mkdtemp(join(tmpdir(),'exhibitos-public-consumer-'));
try{
 await writeFile(join(consumer,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{'@exhibitos/spec':'file:'+path}}));
 // Default proves installation from an empty isolated cache via public npm.
 // Offline opt-in uses the caller's existing complete metadata + tarball cache.
 const cacheArgs=offline?[]:['--cache',join(consumer,'npm-cache')];
 run(npm,['install','--ignore-scripts',...(offline?['--offline']:[]),'--registry','https://registry.npmjs.org','--no-audit','--no-fund',...cacheArgs],consumer);
 run(npm,['ci','--ignore-scripts','--offline','--no-audit','--no-fund',...cacheArgs],consumer);
 const cli=JSON.parse(run(process.execPath,['node_modules/.bin/exhibitos-conformance'],consumer));assert.equal(cli.valid,true);
 await writeFile(join(consumer,'test.mjs'),"import {runConformance,fixtureURL,schemaURL} from '@exhibitos/spec'; import {readFile} from 'node:fs/promises'; const result=await runConformance(); if(!result.valid)throw Error('Rejected'); const schema=JSON.parse(await readFile(schemaURL('artwork'))); if(!schema.$id.endsWith('/1.0.0-draft.1/artwork.schema.json'))throw Error('Schema'); console.log(JSON.stringify({valid:result.valid,cases:result.cases.length,fixture:String(fixtureURL('oes/v1/examples/sculpture.json'))}));");
 const api=JSON.parse(run(process.execPath,['test.mjs'],consumer));assert.equal(api.cases,18);
 await writeFile(join(consumer,'media.mjs'),"import {readOex,writeOex,fixtureURL,OEX_MEDIA_VERSION} from '@exhibitos/spec'; import {readFile} from 'node:fs/promises'; import {createHash} from 'node:crypto'; import schema from '@exhibitos/spec/schemas/oex-media.json' with {type:'json'}; const bytes=await readFile(fixtureURL('oex/v1/examples/synthetic-media.oex')); const decoded=await readOex(bytes); if(decoded.manifest.formatVersion!==OEX_MEDIA_VERSION||schema.properties.formatVersion.const!==OEX_MEDIA_VERSION)throw Error('Media version'); const assets=new Map(decoded.manifest.assets.map(a=>[a.artifactPath,decoded.files.get(a.path)])); const next=await writeOex(decoded.exhibition,assets,{createdAt:decoded.manifest.createdAt,generator:decoded.manifest.generator}); if(!Buffer.from(next).equals(bytes))throw Error('Roundtrip'); console.log(createHash('sha256').update(next).digest('hex'));");
 assert.equal(run(process.execPath,['media.mjs'],consumer).trim(),'28b74acc1444d15f8a64a307350b784b4b86279cbd2ed5a31939ff3e57188f66');
 await writeFile(join(consumer,'spatial.mjs'),"import {readFile} from 'node:fs/promises'; import {validateExhibition,validateSpatialProgram,validateSpatialProfile,parseSpatialProgram,spatialScopeFor,fixtureURL,SPATIAL_SCRIPTING_NAMESPACE} from '@exhibitos/spec'; import schema from '@exhibitos/spec/schemas/spatial-scripting.json' with {type:'json'}; const exhibition=JSON.parse(await readFile(fixtureURL('oes/v1/examples/spatial-exhibition.json'))),program=JSON.parse(await readFile(fixtureURL('oes/v1/examples/spatial-program.json'))),scope=spatialScopeFor(exhibition); if(schema.properties.version.const!==1||!validateExhibition(exhibition).valid||!validateSpatialProgram(program,scope).valid||!parseSpatialProgram(JSON.stringify(program),scope).program)throw Error('Spatial public consumer'); exhibition.extensions[SPATIAL_SCRIPTING_NAMESPACE].version=2;if(validateSpatialProfile(exhibition).valid||validateExhibition(exhibition).valid)throw Error('Unsafe spatial version');console.log('spatial consumer validated');");
 assert.equal(run(process.execPath,['spatial.mjs'],consumer).trim(),'spatial consumer validated');
 const imports=['artwork','exhibition','lifecycle','oex','oed'].map(name=>"import "+name+" from '@exhibitos/spec/schemas/"+name+".json' with {type:'json'};").join('\n');
 await writeFile(join(consumer,'schemas.mjs'),imports+"\nconst schemas=[artwork,exhibition,lifecycle,oex,oed]; if(schemas.some(s=>!s.$id.includes('/1.0.0-draft.1/')))throw Error('Schema identity');console.log(schemas.length);");
 assert.equal(run(process.execPath,['schemas.mjs'],consumer).trim(),'5');
 for(const [bin,args]of [['exhibitos-artwork',['oes/v1/examples/sculpture.json','fixtures/synthetic']],['exhibitos-exhibition',['revision','oes/v1/examples/exhibition.json','--assets','fixtures/synthetic']],['exhibitos-package',['oex','oex/v1/examples/synthetic.oex']],['exhibitos-package',['oed','oed/v1/examples/local.json']]]){const cwd=join(consumer,'node_modules/@exhibitos/spec');const output=JSON.parse(run(process.execPath,[join(consumer,'node_modules/.bin',bin),...args],cwd));assert.equal(output.valid,true);}
 // Compile against installed exports, not the source repo's self-reference.
 await writeFile(join(consumer,'types-consumer.mts'),await readFile('conformance/types-consumer.mts'));
 await writeFile(join(consumer,'tsconfig.json'),await readFile('conformance/tsconfig.json'));
 run(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'-p','tsconfig.json'],consumer);
 console.log(JSON.stringify({valid:true,filename,sha256:original,cases:api.cases,installation:offline?'offline isolated npm install + npm ci (prepopulated metadata/tarball cache)':'public-registry npm install with empty isolated cache + offline npm ci',types:'installed NodeNext exports',reproduction:'two exact packs',nativeIosTested:false}));
}finally{await rm(consumer,{recursive:true,force:true});}
