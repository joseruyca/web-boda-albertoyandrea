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
