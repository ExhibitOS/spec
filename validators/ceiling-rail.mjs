// SPDX-License-Identifier: Apache-2.0
// Passive visual attachment only. Actual quaternion components are used; no
// normalization, collision, electrical, emitter or physical-support inference.
const EPS=1e-6;
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const vector=(v,n)=>Array.isArray(v)&&v.length===n&&v.every(Number.isFinite);
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=EPS;
const unit=t=>vector(t?.position,3)&&vector(t?.rotation,4)&&vector(t?.scale,3)&&t.scale.every(n=>n===1)&&Math.abs(t.rotation.reduce((sum,n)=>sum+n*n,0)-1)<=EPS;
const level=t=>unit(t)&&Math.abs(t.rotation[0])<=EPS&&Math.abs(t.rotation[2])<=EPS;
const identity=()=>[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function multiply(a,b){return a.map(row=>b[0].map((_,j)=>row.reduce((sum,n,k)=>sum+n*b[k][j],0)));}
function pose(t){
 const [x,y,z,w]=t.rotation,[px,py,pz]=t.position;
 return [[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),px],
  [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),py],
  [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y),pz],[0,0,0,1]];
}
const point=(m,p)=>m.slice(0,3).map(row=>row[0]*p[0]+row[1]*p[1]+row[2]*p[2]+row[3]);
const corners=(lo,hi)=>[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>[x<0?lo[0]:hi[0],y<0?lo[1]:hi[1],z<0?lo[2]:hi[2]])));

/** Mathematical row/column matrix with column vectors. It is internal numeric
 * derivation, not a serialized matrix field. Inputs must satisfy the v8 schema. */
export function ceilingRailAttachmentMatrix(surface,attachment){
 const translation=identity();translation[0][3]=attachment.anchor[0];translation[1][3]=attachment.anchor[1];translation[2][3]=attachment.gap;
 const c=Math.cos(attachment.yaw),s=Math.sin(attachment.yaw),rz=[[c,-s,0,0],[s,c,0,0],[0,0,1,0],[0,0,0,1]],rx=[[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]];
 const local=multiply(multiply(translation,rz),rx);
 return {local,matrix:multiply(pose(surface.transform),local)};
}
export function ceilingRailDerivedPose(matrix){
 let yaw=Math.atan2(-matrix[2][0],matrix[0][0]);if(yaw>=Math.PI)yaw-=2*Math.PI;
 if(Object.is(yaw,-0))yaw=0;
 return {position:matrix.slice(0,3).map(row=>Object.is(row[3],-0)?0:row[3]),yaw,scale:1};
}
export function passiveCeilingRailGeometry(g){
 return g&&g.profile==='passive-ceiling-rail-v1'&&Object.keys(g).sort().join(',')==='max,min,profile'&&[g.min,g.max].every(p=>vector(p,3)&&p.every(n=>Math.abs(n)<=100))&&g.min.every((n,i)=>n<g.max[i])&&Math.abs(g.max[1])<=EPS&&g.min[1]<-EPS;
}
export function validateCeilingRailAttachments(value,exhibition){
 const errors=[],add=(code,path,message)=>errors.push({code,path,message});
 const descriptors=new Map(value.furnishings.map(item=>[item.id,item]));
 const rails=value.placements.filter(p=>descriptors.get(p.furnishingId)?.kind==='ceiling-rail');
 const seen=new Set();
 for(const [i,a]of value.ceilingAttachments.entries()){
  const path='/ceilingAttachments/'+i,placements=value.placements.filter(p=>same(p.id,a.placementId)),p=placements[0];
  if(seen.has(a.placementId)||placements.length!==1||descriptors.get(p?.furnishingId)?.kind!=='ceiling-rail'){add('CEILING_RAIL_BIJECTION',path,'One attachment is required for each rail placement and no other placement');continue;}
  seen.add(a.placementId);
  const surfaces=(Array.isArray(exhibition.surfaces)?exhibition.surfaces:[]).filter(s=>same(s?.id,a.surfaceId)),surface=surfaces[0];
  const rooms=exhibition.rooms.filter(r=>same(r?.id,surface?.roomId)),room=rooms[0],d=room?.dimensions,sd=surface?.dimensions;
  if(surfaces.length!==1||surface.type!=='ceiling'||rooms.length!==1||!same(p.roomId,room.id)){add('CEILING_RAIL_TARGET',path,'The unique selected ceiling determines the existing placement room');continue;}
  if(!d||![d.width,d.height,d.depth].every(n=>Number.isFinite(n)&&n>0)||!sd||![sd.width,sd.height].every(n=>Number.isFinite(n)&&n>0)||!level(room.transform)||!unit(surface.transform)||p.scale!==1||!Number.isFinite(p.yaw)||p.yaw< -Math.PI||p.yaw>=Math.PI||!Number.isFinite(a.yaw)||a.yaw< -Math.PI||a.yaw>=Math.PI){add('CEILING_RAIL_TRANSFORM',path,'Finite level room, unit-scale transforms and canonical yaw are required');continue;}
  const surfaceMatrix=pose(surface.transform);
  if(!close(surfaceMatrix[0][2],0)||!close(surfaceMatrix[1][2],-1)||!close(surfaceMatrix[2][2],0)||[-1,1].some(x=>[-1,1].some(y=>!close(point(surfaceMatrix,[x*sd.width/2,y*sd.height/2,0])[1],d.height)))){add('CEILING_RAIL_CEILING',path,'The actual ceiling +Z must face down and all four corners be at room height');continue;}
  const geometry=descriptors.get(p.furnishingId)?.fit?.geometry;
  if(!passiveCeilingRailGeometry(geometry)){add('CEILING_RAIL_SOURCE',path,'Measured source-bound rail bounds required');continue;}
  const {min,max}=geometry;
  const {local,matrix}=ceilingRailAttachmentMatrix(surface,a),c=Math.cos(p.yaw),s=Math.sin(p.yaw),stored=[[c,0,s,p.position[0]],[0,1,0,p.position[1]],[-s,0,c,p.position[2]],[0,0,0,1]];
  if(matrix.some((row,r)=>row.some((n,col)=>!close(n,stored[r][col])))){add('CEILING_RAIL_POSE',path,'All16 matrix components must reconstruct the stored unit placement');continue;}
  if(corners(min,max).some(corner=>{
   const ceiling=point(local,corner),placed=point(matrix,corner);
   return [...ceiling,...placed].some(n=>!Number.isFinite(n))||Math.abs(ceiling[0])>sd.width/2+EPS||Math.abs(ceiling[1])>sd.height/2+EPS||Math.abs(placed[0])>d.width/2+EPS||placed[1]< -EPS||placed[1]>d.height+EPS||Math.abs(placed[2])>d.depth/2+EPS;
  }))add('CEILING_RAIL_BOUNDS',path,'All eight nominal rail corners must fit the ceiling footprint and room');
 }
 for(const p of rails)if(!seen.has(p.id))add('CEILING_RAIL_BIJECTION','/ceilingAttachments','Every rail placement requires exactly one ceiling attachment');
 return errors;
}
