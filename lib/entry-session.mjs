/** Keep an authenticated invitation when a later configuration read fails. */
export function parseEntry(hash='') {
 const h=new URLSearchParams(hash.replace(/^#/,''));
 let view='invitation',session=null;
 if(h.has('preview')||h.has('i')) {session={path:'session',data:{token:h.get(h.has('preview')?'preview':'i')}};view=h.get('view')==='gallery'?'gallery':'invitation';}
 else if(h.has('album')) {session={path:'album-session',data:{token:h.get('album')}};view='gallery';}
 else if(h.get('admin')) {session={path:'admin/session',data:{key:h.get('admin')}};view='admin';}
 else {const name=hash.replace(/^#/,'');if(['day','venue','rsvp','gallery','gift','admin'].includes(name))view=name;else if(name==='table')view='rsvp';}
 return {view,session,personal:h.has('i')||h.has('preview')};
}
/** @param {{entry:ReturnType<typeof parseEntry>,exchange:(path:string,data:object)=>Promise<unknown>,refresh:()=>Promise<unknown>,onAuthenticated?:(view:string)=>void}} options */
export function createEntryLoader({entry,exchange,refresh,onAuthenticated=()=>{}}) {
 let session=entry.session,running=null;
 return {
  get needsSession(){return !!session;},
  load(){
   if(running)return running;
   running=(async()=>{
    if(session){await exchange(session.path,session.data);session=null;onAuthenticated(entry.view);}
    return refresh();
   })().finally(()=>{running=null;});
   return running;
  }
 };
}
export function isRejectedInvitation(error){return [400,401,403,404,410].includes(error?.status);}
