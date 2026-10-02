// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const npm=process.platform==='win32'?'npm.cmd':'npm';
if(process.version!=='v24.21.0'||spawnSync(npm,['--version'],{encoding:'utf8'}).stdout.trim()!=='11.19.0')throw new Error('Use Node24.21.0/npm11.19.0');
await mkdir('dist',{recursive:true});
const pack=spawnSync(npm,['pack','--ignore-scripts','--json','--pack-destination','dist'],{encoding:'utf8'});
if(pack.status!==0)throw new Error(pack.stderr);
const [info]=JSON.parse(pack.stdout);
const bytes=await readFile('dist/'+info.filename),sha256=createHash('sha256').update(bytes).digest('hex');
await writeFile('dist/'+info.filename+'.sha256',sha256+'  '+info.filename+'\n');
console.log(JSON.stringify({filename:info.filename,bytes:bytes.length,sha256,packageVersion:info.version,contractVersions:{oes:'1.0.0-draft.1',oex:['1.0.0-draft.1','1.0.0-draft.2'],oed:'1.0.0-draft.1'},status:'draft'}));
