// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ExhibitOS contributors
/** This opt-in registry identifies public display derivatives, not original recordings. */
export const OEX_FOOTSTEP_RESOURCE_VERSION='1.0.0-draft.8';
export const FOOTSTEP_RESOURCE_NAMESPACE='org.exhibitos.viewer/footstep-resources';
const samples={
 carpet:[['34213946f200a31d9440a3f362d9c6ca88a50d498092f9aff225fe698e33279e',25036],['67854dd262d3035a6634c1e9f9bd044e92ed5eaa17a0717a563f6e8d66deb043',25128]],
 tile:[['7ca36a490917d937421b8b59e1a0ab522bd4d30b44c14d24dd5bccd82edb599e',28884],['e87702641d0b7fcbe2d281f306485187ed908cffb193d32af7d78643c6d31e52',21534]],
 concrete:[['e9b60da98614aa459f1f50e8f91a766a19b4cc08470e2b57b4dabd1c01109220',35944],['618daca30a012b88db88f516b35001eefa86322e10a0e4722888be64887afcbd',30778]],
 wood:[['ea8f68ab6983ff43a72d67c192a79e9f021ebf9584589af232a37190e1b18f78',41324],['3d8d589234fa6c2131cdc8c6c666cdc9256c5042e10cd395564e03398413769e',41324]],
 marble:[['e156335a5f984a51f36519c40cd381fda5a77c31d4285f3e5dd7c1b9a2001619',84524],['9cd0ed446bf9d6cc28c48024dbe0416693cdb809a966f0a1d2df6f58f3029e18',84524],['0f96c75572f718f9fe268f8c847803331dfe0f9fb923345a311a02ac75a67f60',84524]],
};
export const FOOTSTEP_FAMILIES=Object.freeze(Object.keys(samples).sort());
export const FOOTSTEP_SAMPLES=Object.freeze(Object.entries(samples).flatMap(([family,items])=>items.map(([sha256,bytes])=>{
 const artifactPath=`footstep-samples/v1/${sha256}.wav`;
 return Object.freeze({family,version:1,role:'sample',mime:'audio/wav',artifactPath,path:`resources/${artifactPath}`,bytes,sha256});
})));
export const FOOTSTEP_NOTICES=Object.freeze([
 ['CC0-1.0.txt','text/plain; charset=utf-8',7133,'645290fbe623e74da82dae25734e8e6d5123f40f85343ad11cf0d990f8b3e4e0'],
 ['provenance.json','application/json',9620,'c8e2802c8ebf416474b402bb6c439d15f31952c45df144d349c75045e8604138'],
].map(([name,mime,bytes,sha256])=>{
 const artifactPath=`footstep-samples/v1/${name}`;
 return Object.freeze({family:'shared',version:1,role:'notice',mime,artifactPath,path:`resources/${artifactPath}`,bytes,sha256});
}));
/** Absent is legacy. Malformed or unknown selections must never become absence. */
export function footstepResourcesFor(document){
 const value=document?.extensions?.[FOOTSTEP_RESOURCE_NAMESPACE];
 if(value===undefined)return [];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='families,version'||value.version!==1||!Array.isArray(value.families)||!value.families.length||value.families.length>5||value.families.some(v=>typeof v!=='string'||!FOOTSTEP_FAMILIES.includes(v))||new Set(value.families).size!==value.families.length||value.families.some((v,i)=>i&&value.families[i-1]>=v))throw Error('FOOTSTEP_RESOURCE_SELECTION');
 return [...FOOTSTEP_SAMPLES.filter(entry=>value.families.includes(entry.family)),...FOOTSTEP_NOTICES];
}
