// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ExhibitOS contributors
// File-backed ZIP primitives for a future explicitly negotiated OEX profile.
// These are not a complete OEX validator: callers must check manifests, rights,
// exact hashes and every entry before publishing or importing anything.
import {constants} from 'node:fs';
import {open} from 'node:fs/promises';
import {inflateRawSync} from 'node:zlib';
import {safeArchivePath} from './zip.mjs';

export const FILE_ZIP_LIMITS=Object.freeze({archiveBytes:512*1024*1024,files:256,fileBytes:32*1024*1024,expandedBytes:512*1024*1024,ratio:100});
const fail=code=>{throw new Error(code);};
const crcTable=Uint32Array.from({length:256},(_,value)=>{let n=value;for(let bit=0;bit<8;bit++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0;});
export function fileCrc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=(crc>>>8)^crcTable[(crc^byte)&255];return (crc^0xffffffff)>>>0;}
async function readExactly(file,offset,length){
  const bytes=Buffer.alloc(length);let pos=0;
  while(pos<length){const {bytesRead}=await file.read(bytes,pos,length-pos,offset+pos);if(!bytesRead)fail('ZIP_STRUCTURE');pos+=bytesRead;}
  return bytes;
}
const sameStat=(a,b)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeNs===b.mtimeNs&&a.ctimeNs===b.ctimeNs;

