// SPDX-License-Identifier: Apache-2.0
import {inflateSync} from 'node:zlib';
import {crc32} from '../scripts/generate-fixtures.mjs';
import {MAX_SPACE_STILL_BYTES,MAX_SPACE_STILL_PIXELS,MAX_SPACE_STILL_DIMENSION} from './space-still.mjs';
/** Independent bounded PNG profile check; Platform still isolates actual decoding. */
export function validSpaceStillPng(bytes){
 return validStandalonePng(bytes,{bytes:MAX_SPACE_STILL_BYTES,pixels:MAX_SPACE_STILL_PIXELS,dimension:MAX_SPACE_STILL_DIMENSION,rgbOnly:false,srgb:true});
}
/** Exact registered RGB8 material maps, independent of cover still limits. */
export function validSurfaceMaterialPng(bytes){
 return validStandalonePng(bytes,{bytes:8*1024*1024,pixels:4194304,dimension:2048,rgbOnly:true,srgb:false});
}
function validStandalonePng(bytes,limits){
 try{
  if(bytes.length<57||bytes.length>limits.bytes||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return false;
  let cursor=8,width=0,height=0,channels=0,srgb=false,idat=false,ended=false,count=0;const compressed=[];
  while(cursor<bytes.length){
   if(++count>256||cursor+12>bytes.length||ended)return false;
   const length=bytes.readUInt32BE(cursor),next=cursor+length+12;if(next>bytes.length)return false;
   const name=bytes.toString('latin1',cursor+4,cursor+8),body=bytes.subarray(cursor+8,next-4);
   if(crc32(bytes.subarray(cursor+4,next-4))!==bytes.readUInt32BE(next-4))return false;
   if(cursor===8){
    if(name!=='IHDR'||length!==13)return false;
    width=body.readUInt32BE(0);height=body.readUInt32BE(4);channels=body[9]===2?3:body[9]===6?4:0;
    if(!width||!height||width>limits.dimension||height>limits.dimension||width*height>limits.pixels||!channels||limits.rgbOnly&&channels!==3||body[8]!==8||body[10]||body[11]||body[12])return false;
   }else if(name==='sRGB'){
    if(!limits.srgb||srgb||idat||length!==1||body[0]>3)return false;srgb=true;
   }else if(name==='IDAT'){idat=true;compressed.push(body);}
   else if(name==='IEND'){if(length||!idat||next!==bytes.length)return false;ended=true;}
   else return false;
   cursor=next;
  }
  if(!ended)return false;
  const packed=Buffer.concat(compressed),expected=(width*channels+1)*height,result=inflateSync(packed,{maxOutputLength:expected,info:true});
  if(result.buffer.length!==expected||result.engine.bytesWritten!==packed.length)return false;
  for(let row=0;row<height;row++)if(result.buffer[row*(width*channels+1)]>4)return false;
  return true;
 }catch{return false;}
}
