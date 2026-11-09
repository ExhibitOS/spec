// SPDX-License-Identifier: Apache-2.0
const near=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<=1e-6;
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);

export function workspaceFitGeometry(descriptor){
 const {fit,model,kind}=descriptor??{};
 if(!object(fit)||Object.keys(fit).sort().join(',')!=='geometry,sourceBytes,sourceSha256,version'||fit.version!==1||
  fit.sourceSha256!==model?.sha256||fit.sourceBytes!==model?.bytes||!object(fit.geometry))return;
 const g=fit.geometry,keys=Object.keys(g).sort().join(',');
 if(kind==='artwork-frame'&&g.profile==='straight-ring-v1'&&keys==='imagePlaneZ,openingHeight,openingWidth,profile'&&
  finite(g.openingWidth,.4,2)&&finite(g.openingHeight,.4,2)&&g.imagePlaneZ===-.012)return g;
 if(kind==='portal-finish'&&g.profile==='continuous-portal-v1'&&keys==='maxZ,minZ,openingHeight,openingWidth,profile'&&
  finite(g.openingWidth,.9,3)&&finite(g.openingHeight,2,3.2)&&finite(g.minZ,-.15,-.015)&&finite(g.maxZ,.015,.15))return g;
}

export function qualifiedFrameTargetFit(geometry,width,height){
 if(!finite(width,.4,2)||!finite(height,.4,2))return;
 const clearance=.003;
 return {cornerX:(width+2*clearance-geometry.openingWidth)/2,cornerY:(height+2*clearance-geometry.openingHeight)/2};
}

/** A reusable continuous profile mounts on one plain, centred wall reveal. */
export function qualifiedPortalWallFit(geometry,opening,wall,finish){
 if(opening.connectsToOpeningId!==undefined||finish?.preset!=='plain'||
  !near(geometry.minZ,-finish.depth/2)||!near(geometry.maxZ,finish.depth/2))return false;
 const {width,height}=wall.dimensions??{},[x,y]=opening.offset??[];
 const surround=.045;
 return [width,height,x,y].every(Number.isFinite)&&Math.abs(x)+geometry.openingWidth/2+surround<=width/2+1e-6&&
  y+geometry.openingHeight/2+surround<=height/2+1e-6;
}
