#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { cliOptions,diagnostic } from './cli-ux.mjs';
import { open } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { validateExhibition,validateExhibitionFiles,validateLifecycle,validateLifecycleFiles } from './exhibition.mjs';
const options=cliOptions(process.argv.slice(2));
async function load(filename) {
  if(!filename)throw new Error('USAGE');
  stage='read';
  const handle=await open(filename,'r');let buffer;
  try {const stat=await handle.stat();if(!stat.isFile()||stat.size>1048576)throw new Error('DOCUMENT_LIMIT');buffer=Buffer.alloc(stat.size);let offset=0;
    while(offset<buffer.length){const {bytesRead}=await handle.read(buffer,offset,buffer.length-offset,offset);if(!bytesRead)throw new Error('INVALID_INPUT');offset+=bytesRead;}
    const extra=Buffer.alloc(1);if((await handle.read(extra,0,1,buffer.length)).bytesRead)throw new Error('DOCUMENT_LIMIT');
  }finally{await handle.close();}
  stage='parse';
  return JSON.parse(buffer.toString('utf8'));
}
let stage='arguments';
if(options.help&&!options.invalid)console.log(`ExhibitOS exhibition 규격 검사\n사용법: revision|draft|publication|freeze document.json [--revision revision.json] [--publication publication.json] [--assets directory] [--at UTC]\n--help 또는 --human은 첫 인수에 둡니다. --human은 JSON stdout을 유지하고 stderr에 안내합니다.\n성공 0 / 실패 1. 파일명이 --help 또는 --human이면 ./ 접두사를 사용하세요.\n실제 촬영 품질·배포 준비는 별도 검사입니다.`);
else {
try {
  if(options.invalid)throw new Error('USAGE');
  const {values,positionals}=parseArgs({args:options.args,allowPositionals:true,options:{assets:{type:'string'},at:{type:'string'},revision:{type:'string'},publication:{type:'string'}}});
  const [mode,filename]=positionals;if(positionals.length!==2||!['revision','draft','publication','freeze'].includes(mode))throw new Error('USAGE');
  if(values.assets!==undefined&&values.assets.length===0)throw new Error('USAGE');
  const document=await load(filename);stage='validation';let checked;
  if(mode==='revision') {
    if(values.revision!==undefined||values.publication!==undefined)throw new Error('USAGE');
    checked=values.assets!==undefined?await validateExhibitionFiles(document,values.assets,{publicationTime:values.at}):validateExhibition(document,{publicationTime:values.at});
  }else {
    if(values.at!==undefined||document.kind!==(mode==='draft'?'exhibition-draft':mode)||(mode==='draft'&&(values.revision!==undefined||values.publication!==undefined))||(mode==='publication'&&values.publication!==undefined))throw new Error('USAGE');
    const revision=mode==='draft'?undefined:await load(values.revision),publication=mode==='freeze'?await load(values.publication):undefined;
    checked=values.assets!==undefined?await validateLifecycleFiles(document,revision,values.assets,{publication}):validateLifecycle(document,revision,{publication});
  }
  console.log(JSON.stringify(checked));process.exitCode=checked.valid?0:1;diagnostic(options.human,'validation',checked);
}catch(error){const failure={valid:false,errors:[{code:['USAGE','DOCUMENT_LIMIT'].includes(error.message)?error.message:'INVALID_INPUT',path:'',message:'Use revision|draft|publication|freeze document.json [--revision revision.json] [--publication publication.json] [--assets directory] [--at UTC]'} ]};console.log(JSON.stringify(failure));process.exitCode=1;diagnostic(options.human,stage,failure);}

}
