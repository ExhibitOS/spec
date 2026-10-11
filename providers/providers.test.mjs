// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {observeAuthSession,inspectCaptureProducer,validateProviderDescriptor} from './index.mjs';
import {fileArtworkProducer,memoryArtworkProducer,localSessionAdapter} from './examples.mjs';
const tenantId='10000000-0000-4000-8000-000000000001';
const session={id:'10000000-0000-4000-8000-000000000002',userId:'10000000-0000-4000-8000-000000000003',tenantId,role:'artist',expiresAt:'2030-01-01T00:00:00Z'};
const now=Date.parse('2026-10-11T00:00:00Z');
test('two independent producers deliver exact same public OES with real binary validation',async()=>{
 const file=await fileArtworkProducer(),memory=await memoryArtworkProducer();
 const a=await inspectCaptureProducer(file),b=await inspectCaptureProducer(memory);
 assert.equal(a.valid,true,JSON.stringify(a.errors));assert.equal(b.valid,true,JSON.stringify(b.errors));assert.deepEqual(a.document,b.document);
 for(const asset of a.document.assets){const data=await readFile(join((await file.produceArtwork()).assetRoot,asset.path));assert.equal(createHash('sha256').update(data).digest('hex'),asset.sha256);assert.equal(data.length,asset.bytes);}
});
test('producer rejects mutated bytes, escaped assets, withheld rights and unknown document version',async()=>{
 const adapter=await fileArtworkProducer(),original=await adapter.produceArtwork();const root=await mkdtemp(join(tmpdir(),'exhibitos-public-provider-'));
 try{
  for(const asset of original.document.assets){const bytes=await readFile(join(original.assetRoot,asset.path));bytes[0]^=1;await writeFile(join(root,asset.path),bytes);}
  const change=doc=>({...adapter,async produceArtwork(){return {document:doc,assetRoot:root};}});
  assert.equal((await inspectCaptureProducer(change(original.document))).valid,false);
  const escaped=structuredClone(original.document);escaped.assets[0].path='../escape.glb';assert.equal((await inspectCaptureProducer(change(escaped))).valid,false);
  const denied=structuredClone(original.document);denied.rights.permissions.display=false;
  assert.equal((await inspectCaptureProducer({...adapter,async produceArtwork(){return {...original,document:denied};}},{},{publicationTime:'2026-10-11T00:00:00Z'})).valid,false);
  assert.equal((await inspectCaptureProducer(change({...original.document,schemaVersion:'2.0.0'}))).errors[0].code,'UNSUPPORTED_VERSION');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('auth adapter strips server-only secrets and keeps exact tenant, identity and role',async()=>{
 const context=Object.freeze({requestId:'opaque-context'});let observed;
 const adapter=await localSessionAdapter(async request=>{observed=request;return {...session,csrfToken:'not-exported',cookie:'not-exported'};});
 assert.deepEqual(await observeAuthSession(adapter,context,{tenantId,now}),session);assert.equal(observed,context);
 assert.equal(await observeAuthSession(await localSessionAdapter(async()=>null),context,{tenantId,now}),null);
});
test('auth rejects expired/cross-tenant/unsupported role, credential leakage and post-await cancellation',async()=>{
 const base=await localSessionAdapter(async()=>session);
 for(const value of [{...session,expiresAt:'2030-02-30T00:00:00Z'},{...session,expiresAt:'2030-01-01T24:00:00Z'},{...session,expiresAt:'2020-01-01T00:00:00Z'},{...session,tenantId:session.userId},{...session,role:'superuser'},{...session,token:'secret'}])await assert.rejects(observeAuthSession({...base,async resolveSession(){return value;}},{},{tenantId,now}));
 const controller=new AbortController();await assert.rejects(observeAuthSession({...base,async resolveSession(){controller.abort();return session;}},{},{tenantId,now,signal:controller.signal}),/PROVIDER_CANCELLED/);
 const failing={...base,async resolveSession(){throw Error('private-credential-value');}};await assert.rejects(observeAuthSession(failing,{},{tenantId,now}),e=>e.message==='AUTH_PROVIDER_UNAVAILABLE');
});
test('closed versions/capabilities refuse unsupported adapters without invoking them',async()=>{
 const capture=await memoryArtworkProducer();let invoked=false;
 for(const descriptor of [{...capture.descriptor,schemaVersion:'2'},{...capture.descriptor,secret:'private'},{...capture.descriptor,contract:'session-observation-v1'}]){
  assert.equal(validateProviderDescriptor(descriptor).valid,false);
  await assert.rejects(inspectCaptureProducer({descriptor,async produceArtwork(){invoked=true;return {};}}));
 }
 assert.equal(invoked,false);
 const controller=new AbortController();controller.abort();await assert.rejects(inspectCaptureProducer(capture,{},{signal:controller.signal}),/PROVIDER_CANCELLED/);
});
