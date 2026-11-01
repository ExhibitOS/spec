// SPDX-License-Identifier: Apache-2.0
import raw from '../policies/oex-capacity-v1.json' with {type:'json'};

const object=(value,keys)=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
const positive=value=>Number.isSafeInteger(value)&&value>0;

/** A packaged build input, not an HTTP option or a resource reservation. */
export function validateOexCapacityPolicy(value){
 if(!object(value,['schemaVersion','format','exhibition','nativeImport','packed'])||value.schemaVersion!==1||
    !object(value.format,['archiveBytesMax','expandedBytesMax','entryBytesMax','entryCountMax','expansionRatioMax'])||
    !object(value.exhibition,['uniqueAssetBytesMax','assetBytesMax'])||!object(value.nativeImport,['chunkBytes'])||!object(value.packed,['resourceCountMax']))throw Error('OEX_POLICY_INVALID');
 const {format,exhibition,nativeImport,packed}=value;
 if(![...Object.values(format),...Object.values(exhibition),...Object.values(nativeImport),...Object.values(packed)].every(positive)||
    format.archiveBytesMax>0xffffffff||format.expandedBytesMax>0xffffffff||format.entryBytesMax>format.expandedBytesMax||
    format.entryCountMax>65535||format.entryCountMax<3||packed.resourceCountMax>format.entryCountMax-2||
    exhibition.assetBytesMax>format.entryBytesMax||exhibition.assetBytesMax>exhibition.uniqueAssetBytesMax||exhibition.uniqueAssetBytesMax>format.expandedBytesMax||
    nativeImport.chunkBytes>format.archiveBytesMax)throw Error('OEX_POLICY_INVALID');
 return Object.freeze({schemaVersion:1,format:Object.freeze({...format}),exhibition:Object.freeze({...exhibition}),nativeImport:Object.freeze({...nativeImport}),packed:Object.freeze({...packed})});
}
export const OEX_CAPACITY_POLICY=validateOexCapacityPolicy(raw);
