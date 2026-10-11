// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
const run=(cli,args)=>spawnSync(process.execPath,[new URL(cli,import.meta.url).pathname,...args],{encoding:'utf8'});
for(const [cli,prefix,fixture] of [['artwork-cli.mjs',[],'oes/v1/examples/sculpture.json'],['exhibition-cli.mjs',['revision'],'oes/v1/examples/exhibition.json'],['package-cli.mjs',['oed'],'oed/v1/examples/local.json']]){
 test(`${cli}: opt-in help and human output preserve machine JSON and exit status`,()=>{
  const args=[...prefix,fixture],normal=run(cli,args),human=run(cli,['--human',...args]);assert.equal(normal.status,0);assert.equal(human.status,0);assert.equal(human.stdout,normal.stdout);assert.equal(normal.stderr,'');assert.match(human.stderr,/검사 통과/);
  const help=run(cli,['--help']);assert.equal(help.status,0);assert.match(help.stdout,/사용법/);assert.equal(help.stderr,'');
 });
 test(`${cli}: actionable failures never echo file paths, raw errors or input values`,async()=>{
  const root=await mkdtemp(join(tmpdir(),'exhibitos-cli-ux-'));try{
   await writeFile(join(root,'malformed.json'),'{SYNTHETIC_PRIVATE_MARKER');await writeFile(join(root,'large.json'),Buffer.alloc(1048577));
   for(const [file,label] of [['missing.json',/파일 접근/],['malformed.json',/JSON 문법/],['large.json',/크기/]]){
    const args=[...prefix,join(root,file)],normal=run(cli,args),human=run(cli,['--human',...args]);assert.equal(normal.status,1);assert.equal(human.status,1);assert.equal(human.stdout,normal.stdout);assert.equal(normal.stderr,'');assert.match(human.stderr,label);
    for(const output of [human.stdout,human.stderr]){assert.ok(!output.includes(root));assert.ok(!output.includes('SYNTHETIC_PRIVATE_MARKER'));assert.ok(!output.includes('ENOENT'));}
   }
   const usage=run(cli,['--human']);assert.equal(usage.status,1);assert.equal(JSON.parse(usage.stdout).errors[0].code,'USAGE');assert.match(usage.stderr,/사용법/);
   const duplicate=run(cli,['--human','--human',...prefix,fixture]);assert.equal(duplicate.status,1);assert.equal(JSON.parse(duplicate.stdout).errors[0].code,'USAGE');
  }finally{await rm(root,{recursive:true,force:true});}
 });
}
