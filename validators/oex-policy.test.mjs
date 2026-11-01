// SPDX-License-Identifier: Apache-2.0
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OEX_CAPACITY_POLICY,validateOexCapacityPolicy} from './oex-policy.mjs';
import {FILE_ZIP_LIMITS} from './zip-file.mjs';

test('bounded OEX policy matches the file reader and retains distinct limits',()=>{
 const p=OEX_CAPACITY_POLICY;
 assert.deepEqual(FILE_ZIP_LIMITS,{archiveBytes:p.format.archiveBytesMax,files:p.format.entryCountMax,fileBytes:p.format.entryBytesMax,expandedBytes:p.format.expandedBytesMax,ratio:p.format.expansionRatioMax});
 assert.deepEqual([p.format.archiveBytesMax,p.format.expandedBytesMax,p.format.entryBytesMax,p.format.entryCountMax,p.format.expansionRatioMax,p.exhibition.uniqueAssetBytesMax,p.exhibition.assetBytesMax,p.nativeImport.chunkBytes,p.packed.resourceCountMax],[536870912,536870912,33554432,256,100,536870912,33554432,16777216,254]);
 assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.format)&&Object.isFrozen(p.exhibition)&&Object.isFrozen(p.nativeImport)&&Object.isFrozen(p.packed));
});
test('rejects missing, extra, malformed and inconsistent policy values',()=>{
 const cases=[p=>{delete p.format;},p=>{p.unexpected=1;},p=>{p.schemaVersion=2;},p=>{p.format.archiveBytesMax='536870912';},p=>{p.format.entryBytesMax=0;},p=>{p.format.expansionRatioMax=Infinity;},p=>{p.format.entryCountMax=257.5;},p=>{p.nativeImport.chunkBytes=p.format.archiveBytesMax+1;},p=>{p.exhibition.assetBytesMax=p.format.entryBytesMax+1;},p=>{p.exhibition.uniqueAssetBytesMax=p.exhibition.assetBytesMax-1;},p=>{p.packed.resourceCountMax=p.format.entryCountMax-1;},p=>{p.format.archiveBytesMax=4294967296;}];
 for(const change of cases){const p=structuredClone(OEX_CAPACITY_POLICY);change(p);assert.throws(()=>validateOexCapacityPolicy(p),/OEX_POLICY_INVALID/);}
});
