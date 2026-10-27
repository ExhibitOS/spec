// SPDX-License-Identifier: Apache-2.0
// Compiled public descriptors only; source paths and authoring originals are not shipped.
export const OEX_SURFACE_MATERIAL_VERSION='1.0.0-draft.7';
export const MATERIAL_NAMESPACE='org.exhibitos.studio/materials';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const SURFACE_MATERIAL_PACKS=freeze([
  {
    "id": "museum-matte-paint",
    "version": 1,
    "license": "CC0-1.0",
    "credit": "User-authored ExhibitOS asset",
    "changes": "Base color and NormalGL bytes unchanged. Roughness L8 replicated to equal RGB8 channels without resizing or numeric/color correction. Height is not consumed.",
    "maps": {
      "color": {
        "mime": "image/png",
        "bytes": 1810870,
        "sha256": "01fee8fd9374ad1135b0ea10574024d974dafe404fd396cfb2a10b073c3ab622",
        "width": 2048,
        "height": 2048,
        "colorSpace": "srgb",
        "path": "surface-material-textures/museum-matte-paint/1/color-01fee8fd9374.png",
        "channels": 3,
        "bitDepth": 8,
        "sourceSha256": "01fee8fd9374ad1135b0ea10574024d974dafe404fd396cfb2a10b073c3ab622"
      },
      "normal": {
        "mime": "image/png",
        "bytes": 2397933,
        "sha256": "10246edc0ab388181a9b1d4fed8dd486a01b0f618f8b1a7a5919e3b5b160e324",
        "width": 2048,
        "height": 2048,
        "colorSpace": "linear",
        "path": "surface-material-textures/museum-matte-paint/1/normal-10246edc0ab3.png",
        "channels": 3,
        "bitDepth": 8,
        "sourceSha256": "10246edc0ab388181a9b1d4fed8dd486a01b0f618f8b1a7a5919e3b5b160e324"
      },
      "roughness": {
        "mime": "image/png",
        "bytes": 836940,
        "sha256": "b62c048f881954fda611a1c415433460fd655a8ef14a1368b31b13918cad4cd8",
        "width": 2048,
        "height": 2048,
        "colorSpace": "linear",
        "path": "surface-material-textures/museum-matte-paint/1/roughness-b62c048f8819.png",
        "channels": 3,
        "bitDepth": 8,
        "sourceSha256": "b5489044ab0cf0163670482272741f050f4797b6a7ee66e6809b50f7e9e2ea69"
      }
    },
    "notice": {
      "path": "surface-material-notices/museum-matte-paint-1.txt",
      "mime": "text/plain; charset=utf-8",
      "bytes": 957,
      "sha256": "dd2097de8126b398fe4e6fd7ab3c4fbb20b5347d92915b9a6c85bd1ab0050583"
    },
    "noticeText": "museum-matte-paint — current distribution notice\nUser-authored ExhibitOS asset.\nCC0 1.0 Universal, pursuant to the user standing authorization dated 2026-10-27 for personally-created AND rights-owned models, textures, materials, previews, production originals, authoring scripts and asset derivatives, including future ExhibitOS deliveries unless separately instructed.\nhttps://creativecommons.org/publicdomain/zero/1.0/\nhttps://creativecommons.org/publicdomain/zero/1.0/legalcode\nCommercial use, modification, conversion, LOD, texture optimization and app/public repository/OEX/static redistribution are permitted; attribution is not mandatory. Original historical unselected license notes remain unchanged. No original asset bytes were modified during intake.\nThird-party components retain their own licenses; unknown-rights components require separate review. This notice does not relabel product code or grant trademark, patent or personality rights.\n"
  },
  {
    "id": "fine-lime-plaster",
    "version": 1,
    "license": "CC0-1.0",
    "credit": "User-authored ExhibitOS asset",
    "changes": "Base color and NormalGL bytes unchanged. Roughness L8 replicated to equal RGB8 channels without resizing or numeric/color correction. Height is not consumed.",
    "maps": {
      "color": {
        "mime": "image/png",
        "bytes": 1741974,
        "sha256": "73294b1726758af405aee172ce1a5bf486b2998ce485f5dd3b3d2a31e4f40a8c",
        "width": 2048,
        "height": 2048,
        "colorSpace": "srgb",
        "path": "surface-material-textures/fine-lime-plaster/1/color-73294b172675.png",
        "channels": 3,
        "bitDepth": 8,
        "sourceSha256": "73294b1726758af405aee172ce1a5bf486b2998ce485f5dd3b3d2a31e4f40a8c"
      },
      "normal": {
        "mime": "image/png",
        "bytes": 2819439,
        "sha256": "36d7e70a9317dffbce237e832cfa18f7dfc1c6aba45ba98998c9da51f562a2df",
        "width": 2048,
        "height": 2048,
        "colorSpace": "linear",
        "path": "surface-material-textures/fine-lime-plaster/1/normal-36d7e70a9317.png",
        "channels": 3,
        "bitDepth": 8,
        "sourceSha256": "36d7e70a9317dffbce237e832cfa18f7dfc1c6aba45ba98998c9da51f562a2df"
      },
      "roughness": {
        "mime": "image/png",
        "bytes": 839630,
        "sha256": "bb774369bf82a83525e439051f6dd72e3fd09ca51302617d0e109a56a0a24e5d",
        "width": 2048,
        "height": 2048,
        "colorSpace": "linear",
        "path": "surface-material-textures/fine-lime-plaster/1/roughness-bb774369bf82.png",
        "channels": 3,
        "bitDepth": 8,
        "sourceSha256": "82a981c2593723a13f876bdbd16b2095127aeb140d499561a0c934114174dbd3"
      }
    },
    "notice": {
      "path": "surface-material-notices/fine-lime-plaster-1.txt",
      "mime": "text/plain; charset=utf-8",
      "bytes": 956,
      "sha256": "36d175c95c1d07e4d306c64f87468a7d63f2199edcc472ac2837deebc0414b33"
    },
    "noticeText": "fine-lime-plaster — current distribution notice\nUser-authored ExhibitOS asset.\nCC0 1.0 Universal, pursuant to the user standing authorization dated 2026-10-27 for personally-created AND rights-owned models, textures, materials, previews, production originals, authoring scripts and asset derivatives, including future ExhibitOS deliveries unless separately instructed.\nhttps://creativecommons.org/publicdomain/zero/1.0/\nhttps://creativecommons.org/publicdomain/zero/1.0/legalcode\nCommercial use, modification, conversion, LOD, texture optimization and app/public repository/OEX/static redistribution are permitted; attribution is not mandatory. Original historical unselected license notes remain unchanged. No original asset bytes were modified during intake.\nThird-party components retain their own licenses; unknown-rights components require separate review. This notice does not relabel product code or grant trademark, patent or personality rights.\n"
  }
]);
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const closed=(v,keys)=>object(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const scalar=v=>closed(v,['color','roughness','metalness'])&&typeof v.color==='string'&&/^#[0-9a-f]{6}$/.test(v.color)&&finite(v.roughness,0,1)&&finite(v.metalness,0,1);
const binding=v=>closed(v,['pack','repeatMeters','rotation','normalScale'])&&closed(v.pack,['id','version'])&&SURFACE_MATERIAL_PACKS.some(p=>p.id===v.pack.id&&p.version===v.pack.version)&&Array.isArray(v.repeatMeters)&&v.repeatMeters.length===2&&v.repeatMeters.every(n=>finite(n,.05,20))&&finite(v.rotation,-Math.PI,Math.PI)&&finite(v.normalScale,0,2);
/** Opt-in only. Legacy scalar-only extension bytes keep their old format. */
export function selectedSurfaceMaterialPacks(revision){
 const value=revision?.extensions?.[MATERIAL_NAMESPACE];
 if(!object(value)||!Object.hasOwn(value,'surfaceTextures'))return [];
 const fail=()=>{throw Error('SURFACE_MATERIAL_INVALID');};
 if(!closed(value,['version','surfaces','surfaceTextures'])||value.version!==1||!object(value.surfaces)||!object(value.surfaceTextures)||new TextEncoder().encode(JSON.stringify(value)).length>16384)fail();
 const surfaces=Array.isArray(revision.surfaces)?revision.surfaces:[],used=new Set(),ids=new Set();
 for(const map of [value.surfaces,value.surfaceTextures]){
  const seen=new Set();
  for(const [id,entry] of Object.entries(map)){
   const surface=surfaces.find(s=>typeof s?.id==='string'&&s.id.toLowerCase()===id.toLowerCase());
   if(!uuid(id)||seen.has(id.toLowerCase())||!surface)fail();seen.add(id.toLowerCase());ids.add(id.toLowerCase());
   if(map===value.surfaces){if(!scalar(entry))fail();}
   else{if((surface.type!=='wall'&&surface.type!=='ceiling')||!binding(entry))fail();used.add(entry.pack.id);}
  }
 }
 if(ids.size>64)fail();
 return SURFACE_MATERIAL_PACKS.filter(p=>used.has(p.id));
}
export const SURFACE_MATERIAL_FILES=freeze(SURFACE_MATERIAL_PACKS.flatMap(pack=>[...Object.entries(pack.maps),['notice',pack.notice]].map(([role,file])=>({packId:pack.id,packVersion:pack.version,role,path:'resources/'+file.path,artifactPath:file.path,mime:file.mime,bytes:file.bytes,sha256:file.sha256}))).sort((a,b)=>a.path.localeCompare(b.path)));
export function packageSurfaceMaterialManifest(revision){
 const selected=new Set(selectedSurfaceMaterialPacks(revision).map(p=>p.id));
 return SURFACE_MATERIAL_FILES.filter(file=>selected.has(file.packId)).map(file=>({...file}));
}
export const surfaceMaterialNotice=pack=>{
 if(!SURFACE_MATERIAL_PACKS.includes(pack))throw Error('SURFACE_MATERIAL_DESCRIPTOR');
 return pack.noticeText;
};
