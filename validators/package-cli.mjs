#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { open } from 'node:fs/promises';
import { TextDecoder } from 'node:util';
import { validateOex,validateOed,adaptOexManifest } from './package.mjs';
import { ZIP_LIMITS } from './zip.mjs';
const [mode,filename,target,...extra]=process.argv.slice(2);
try {
  if(!filename||extra.length||!['oex','oed','identity-adapter'].includes(mode)||(mode==='identity-adapter'?target===undefined:target!==undefined))throw new Error('USAGE');
  const handle=await open(filename,'r');let buffer;
  try{const stat=await handle.stat(),cap=mode==='oex'?ZIP_LIMITS.archiveBytes:1048576;if(!stat.isFile()||stat.size>cap)throw new Error('INPUT_LIMIT');buffer=Buffer.alloc(stat.size);let offset=0;while(offset<buffer.length){const {bytesRead}=await handle.read(buffer,offset,buffer.length-offset,offset);if(!bytesRead)throw new Error('INVALID_INPUT');offset+=bytesRead;}const extraByte=Buffer.alloc(1);if((await handle.read(extraByte,0,1,buffer.length)).bytesRead)throw new Error('INPUT_LIMIT');}finally{await handle.close();}
  const checked=mode==='oex'?await validateOex(buffer):mode==='oed'?validateOed(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer))):adaptOexManifest(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer)),target);
  // Identity adapter CLI reports acceptance only, never dumps artifact metadata.
  const output={valid:checked.valid,errors:checked.errors,...(checked.adapter?{adapter:checked.adapter}:{})};console.log(JSON.stringify(output));process.exitCode=checked.valid?0:1;
}catch(error){console.log(JSON.stringify({valid:false,errors:[{code:['USAGE','INPUT_LIMIT'].includes(error.message)?error.message:'INVALID_INPUT',path:'',message:'Use: oex|oed file or identity-adapter manifest.json target-version'}]}));process.exitCode=1;}
