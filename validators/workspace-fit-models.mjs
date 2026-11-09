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
export function qualifiedPortalWallFit(geometry,opening,wall,finish,openings){
 if(typeof wall?.id!=='string'||opening.connectsToOpeningId!==undefined||finish?.preset!=='plain'||
  !near(geometry.minZ,-finish.depth/2)||!near(geometry.maxZ,finish.depth/2))return false;
 const {width,height}=wall.dimensions??{},[x,y]=opening.offset??[];
 const surround=.045;
 const halfWidth=geometry.openingWidth/2,halfHeight=geometry.openingHeight/2;
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
