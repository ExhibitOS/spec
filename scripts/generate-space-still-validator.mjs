// SPDX-License-Identifier: Apache-2.0
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
const sources=await Promise.all(['../oes/v1/artwork.schema.json','../oes/extensions/space-still.schema.json'].map(async path=>await readFile(new URL(path,import.meta.url),'utf8')));
// UTC/UUID semantics are checked by the pure adapter. Shape validation is
// compiled here so a browser with a strict CSP never needs runtime codegen.
const compiler=new Ajv({strict:true,allErrors:true,validateFormats:false,coerceTypes:false,useDefaults:false,removeAdditional:false,code:{source:true,esm:true}});
for(const text of sources)compiler.addSchema(JSON.parse(text));
let generated=standalone(compiler,compiler.getSchema(JSON.parse(sources[1]).$id));
const imports=[];let number=0;
for(const module of new Set([...generated.matchAll(/require\("([^"]+)"\)/g)].map(match=>match[1]))){
 if(!/^ajv\/dist\/runtime\/[a-zA-Z0-9_-]+$/.test(module))throw Error('SPACE_STILL_GENERATOR_RUNTIME');
 const name=`helper${number++}`;imports.push(`import ${name}Module from ${JSON.stringify(module+'.js')}; const ${name}=typeof ${name}Module==='function'?{default:${name}Module}:${name}Module;`);generated=generated.replaceAll(`require(${JSON.stringify(module)})`,name);
}
if(/\brequire\(|\bnew Function\(|\beval\(/.test(generated))throw Error('SPACE_STILL_RUNTIME_CODEGEN');
const digest=createHash('sha256').update(sources.join('\n')).digest('hex');
const output=`// SPDX-License-Identifier: Apache-2.0\n// Generated shape validator. Input schemas SHA256 ${digest}\n${imports.join('\n')}\n${generated}\n`,target=new URL('../validators/space-still-schema.mjs',import.meta.url);
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==output)throw Error('SPACE_STILL_SCHEMA_STALE');}else await writeFile(target,output);
console.log(JSON.stringify({mode:process.argv.includes('--check')?'check':'generate',schemasSha256:digest,bytes:Buffer.byteLength(output),runtimeCodegen:false}));
