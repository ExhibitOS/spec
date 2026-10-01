#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { open } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { validateExhibition,validateExhibitionFiles,validateLifecycle,validateLifecycleFiles } from './exhibition.mjs';
async function load(filename) {
  if(!filename)throw new Error('USAGE');
  const handle=await open(filename,'r');let buffer;
  try {const stat=await handle.stat();if(!stat.isFile()||stat.size>1048576)throw new Error('DOCUMENT_LIMIT');buffer=Buffer.alloc(stat.size);let offset=0;
    while(offset<buffer.length){const {bytesRead}=await handle.read(buffer,offset,buffer.length-offset,offset);if(!bytesRead)throw new Error('INVALID_INPUT');offset+=bytesRead;}
    const extra=Buffer.alloc(1);if((await handle.read(extra,0,1,buffer.length)).bytesRead)throw new Error('DOCUMENT_LIMIT');
  }finally{await handle.close();}
  return JSON.parse(buffer.toString('utf8'));
}
try {
  const {values,positionals}=parseArgs({allowPositionals:true,options:{assets:{type:'string'},at:{type:'string'},revision:{type:'string'},publication:{type:'string'}}});
  const [mode,filename]=positionals;if(positionals.length!==2||!['revision','draft','publication','freeze'].includes(mode))throw new Error('USAGE');
  const document=await load(filename);let checked;
  if(mode==='revision') {
    if(values.revision||values.publication)throw new Error('USAGE');
    checked=values.assets?await validateExhibitionFiles(document,values.assets,{publicationTime:values.at}):validateExhibition(document,{publicationTime:values.at});
  }else {
    if(values.at||document.kind!==(mode==='draft'?'exhibition-draft':mode)||(mode==='draft'&&(values.revision||values.publication))||(mode==='publication'&&values.publication))throw new Error('USAGE');
    const revision=mode==='draft'?undefined:await load(values.revision),publication=mode==='freeze'?await load(values.publication):undefined;
    checked=values.assets?await validateLifecycleFiles(document,revision,values.assets,{publication}):validateLifecycle(document,revision,{publication});
  }
  console.log(JSON.stringify(checked));process.exitCode=checked.valid?0:1;
}catch(error){console.log(JSON.stringify({valid:false,errors:[{code:['USAGE','DOCUMENT_LIMIT'].includes(error.message)?error.message:'INVALID_INPUT',path:'',message:'Use revision|draft|publication|freeze document.json [--revision revision.json] [--publication publication.json] [--assets directory] [--at UTC]'}]}));process.exitCode=1;}
