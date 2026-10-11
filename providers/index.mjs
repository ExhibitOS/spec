// SPDX-License-Identifier: Apache-2.0
import Ajv2020 from 'ajv/dist/2020.js';
import {readFile} from 'node:fs/promises';
import {validateArtwork,validateArtworkFiles} from '../validators/artwork.mjs';
export const PROVIDER_VERSION='1.0.0-draft.1';
const schema=JSON.parse(await readFile(new URL('./v1/descriptor.schema.json',import.meta.url),'utf8'));
const check=new Ajv2020({strict:true,allErrors:true}).compile(schema);
const fail=code=>{throw Error(code);};
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===keys.slice().sort().join(',');
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function validateProviderDescriptor(v){return v?.schemaVersion!==PROVIDER_VERSION?{valid:false,errors:[{code:'UNSUPPORTED_VERSION',path:'/schemaVersion',message:'Unsupported provider contract'}]}:check(v)?{valid:true,errors:[]}:{valid:false,errors:[{code:'PROVIDER_INVALID',path:'',message:'Closed provider descriptor or capability mismatch'}]};}
function descriptor(adapter,kind){if(!validateProviderDescriptor(adapter?.descriptor).valid||adapter.descriptor.kind!==kind)fail('PROVIDER_UNSUPPORTED');}
function active(signal){if(signal?.aborted)fail('PROVIDER_CANCELLED');}
/** Server-owned adapter/context only. Shape validation never authenticates an HTTP caller. */
export async function observeAuthSession(adapter,context,{tenantId,now=Date.now(),signal}={}){
 descriptor(adapter,'auth-provider');if(!uuid(tenantId)||!Number.isFinite(now)||typeof adapter.resolveSession!=='function')fail('AUTH_CONTEXT_INVALID');
 active(signal);let value;try{value=await adapter.resolveSession(context,{signal});}catch{fail('AUTH_PROVIDER_UNAVAILABLE');}active(signal);
 if(value===null)return null;
 // Credentials and CSRF tokens stay inside the actual server adapter, never in this observation.
 if(!exact(value,['id','userId','tenantId','role','expiresAt'])||!uuid(value.id)||!uuid(value.userId)||!uuid(value.tenantId)||!['admin','artist','curator','viewer'].includes(value.role)||typeof value.expiresAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:[0-5]\d(?:\.\d{1,3})?Z$/.test(value.expiresAt)||!Number.isFinite(Date.parse(value.expiresAt))||new Date(value.expiresAt).toISOString().slice(0,19)!==value.expiresAt.slice(0,19))fail('AUTH_SESSION_INVALID');
 if(value.tenantId.toLowerCase()!==tenantId.toLowerCase()||Date.parse(value.expiresAt)<=now)fail('AUTH_SESSION_UNAVAILABLE');
 return Object.freeze(structuredClone(value));
}
/** Consumer must separately observe current authorization before import/publication. */
export async function inspectCaptureProducer(adapter,context,{publicationTime,signal}={}){
 descriptor(adapter,'capture-producer');if(typeof adapter.produceArtwork!=='function')fail('CAPTURE_PROVIDER_UNSUPPORTED');
 active(signal);let result;try{result=await adapter.produceArtwork(context,{signal});}catch{fail('CAPTURE_PROVIDER_UNAVAILABLE');}active(signal);
 if(!exact(result,['document','assetRoot'])||typeof result.assetRoot!=='string'||result.assetRoot.length>4096)fail('CAPTURE_OUTPUT_INVALID');
 // Snapshot metadata; never replace identity, provenance, measured scale or rights with provider claims.
 const document=structuredClone(result.document),options={publicationTime};
 const metadata=validateArtwork(document,options);if(!metadata.valid)return metadata;
 const files=await validateArtworkFiles(document,result.assetRoot,options);active(signal);
 return {...files,...(files.valid?{document}: {})};
}
