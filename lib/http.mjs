/** Read API JSON without leaving a screen waiting forever on a stalled connection.
 * @param {string} url
 * @param {RequestInit} init
 * @param {number} timeoutMs
 */
export async function requestJSON(url,init={},timeoutMs=20000){
 const controller=new AbortController();let timedOut=false;
 const abort=()=>controller.abort(init.signal?.reason);
 if(init.signal?.aborted)abort();else init.signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
 try{
  const response=await fetch(url,{...init,signal:controller.signal});
  let body;try{body=await response.json();}catch(error){if(controller.signal.aborted)throw error;throw Error('No se pudo leer la respuesta. Vuelve a intentarlo en unos instantes.');}
  if(!response.ok)throw Error(body?.error||'No se ha podido completar. Vuelve a intentarlo.');
  return body;
 }catch(error){
  if(timedOut)throw Error('La conexión está tardando demasiado. Comprueba tu conexión y vuelve a intentarlo.');
  if(init.signal?.aborted)throw error;
  if(error instanceof TypeError)throw Error('No hay conexión con la web. Comprueba tu conexión y vuelve a intentarlo.');
  throw error;
 }finally{clearTimeout(timer);init.signal?.removeEventListener('abort',abort);}
}
