// SPDX-License-Identifier: Apache-2.0
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {crc32} from './generate-fixtures.mjs';
import {readOex,writeOex,SPACE_STILL_NAMESPACE} from '../index.mjs';
// Original tiny empty-room diagram: a binary/profile fixture, never evidence of
// an actual captured space, camera continuity, renderer quality or private data.
export function syntheticSpacePng(){
 const width=32,height=24,rows=Buffer.alloc((width*3+1)*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const color=y>16?[155,159,155]:x<4||x>27?[201,205,199]:x>=13&&x<=18&&y>5?[86,105,110]:[240,242,232];
  color.forEach((value,i)=>{rows[y*(width*3+1)+1+x*3+i]=value;});
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 const block=Buffer.alloc(5);block[0]=1;block.writeUInt16LE(rows.length,1);block.writeUInt16LE(rows.length^65535,3);
 let a=1,b=0;for(const byte of rows){a=(a+byte)%65521;b=(b+a)%65521;}const adler=Buffer.alloc(4);adler.writeUInt32BE(((b<<16)|a)>>>0);
 const chunk=(kind,body)=>{const name=Buffer.from(kind),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(body.length);crc.writeUInt32BE(crc32(Buffer.concat([name,body])));return Buffer.concat([length,name,body,crc]);};
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',Buffer.concat([Buffer.from([120,1]),block,rows,adler])),chunk('IEND',Buffer.alloc(0))]);
}
export async function createSpaceStillExample(){
 const previous=await readOex(await readFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url))),revision=previous.exhibition,png=syntheticSpacePng();
 revision.revisionId='50000000-0000-4000-8000-000000000141';revision.revision=4;revision.createdAt='2026-10-03T09:00:00Z';
 const asset={id:'50000000-0000-4000-8000-000000000142',path:'space-still/synthetic/room.png',mime:'image/png',bytes:png.length,sha256:createHash('sha256').update(png).digest('hex'),rights:{holder:'ExhibitOS contributors',ownership:'owner',licenseId:'CC0-1.0',permissions:{display:true,download:true,export:true,commercial:true},creditLine:'Original synthetic empty-room diagram; CC0-1.0'}};
 revision.extensions={...revision.extensions,[SPACE_STILL_NAMESPACE]:{version:1,asset},'org.exhibitos.viewer/entrance':{version:1,artist:'Synthetic creator',introduction:'Binary contract fixture only.',imageAssetId:asset.id,imageAlt:'Original synthetic empty-room diagram',mobilePosition:'center'}};
 const assets=new Map(previous.manifest.assets.map(a=>[a.artifactPath,previous.files.get(a.path)]));assets.set(asset.path,png);
 const options={createdAt:revision.createdAt,generator:{name:'ExhibitOS original synthetic space-still fixture',version:'4'}};
 return {archive:await writeOex(revision,assets,options),revision,assets,options,png};
}
if(process.argv[1]?.endsWith('/generate-space-still-oex.mjs')){const sample=await createSpaceStillExample();await writeFile(new URL('../oex/v1/examples/synthetic-space-still.oex',import.meta.url),sample.archive);await writeFile(new URL('../oex/v1/examples/space-still-manifest.json',import.meta.url),JSON.stringify((await readOex(sample.archive)).manifest,null,2)+'\n');console.log(JSON.stringify({bytes:sample.archive.length,sha256:createHash('sha256').update(sample.archive).digest('hex')}));}
