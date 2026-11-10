/** Bounded download: active slow transfers continue; stalled ones can be cancelled. */
export async function fetchOriginal(file,signal){
 const controller=new AbortController();const abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 let timer=setTimeout(abort,30000);const maximum=setTimeout(abort,1800000);const parts=[];let size=0;
 try{
  const response=await fetch(file.src||'/api/file/'+file.id,{signal:controller.signal});if(!response.ok)throw Error('No se pudo descargar '+file.name+'.');
  if(!response.body)throw Error('No se pudo leer el original.');const reader=response.body.getReader();
  for(;;){clearTimeout(timer);timer=setTimeout(abort,120000);const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>100*1024*1024){await reader.cancel();throw Error('El original supera el límite de esta descarga.');}parts.push(value);}
  if(Number(file.size)>0&&size!==Number(file.size))throw Error('La descarga de '+file.name+' quedó incompleta. Vuelve a intentarlo.');
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}return bytes.buffer;
 }catch(error){if(signal?.aborted)throw new DOMException('Descarga cancelada.','AbortError');if(controller.signal.aborted)throw Error('La descarga se ha detenido. Comprueba la conexión y vuelve a intentarlo.');throw error;}
 finally{clearTimeout(timer);clearTimeout(maximum);signal?.removeEventListener('abort',abort);}
}
