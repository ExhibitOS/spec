// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ExhibitOS contributors
import { inflateRawSync } from 'node:zlib';
import { crc32 } from '../scripts/generate-fixtures.mjs';
export const ZIP_LIMITS=Object.freeze({archiveBytes:67108864,files:256,fileBytes:104857600,expandedBytes:268435456,ratio:100});
const fail=code=>{throw new Error(code);};
export function safeArchivePath(name) {
  return typeof name==='string'&&name.length<=240&&/^(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(name)&&name.split('/').every(segment=>!segment.endsWith('.')&&!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment));
}
export function readBoundedZip(bytes) {
  if(!Buffer.isBuffer(bytes))fail('ZIP_INPUT_TYPE');
  if(bytes.length>ZIP_LIMITS.archiveBytes)fail('ZIP_ARCHIVE_LIMIT');
  if(bytes.length<22)fail('ZIP_STRUCTURE');
  const eocd=bytes.length-22;
  if(bytes.readUInt32LE(eocd)!==0x06054b50||bytes.readUInt16LE(eocd+20)!==0)fail('ZIP_END_RECORD');
  const disk=bytes.readUInt16LE(eocd+4),centralDisk=bytes.readUInt16LE(eocd+6),diskCount=bytes.readUInt16LE(eocd+8),count=bytes.readUInt16LE(eocd+10),centralSize=bytes.readUInt32LE(eocd+12),centralOffset=bytes.readUInt32LE(eocd+16);
  if(disk!==0||centralDisk!==0||diskCount!==count)fail('ZIP_MULTI_DISK');
  if(count===0||count>ZIP_LIMITS.files)fail('ZIP_FILE_LIMIT');
  if(centralOffset+centralSize!==eocd)fail('ZIP_CENTRAL_BOUNDS');
  let offset=centralOffset,total=0;const entries=[],names=new Set();
  for(let index=0;index<count;index++) {
    if(offset+46>eocd||bytes.readUInt32LE(offset)!==0x02014b50)fail('ZIP_CENTRAL_HEADER');
    const madeBy=bytes.readUInt16LE(offset+4),needed=bytes.readUInt16LE(offset+6),flags=bytes.readUInt16LE(offset+8),method=bytes.readUInt16LE(offset+10),time=bytes.readUInt16LE(offset+12),date=bytes.readUInt16LE(offset+14),crc=bytes.readUInt32LE(offset+16),compressed=bytes.readUInt32LE(offset+20),size=bytes.readUInt32LE(offset+24),nameLength=bytes.readUInt16LE(offset+28),extraLength=bytes.readUInt16LE(offset+30),commentLength=bytes.readUInt16LE(offset+32),startDisk=bytes.readUInt16LE(offset+34),attributes=bytes.readUInt32LE(offset+38),localOffset=bytes.readUInt32LE(offset+42);
    if(nameLength===0||nameLength>240||offset+46+nameLength+extraLength+commentLength>eocd)fail('ZIP_CENTRAL_BOUNDS');
    const rawName=bytes.subarray(offset+46,offset+46+nameLength),name=rawName.toString('ascii');
    if(rawName.some(byte=>byte>127)||!safeArchivePath(name))fail('ZIP_UNSAFE_PATH');
    const folded=name.toLowerCase();if(names.has(folded))fail('ZIP_DUPLICATE_PATH');
    const segments=folded.split('/');for(let i=1;i<segments.length;i++)if(names.has(segments.slice(0,i).join('/')))fail('ZIP_PATH_PREFIX_COLLISION');
    if([...names].some(existing=>existing.startsWith(folded+'/')))fail('ZIP_PATH_PREFIX_COLLISION');
    names.add(folded);
    const unixType=(attributes>>>16)&0xf000;
    if(unixType===0xa000)fail('ZIP_SYMLINK');
    if((unixType!==0&&unixType!==0x8000)||(attributes&0x10)!==0)fail('ZIP_SPECIAL_FILE');
    if((madeBy>>>8)!==0&&(madeBy>>>8)!==3)fail('ZIP_UNSUPPORTED_PLATFORM');
    if(extraLength!==0||commentLength!==0||startDisk!==0||(flags!==0&&flags!==0x800)||![0,8].includes(method)||(method===8?needed!==20:needed!==10&&needed!==20))fail('ZIP_UNSUPPORTED_FEATURE');
    if(size===0||size>ZIP_LIMITS.fileBytes||compressed===0||compressed>ZIP_LIMITS.archiveBytes)fail('ZIP_SIZE_LIMIT');
    if(size/compressed>ZIP_LIMITS.ratio)fail('ZIP_RATIO_LIMIT');
    total+=size;if(total>ZIP_LIMITS.expandedBytes)fail('ZIP_EXPANDED_LIMIT');
    entries.push({name,rawName,needed,flags,method,time,date,crc,compressed,size,localOffset});offset+=46+nameLength;
  }
  if(offset!==eocd)fail('ZIP_CENTRAL_BOUNDS');
  let nextOffset=0;const files=new Map();
  for(const entry of entries) {
    const local=entry.localOffset;
    if(local!==nextOffset||local+30>centralOffset||bytes.readUInt32LE(local)!==0x04034b50)fail('ZIP_LOCAL_LAYOUT');
    const nameLength=bytes.readUInt16LE(local+26),extraLength=bytes.readUInt16LE(local+28);
    if(local+30+nameLength+extraLength>centralOffset)fail('ZIP_LOCAL_BOUNDS');
    if(bytes.readUInt16LE(local+4)!==entry.needed||bytes.readUInt16LE(local+6)!==entry.flags||bytes.readUInt16LE(local+8)!==entry.method||bytes.readUInt16LE(local+10)!==entry.time||bytes.readUInt16LE(local+12)!==entry.date||bytes.readUInt32LE(local+14)!==entry.crc||bytes.readUInt32LE(local+18)!==entry.compressed||bytes.readUInt32LE(local+22)!==entry.size||extraLength!==0||nameLength!==entry.rawName.length||!bytes.subarray(local+30,local+30+nameLength).equals(entry.rawName))fail('ZIP_LOCAL_CENTRAL_MISMATCH');
    const start=local+30+nameLength,end=start+entry.compressed;
    if(end>centralOffset)fail('ZIP_LOCAL_BOUNDS');
    const compressedBytes=bytes.subarray(start,end);let data;
    if(entry.method===0) {if(entry.compressed!==entry.size)fail('ZIP_SIZE_MISMATCH');data=compressedBytes;}
    else {
      try {const decoded=inflateRawSync(compressedBytes,{maxOutputLength:entry.size,info:true});data=decoded.buffer;if(decoded.engine.bytesWritten!==entry.compressed)fail('ZIP_DEFLATE_TRAILING_DATA');}
      catch(error){if(error.message==='ZIP_DEFLATE_TRAILING_DATA')throw error;fail('ZIP_DEFLATE_LIMIT_OR_INVALID');}
      if(data.length!==entry.size)fail('ZIP_SIZE_MISMATCH');
    }
    if(crc32(data)!==entry.crc)fail('ZIP_CRC_MISMATCH');
    files.set(entry.name,data);nextOffset=end;
  }
  if(nextOffset!==centralOffset)fail('ZIP_LOCAL_LAYOUT');
  return files;
}
