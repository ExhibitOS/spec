// SPDX-License-Identifier: Apache-2.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir,mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,dirname } from 'node:path';
import { runConformance,fixtureURL,schemaURL,validateOex } from '../index.mjs';
import { spawnSync } from 'node:child_process';
test('public runner validates original assets and positive/negative contracts',async()=>{const result=await runConformance();assert.equal(result.valid,true,JSON.stringify(result));assert.equal(result.cases.length,15);assert.ok(result.cases.every(c=>c.valid));});
test('fixture and schema locators reject arbitrary paths',()=>{for(const p of ['../package.json','/etc/passwd','fixtures/synthetic/../../package.json','oes/v1/examples/sculpture.json?x'])assert.throws(()=>fixtureURL(p),/UNKNOWN_FIXTURE/);assert.throws(()=>schemaURL('constructor'),/UNKNOWN_SCHEMA/);});
test('exported schema copies preserve original identity and exact bytes',async()=>{for(const [name,path]of [['artwork','oes/v1/artwork.schema.json'],['exhibition','oes/v1/exhibition.schema.json'],['lifecycle','oes/v1/lifecycle.schema.json'],['oex','oex/v1/manifest.schema.json'],['oed','oed/v1/deployment.schema.json']])assert.deepEqual(await readFile(schemaURL(name)),await readFile(new URL('../'+path,import.meta.url)));});
test('conformance CLI succeeds and rejects arguments',()=>{const cli=new URL('./cli.mjs',import.meta.url);for(const [args,valid]of [[[],true],[['unexpected'],false]]){const result=spawnSync(process.execPath,[cli.pathname,...args],{encoding:'utf8'});assert.equal(result.status,valid?0:1);assert.equal(JSON.parse(result.stdout).valid,valid);}});

test('public OEX API accepts Buffer and offset Uint8Array views consistently',async()=>{const bytes=await readFile(fixtureURL('oex/v1/examples/synthetic.oex'));const padded=new Uint8Array(bytes.length+4);padded.set(bytes,2);assert.equal((await validateOex(padded.subarray(2,-2))).valid,true);assert.equal((await validateOex(new Uint8Array(bytes))).valid,true);assert.equal((await validateOex(bytes)).valid,true);assert.equal((await validateOex(new Uint8Array([1,2]))).valid,false);});

test('generator preflights unsupported nested schema keywords and unused refs in an isolated clone',async()=>{
 const root=await mkdtemp(join(tmpdir(),'exhibitos-generator-mutation-'));
 const paths=['scripts/generate-types.mjs','conformance/api-types.txt','oes/v1/artwork.schema.json','oes/v1/exhibition.schema.json','oes/v1/lifecycle.schema.json','oex/v1/manifest.schema.json','oex/v1/media-manifest.schema.json','oed/v1/deployment.schema.json'];
 try{
  for(const path of paths){await mkdir(dirname(join(root,path)),{recursive:true});await writeFile(join(root,path),await readFile(new URL('../'+path,import.meta.url)));}
  const generate=()=>spawnSync(process.execPath,[join(root,'scripts/generate-types.mjs')],{cwd:root,encoding:'utf8'});
  assert.equal(generate().status,0,'Original public schema must generate');
  const original=await readFile(join(root,'oes/v1/artwork.schema.json'),'utf8');
  for(const [mutation,message]of [
   [schema=>{schema.$defs.rights.anyOf[0].properties={licenseId:{if:{type:'string'}}};},/Unsupported schema keyword if/],
   [schema=>{schema.$defs.unused={properties:{nested:{items:{if:{type:'string'}}}}};},/Unsupported schema keyword if/],
   [schema=>{schema.$defs.unused={$ref:'#/$defs/notPresent'};},/Unresolved pointer/],
   [schema=>{schema.$defs.unused={$ref:'https:\/\/example.invalid\/missing.schema.json'};},/Unresolved schema/],
  ]){
   const schema=JSON.parse(original);mutation(schema);await writeFile(join(root,'oes/v1/artwork.schema.json'),JSON.stringify(schema));
   const result=generate();assert.notEqual(result.status,0);assert.match(result.stderr,message);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});

test('all documented JSON schema export aliases resolve with JSON import attributes',async()=>{
 for(const name of ['artwork','exhibition','lifecycle','oex','oed']){
  const {default:schema}=await import('@exhibitos/spec/schemas/'+name+'.json',{with:{type:'json'}});
  assert.ok(schema.$id.includes('/1.0.0-draft.1/'));
  assert.deepEqual(schema,JSON.parse(await readFile(schemaURL(name),'utf8')));
 }
});

test('artifact checker rejects unknown and repeated CLI flags before packing',()=>{
 for(const args of [['--unknown'],['--offline','--offline']]){
  const result=spawnSync(process.execPath,[new URL('../scripts/check-artifact.mjs',import.meta.url).pathname,...args],{encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/Use: node scripts\/check-artifact.mjs/);
 }
});

test('separate media schema export has exact distinct identity and bytes',async()=>{const {default:schema}=await import('@exhibitos/spec/schemas/oex-media.json',{with:{type:'json'}});assert.ok(schema.$id.includes('/1.0.0-draft.2/'));assert.deepEqual(schema,JSON.parse(await readFile(schemaURL('oex-media'),'utf8')));});
