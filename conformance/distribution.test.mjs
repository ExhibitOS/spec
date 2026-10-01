// SPDX-License-Identifier: Apache-2.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runConformance,fixtureURL,schemaURL,validateOex } from '../index.mjs';
import { spawnSync } from 'node:child_process';
test('public runner validates original assets and positive/negative contracts',async()=>{const result=await runConformance();assert.equal(result.valid,true,JSON.stringify(result));assert.equal(result.cases.length,15);assert.ok(result.cases.every(c=>c.valid));});
test('fixture and schema locators reject arbitrary paths',()=>{for(const p of ['../package.json','/etc/passwd','fixtures/synthetic/../../package.json','oes/v1/examples/sculpture.json?x'])assert.throws(()=>fixtureURL(p),/UNKNOWN_FIXTURE/);assert.throws(()=>schemaURL('constructor'),/UNKNOWN_SCHEMA/);});
test('exported schema copies preserve original identity and exact bytes',async()=>{for(const [name,path]of [['artwork','oes/v1/artwork.schema.json'],['exhibition','oes/v1/exhibition.schema.json'],['lifecycle','oes/v1/lifecycle.schema.json'],['oex','oex/v1/manifest.schema.json'],['oed','oed/v1/deployment.schema.json']])assert.deepEqual(await readFile(schemaURL(name)),await readFile(new URL('../'+path,import.meta.url)));});
test('conformance CLI succeeds and rejects arguments',()=>{const cli=new URL('./cli.mjs',import.meta.url);for(const [args,valid]of [[[],true],[['unexpected'],false]]){const result=spawnSync(process.execPath,[cli.pathname,...args],{encoding:'utf8'});assert.equal(result.status,valid?0:1);assert.equal(JSON.parse(result.stdout).valid,valid);}});

test('public OEX API accepts Buffer and offset Uint8Array views consistently',async()=>{const bytes=await readFile(fixtureURL('oex/v1/examples/synthetic.oex'));const padded=new Uint8Array(bytes.length+4);padded.set(bytes,2);assert.equal((await validateOex(padded.subarray(2,-2))).valid,true);assert.equal((await validateOex(new Uint8Array(bytes))).valid,true);assert.equal((await validateOex(bytes)).valid,true);assert.equal((await validateOex(new Uint8Array([1,2]))).valid,false);});
