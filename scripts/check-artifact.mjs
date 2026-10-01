// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
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
 run(npm,['install','--ignore-scripts','--offline','--no-audit','--no-fund'],consumer);
 run(npm,['ci','--ignore-scripts','--offline','--no-audit','--no-fund'],consumer);
 const cli=JSON.parse(run(process.execPath,['node_modules/.bin/exhibitos-conformance'],consumer));assert.equal(cli.valid,true);
 await writeFile(join(consumer,'test.mjs'),"import {runConformance,fixtureURL,schemaURL} from '@exhibitos/spec'; import {readFile} from 'node:fs/promises'; const result=await runConformance(); if(!result.valid)throw Error('Rejected'); const schema=JSON.parse(await readFile(schemaURL('artwork'))); if(!schema.$id.endsWith('/1.0.0-draft.1/artwork.schema.json'))throw Error('Schema'); console.log(JSON.stringify({valid:result.valid,cases:result.cases.length,fixture:String(fixtureURL('oes/v1/examples/sculpture.json'))}));");
 const api=JSON.parse(run(process.execPath,['test.mjs'],consumer));assert.equal(api.cases,15);
 const imports=['artwork','exhibition','lifecycle','oex','oed'].map(name=>"import "+name+" from '@exhibitos/spec/schemas/"+name+".json' with {type:'json'};").join('\n');
 await writeFile(join(consumer,'schemas.mjs'),imports+"\nconst schemas=[artwork,exhibition,lifecycle,oex,oed]; if(schemas.some(s=>!s.$id.includes('/1.0.0-draft.1/')))throw Error('Schema identity');console.log(schemas.length);");
 assert.equal(run(process.execPath,['schemas.mjs'],consumer).trim(),'5');
 for(const [bin,args]of [['exhibitos-artwork',['oes/v1/examples/sculpture.json','fixtures/synthetic']],['exhibitos-exhibition',['revision','oes/v1/examples/exhibition.json','--assets','fixtures/synthetic']],['exhibitos-package',['oex','oex/v1/examples/synthetic.oex']],['exhibitos-package',['oed','oed/v1/examples/local.json']]]){const cwd=join(consumer,'node_modules/@exhibitos/spec');const output=JSON.parse(run(process.execPath,[join(consumer,'node_modules/.bin',bin),...args],cwd));assert.equal(output.valid,true);}
 // Compile against installed exports, not the source repo's self-reference.
 await writeFile(join(consumer,'types-consumer.mts'),await readFile('conformance/types-consumer.mts'));
 await writeFile(join(consumer,'tsconfig.json'),await readFile('conformance/tsconfig.json'));
 run(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'-p','tsconfig.json'],consumer);
 console.log(JSON.stringify({valid:true,filename,sha256:original,cases:api.cases,installation:'offline isolated npm install + npm ci',types:'installed NodeNext exports',reproduction:'two exact packs',nativeIosTested:false}));
}finally{await rm(consumer,{recursive:true,force:true});}
