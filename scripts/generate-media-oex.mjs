// SPDX-License-Identifier: Apache-2.0
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {writeOex,readOex} from '../index.mjs';
// Original synthetic silence, not recorded speech/music or private artwork.
export function syntheticWav(){const b=Buffer.alloc(1644);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);b.writeUInt32LE(16000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(1600,40);return b;}
export async function createMediaExample(){
 const old=await readOex(await readFile(new URL('../oex/v1/examples/synthetic.oex',import.meta.url))),revision=old.exhibition,wav=syntheticWav();
 revision.revisionId='50000000-0000-4000-8000-000000000121';revision.revision=3;revision.createdAt='2026-10-02T09:00:00Z';
 revision.mediaAssets=[{id:'50000000-0000-4000-8000-000000000122',path:'media/synthetic/audio.wav',mime:'audio/wav',bytes:wav.length,sha256:createHash('sha256').update(wav).digest('hex'),rights:{holder:'ExhibitOS contributors',ownership:'owner',licenseId:'CC0-1.0',permissions:{display:true,download:true,export:true,commercial:true},creditLine:'Original synthetic silence; CC0-1.0'}}];
 revision.audioZones=[{id:'50000000-0000-4000-8000-000000000123',roomId:revision.rooms[0].id,assetId:revision.mediaAssets[0].id,position:[0,0,0],radius:1,volume:0.5,autoplay:false,transcript:'Original synthetic silence.'}];
 const assets=new Map(old.manifest.assets.map(a=>[a.artifactPath,old.files.get(a.path)]));assets.set(revision.mediaAssets[0].path,wav);
 const options={createdAt:revision.createdAt,generator:{name:'ExhibitOS original synthetic media OEX fixture',version:'2'}};
 return {archive:await writeOex(revision,assets,options),revision,assets,options,wav};
}
if(process.argv[1]?.endsWith('/generate-media-oex.mjs')){const {archive,wav}=await createMediaExample();const {manifest}=await readOex(archive);await writeFile(new URL('../oex/v1/examples/synthetic-media.oex',import.meta.url),archive);await writeFile(new URL('../oex/v1/examples/media-manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');await writeFile(new URL('../fixtures/synthetic/audio.wav',import.meta.url),wav);console.log(JSON.stringify({bytes:archive.length,sha256:createHash('sha256').update(archive).digest('hex')}));}
