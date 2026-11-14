export const ALBUM_MOMENTS=[['all','Todos los momentos'],['prewedding','Preboda'],['ceremony','Ceremonia'],['cocktail','Cóctel'],['dinner','Cena'],['party','Fiesta'],['other','Otros recuerdos']];
export const momentLabel=value=>ALBUM_MOMENTS.find(([id])=>id===value)?.[1]||'Otros recuerdos';
export const validMoment=value=>ALBUM_MOMENTS.slice(1).some(([id])=>id===value);
export function albumQuery({offset=0,scope='all',member='',moment='all',kind='all'}={}){const q=new URLSearchParams({offset:String(offset),scope,moment,kind});if(member)q.set('member',member);return '/api/album/feed?'+q;}
export const challengeOpen=c=>!!c?.is_open&&(!c.closes_at||Date.parse(c.closes_at)>Date.now());
export function groupedMemoryName(memory,mode='person'){const clean=v=>String(v||'Sin clasificar').replace(/[\\/\x00-\x1f]/g,'_').replace(/^\.+$/,'_').trim().slice(0,100);return clean(mode==='moment'?momentLabel(memory.moment):memory.author)+'/'+clean(memory.name||'recuerdo');}
