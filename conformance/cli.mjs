#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { runConformance } from './runner.mjs';
try{if(process.argv.length!==2)throw new Error('USAGE');const result=await runConformance();console.log(JSON.stringify(result));process.exitCode=result.valid?0:1;}catch{console.log(JSON.stringify({valid:false,cases:[],errors:[{code:'CONFORMANCE_FAILED',path:'',message:'Use exhibitos-conformance with no arguments; installed fixtures must be intact'}]}));process.exitCode=1;}
