export const ALBUM_MOMENTS=[['all','Todos los momentos'],['prewedding','Preboda'],['ceremony','Ceremonia'],['cocktail','Cóctel'],['dinner','Cena'],['party','Fiesta'],['other','Otros recuerdos']];
export const momentLabel=value=>ALBUM_MOMENTS.find(([id])=>id===value)?.[1]||'Otros recuerdos';
export const validMoment=value=>ALBUM_MOMENTS.slice(1).some(([id])=>id===value);
export function albumQuery({offset=0,scope='all',member='',moment='all',kind='all'}={}){const q=new URLSearchParams({offset:String(offset),scope,moment,kind});if(member)q.set('member',member);return '/api/album/feed?'+q;}
export const challengeOpen=c=>!!c?.is_open&&(!c.closes_at||Date.parse(c.closes_at)>Date.now());
export function groupedMemoryName(memory,mode='person'){const clean=v=>String(v||'Sin clasificar').replace(/[\\/\x00-\x1f]/g,'_').replace(/^\.+$/,'_').trim().slice(0,100);return clean(mode==='moment'?momentLabel(memory.moment):memory.author)+'/'+clean(memory.name||'recuerdo');}

// Reuse a saved identity. Only a single invited guest can be selected without a choice.
export function automaticAlbumChoice({current,choices=[],members=[]}){
 if(current&&!choices.length)return null;
 if(current?.verified&&choices.some(c=>c.slot===current.slot&&c.name===current.name))return null;
 if(current?.verified&&current.slot&&choices.some(c=>c.slot===current.slot))return {slot:current.slot};
 if(choices.length===1)return {slot:choices[0].slot};
 if(!current&&!choices.length&&members.length===1)return {memberId:members[0].id};
 return null;
}

// Keep one or two rows per desktop page; mobile continues its natural feed.
export function desktopAlbumPageSize(width,height){
 if(width<=700)return 0;
 const canvas=Math.min(1280,width-(width<=1050?40:80));
 const content=canvas-(width<=1050?144:176);
 const columns=Math.max(2,Math.floor((content+18)/173));
 return columns*(height>=820?2:1);
}
export function albumPage(rows,index,size){
 const count=size?Math.max(1,Math.ceil(rows.length/size)):1;
 const page=Math.max(0,Math.min(count-1,Number.isFinite(index)?Math.floor(index):0));
 return {items:size?rows.slice(page*size,(page+1)*size):rows,page,count};
}
