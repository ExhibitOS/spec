// SPDX-License-Identifier: Apache-2.0
// Exact, independently licensed floor map byte versions; no network locations are fetched.
export const OEX_FLOOR_RESOURCE_VERSION='1.0.0-draft.5';
export const FLOOR_NAMESPACE='org.exhibitos.studio/floors';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const FLOOR_RESOURCE_PACKS=freeze([
  {
    "id": "WoodFloor051",
    "version": 1,
    "credit": "Wood Floor 051, ambientCG.com, CC0 1.0",
    "source": "https://ambientcg.com/view?id=WoodFloor051",
    "license": "CC0-1.0",
    "licenseSource": "https://docs.ambientcg.com/license/",
    "maps": {
      "color": {
        "mime": "image/png",
        "bytes": 1235894,
        "sha256": "68bad517cc4aafa4c5ab5812f6a2ee57068da49fcb9446941d44371d716b3ce3",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "srgb",
        "path": "floor-textures/WoodFloor051/1/color-68bad517cc4a.png"
      },
      "roughness": {
        "mime": "image/png",
        "bytes": 532165,
        "sha256": "8c578dfb7c616d81cf89a666506759f29cbd88ba15c6ea0221e52f9e9d57ae43",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "linear",
        "path": "floor-textures/WoodFloor051/1/roughness-8c578dfb7c61.png"
      },
      "normal": {
        "mime": "image/png",
        "bytes": 693158,
        "sha256": "23d13c247759c1323ebb851149fb0f0f9d66be3f367264e897fb2352f2e65181",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "linear",
        "path": "floor-textures/WoodFloor051/1/normal-gl-23d13c247759.png"
      }
    },
    "changes": "Metadata-free RGB8 encoding. Color samples preserved; grayscale roughness copied equally to RGB (G roughness). OpenGL normal converted from16 to8 bits by high-byte quantization (q=u16>>8; maximum encoded-channel error0.0038910505836575737). No green inversion, gamma, sharpening, tint, resize, displacement or invented AO. Authored1.8m patch repeat is editable, not a measured physical guarantee.",
    "notice": {
      "path": "floor-texture-notices/WoodFloor051-1.txt",
      "mime": "text/plain; charset=utf-8",
      "bytes": 551,
      "sha256": "c7db0d49a276da8bfbae71868d5aa0e7d1c925c87ac5df05ce6d5e034a4aba87"
    }
  },
  {
    "id": "Marble006",
    "version": 1,
    "credit": "Marble006, ambientCG.com, CC0 1.0",
    "source": "https://ambientcg.com/view?id=Marble006",
    "license": "CC0-1.0",
    "licenseSource": "https://docs.ambientcg.com/license/",
    "maps": {
      "color": {
        "mime": "image/png",
        "bytes": 1798345,
        "sha256": "d44e0a2b040249c629a67aace4bf0f82a79c33199f1817d55cb1d199bbcefea2",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "srgb",
        "path": "floor-textures/Marble006/1/color-d44e0a2b0402.png"
      },
      "normal": {
        "mime": "image/png",
        "bytes": 538862,
        "sha256": "a61a93414470559bc5e7c1286b7bb93ea234546a315669161249c3f6433a8015",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "linear",
        "path": "floor-textures/Marble006/1/normal-gl-a61a93414470.png"
      },
      "roughness": {
        "mime": "image/png",
        "bytes": 690832,
        "sha256": "cd5898bc49d9d15a21740929731bffbbb97d06c3aa03642772e27fc50e629437",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "linear",
        "path": "floor-textures/Marble006/1/roughness-cd5898bc49d9.png"
      }
    },
    "changes": "Ancillarymetadata removed through fresh RGB8 encoding; grayscale scalar replicated identically to RGB; source16bit maps quantized highbyte to8bit as numerically recorded. Noresize/Gflip/gamma/tint/AI/sharpen/displacement; no inventedAO. Authored1m repeat; providerphysicalsizeunknown, notmeasured.",
    "notice": {
      "path": "floor-texture-notices/Marble006-1.txt",
      "mime": "text/plain; charset=utf-8",
      "bytes": 444,
      "sha256": "5f026528efc38845a2ea54a32d1fb4d1186c970281bde8d2807aa8479fffd1ed"
    }
  },
  {
    "id": "Tiles074",
    "version": 1,
    "credit": "Tiles074, ambientCG.com, CC0 1.0",
    "source": "https://ambientcg.com/view?id=Tiles074",
    "license": "CC0-1.0",
    "licenseSource": "https://docs.ambientcg.com/license/",
    "maps": {
      "color": {
        "mime": "image/png",
        "bytes": 1714324,
        "sha256": "99d35940d5ae7e645ea99f0d3c0d20eb73932d3d68303f534ac481afd0976f16",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "srgb",
        "path": "floor-textures/Tiles074/1/color-99d35940d5ae.png"
      },
      "normal": {
        "mime": "image/png",
        "bytes": 343061,
        "sha256": "89ad085427ad6ab8b446bc2a1da476195c889b7c51fec4000c64c47b560665d0",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "linear",
        "path": "floor-textures/Tiles074/1/normal-gl-89ad085427ad.png"
      },
      "roughness": {
        "mime": "image/png",
        "bytes": 604569,
        "sha256": "538f7d7c064513880c73c9ded25886de29e4200576275d3d324a4dedbb83d021",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "linear",
        "path": "floor-textures/Tiles074/1/roughness-538f7d7c0645.png"
      }
    },
    "changes": "Ancillarymetadata removed through fresh RGB8 encoding; grayscale scalar replicated identically to RGB; source16bit maps quantized highbyte to8bit as numerically recorded. Noresize/Gflip/gamma/tint/AI/sharpen/displacement; no inventedAO. ProviderapproximateWHOLE texturepatch2.1m; notindividualtilemeasurement orphysicalguarantee.",
    "notice": {
      "path": "floor-texture-notices/Tiles074-1.txt",
      "mime": "text/plain; charset=utf-8",
      "bytes": 474,
      "sha256": "da72eb5d9885b470536fa881437dc341be71df76107a70d320eb84dfa44707a0"
    }
  },
  {
    "id": "Carpet004",
    "version": 1,
    "credit": "Carpet004, ambientCG.com, CC0 1.0",
    "source": "https://ambientcg.com/view?id=Carpet004",
    "license": "CC0-1.0",
    "licenseSource": "https://docs.ambientcg.com/license/",
    "maps": {
      "ao": {
        "mime": "image/png",
        "bytes": 1462307,
        "sha256": "cba7d7a73cc9dd199e75ce8930189f7ca1a817d0dfd1f9fafd98b3be6caa1a18",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "linear",
        "path": "floor-textures/Carpet004/1/ao-cba7d7a73cc9.png"
      },
      "color": {
        "mime": "image/png",
        "bytes": 1932055,
        "sha256": "df90d6a3be6b2be92e89b830d41ec329a170266009a3cffa2e05bf043085b25f",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "srgb",
        "path": "floor-textures/Carpet004/1/color-df90d6a3be6b.png"
      },
      "normal": {
        "mime": "image/png",
        "bytes": 2704480,
        "sha256": "956a4ad49737669c6bb8b5c669db475239bc7a6d2556dcf8426b029bf92a09e4",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "linear",
        "path": "floor-textures/Carpet004/1/normal-gl-956a4ad49737.png"
      },
      "roughness": {
        "mime": "image/png",
        "bytes": 771102,
        "sha256": "6a60aa6770e64ad23992e6754657787e19417edb3620a625fac2398204b59854",
        "width": 1024,
        "height": 1024,
        "channels": 3,
        "bitDepth": 8,
        "colorSpace": "linear",
        "path": "floor-textures/Carpet004/1/roughness-6a60aa6770e6.png"
      }
    },
    "changes": "Ancillarymetadata removed through fresh RGB8 encoding; grayscale scalar replicated identically to RGB; source16bit maps quantized highbyte to8bit as numerically recorded. Noresize/Gflip/gamma/tint/AI/sharpen/displacement; no inventedAO. Authored1m repeat; providerphysicalsizeunknown, notmeasured.",
    "notice": {
      "path": "floor-texture-notices/Carpet004-1.txt",
      "mime": "text/plain; charset=utf-8",
      "bytes": 444,
      "sha256": "b6885b09f4f3ce672ad769cb6cbc5f5a8d23dfd0ee13acd290f271c8b4e149c3"
    }
  }
]);
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const closed=(v,required,optional=[])=>obj(v)&&required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const fail=()=>{throw Error('FLOOR_RESOURCE_REFERENCE');};
/** Validates the existing v1 binding selection without changing its content.
 * An authored floor suppresses a stored room-base binding exactly as in Studio. */
