// SPDX-License-Identifier: Apache-2.0
// Fixed visual geometry records; the digest and byte count bind the original GLB.
const records = Object.freeze([
 Object.freeze({id:'thin-brass-frame',version:1,sha256:'4b14e45ccf14ed38eea90c50553733a0b97b1671b9ec377d900e5a947545f8b4',bytes:7892,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.012,depth:0.025}),
 Object.freeze({id:'gallery-frame',version:1,sha256:'50b1caa7c100150f9872236e5866dec072ea2fa86747ce38e1cd3204aa6c5072',bytes:78732,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.015,depth:0.035}),
 Object.freeze({id:'black-aluminum-frame',version:1,sha256:'17c571accc4ed2554731d4ce89f3cad4faa66cf2bca83321ecd92ad2537093d9',bytes:101768,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.021,depth:0.025}),
 Object.freeze({id:'brushed-silver-frame',version:1,sha256:'b21ee369bf9e2d958d9ff2c03cf2457bbd22669c7d1621c379bebcb6330a8c89',bytes:147640,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.024,depth:0.028}),
 Object.freeze({id:'classical-gilt-frame',version:1,sha256:'dd8a991193788ec10868e2c9947855af4b5ca2630ae9c3aecaa6bd7fb8478d15',bytes:642804,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.012,depth:0.05}),
 Object.freeze({id:'dark-baroque-frame',version:1,sha256:'f10da86d63586d113d363a64572fedd7b70f926ad525bc927ab53c4212fd57bd',bytes:177988,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.012,depth:0.055}),
 Object.freeze({id:'natural-oak-flat-frame',version:1,sha256:'06ac605194e7aa870c4c9c68c17e00b6d1256c421aba6ed9b169e7f873b7b8d9',bytes:177500,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.026,depth:0.03}),
 Object.freeze({id:'neutral-linen-liner-frame',version:1,sha256:'369cca20f6afad83040a20a903afaa55034c4767bd09f88520c6a137cdde997d',bytes:14068,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.012,depth:0.04}),
 Object.freeze({id:'walnut-stepped-frame',version:1,sha256:'b3f0bf2e6dbe659b1484ea6425848ad96b88d0be4b61ca82f5a4694462a7e03e',bytes:196160,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.034,depth:0.038}),
 Object.freeze({id:'white-gallery-box-frame',version:1,sha256:'8c20559389f667ed97879776ec6fd53bfff1cbd4c174177988cf24fe3732e00b',bytes:8728,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.012,depth:0.045}),
 Object.freeze({id:'black-float-frame',version:1,sha256:'d4bdc4201fe2e8866652350915799a346ba07cf73078fec9f7f6e275287e918a',bytes:152056,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.037,depth:0.045}),
 Object.freeze({id:'black-aluminum-frame',version:2,sha256:'2fb941a9f6ed030638512e917e348a0a3000e29c1133fe3f9670268ff1c4169c',bytes:101720,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.021,depth:0.025,derivedFrom:Object.freeze({version:1,sha256:'17c571accc4ed2554731d4ce89f3cad4faa66cf2bca83321ecd92ad2537093d9',bytes:101768,recipe:'omit-unused-invalid-tangent-r1'})}),
 Object.freeze({id:'brushed-silver-frame',version:2,sha256:'a0d0c0d3f02fea91b6a09273eec8d200248a16c8caf5139bd029b681af8eddcd',bytes:147592,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.024,depth:0.028,derivedFrom:Object.freeze({version:1,sha256:'b21ee369bf9e2d958d9ff2c03cf2457bbd22669c7d1621c379bebcb6330a8c89',bytes:147640,recipe:'omit-unused-invalid-tangent-r1'})}),
 Object.freeze({id:'natural-oak-flat-frame',version:2,sha256:'5af789b1aa8e6aa410b40cf16e27c9e2000f87438f1fa52cb08bc46c19c75778',bytes:177476,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.026,depth:0.03,derivedFrom:Object.freeze({version:1,sha256:'06ac605194e7aa870c4c9c68c17e00b6d1256c421aba6ed9b169e7f873b7b8d9',bytes:177500,recipe:'omit-unused-invalid-tangent-r1'})}),
 Object.freeze({id:'wheat-matte-oak-frame',version:1,sha256:'a96b4942c2cd10b25fe1b33001443e1824fc125bc258f28a68547d38d8c54362',bytes:3380,openingWidth:.940,openingHeight:.738,fit:Object.freeze({minWidth:.800,maxWidth:1,minHeight:.600,maxHeight:.800,edgeClearance:.003}),front:'-Z',wallAnchorZ:0,imagePlaneZ:-.012,depth:.030}),
]);
if(records.some(record=>!/^[a-f0-9]{64}$/.test(record.sha256)||!Number.isSafeInteger(record.bytes)||record.bytes<1)||new Set(records.map(record=>record.sha256)).size!==records.length||new Set(records.map(record=>record.id+'@'+record.version)).size!==records.length||records.some(record=>record.version===2&&(!record.derivedFrom||record.derivedFrom.recipe!=='omit-unused-invalid-tangent-r1'||!records.some(source=>source.id===record.id&&source.version===1&&source.sha256===record.derivedFrom.sha256&&source.bytes===record.derivedFrom.bytes&&source.openingWidth===record.openingWidth&&source.openingHeight===record.openingHeight&&source.front===record.front&&source.wallAnchorZ===record.wallAnchorZ&&source.imagePlaneZ===record.imagePlaneZ&&source.depth===record.depth))))throw Error('ARTWORK_FRAME_MODELS_INVALID');
export function artworkFrameModel(sha256,bytes){return records.find(record=>record.sha256===sha256&&record.bytes===bytes);}

/** The fixed ring mesh is resized by translating its four corner profiles. */
export function artworkFrameFit(model,width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height))return undefined;
 const fit=model.fit;
 if(!fit)return Math.abs(width-.6)<=1e-6&&Math.abs(height-.8)<=1e-6?{cornerX:0,cornerY:0}:undefined;
 if(width<fit.minWidth||width>fit.maxWidth||height<fit.minHeight||height>fit.maxHeight)return undefined;
 return {cornerX:(width+2*fit.edgeClearance-model.openingWidth)/2,cornerY:(height+2*fit.edgeClearance-model.openingHeight)/2};
}
