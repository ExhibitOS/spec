#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { cliOptions,diagnostic } from './cli-ux.mjs';
import { open } from 'node:fs/promises';
import { validateArtwork,validateArtworkFiles,MAX_DOCUMENT_BYTES } from './artwork.mjs';
const options=cliOptions(process.argv.slice(2));
const [filename,root,publicationTime,...extra]=options.args;
let stage='arguments';
if(options.help&&!options.invalid)console.log(`ExhibitOS artwork 규격 검사\n사용법: document.json [asset-root [publication-UTC-time]]\n--help 또는 --human은 첫 인수에 둡니다. --human은 JSON stdout을 유지하고 stderr에 안내합니다.\n성공 0 / 실패 1. 파일명이 --help 또는 --human이면 ./ 접두사를 사용하세요.\n실제 촬영 품질·배포 준비는 별도 검사입니다.`);
else {
try {
  if(options.invalid)throw new Error('USAGE');
  if(!filename||extra.length||(root!==undefined&&root.length===0)) throw new Error('USAGE');
  stage='read';
  const handle=await open(filename,'r'); let buffer;
  try {
    const stat=await handle.stat(); if(!stat.isFile()||stat.size>MAX_DOCUMENT_BYTES)throw new Error('DOCUMENT_LIMIT');
    buffer=Buffer.alloc(stat.size); let offset=0;
    while(offset<buffer.length) {const {bytesRead}=await handle.read(buffer,offset,buffer.length-offset,offset);if(!bytesRead)throw new Error('DOCUMENT_READ_FAILED');offset+=bytesRead;}
    const extraByte=Buffer.alloc(1);if((await handle.read(extraByte,0,1,buffer.length)).bytesRead)throw new Error('DOCUMENT_LIMIT');
  } finally {await handle.close();}
  stage='parse';
  const document=JSON.parse(buffer.toString('utf8'));
  stage='validation';
  const result=root!==undefined?await validateArtworkFiles(document,root,{publicationTime}):validateArtwork(document,{publicationTime});
  console.log(JSON.stringify(result));process.exitCode=result.valid?0:1;diagnostic(options.human,stage,result);
} catch(error) {const failure={valid:false,errors:[{code:['USAGE','DOCUMENT_LIMIT','DOCUMENT_READ_FAILED'].includes(error.message)?error.message:'INVALID_INPUT',path:'',message:'Use: node validators/artwork-cli.mjs document.json [asset-root [publication-UTC-time]]'} ]};console.log(JSON.stringify(failure));process.exitCode=1;diagnostic(options.human,stage,failure);}

}
