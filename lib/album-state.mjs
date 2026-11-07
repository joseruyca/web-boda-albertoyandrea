export const MAX_SELECTION=30;
export function mergeMemories(current,incoming){const seen=new Set(current.map(item=>item.id));return [...current,...incoming.filter(item=>{if(!item?.id||seen.has(item.id))return false;seen.add(item.id);return true;})];}
export function toggleMemorySelection(selected,id){if(selected.includes(id))return selected.filter(value=>value!==id);return selected.length<MAX_SELECTION?[...selected,id]:selected;}
export function albumEmptyMessage(filter){return filter==='video'?'Todavía no hay vídeos.':filter==='image'?'Todavía no hay fotos.':'Aquí empieza nuestro álbum.';}
