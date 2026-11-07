/** Invitation credentials stay in URL fragments, never in shared query strings. */
export function parseInvitationInput(value){
 let token=String(value||'').trim();
 if(!token)throw Error('Pega el enlace de tu invitación o introduce tu código.');
 if(token.length>2048)throw Error('Ese enlace es demasiado largo. Copia solo el enlace de la invitación.');
 if(token.includes('#')||/^https?:/i.test(token)){
  let url;try{url=new URL(token,'https://invitation.local');}catch{throw Error('No reconocemos ese enlace. Copia el enlace completo que recibiste.');}
  if(!['https:','http:'].includes(url.protocol))throw Error('Ese enlace no corresponde a una invitación.');
  const hash=new URLSearchParams(url.hash.slice(1));token=hash.get('i')||hash.get('preview')||'';
  if(!token)throw Error(hash.has('gallery')||url.hash==='#gallery'?'Ese es el álbum compartido. Para confirmar necesitas tu enlace personal.':'Ese enlace no contiene una invitación personal. Revisa el mensaje que recibiste.');
 }
 if(/^JOSE-/i.test(token)){token=token.toUpperCase().replace(/\s/g,'');if(!/^JOSE-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(token))throw Error('Revisa el código de prueba e inténtalo de nuevo.');return token;}
 if(!/^[A-Za-z0-9_-]{32}$/.test(token))throw Error('No reconocemos ese código. Lo más fácil es abrir el enlace que recibiste por WhatsApp.');
 return token;
}
export function invitationPass(person,token){
 if(!person?.invitation?.id||person.preview||!token||!/^[A-Za-z0-9_-]{32}$/.test(token))return null;
 return {token,label:person.invitation.label,guests:person.invitation.guests,preview:false};
}
export function isAlbumLink(value){try{const url=new URL(value);return url.hash==='#gallery'||new URLSearchParams(url.hash.slice(1)).get('view')==='gallery';}catch{return false;}}