// Input must be a private, stable snapshot owned by the caller. The open file
// descriptor and stat checks detect truncation/change to the open inode during reads.
// Entry data are loaded on demand, never as an archive-sized Buffer.
export async function openBoundedZipFile(path,{fileHandle}={}){
  const ownFile=!fileHandle;
  const file=fileHandle??await open(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{
    const original=await file.stat({bigint:true});
    if(!original.isFile())fail('ZIP_INPUT_TYPE');
    if(original.size>BigInt(FILE_ZIP_LIMITS.archiveBytes))fail('ZIP_ARCHIVE_LIMIT');
    if(original.size<22n)fail('ZIP_STRUCTURE');
    const archiveSize=Number(original.size),end=await readExactly(file,archiveSize-22,22);
    if(end.readUInt32LE(0)!==0x06054b50||end.readUInt16LE(20)!==0)fail('ZIP_END_RECORD');
    const disk=end.readUInt16LE(4),centralDisk=end.readUInt16LE(6),diskCount=end.readUInt16LE(8),count=end.readUInt16LE(10),centralSize=end.readUInt32LE(12),centralOffset=end.readUInt32LE(16);
    if(disk!==0||centralDisk!==0||diskCount!==count)fail('ZIP_MULTI_DISK');
    if(!count||count>FILE_ZIP_LIMITS.files)fail('ZIP_FILE_LIMIT');
    if(centralOffset+centralSize!==archiveSize-22||centralSize>count*(46+240))fail('ZIP_CENTRAL_BOUNDS');
    const central=await readExactly(file,centralOffset,centralSize),entries=new Map(),names=new Set();let pos=0,total=0,next=0;
    for(let i=0;i<count;i++){
      if(pos+46>central.length||central.readUInt32LE(pos)!==0x02014b50)fail('ZIP_CENTRAL_HEADER');
      const madeBy=central.readUInt16LE(pos+4),needed=central.readUInt16LE(pos+6),flags=central.readUInt16LE(pos+8),method=central.readUInt16LE(pos+10),time=central.readUInt16LE(pos+12),date=central.readUInt16LE(pos+14),crc=central.readUInt32LE(pos+16),compressed=central.readUInt32LE(pos+20),size=central.readUInt32LE(pos+24),nameLength=central.readUInt16LE(pos+28),extraLength=central.readUInt16LE(pos+30),commentLength=central.readUInt16LE(pos+32),startDisk=central.readUInt16LE(pos+34),attributes=central.readUInt32LE(pos+38),localOffset=central.readUInt32LE(pos+42);
      if(!nameLength||nameLength>240||pos+46+nameLength+extraLength+commentLength>central.length)fail('ZIP_CENTRAL_BOUNDS');
      const rawName=central.subarray(pos+46,pos+46+nameLength),name=rawName.toString('ascii'),folded=name.toLowerCase();
      if(rawName.some(byte=>byte>127)||!safeArchivePath(name))fail('ZIP_UNSAFE_PATH');
      if(names.has(folded))fail('ZIP_DUPLICATE_PATH');
      const segments=folded.split('/');for(let j=1;j<segments.length;j++)if(names.has(segments.slice(0,j).join('/')))fail('ZIP_PATH_PREFIX_COLLISION');
      if([...names].some(existing=>existing.startsWith(folded+'/')))fail('ZIP_PATH_PREFIX_COLLISION');names.add(folded);
      const unixType=(attributes>>>16)&0xf000;
      if(unixType===0xa000)fail('ZIP_SYMLINK');
      if((unixType!==0&&unixType!==0x8000)||(attributes&0x10))fail('ZIP_SPECIAL_FILE');
      if((madeBy>>>8)!==0&&(madeBy>>>8)!==3)fail('ZIP_UNSUPPORTED_PLATFORM');
      if(extraLength||commentLength||startDisk||(flags!==0&&flags!==0x800)||![0,8].includes(method)||(method===8?needed!==20:needed!==10&&needed!==20))fail('ZIP_UNSUPPORTED_FEATURE');
      // A deflate stream may be slightly larger than its uncompressed input.
      if(!size||size>FILE_ZIP_LIMITS.fileBytes||!compressed||compressed>FILE_ZIP_LIMITS.fileBytes+65536)fail('ZIP_SIZE_LIMIT');
      if(size/compressed>FILE_ZIP_LIMITS.ratio)fail('ZIP_RATIO_LIMIT');
      total+=size;if(total>FILE_ZIP_LIMITS.expandedBytes)fail('ZIP_EXPANDED_LIMIT');
      if(localOffset!==next||localOffset+30+nameLength>centralOffset)fail('ZIP_LOCAL_LAYOUT');
      const local=await readExactly(file,localOffset,30+nameLength);
      if(local.readUInt32LE(0)!==0x04034b50)fail('ZIP_LOCAL_LAYOUT');
      if(local.readUInt16LE(4)!==needed||local.readUInt16LE(6)!==flags||local.readUInt16LE(8)!==method||local.readUInt16LE(10)!==time||local.readUInt16LE(12)!==date||local.readUInt32LE(14)!==crc||local.readUInt32LE(18)!==compressed||local.readUInt32LE(22)!==size||local.readUInt16LE(26)!==nameLength||local.readUInt16LE(28)!==0||!local.subarray(30).equals(rawName))fail('ZIP_LOCAL_CENTRAL_MISMATCH');
      const start=localOffset+30+nameLength;next=start+compressed;if(next>centralOffset)fail('ZIP_LOCAL_BOUNDS');
      entries.set(name,{start,compressed,size,method,crc});pos+=46+nameLength;
    }
    if(pos!==central.length)fail('ZIP_CENTRAL_BOUNDS');
    if(next!==centralOffset)fail('ZIP_LOCAL_LAYOUT');
    let closed=false,busy=false;
    const verifyStable=async()=>{if(closed||!sameStat(original,await file.stat({bigint:true})))fail('ZIP_INPUT_CHANGED');};
    await verifyStable();
    return {
      size:entries.size,archiveBytes:archiveSize,expandedBytes:total,keys:()=>entries.keys(),has:name=>entries.has(name),
      async get(name){
        if(busy)fail('ZIP_CONCURRENT_READ');busy=true;
        try{
          await verifyStable();const entry=entries.get(name);if(!entry)return undefined;
          const source=await readExactly(file,entry.start,entry.compressed);let data;
          if(entry.method===0){if(entry.compressed!==entry.size)fail('ZIP_SIZE_MISMATCH');data=source;}
          else{try{const decoded=inflateRawSync(source,{maxOutputLength:entry.size,info:true});data=decoded.buffer;if(decoded.engine.bytesWritten!==entry.compressed)fail('ZIP_DEFLATE_TRAILING_DATA');}catch(error){if(error.message==='ZIP_DEFLATE_TRAILING_DATA')throw error;fail('ZIP_DEFLATE_LIMIT_OR_INVALID');}if(data.length!==entry.size)fail('ZIP_SIZE_MISMATCH');}
          if(fileCrc32(data)!==entry.crc)fail('ZIP_CRC_MISMATCH');await verifyStable();return data;
        }finally{busy=false;}
      },
      verifyStable,
      async close(){if(!closed){closed=true;if(ownFile)await file.close();}}
    };
  }catch(error){if(ownFile)await file.close();throw error;}
}
