const MOMENTS=new Set(['prewedding','ceremony','cocktail','dinner','party','other']);
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const clean=(v:unknown,n=300)=>typeof v==='string'?v.trim().slice(0,n):'';
const ok=(r:any)=>{if(r.error)throw Error(r.error.message);return r.data;};
const out=(b:unknown,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store'}});
export async function resolveAlbumMember(db:any,id:unknown,owner:string|null){return uuid(id)&&owner?ok(await db.from('wedding_album_members').select('id,display_name,invitation_id,slot').eq('id',id).eq('owner_key',owner).maybeSingle()):null;}
export async function albumApi(c:any){
 const {db,path,method,body:b,inv,uploadOwner:owner,memberId,organizer,limit}=c;
 if(!path.startsWith('album/')&&!path.startsWith('admin/album/'))return null;
 const member=await resolveAlbumMember(db,memberId,owner);
 const verified=!!inv&&/^guest:\d+$/.test(member?.slot||'');
 const offset=Math.max(0,Math.min(100000,Math.floor(Number(b.offset)||0)));
 const stats=async(rows:any[])=>{if(!rows.length)return [];const data=ok(await db.rpc('wedding_album_stats',{p_ids:rows.map(r=>r.id),p_member:member?.id||null}));const by=new Map(data.map((s:any)=>[s.media_id,s]));return rows.map(r=>{const s:any=by.get(r.id);return {...r,author:r.person?.display_name||r.author,person:undefined,created:r.created_at,likes:Number(s?.likes||0),liked:!!s?.liked,own:r.member_id===member?.id};});};
 const rpc=async(name:string,args:any)=>{const r=await db.rpc(name,args);if(r.error){if(/^(Identifícate|El recuerdo|Selecciona|Este reto|Elige una foto|Tu foto|Para votar|Para participar|La votación|No puedes)/.test(r.error.message))return out({error:r.error.message},409);throw Error(r.error.message);}return r.data;};
 if(path==='album/identity'&&method==='GET')return out({current:member?{id:member.id,name:member.display_name,verified}:null,members:owner?ok(await db.from('wedding_album_members').select('id,display_name,slot').eq('owner_key',owner).order('created_at')):[],choices:inv?inv.guests.map((name:string,i:number)=>({slot:'guest:'+i,name})):[],canVote:!!inv});
 if(path==='album/identity'&&method==='POST'){
  if(!owner)return out({error:'Actualiza el álbum para identificarte.'},401);
  if(!await limit('album-profile:'+owner,30,3600))return out({error:'Espera unos minutos antes de cambiar de perfil.'},429);
  if(b.memberId){const selected=await resolveAlbumMember(db,b.memberId,owner);return selected?out({current:{id:selected.id,name:selected.display_name,verified:!!inv&&/^guest:\d+$/.test(selected.slot)}}):out({error:'Ese álbum personal no pertenece a este acceso.'},403);}
  const n=Number(String(b.slot||'').replace(/^guest:/,''));const name=inv&&/^guest:\d+$/.test(b.slot)&&Number.isInteger(n)?clean(inv.guests[n],120):!inv?clean(b.name,80):'';
  if(!name)return out({error:inv?'Elige una persona de tu invitación.':'Indica tu nombre para crear tu álbum.'},400);
  const row=ok(await db.from('wedding_album_members').upsert({owner_key:owner,slot:inv?'guest:'+n:'visitor',display_name:name,invitation_id:inv?.id||null},{onConflict:'owner_key,slot'}).select('id,display_name').single());
  return out({current:{id:row.id,name:row.display_name,verified:!!inv}});
 }
 if(path==='album/people'&&method==='GET'){const rows=ok(await db.rpc('wedding_album_people',{p_offset:offset,p_search:clean(b.search,100)}));return out({items:rows.slice(0,60),hasMore:rows.length>60});}
 if(path==='album/moments'&&method==='GET')return out({items:ok(await db.rpc('wedding_album_moments'))});
 if(path==='album/feed'&&method==='GET'){
  if(b.scope==='admin'&&!organizer)return out({error:'Acceso reservado a los novios.'},403);
  if(b.scope==='mine'&&!member)return out({items:[],hasMore:false,needsIdentity:true});
  let q=db.from('wedding_media').select('id,name,mime,size,author,caption,approved,thumbnail_ready,hidden,created_at,member_id,moment,person:wedding_album_members!wedding_media_member_id_fkey(display_name)').eq('status','ready');
  if(b.scope==='mine')q=q.eq('member_id',member.id);else if(b.scope!=='admin')q=q.eq('hidden',false);
  if(b.member){if(!uuid(b.member))return out({error:'Álbum no válido.'},400);q=q.eq('member_id',b.member);}
  if(b.moment&&b.moment!=='all'){if(!MOMENTS.has(b.moment))return out({error:'Momento no válido.'},400);q=q.eq('moment',b.moment);}
  if(['image','video'].includes(b.kind))q=q.like('mime',b.kind+'/%');
  const rows=ok(await q.order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+60));return out({items:await stats(rows.slice(0,60)),hasMore:rows.length>60});
 }
 if(path==='album/like'&&method==='PUT'){
  if(!member)return out({error:'Selecciona tu nombre antes de dar un corazón.'},401);
  if(!uuid(b.id)||typeof b.liked!=='boolean')return out({error:'Reacción no válida.'},400);
  if(!await limit('album-like:'+member.id,180,600))return out({error:'Espera un momento antes de seguir reaccionando.'},429);
  const r=await rpc('wedding_album_react',{p_media:b.id,p_member:member.id,p_owner:owner,p_liked:b.liked});if(r instanceof Response)return r;
  return out({ok:true,...ok(await db.rpc('wedding_album_stats',{p_ids:[b.id],p_member:member.id}))[0]});
 }
 if(path.startsWith('album/media/')&&method==='PATCH'){
  const id=path.split('/')[2];if(!member||!uuid(id))return out({error:'Selecciona tu álbum personal.'},401);
  const row=ok(await db.from('wedding_media').select('id').eq('id',id).eq('upload_owner',owner).eq('member_id',member.id).eq('status','ready').maybeSingle());if(!row)return out({error:'Solo puedes modificar tus recuerdos.'},403);
  const patch:any={};if('caption'in b)patch.caption=clean(b.caption,300);if('moment'in b){if(!MOMENTS.has(b.moment))return out({error:'Elige un momento válido.'},400);patch.moment=b.moment;}if('hidden'in b)patch.hidden=b.hidden===true;
  if(!Object.keys(patch).length)return out({error:'No hay cambios.'},400);
  ok(await db.from('wedding_media').update(patch).eq('id',id));return out({ok:true});
 }
 if(path==='album/challenges'&&method==='GET'){
  const rows=ok(await db.from('wedding_album_challenges').select('id,title,description,is_open,closes_at,winner_entry_id').order('created_at').order('id'));
  return out({items:rows,canVote:verified});
 }
 const challengeMatch=path.match(/^album\/challenges\/([a-z0-9_-]{1,60})$/);
 if(challengeMatch&&method==='GET'){
  const challenge=ok(await db.from('wedding_album_challenges').select('id,title,description,is_open,closes_at,winner_entry_id').eq('id',challengeMatch[1]).maybeSingle());if(!challenge)return out({error:'Este reto no existe.'},404);
  const rows=ok(await db.rpc('wedding_challenge_results',{p_challenge:challenge.id,p_member:member?.id||null,p_offset:offset}));
  const own=member?ok(await db.from('wedding_challenge_entries').select('id,media_id').eq('challenge_id',challenge.id).eq('member_id',member.id).maybeSingle()):null;
  return out({challenge,items:rows.slice(0,60),hasMore:rows.length>60,own,canVote:verified});
 }
 if(path==='album/entry'&&method==='POST'){
  if(!verified)return out({error:'Para participar en los premios, abre tu invitación personal y elige tu nombre.'},401);
  if(!member||!uuid(b.mediaId))return out({error:'Selecciona tu nombre y una foto de tu álbum.'},400);
  if(!await limit('album-entry:'+member.id,30,3600))return out({error:'Espera antes de cambiar otra candidatura.'},429);
  const r=await rpc('wedding_submit_entry',{p_challenge:clean(b.challengeId,60),p_media:b.mediaId,p_member:member.id,p_owner:owner});return r instanceof Response?r:out({ok:true,id:r});
 }
 if(path==='album/entry'&&method==='DELETE'){
  if(!member)return out({error:'Selecciona tu nombre.'},401);
  ok(await db.from('wedding_challenge_entries').delete().eq('challenge_id',clean(b.challengeId,60)).eq('member_id',member.id));return out({ok:true});
 }
 if(path==='album/vote'&&method==='PUT'){
  if(!verified)return out({error:'Para votar, abre tu invitación personal y elige tu nombre.'},401);
  if(!uuid(b.entryId)||typeof b.remove!=='boolean')return out({error:'Voto no válido.'},400);
  if(!await limit('album-vote:'+member.id,90,600))return out({error:'Espera un momento antes de seguir votando.'},429);
  const r=await rpc('wedding_vote_entry',{p_challenge:clean(b.challengeId,60),p_entry:b.entryId,p_member:member.id,p_owner:owner,p_remove:b.remove});return r instanceof Response?r:out({ok:true});
 }
 if(path.startsWith('admin/album/')){
  if(!organizer)return out({error:'Acceso reservado a los novios.'},403);
  if(path==='admin/album/challenges'&&method==='GET')return out({items:ok(await db.from('wedding_album_challenges').select('*').order('created_at'))});
  if(path==='admin/album/challenges'&&method==='POST'){
   const title=clean(b.title,100);if(!title)return out({error:'Añade un título.'},400);
   const id='reto-'+crypto.randomUUID().slice(0,8);ok(await db.from('wedding_album_challenges').insert({id,title,description:clean(b.description,300)}));return out({ok:true,id});
  }
  const match=path.match(/^admin\/album\/challenges\/([a-z0-9_-]{1,60})$/);
  if(match&&method==='PATCH'){
   const patch:any={};if('title'in b){if(!clean(b.title,100))return out({error:'Añade un título.'},400);patch.title=clean(b.title,100);}if('description'in b)patch.description=clean(b.description,300);if('is_open'in b)patch.is_open=b.is_open===true;
   if('closes_at'in b){if(b.closes_at&&!Number.isFinite(Date.parse(b.closes_at)))return out({error:'Fecha de cierre no válida.'},400);patch.closes_at=b.closes_at?new Date(b.closes_at).toISOString():null;}
   if('winner_entry_id'in b){if(b.winner_entry_id){if(!uuid(b.winner_entry_id))return out({error:'Candidatura no válida.'},400);const e=ok(await db.from('wedding_challenge_entries').select('id').eq('id',b.winner_entry_id).eq('challenge_id',match[1]).maybeSingle());if(!e)return out({error:'La candidatura no pertenece al reto.'},400);}patch.winner_entry_id=b.winner_entry_id||null;}
   if(!Object.keys(patch).length)return out({error:'No hay cambios.'},400);ok(await db.from('wedding_album_challenges').update(patch).eq('id',match[1]));return out({ok:true});
  }
 }
 return out({error:'Operación de álbum no disponible.'},404);
}
