// SPDX-License-Identifier: Apache-2.0
const legacy=Object.freeze({sha256:'385a3a6d5266a5dda5b3fc6e51fd14e0b990e29de66ee27a80b634a93ef2591b',bytes:164044,width:2.4,height:2.6,paired:false});
const pale=Object.freeze({sha256:'62fd3bc49e0e77ffde26f60dee7ddfbbac0939347d68ea53a94700de0695f1ae',bytes:2468,width:2.4,height:3,paired:true});
export function portalFinishModel(sha256,bytes){return [legacy,pale].find(model=>model.sha256===sha256&&model.bytes===bytes);}

const near=(a,b)=>typeof a==='number'&&Math.abs(a-b)<=1e-6;
const key=id=>typeof id==='string'?id.toLowerCase():undefined;
function single(rows,id){
 if(!id||!Array.isArray(rows))return undefined;
 const matching=rows.filter(row=>key(row?.id)===id);
 return matching.length===1?matching[0]:undefined;
}
function levelYaw(transform){
 const {position,rotation,scale}=transform??{};
 if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite)||!Array.isArray(scale)||scale.length!==3||!scale.every(n=>n===1)||!Array.isArray(rotation)||rotation.length!==4||!rotation.every(Number.isFinite)||rotation[0]!==0||rotation[2]!==0||!near(rotation[1]**2+rotation[3]**2,1))return undefined;
 return 2*Math.atan2(rotation[1],rotation[3]);
}
function rotate(x,z,yaw){return [x*Math.cos(yaw)+z*Math.sin(yaw),-x*Math.sin(yaw)+z*Math.cos(yaw)];}
function floorPose(doc,opening){
 if(opening?.type!=='door'||!near(opening.dimensions?.width,pale.width)||!near(opening.dimensions?.height,pale.height)||!Array.isArray(opening.offset)||opening.offset.length!==2||!opening.offset.every(Number.isFinite))return undefined;
 const wall=single(doc.surfaces,key(opening.surfaceId)),room=single(doc.rooms,key(wall?.roomId));
 if(wall?.type!=='wall')return undefined;
 const wallYaw=levelYaw(wall.transform),roomYaw=levelYaw(room?.transform);
 if(wallYaw===undefined||roomYaw===undefined)return undefined;
 const [ox,oz]=rotate(opening.offset[0],0,wallYaw),[wx,wy,wz]=wall.transform.position;
 const [x,z]=rotate(wx+ox,wz+oz,roomYaw),[rx,ry,rz]=room.transform.position;
 const floor=wy+opening.offset[1]-pale.height/2;
 if(!near(floor,0))return undefined;
 return {wallId:key(wall.id),roomId:key(room.id),x:x+rx,y:floor+ry,z:z+rz,yaw:wallYaw+roomYaw,wallYaw,wall,room};
}

function finishedDoorPair(doc,openingId){
 const id=key(openingId),opening=single(doc.openings,id),mateId=key(opening?.connectsToOpeningId);
 const mate=single(doc.openings,mateId);
 if(!mate||mateId===id||key(mate.connectsToOpeningId)!==id)return;
 const host=floorPose(doc,opening),other=floorPose(doc,mate);
 if(!host||!other||host.roomId===other.roomId||!near(host.y,other.y)||(Math.cos(host.yaw-other.yaw)>=0||!near(Math.sin(host.yaw-other.yaw),0)))return;
 const [x,z]=rotate(other.x-host.x,other.z-host.z,-host.yaw);
 if(!near(x,0))return;
 const finishes=doc.extensions?.['org.exhibitos.studio/architectural-finishes']?.walls;
 if(!Array.isArray(finishes))return;
 const own=finishes.filter(f=>key(f?.surfaceId)===host.wallId),opposite=finishes.filter(f=>key(f?.surfaceId)===other.wallId);
 if(own.length!==1||opposite.length!==1||!near(own[0].depth,.120)||own[0].preset!=='plain'||!near(opposite[0].depth,.120))return;
 return {host,other,opening,mate,x,z,own:own[0],opposite:opposite[0]};
}

/** The asymmetric reveal covers the existing measured inset wall faces. */
export function pairedPortalFit(doc,openingId){
 const pair=finishedDoorPair(doc,openingId);
 return !!pair&&near(pair.z,-.020)&&['painted-edge','dark-edge'].includes(pair.opposite.preset);
}

function isInwardRoomBoundary(side){
 const {wall,room,wallYaw}=side;
 const {width,height,depth}=room.dimensions??{};
 if(![width,height,depth].every(n=>Number.isFinite(n)&&n>0))return false;
 const {width:span,height:rise}=wall.dimensions??{};
 const [x,y,z]=wall.transform.position;
 const [nx,nz]=rotate(0,1,wallYaw);
 if(!near(rise,height)||!near(y,height/2))return false;
 if(near(Math.abs(nx),1)&&near(nz,0))return near(x,-Math.sign(nx)*width/2)&&near(z,0)&&near(span,depth);
 return near(Math.abs(nz),1)&&near(nx,0)&&near(z,-Math.sign(nz)*depth/2)&&near(x,0)&&near(span,width);
}

/** Both walls are complete room boundaries. Their matching cut must be inside
 * the physical overlap; either wall can continue past that overlap. */
export function coincidentPortalFit(doc,openingId){
 const pair=finishedDoorPair(doc,openingId);
 if(!pair||!near(pair.z,0)||pair.opposite.preset!=='painted-edge')return;
 const {host,other,opening,mate,x,z,own,opposite}=pair;
 if(Math.abs(Math.sin(host.yaw-other.yaw))>1e-9||!isInwardRoomBoundary(host)||!isInwardRoomBoundary(other)||
    !near(host.wall.dimensions.height,other.wall.dimensions.height)||
    !near(opening.dimensions.width,mate.dimensions.width)||
    !near(opening.dimensions.height,mate.dimensions.height)||
    !near(opening.offset[1],mate.offset[1]))return;
 const cuts=doc.openings.filter(row=>[host.wallId,other.wallId].includes(key(row?.surfaceId)));
 if(cuts.length!==2)return;
 // The opposite wall's local X runs backwards. Transform its center using
 // the coincident opening centers and intersect the two full wall spans.
 const center=opening.offset[0]+mate.offset[0]+x;
 const hostHalf=host.wall.dimensions.width/2,peerHalf=other.wall.dimensions.width/2;
 const hostSpan=[Math.max(-hostHalf,center-peerHalf),Math.min(hostHalf,center+peerHalf)];
 const peerSpan=[Math.max(-peerHalf,center-hostHalf),Math.min(peerHalf,center+hostHalf)];
 const covers=(span,cut)=>cut.offset[0]-cut.dimensions.width/2>=span[0]-1e-6&&
  cut.offset[0]+cut.dimensions.width/2<=span[1]+1e-6;
 if(!covers(hostSpan,opening)||!covers(peerSpan,mate))return;
 return {hostSurfaceId:host.wallId,peerSurfaceId:other.wallId,hostSpan,peerSpan,
  minZ:Math.min(-own.depth/2,z-opposite.depth/2),maxZ:Math.max(own.depth/2,z+opposite.depth/2)};
}
