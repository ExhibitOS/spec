// SPDX-License-Identifier: Apache-2.0
import {pairedPortalFit} from './portal-finish-models.mjs';
const near=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<=1e-6;
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);

export function workspaceFitGeometry(descriptor){
 const {fit,model,kind}=descriptor??{};
 if(!object(fit)||Object.keys(fit).sort().join(',')!=='geometry,sourceBytes,sourceSha256,version'||fit.version!==1||
  fit.sourceSha256!==model?.sha256||fit.sourceBytes!==model?.bytes||!object(fit.geometry))return;
 const g=fit.geometry,keys=Object.keys(g).sort().join(',');
 if(kind==='artwork-frame'&&['straight-ring-v1','straight-miter-ring-v1'].includes(g.profile)&&keys==='imagePlaneZ,openingHeight,openingWidth,profile'&&
  finite(g.openingWidth,.4,2)&&finite(g.openingHeight,.4,2)&&g.imagePlaneZ===-.012)return g;
 if(kind==='portal-finish'&&modularPortalParts(g))return g;
 if(kind==='portal-finish'&&['continuous-portal-v1','rectangular-portal-v1'].includes(g.profile)&&keys==='maxZ,minZ,openingHeight,openingWidth,profile'&&
  finite(g.openingWidth,.9,3)&&finite(g.openingHeight,2,3.2)&&finite(g.minZ,-.15,-.015)&&finite(g.maxZ,.015,.15))return g;
}

/** The modular family has three closed reveal sections and two separate
 * three-section face trims. Roles are assigned by the source worker. */
export function modularPortalParts(g){
 if(!object(g)||g.profile!=='modular-portal-v1'||Object.keys(g).sort().join(',')!=='maxZ,minZ,openingHeight,openingWidth,parts,profile'||
  !finite(g.openingWidth,1.1,2.4)||!finite(g.openingHeight,2.2,3)||!finite(g.minZ,-.1,-.06)||!near(g.maxZ,-g.minZ)||!object(g.parts)||Object.keys(g.parts).length!==9)return false;
 const nodes=new Set(),half=g.openingWidth/2;
 for(const face of ['reveal','front','back'])for(const side of ['left','right','head']){
  const part=g.parts[face+'-'+side],trim=face==='reveal'?.025:.04;
  if(!object(part)||Object.keys(part).sort().join(',')!=='max,min,node'||!Number.isInteger(part.node)||part.node<0||part.node>8||nodes.has(part.node)||
   ![part.min,part.max].every(p=>Array.isArray(p)&&p.length===3&&p.every(n=>finite(n,-4,4))))return false;
  nodes.add(part.node);
  const x=side==='left'?[-half-trim,-half]:side==='right'?[half,half+trim]:[-half-trim,half+trim];
  const y=side==='head'?[g.openingHeight,g.openingHeight+trim]:[0,g.openingHeight];
  const z=face==='front'?[g.maxZ,g.maxZ+.006]:face==='back'?[g.minZ-.006,g.minZ]:[g.minZ,g.maxZ];
  if(![x,y,z].every(([min,max],axis)=>near(part.min[axis],min)&&near(part.max[axis],max)))return false;
 }
 return true;
}

export function qualifiedFrameTargetFit(geometry,width,height){
 if(!finite(width,.4,2)||!finite(height,.4,2))return;
 const clearance=.003;
 return {cornerX:(width+2*clearance-geometry.openingWidth)/2,cornerY:(height+2*clearance-geometry.openingHeight)/2};
}

/** A reusable continuous profile mounts on one plain, centred wall reveal. */
export function qualifiedPortalWallFit(geometry,opening,wall,finish,openings){
 if(typeof wall?.id!=='string'||opening.connectsToOpeningId!==undefined||finish?.preset!=='plain'||
  !near(geometry.minZ,-finish.depth/2)||!near(geometry.maxZ,finish.depth/2))return false;
 return portalRailsFit(geometry.openingWidth,geometry.openingHeight,.045,opening,wall,openings);
}

function portalRailsFit(openingWidth,openingHeight,surround,opening,wall,openings){
 if(typeof wall?.id!=='string')return false;
 const {width,height}=wall.dimensions??{},[x,y]=opening.offset??[];
 const halfWidth=openingWidth/2,halfHeight=openingHeight/2;
 if(![width,height,x,y].every(Number.isFinite)||Math.abs(x)+halfWidth+surround>width/2+1e-6||
  y+halfHeight+surround>height/2+1e-6||!Array.isArray(openings))return false;
 const left=x-halfWidth,right=x+halfWidth,bottom=y-halfHeight,top=y+halfHeight;
 const rails=[[left-surround,bottom,left,top],[right,bottom,right+surround,top],[left-surround,top,right+surround,top+surround]];
 for(const other of openings){
  if(other===opening||other?.id===opening.id||typeof other?.surfaceId!=='string'||other.surfaceId.toLowerCase()!==wall.id.toLowerCase())continue;
  const [ox,oy]=other.offset??[],ow=other.dimensions?.width,oh=other.dimensions?.height;
  if(![ox,oy,ow,oh].every(Number.isFinite)||ow<=0||oh<=0)return false;
  const [l,b,r,t]=[ox-ow/2,oy-oh/2,ox+ow/2,oy+oh/2];
  if(rails.some(([rl,rb,rr,rt])=>Math.min(r,rr)-Math.max(l,rl)>1e-6&&Math.min(t,rt)-Math.max(b,rb)>1e-6))return false;
 }
 return true;
}

