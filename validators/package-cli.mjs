#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { cliOptions,diagnostic } from './cli-ux.mjs';
import { open } from 'node:fs/promises';
import { TextDecoder } from 'node:util';
import { validateOex,validateOed,adaptOexManifest } from './package.mjs';
import { ZIP_LIMITS } from './zip.mjs';
const options=cliOptions(process.argv.slice(2));
const [mode,filename,target,...extra]=options.args;
let stage='arguments';
if(options.help&&!options.invalid)console.log(`ExhibitOS package 규격 검사\n사용법: oex|oed file 또는 identity-adapter manifest.json target-version\n--help 또는 --human은 첫 인수에 둡니다. --human은 JSON stdout을 유지하고 stderr에 안내합니다.\n성공 0 / 실패 1. 파일명이 --help 또는 --human이면 ./ 접두사를 사용하세요.\n실제 촬영 품질·배포 준비는 별도 검사입니다.`);
else {
try {
  if(options.invalid)throw new Error('USAGE');
  if(!filename||extra.length||!['oex','oed','identity-adapter'].includes(mode)||(mode==='identity-adapter'?target===undefined:target!==undefined))throw new Error('USAGE');
  stage='read';
  const handle=await open(filename,'r');let buffer;
  try{const stat=await handle.stat(),cap=mode==='oex'?ZIP_LIMITS.archiveBytes:1048576;if(!stat.isFile()||stat.size>cap)throw new Error('INPUT_LIMIT');buffer=Buffer.alloc(stat.size);let offset=0;while(offset<buffer.length){const {bytesRead}=await handle.read(buffer,offset,buffer.length-offset,offset);if(!bytesRead)throw new Error('INVALID_INPUT');offset+=bytesRead;}const extraByte=Buffer.alloc(1);if((await handle.read(extraByte,0,1,buffer.length)).bytesRead)throw new Error('INPUT_LIMIT');}finally{await handle.close();}
  stage='parse';
  const checked=mode==='oex'?await validateOex(buffer):mode==='oed'?validateOed(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer))):adaptOexManifest(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer)),target);
  // Identity adapter CLI reports acceptance only, never dumps artifact metadata.
  const output={valid:checked.valid,errors:checked.errors,...(checked.adapter?{adapter:checked.adapter}:{})};console.log(JSON.stringify(output));process.exitCode=checked.valid?0:1;diagnostic(options.human,'validation',output);
}catch(error){const failure={valid:false,errors:[{code:['USAGE','INPUT_LIMIT'].includes(error.message)?error.message:'INVALID_INPUT',path:'',message:'Use: oex|oed file or identity-adapter manifest.json target-version'} ]};console.log(JSON.stringify(failure));process.exitCode=1;diagnostic(options.human,stage,failure);}

}