export function selectedFloorResourcePacks(document){
 if(!obj(document?.extensions)||!Object.hasOwn(document.extensions,FLOOR_NAMESPACE))return [];
 const value=document.extensions[FLOOR_NAMESPACE];
 if(!closed(value,['version','bindings'])||value.version!==1)throw Error('FLOOR_RESOURCE_VERSION');
 if(!Array.isArray(value.bindings)||value.bindings.length>64||new TextEncoder().encode(JSON.stringify(value)).length>16384)fail();
 const selected=new Set(),targets=new Set(),defaults={wood:'WoodFloor051',marble:'Marble006',tile:'Tiles074',carpet:'Carpet004'};
 const rooms=new Set(document.rooms.map(r=>r.id.toLowerCase())),wav=new Set(document.mediaAssets.filter(m=>m.mime==='audio/wav').map(m=>m.id.toLowerCase()));
 for(const b of value.bindings){
  if(!closed(b,['target','preset','repeatMeters','rotation'],['materialOverride','texturePack','normalScale','aoStrength','sound'])||typeof b.preset!=='string'||!Object.hasOwn(defaults,b.preset)||!Array.isArray(b.repeatMeters)||b.repeatMeters.length!==2||!b.repeatMeters.every(n=>number(n,.05,20))||!number(b.rotation,-Math.PI,Math.PI))fail();
  const t=b.target;if(!obj(t))fail();let key,active=true;
  if(t.kind==='surface'&&closed(t,['kind','surfaceId'])&&uuid(t.surfaceId)){const id=t.surfaceId.toLowerCase();key='surface:'+id;if(!document.surfaces.some(s=>s.type==='floor'&&s.id.toLowerCase()===id))fail();}
  else if(t.kind==='room-base'&&closed(t,['kind','roomId'])&&uuid(t.roomId)){const id=t.roomId.toLowerCase();key='room-base:'+id;if(!rooms.has(id))fail();active=!document.surfaces.some(s=>s.type==='floor'&&s.roomId.toLowerCase()===id);}
  else fail();
  if(targets.has(key))fail();targets.add(key);
  if(Object.hasOwn(b,'materialOverride')){const m=b.materialOverride;if(!obj(m)||!Object.keys(m).length||Object.entries(m).some(([k,v])=>k==='color'?typeof v!=='string'||!/^#[0-9a-f]{6}$/.test(v):!['roughness','metalness'].includes(k)||!number(v,0,1)))fail();}
  if(Object.hasOwn(b,'normalScale')&&!number(b.normalScale,0,2)||Object.hasOwn(b,'aoStrength')&&!number(b.aoStrength,0,1))fail();
  if(Object.hasOwn(b,'sound')){const s=b.sound;if(!obj(s)||!number(s.gain,0,1))fail();if(s.mode==='explicit'){if(!closed(s,['mode','gain','assetIds'])||!Array.isArray(s.assetIds)||s.assetIds.length<1||s.assetIds.length>16||s.assetIds.some(id=>!uuid(id)||!wav.has(id.toLowerCase()))||new Set(s.assetIds.map(id=>id.toLowerCase())).size!==s.assetIds.length)fail();}else if(!['none','material-default'].includes(s.mode)||!closed(s,['mode','gain']))fail();}
  const p=Object.hasOwn(b,'texturePack')?b.texturePack:{id:defaults[b.preset],version:1};
  if(!closed(p,['id','version'])||p.version!==1||!FLOOR_RESOURCE_PACKS.some(pack=>pack.id===p.id))throw Error('FLOOR_RESOURCE_VERSION');
  if(active)selected.add(p.id);
 }
 return FLOOR_RESOURCE_PACKS.filter(p=>selected.has(p.id));
}
export function floorResourceNotice(pack){
 if(!FLOOR_RESOURCE_PACKS.includes(pack))throw Error('FLOOR_RESOURCE_VERSION');
 return `${pack.credit}\nSource: ${pack.source}\nLicense: ${pack.license} (${pack.licenseSource})\nChanges: ${pack.changes}\n`;
}
export const FLOOR_RESOURCE_FILES=freeze(FLOOR_RESOURCE_PACKS.flatMap(pack=>[...Object.entries(pack.maps),['notice',pack.notice]].map(([role,file])=>({packId:pack.id,packVersion:pack.version,role,path:'resources/'+file.path,artifactPath:file.path,mime:file.mime,bytes:file.bytes,sha256:file.sha256}))).sort((a,b)=>a.path.localeCompare(b.path)));
export function packageFloorResourceManifest(document){
 const ids=new Set(selectedFloorResourcePacks(document).map(p=>p.id));return FLOOR_RESOURCE_FILES.filter(f=>ids.has(f.packId)).map(f=>({...f}));
}