/** A measured continuous U-section is fitted in the renderer, never by changing
 * its source or enlarging the host opening. Textured/decorated sections are not
 * admitted by this profile's binary producer. */
export function qualifiedRectangularPortalTarget(geometry,exhibition,openingId){
 if(!object(geometry)||geometry.profile!=='rectangular-portal-v1'||Object.keys(geometry).sort().join(',')!=='maxZ,minZ,openingHeight,openingWidth,profile'||!finite(geometry.openingWidth,.9,3)||!finite(geometry.openingHeight,2,3.2)||!finite(geometry.minZ,-.15,-.015)||!finite(geometry.maxZ,.015,.15)||typeof openingId!=='string'||!Array.isArray(exhibition?.openings)||!Array.isArray(exhibition?.surfaces))return;
 const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
 const rows=exhibition.openings.filter(o=>same(o?.id,openingId));
 if(rows.length!==1)return;
 const opening=rows[0],walls=exhibition.surfaces.filter(w=>same(w?.id,opening.surfaceId));
 if(walls.length!==1)return;
 const wall=walls[0],width=opening.dimensions?.width,height=opening.dimensions?.height;
 if(opening.type!=='door'||!finite(width,.9,3)||!finite(height,2,3.2)||!portalRailsFit(width,height,.045,opening,wall,exhibition.openings))return;
 if(opening.connectsToOpeningId!==undefined){
  if(!pairedPortalFit(exhibition,opening.id))return;
  const mate=exhibition.openings.find(o=>same(o?.id,opening.connectsToOpeningId)),mateWall=exhibition.surfaces.find(w=>same(w?.id,mate?.surfaceId));
  if(!portalRailsFit(width,height,.045,mate,mateWall,exhibition.openings))return;
  // Opposite 120 mm structure plus its 2 mm face finish, measured relative
  // to the Arrival wall. Preserve the approved asymmetric finished envelope.
  return {width,height,minZ:-.082,maxZ:.060};
 }
 const finishes=exhibition.extensions?.['org.exhibitos.studio/architectural-finishes'];
 if(!Array.isArray(finishes?.walls))return;
 const finishRows=finishes.walls.filter(f=>same(f?.surfaceId,wall.id));
 if(finishRows.length!==1||finishRows[0].preset!=='plain'||!finite(finishRows[0].depth,.03,.2))return;
 const depth=finishRows[0].depth;
 return {width,height,minZ:-depth/2,maxZ:depth/2};
}

/** Modular trim stays 40 mm wide. A reciprocal target reuses the measured
 * pale-host wall relationship rather than admitting arbitrary wall joins. */
export function qualifiedModularPortalTarget(geometry,exhibition,openingId){
 if(!modularPortalParts(geometry)||typeof openingId!=='string'||!Array.isArray(exhibition?.openings)||!Array.isArray(exhibition?.surfaces)||!Array.isArray(exhibition?.rooms))return;
 const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
 const opening=exhibition.openings.find(o=>same(o?.id,openingId)),wall=exhibition.surfaces.find(w=>same(w?.id,opening?.surfaceId));
 const width=opening?.dimensions?.width,height=opening?.dimensions?.height;
 if(opening?.type!=='door'||!finite(width,1.1,2.4)||!finite(height,2.2,3)||!portalRailsFit(width,height,.04,opening,wall,exhibition.openings))return;
 if(opening.connectsToOpeningId!==undefined){
  if(!pairedPortalFit(exhibition,opening.id))return;
  const mate=exhibition.openings.find(o=>same(o.id,opening.connectsToOpeningId)),mateWall=exhibition.surfaces.find(w=>same(w.id,mate?.surfaceId));
  if(!portalRailsFit(width,height,.04,mate,mateWall,exhibition.openings))return;
  return {width,height,minZ:-.08,maxZ:.06};
 }
 const finishes=exhibition.extensions?.['org.exhibitos.studio/architectural-finishes'];
 if(finishes!==undefined&&!Array.isArray(finishes?.walls))return;
 const finish=finishes?.walls.find(f=>same(f?.surfaceId,wall.id));
 const depth=finish?.depth??.2;
 if(finish&&finish.preset!=='plain'||!finite(depth,.12,.2))return;
 return {width,height,minZ:-depth/2,maxZ:depth/2};
}


