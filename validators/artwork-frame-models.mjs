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
 Object.freeze({id:'white-gallery-box-frame',version:1,sha256:'8c20559389f667ed97879776ec6fd53bfff1cbd4c174177988cf24fe3732e00b7',bytes:8728,openingWidth:.6,openingHeight:.8,front:'-Z',wallAnchorZ:0,imagePlaneZ:-0.012,depth:0.045}),
]);
export function artworkFrameModel(sha256,bytes){return records.find(record=>record.sha256===sha256&&record.bytes===bytes);}
