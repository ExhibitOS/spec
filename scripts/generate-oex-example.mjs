// SPDX-License-Identifier: Apache-2.0
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { packageAssetManifest,validateOex } from '../validators/package.mjs';
import { revisionHash } from '../validators/exhibition.mjs';
import { buildZip } from './zip-fixture-builder.mjs';
export async function createOexExample() {
const revision=JSON.parse(await readFile(new URL('../oes/v1/examples/exhibition.json',import.meta.url)));
// New immutable snapshot carries redistribution terms; never mutate the source example.
revision.revisionId='50000000-0000-4000-8000-000000000120';revision.revision=2;revision.createdAt='2026-10-01T03:00:00Z';
revision.extensions={
  'org.exhibitos/apache-license':{scope:'Generated package metadata and documentation',licenseId:'Apache-2.0',text:await readFile(new URL('../LICENSES/Apache-2.0.txt',import.meta.url),'utf8')},
  'org.exhibitos/cc0-license':{scope:'Original synthetic binary artwork assets only',licenseId:'CC0-1.0',text:await readFile(new URL('../LICENSES/CC0-1.0.txt',import.meta.url),'utf8')},
};
const exhibitionBytes=Buffer.from(JSON.stringify(revision,null,2)+'\n');
const manifest={formatVersion:'1.0.0-draft.1',kind:'oex-manifest',oesArtworkVersion:'1.0.0-draft.1',oesExhibitionVersion:'1.0.0-draft.1',createdAt:'2026-10-01T03:00:00Z',generator:{name:'ExhibitOS original synthetic OEX fixture',version:'1'},exhibition:{path:'exhibition.json',id:revision.id,revisionId:revision.revisionId,bytes:exhibitionBytes.length,sha256:createHash('sha256').update(exhibitionBytes).digest('hex'),revisionSha256:revisionHash(revision),hashProfile:'oes-sorted-json-v1'},assets:packageAssetManifest(revision)};
const entries=[{name:'manifest.json',data:Buffer.from(JSON.stringify(manifest,null,2)+'\n')},{name:'exhibition.json',data:exhibitionBytes}];
for(const asset of manifest.assets)entries.push({name:asset.path,data:await readFile(new URL('../fixtures/synthetic/'+asset.artifactPath,import.meta.url))});
const archive=buildZip(entries),checked=await validateOex(archive);if(!checked.valid)throw new Error(JSON.stringify(checked));
return {archive,manifest,manifestBytes:entries[0].data};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
const {archive,manifestBytes}=await createOexExample();
await mkdir(new URL('../oex/v1/examples/',import.meta.url),{recursive:true});
await writeFile(new URL('../oex/v1/examples/manifest.json',import.meta.url),manifestBytes);
await writeFile(new URL('../oex/v1/examples/synthetic.oex',import.meta.url),archive);
console.log('Generated original synthetic OEX; '+archive.length+' bytes; sha256 '+createHash('sha256').update(archive).digest('hex'));

}