export const FRAME_IMAGE_FIT_LIMITS=Object.freeze({edge:8192,pixels:25165824});
export const FRAME_IMAGE_CONTACT_EPSILON_METRES=1e-6;
const imageFitFail=code=>{throw Error(code);};
const imageFitKeys=['version','profile','sourceSha256','pixelWidth','pixelHeight'];
const imageFitEqual=(a,b)=>imageFitKeys.every(key=>a[key]===b[key]);
function checkedFrameImageFits(candidate){
 const value=candidate?.extensions?.['org.exhibitos.studio/workspace-furnishings'],rows=value?.frameAttachments??[],records=[];
 if(!Array.isArray(rows))return imageFitFail('FRAME_IMAGE_FIT_INVALID');
 for(const row of rows){
  if(!Object.hasOwn(row??{},'imageFit'))continue;
  const fit=row.imageFit;
  if(value.version!==10||!fit||typeof fit!=='object'||Array.isArray(fit)||Object.keys(fit).length!==imageFitKeys.length||!imageFitKeys.every(key=>Object.hasOwn(fit,key))||fit.version!==1||fit.profile!=='contain-contact-v1'||typeof fit.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(fit.sourceSha256)||![fit.pixelWidth,fit.pixelHeight].every(n=>Number.isInteger(n)&&n>0&&n<=FRAME_IMAGE_FIT_LIMITS.edge)||fit.pixelWidth*fit.pixelHeight>FRAME_IMAGE_FIT_LIMITS.pixels)return imageFitFail('FRAME_IMAGE_FIT_INVALID');
  const arts=candidate?.artworks?.filter(a=>a?.revisionId===row.artworkRevisionId)??[],placements=candidate?.placements?.filter(p=>p?.id===row.placementId)??[],art=arts[0],placement=placements[0],assets=art?.assets?.filter(a=>a?.id===row.assetId)??[],asset=assets[0];
  if(rows.filter(r=>r?.placementId===row.placementId).length!==1||arts.length!==1||placements.length!==1||art.artworkType!=='image'||art.primaryAssetId!==row.assetId||placement.artworkRevisionId!==row.artworkRevisionId||placement.assetId!==row.assetId||assets.length!==1||asset.mime!=='image/png'||asset.sha256!==fit.sourceSha256)return imageFitFail('FRAME_IMAGE_FIT_STALE');
  const sources=value.furnishings?.filter(s=>s?.id===row.furnishingId&&s?.version===row.furnishingVersion)??[],source=sources[0],geometry=source&&workspaceFitGeometry(source);
  if(sources.length!==1||source.kind!=='artwork-frame'||source.model?.sha256!==row.modelSha256||!geometry||!['straight-ring-v1','straight-miter-ring-v1'].includes(geometry.profile))return imageFitFail('FRAME_IMAGE_FIT_UNSUPPORTED');
  const width=art.dimensions?.width,height=art.dimensions?.height;
  if(!qualifiedFrameTargetFit(geometry,width,height))return imageFitFail('FRAME_IMAGE_FIT_UNSUPPORTED');
  const ratio=fit.pixelWidth/fit.pixelHeight,footprint=ratio>=width/height?{width,height:width/ratio}:{width:height*ratio,height};
  if(!qualifiedFrameTargetFit(geometry,footprint.width,footprint.height))return imageFitFail('FRAME_IMAGE_FIT_UNSUPPORTED');
  const prior=records.find(r=>r.art.revisionId===art.revisionId&&r.art.primaryAssetId===art.primaryAssetId);
  if(prior&&!imageFitEqual(prior.fit,fit))return imageFitFail('FRAME_IMAGE_FIT_CONFLICT');
  records.push({row,art,fit,geometry,footprint});
 }
 return records;
}
/** Gallery footprint is keyed by immutable artwork/primary, not loaded LOD or row order. */
export function frameImageFootprintForArtwork(candidate,artwork){
 const records=checkedFrameImageFits(candidate),record=records.find(r=>r.art.revisionId===artwork?.revisionId&&r.art.primaryAssetId===artwork?.primaryAssetId);
 if(!record)return;
 if(record.art.dimensions.width!==artwork.dimensions?.width||record.art.dimensions.height!==artwork.dimensions?.height)return imageFitFail('FRAME_IMAGE_FIT_STALE');
 return {...record.footprint};
}
/** Legacy rows retain their existing fit. Issued contact never adds a mat, crop or Z change. */
export function frameImageContactFit(candidate,attachment,artwork,geometry){
 const records=checkedFrameImageFits(candidate),record=records.find(r=>r.row.placementId===attachment?.placementId);
 if(!record){if(Object.hasOwn(attachment??{},'imageFit'))return imageFitFail('FRAME_IMAGE_FIT_STALE');return;}
 if(record.art.revisionId!==artwork?.revisionId||record.art.primaryAssetId!==artwork?.primaryAssetId||record.art.dimensions.width!==artwork.dimensions?.width||record.art.dimensions.height!==artwork.dimensions?.height||['artworkRevisionId','assetId','furnishingId','furnishingVersion','modelSha256'].some(k=>record.row[k]!==attachment[k])||!attachment.imageFit||!imageFitEqual(record.fit,attachment.imageFit)||!geometry||['profile','openingWidth','openingHeight','imagePlaneZ'].some(k=>record.geometry[k]!==geometry[k]))return imageFitFail('FRAME_IMAGE_FIT_STALE');
 return {cornerX:(record.footprint.width-geometry.openingWidth)/2,cornerY:(record.footprint.height-geometry.openingHeight)/2};
}
