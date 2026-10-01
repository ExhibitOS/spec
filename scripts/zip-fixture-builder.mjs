// SPDX-License-Identifier: Apache-2.0
// Deterministic classic ZIP writer for original fixtures and adversarial tests.
import { deflateRawSync } from 'node:zlib';
import { crc32 } from './generate-fixtures.mjs';
export function buildZip(entries) {
  const local=[],central=[];let offset=0;
  for(const entry of entries) {
    const name=Buffer.from(entry.name,'utf8'),data=Buffer.from(entry.data),method=entry.method??0,compressed=method===8?deflateRawSync(data):data;
    const crc=crc32(data),size=entry.declaredSize??data.length;
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(entry.flags??0,6);header.writeUInt16LE(method,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(size,22);header.writeUInt16LE(name.length,26);
    local.push(header,name,compressed);
    const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(0x0314,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(entry.flags??0,8);directory.writeUInt16LE(method,10);directory.writeUInt16LE(33,14);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(compressed.length,20);directory.writeUInt32LE(size,24);directory.writeUInt16LE(name.length,28);directory.writeUInt32LE(entry.attributes??0x81a40000,38);directory.writeUInt32LE(offset,42);central.push(directory,name);offset+=header.length+name.length+compressed.length;
  }
  const directories=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directories.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,directories,end]);
}
