#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { open } from 'node:fs/promises';
import { validateArtwork,validateArtworkFiles,MAX_DOCUMENT_BYTES } from './artwork.mjs';
const [filename,root,publicationTime,...extra]=process.argv.slice(2);
try {
  if(!filename||extra.length) throw new Error('USAGE');
  const handle=await open(filename,'r'); let buffer;
  try {
    const stat=await handle.stat(); if(!stat.isFile()||stat.size>MAX_DOCUMENT_BYTES)throw new Error('DOCUMENT_LIMIT');
    buffer=Buffer.alloc(stat.size); let offset=0;
    while(offset<buffer.length) {const {bytesRead}=await handle.read(buffer,offset,buffer.length-offset,offset);if(!bytesRead)throw new Error('DOCUMENT_READ_FAILED');offset+=bytesRead;}
    const extraByte=Buffer.alloc(1);if((await handle.read(extraByte,0,1,buffer.length)).bytesRead)throw new Error('DOCUMENT_LIMIT');
  } finally {await handle.close();}
  const document=JSON.parse(buffer.toString('utf8'));
  const result=root?await validateArtworkFiles(document,root,{publicationTime}):validateArtwork(document,{publicationTime});
  console.log(JSON.stringify(result));process.exitCode=result.valid?0:1;
} catch(error) {console.log(JSON.stringify({valid:false,errors:[{code:['USAGE','DOCUMENT_LIMIT','DOCUMENT_READ_FAILED'].includes(error.message)?error.message:'INVALID_INPUT',path:'',message:'Use: node validators/artwork-cli.mjs document.json [asset-root [publication-UTC-time]]'}]}));process.exitCode=1;}
