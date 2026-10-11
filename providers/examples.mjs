// SPDX-License-Identifier: Apache-2.0
// Runnable, synthetic-only examples. They do not implement a network identity provider or camera.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const descriptor=async name=>JSON.parse(await readFile(new URL(`./v1/examples/${name}.json`,import.meta.url),'utf8'));
const artwork=new URL('../oes/v1/examples/sculpture.json',import.meta.url),assetRoot=fileURLToPath(new URL('../fixtures/synthetic/',import.meta.url));
export async function fileArtworkProducer(){return {descriptor:await descriptor('file-artwork'),async produceArtwork(){return {document:JSON.parse(await readFile(artwork,'utf8')),assetRoot};}};}
export async function memoryArtworkProducer(){const document=JSON.parse(await readFile(artwork,'utf8'));return {descriptor:await descriptor('memory-artwork'),async produceArtwork(){return {document:structuredClone(document),assetRoot};}};}
/** Trusted server-owned resolver wraps the existing session service, not caller-supplied JSON. */
export async function localSessionAdapter(resolve){return {descriptor:await descriptor('local-session'),async resolveSession(context,{signal}){const s=await resolve(context,{signal});return s===null?null:{id:s.id,userId:s.userId,tenantId:s.tenantId,role:s.role,expiresAt:s.expiresAt};}};}
