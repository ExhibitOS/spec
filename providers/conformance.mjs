// SPDX-License-Identifier: Apache-2.0
import {fileArtworkProducer,memoryArtworkProducer,localSessionAdapter} from './examples.mjs';
import {inspectCaptureProducer,observeAuthSession,validateProviderDescriptor} from './index.mjs';
const cases=[];
for(const make of [fileArtworkProducer,memoryArtworkProducer]){const adapter=await make();const output=await inspectCaptureProducer(adapter);cases.push({id:adapter.descriptor.id,valid:output.valid});}
const tenantId='10000000-0000-4000-8000-000000000001',now=Date.parse('2026-10-11T00:00:00Z');
const observation={id:'10000000-0000-4000-8000-000000000002',userId:'10000000-0000-4000-8000-000000000003',tenantId,role:'artist',expiresAt:'2030-01-01T00:00:00Z'};
const auth=await localSessionAdapter(async()=>observation);
cases.push({id:'synthetic-server-session-shape',valid:(await observeAuthSession(auth,{}, {tenantId,now})).userId===observation.userId});
let refused=false;try{await observeAuthSession(auth,{}, {tenantId:observation.userId,now});}catch{refused=true;}cases.push({id:'reject-cross-tenant-session',valid:refused});
cases.push({id:'unsupported-provider-fallback',valid:!validateProviderDescriptor({...auth.descriptor,schemaVersion:'2'}).valid});
const valid=cases.every(v=>v.valid);console.log(JSON.stringify({valid,cases,scope:'public-synthetic-provider-contracts',alternateAuthDeployment:false,physicalCapture:false}));process.exitCode=valid?0:1;
