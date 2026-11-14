import {albumApi,resolveAlbumMember} from './album.ts';
import { normalizeRsvp } from './rsvp.mjs';
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { defaults, validIban, normalizeIban, safePhoto } from './config.ts';
const BACKEND_HASH='2f045c4c0ef401ff495ca4f25e9e7f8c25ea60daa4e4daa585abd4297ca2a051';
const MAX=50*1024*1024;
const BUCKET='wedding-memories';
const MIME=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif','image/heic','image/heif','video/mp4','video/webm','video/quicktime']);
const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(v=>v.toString(16).padStart(2,'0')).join('');
const json=(v:unknown,s=200)=>Response.json(v,{status:s,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const text=(v:unknown,n=300)=>typeof v==='string'?v.trim().slice(0,n):'';
function requireOK(r:any){if(r.error)throw new Error(r.error.message||'Error de almacenamiento');return r.data;}
Deno.serve(async(req:Request)=>{
 try {
  if(req.method!=='POST'||await hash(req.headers.get('X-Wedding-Backend')||'')!==BACKEND_HASH)return json({error:'Acceso no permitido.'},403);
  if(Number(req.headers.get('content-length'))>1000000)return json({error:'Demasiados datos.'},413);
  const {path,method,body:b={},organizer=false,invitationToken='',albumToken='',uploaderId='',memberId='',networkKey='',thumbnail=false,download=false}=await req.json();
  const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
  const secret=secretKeys.default||Object.values(secretKeys)[0]||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const db=createClient(Deno.env.get('SUPABASE_URL')!,secret as string,{auth:{persistSession:false,autoRefreshToken:false}});
  const settings=async(key:string)=>requireOK(await db.from('wedding_settings').select('value').eq('key',key).maybeSingle())?.value;
  const savedConfig=await settings('wedding')||{};
  const cfg={...defaults,...savedConfig,dinner:{...defaults.dinner,...savedConfig.dinner},prewedding:{...defaults.prewedding,...savedConfig.prewedding}};
  const inv=invitationToken?requireOK(await db.from('invitations').select('*').eq('token_hash',await hash(invitationToken)).eq('revoked',false).maybeSingle()):null;
  const albumSettings=albumToken?await settings('album'):null;
  const albumAllowed=true; // The shared album is open to every visitor; invitations remain private.
  const uploadOwner=inv?'invite:'+inv.id:albumAllowed&&uploaderId?'album:'+await hash(uploaderId):organizer?'organizer':null;
  const uploadPlan=async(row:any,recover=false)=>{
   const leaf=row.object_key.split('/').pop(),folder=row.object_key.substring(0,row.object_key.lastIndexOf('/'));
   const objects=recover?requireOK(await db.storage.from(BUCKET).list(folder,{search:leaf,limit:10})):[];
   const stored=objects.find((object:any)=>object.name===leaf);
   if(stored&&(Number(stored.metadata?.size)!==Number(row.size)||!MIME.has(stored.metadata?.mimetype||row.mime)))throw Error('El original guardado no coincide con su reserva.');
   const signed=stored?null:requireOK(await db.storage.from(BUCKET).createSignedUploadUrl(row.object_key,{upsert:false}));
   const preview=objects.find((object:any)=>object.name===leaf+'.thumb.webp');let thumb:any=null;
   if(row.thumbnail_key&&!preview){const result=await db.storage.from(BUCKET).createSignedUploadUrl(row.thumbnail_key,{upsert:false});if(!result.error)thumb=result.data;}
   return {ok:true,id:row.id,stored:!!stored,thumbnailUploadUrl:thumb?.signedUrl,bucket:BUCKET,path:row.object_key,token:signed?.token,uploadUrl:signed?.signedUrl,transport:'signed-put'};
  };
  const limit=async(key:string,max:number,seconds:number)=>requireOK(await db.rpc('consume_wedding_limit',{p_key:key,p_limit:max,p_seconds:seconds}));
  const safeInvite=(i:any)=>({id:i.id,label:i.label,guests:i.guests,response:i.response?normalizeRsvp(i.response,i.guests.length):null});
  const {tables:_tables,tablesPublished:_published,...siteConfig}=cfg;
  if(path==='config'&&method==='GET')return json(inv||organizer?siteConfig:{...siteConfig,giftHolder:'',giftIban:''});
  if(path==='session'&&method==='POST'){
   const found=requireOK(await db.from('invitations').select('id,opened_at').eq('token_hash',await hash(text(b.token,100))).eq('revoked',false).maybeSingle());
   if(!found)return json({error:'Esta invitación no es válida. Pide a los novios tu enlace personal.'},401);
   if(!found.opened_at)requireOK(await db.from('invitations').update({opened_at:new Date().toISOString()}).eq('id',found.id).is('opened_at',null));
   return json({ok:true});
  }
  if(path==='album-session'&&method==='POST'){const a=await settings('album');if(!a||a.hash!==await hash(text(b.token,100)))return json({error:'Este acceso al álbum ya no está activo.'},401);return json({ok:true});}
  if(path==='me'&&method==='GET')return json({invitation:inv?safeInvite(inv):null,albumAccess:albumAllowed,admin:organizer});
  if(path==='rsvp'&&method==='POST'){
   if(!inv)return json({error:'Abre tu invitación personal para confirmar.'},401);
   if(!Array.isArray(b.attending)||b.attending.length!==inv.guests.length||b.attending.some((v:unknown)=>typeof v!=='boolean'))return json({error:'Indica la asistencia de cada persona de tu invitación.'},400);
   let response;try{response=normalizeRsvp(b,inv.guests.length);}catch(error){return json({error:(error as Error).message},400);}
   requireOK(await db.from('invitations').update({response,updated_at:new Date().toISOString()}).eq('id',inv.id));return json({ok:true,response});
  }
  const albumResponse=(path.startsWith('album/')||path.startsWith('admin/album/'))?await albumApi({db,path,method,body:b,inv,uploadOwner,memberId,organizer,limit}):null;if(albumResponse)return albumResponse;
  if(path==='media'&&method==='GET'){
   let q=db.from('wedding_media').select('id,name,mime,size,author,caption,approved,thumbnail_ready,hidden,created_at').eq('status','ready').order('created_at',{ascending:false}).order('id',{ascending:false}).range(Math.max(0,Math.floor(Number(b.offset)||0)),Math.max(0,Math.floor(Number(b.offset)||0))+60);
   if(!organizer)q=q.eq('hidden',false);
   const rows=requireOK(await q);return json({items:rows.slice(0,60).map((r:any)=>({...r,created:r.created_at,approved:1})),hasMore:rows.length>60});
  }
  if(path==='media/prepare'&&method==='POST'){
   if(!uploadOwner)return json({error:'Abre tu invitación o escanea el QR del álbum.'},401);
   const size=Number(b.size),mime=text(b.mime,80),name=text(b.name,150),author=inv?.label||text(b.author,80);
   if(!MIME.has(mime))return json({error:'Formato no compatible. Usa una foto o un vídeo MP4, MOV o WebM.'},415);
   if(!Number.isSafeInteger(size)||size<1||size>MAX)return json({error:'El archivo supera los 50 MB permitidos.'},413);
   if(!author)return json({error:'Indica tu nombre para acompañar los recuerdos.'},400);
   if(!await limit('upload:'+uploadOwner,60,600)||networkKey&&!await limit('network:'+networkKey,6000,600))return json({error:'Has compartido muchos archivos seguidos. Espera unos minutos y vuelve a intentarlo.'},429);
   const contentHash=/^[a-f0-9]{64}$/.test(b.contentHash)?b.contentHash:null;
   if(contentHash){const prior=requireOK(await db.from('wedding_media').select('*').eq('content_hash',contentHash).in('status',['reserved','ready']).maybeSingle());if(prior?.status==='ready')return json({ok:true,duplicate:true,id:prior.id});if(prior){if(prior.upload_owner===uploadOwner&&Number(prior.size)===size&&prior.mime===mime)return json(await uploadPlan(prior,true));if(Date.parse(prior.created_at)<Date.now()-86400000)requireOK(await db.from('wedding_media').update({status:'failed'}).eq('id',prior.id).eq('status','reserved'));else return json({error:'Este archivo ya se está subiendo. Espera a que termine.'},409);}}
   const quota=requireOK(await db.from('wedding_media').select('size').eq('upload_owner',uploadOwner).in('status',['reserved','ready']));
   if(quota.length>=200||quota.reduce((n:number,r:any)=>n+Number(r.size),0)+size>1024*1024*1024)return json({error:'Has alcanzado el límite de esta invitación. Contacta con los novios.'},429);
   const albumMember=b.memberId?await resolveAlbumMember(db,b.memberId,uploadOwner):null;
   if(b.memberId&&!albumMember)return json({error:'Selecciona un álbum personal de tu invitación.'},403);
   if(b.moment&&!['prewedding','ceremony','cocktail','dinner','party','other'].includes(b.moment))return json({error:'Momento no válido.'},400);
   const id=crypto.randomUUID();const key=`album/${inv?.id||'compartido'}/${id}`;
   const row={...(albumMember?{member_id:albumMember.id,moment:b.moment||'other'}:{}),id,invitation_id:inv?.id||null,upload_owner:uploadOwner,object_key:key,name:name||'recuerdo',mime,size,author:albumMember?.display_name||author,caption:text(b.caption,300),content_hash:contentHash,thumbnail_key:key+'.thumb.webp'};
   const inserted=await db.from('wedding_media').insert(row);if(inserted.error?.code==='23505')return json({error:'Este archivo ya está compartido o se está subiendo.'},409);requireOK(inserted);
   return json(await uploadPlan(row));
  }
  if(path==='media/resume'&&method==='POST'){
   if(!uploadOwner)return json({error:'Abre tu invitación para continuar.'},401);
   const row=requireOK(await db.from('wedding_media').select('*').eq('id',text(b.id,80)).eq('upload_owner',uploadOwner).eq('status','reserved').maybeSingle());
   if(!row)return json({error:'Esta subida ya no está disponible.'},404);
   return json(await uploadPlan(row,true));
  }
  if(path==='media/complete'&&method==='POST'){
   if(!uploadOwner)return json({error:'Abre tu invitación para completar la subida.'},401);
   const row=requireOK(await db.from('wedding_media').select('*').eq('id',text(b.id,80)).eq('upload_owner',uploadOwner).in('status',['reserved','ready']).maybeSingle());
   if(!row)return json({error:'Esta subida no está autorizada.'},403);
   const folder=row.object_key.substring(0,row.object_key.lastIndexOf('/'));const leaf=row.object_key.split('/').pop();
   const objects=requireOK(await db.storage.from(BUCKET).list(folder,{search:leaf,limit:10}));const object=objects.find((o:any)=>o.name===leaf);
   if(!object)return json({error:'El archivo aún no se ha terminado de subir.'},409);
   if(Number(object.metadata?.size)!==Number(row.size)||!MIME.has(object.metadata?.mimetype||row.mime))return json({error:'El archivo no coincide con la subida autorizada.'},400);
   const preview=objects.find((o:any)=>o.name===leaf+'.thumb.webp');const thumbnailReady=!!preview&&Number(preview.metadata?.size)<=400000&&preview.metadata?.mimetype==='image/webp';
   requireOK(await db.from('wedding_media').update({status:'ready',approved:true,thumbnail_ready:thumbnailReady}).eq('id',row.id));return json({ok:true,id:row.id,pending:false});
  }
  if(path==='media/cancel'&&method==='POST'){if(!uploadOwner)return json({error:'Subida no autorizada.'},401);const row=requireOK(await db.from('wedding_media').select('*').eq('id',text(b.id,80)).eq('upload_owner',uploadOwner).eq('status','reserved').maybeSingle());if(row){requireOK(await db.storage.from(BUCKET).remove([row.object_key,...(row.thumbnail_key?[row.thumbnail_key]:[])]));requireOK(await db.from('wedding_media').update({status:'failed'}).eq('id',row.id).eq('status','reserved'));}return json({ok:true});}
  if(path==='media/report'&&method==='POST'){if(!uploadOwner||!text(b.reason,500))return json({error:'Indica el motivo del aviso.'},400);if(!await limit('report:'+uploadOwner,10,3600))return json({error:'Has enviado varios avisos. Espera antes de enviar otro.'},429);const item=requireOK(await db.from('wedding_media').select('id').eq('id',text(b.id,80)).eq('status','ready').eq('hidden',false).maybeSingle());if(!item)return json({error:'El recuerdo ya no está disponible.'},404);requireOK(await db.from('wedding_media_reports').upsert({media_id:item.id,reporter_hash:await hash(uploadOwner),reason:text(b.reason,500),resolved:false},{onConflict:'media_id,reporter_hash'}));return json({ok:true});}
  if(path.startsWith('file/')&&method==='GET'){
   const row=requireOK(await db.from('wedding_media').select('*').eq('id',path.slice(5)).eq('status','ready').maybeSingle());
   if(!row||row.hidden&&!organizer&&row.upload_owner!==uploadOwner)return json({error:'No existe este recuerdo.'},404);
   const signed=requireOK(await db.storage.from(BUCKET).createSignedUrl(thumbnail&&row.thumbnail_ready&&row.thumbnail_key?row.thumbnail_key:row.object_key,900,{download:download?row.name:false}));return json({url:signed.signedUrl});
  }
  if(path.startsWith('admin/')){
   if(!organizer)return json({error:'Acceso reservado a los novios.'},403);
   if(path==='admin/reports'&&method==='GET')return json({items:requireOK(await db.from('wedding_media_reports').select('id,media_id,reason,resolved,created_at').order('created_at',{ascending:false}).limit(500))});
   if(path.startsWith('admin/reports/')&&method==='PATCH'){requireOK(await db.from('wedding_media_reports').update({resolved:true}).eq('id',path.split('/')[2]));return json({ok:true});}
   if(path==='admin/readiness'&&method==='GET'){
    const rows=requireOK(await db.from('wedding_media').select('id,name,mime,size,status,hidden,created_at,thumbnail_ready').in('status',['ready','reserved']).order('created_at',{ascending:true}).limit(10001));
    const sampled=rows.slice(0,10000),ready=sampled.filter((r:any)=>r.status==='ready'),reserved=sampled.filter((r:any)=>r.status==='reserved');
    return json({checkedAt:new Date().toISOString(),maxFileBytes:MAX,originalBytes:ready.reduce((n:number,r:any)=>n+Number(r.size||0),0),reservedBytes:reserved.reduce((n:number,r:any)=>n+Number(r.size||0),0),readyCount:ready.length,reservedCount:reserved.length,oldReservations:reserved.filter((r:any)=>Date.parse(r.created_at)<Date.now()-86400000).length,truncated:rows.length>10000,files:ready.map((r:any)=>({id:r.id,name:r.name,mime:r.mime,size:Number(r.size||0),hidden:!!r.hidden}))});
   }
   if(path==='admin/export'&&method==='GET')return json({format:'andrea-alberto-backup',version:1,exportedAt:new Date().toISOString(),config:cfg,invitations:requireOK(await db.from('invitations').select('*').order('created_at').limit(5000)),media:requireOK(await db.from('wedding_media').select('*').eq('status','ready').limit(10000)),reports:requireOK(await db.from('wedding_media_reports').select('*').limit(5000)),album:requireOK(await db.rpc('wedding_album_backup'))});
   if(path==='admin/restore'&&method==='POST'){const items=Array.isArray(b.items)?b.items:[];if(!items.length||items.length>300)return json({error:'Copia no válida.'},400);const existing=requireOK(await db.from('invitations').select('id').in('id',items.map((i:any)=>i.id)));const ids=new Set(existing.map((i:any)=>i.id));const rows=items.filter((i:any)=>!ids.has(i.id)).map((i:any)=>({id:i.id,label:text(i.label,120),guests:i.guests,phone:text(i.phone,30),token_hash:i.token_hash,token_ciphertext:i.token_ciphertext,response:i.response?normalizeRsvp(i.response,i.guests.length):null,revoked:i.revoked===true,table_no:null}));if(rows.length)requireOK(await db.from('invitations').insert(rows));return json({ok:true,restored:rows.length});}
   if(path==='admin/invitations'&&method==='GET')return json({items:requireOK(await db.from('invitations').select('*').order('created_at',{ascending:false}).limit(2000)).map((i:any)=>({...i,response:i.response?normalizeRsvp(i.response,i.guests.length):null}))});
   if(path==='admin/invitations'&&method==='POST'){
    const items=Array.isArray(b.items)?b.items:[];if(!items.length||items.length>300)return json({error:'Añade entre 1 y 300 invitaciones.'},400);
    const rows=items.map((i:any)=>{const guests=(Array.isArray(i.guests)?i.guests:[]).map((g:unknown)=>text(g,80)).filter(Boolean).slice(0,15);if(!guests.length||!/^\w{64}$/.test(i.token_hash)||!i.token_ciphertext)throw Error('Invitación no válida');return {label:text(i.label,120)||guests.join(' + '),guests,phone:text(i.phone,30).replace(/[^0-9+]/g,''),token_hash:i.token_hash,token_ciphertext:i.token_ciphertext};});
    const inserted=requireOK(await db.from('invitations').insert(rows).select('*'));return json({ok:true,items:inserted,...(!b.bulk?{token_ciphertext:inserted[0].token_ciphertext}:{})});
   }
   if(path.startsWith('admin/invitations/')&&method==='PATCH'){
    const id=path.split('/')[2];const update:Record<string,unknown>={updated_at:new Date().toISOString()};
    if(b.rotate){if(!b.token_hash||!b.token_ciphertext)return json({error:'Falta el enlace nuevo.'},400);update.token_hash=b.token_hash;update.token_ciphertext=b.token_ciphertext;update.revoked=false;}
    if('tableNo'in b)return json({error:'La asignación de mesas ya no forma parte de esta web.'},400);
    if('revoked'in b)update.revoked=!!b.revoked;
    if('sent'in b)update.sent_at=b.sent?new Date().toISOString():null;
    if('label'in b){if(!text(b.label,120))return json({error:'Añade un nombre a la invitación.'},400);update.label=text(b.label,120);}
    if('guests'in b){const current=requireOK(await db.from('invitations').select('*').eq('id',id).maybeSingle());const guests=(Array.isArray(b.guests)?b.guests:[]).map((g:any)=>text(g,80)).filter(Boolean);if(!guests.length||guests.length>15)return json({error:'Añade entre 1 y 15 nombres.'},400);if(current?.response&&guests.length!==current.guests.length)return json({error:'Esta invitación tiene respuesta. Puedes corregir los nombres manteniendo el mismo número de personas.'},409);update.guests=guests;}
    if('phone'in b)update.phone=text(b.phone,30).replace(/[^0-9+]/g,'');
    const row=requireOK(await db.from('invitations').update(update).eq('id',id).select('*').single());return json({ok:true,...(b.rotate?{token_ciphertext:row.token_ciphertext}:{})});
   }
   if(path==='admin/config'&&method==='PUT'){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||(b.deadline&&!/^\d{4}-\d{2}-\d{2}$/.test(b.deadline)))return json({error:'Revisa las fechas.'},400);

    if(b.prewedding?.date&&!/^\d{4}-\d{2}-\d{2}$/.test(b.prewedding.date))return json({error:'Revisa la fecha de la preboda.'},400);
    if(['startTime','endTime'].some(k=>b.prewedding?.[k]&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.prewedding[k])))return json({error:'Revisa el horario de la preboda.'},400);
    if(b.giftEnabled===true&&(!text(b.giftHolder,120)||!validIban(text(b.giftIban,50))))return json({error:'Revisa el titular y el IBAN antes de activar los regalos.'},400);
    const next={phase:['auto','before','during','after'].includes(b.phase)?b.phase:'auto',thankYou:text(b.thankYou,1000)||defaults.thankYou,story:(Array.isArray(b.story)?b.story:[]).slice(0,12).filter((m:any)=>safePhoto(text(m.photo,2000))).map((m:any)=>({photo:text(m.photo,2000),caption:text(m.caption,160),text:text(m.text,1000)})),practical:Object.fromEntries(['bus','accommodation','dressCode','contact'].map(k=>[k,text(b.practical?.[k],1000)])),faq:(Array.isArray(b.faq)?b.faq:[]).slice(0,15).map((f:any)=>({question:text(f.question,200),answer:text(f.answer,1000)})).filter((f:any)=>f.question&&f.answer),giftEnabled:b.giftEnabled===true,giftHolder:text(b.giftHolder,120),giftIban:normalizeIban(text(b.giftIban,50)),names:text(b.names,80),date:b.date,deadline:text(b.deadline,10),prewedding:b.prewedding?{venue:text(b.prewedding.venue,200),address:text(b.prewedding.address,300),mapUrl:/^https:\/\//.test(b.prewedding.mapUrl||'')?text(b.prewedding.mapUrl,1000):'',date:text(b.prewedding.date,10),startTime:text(b.prewedding.startTime,5),endTime:text(b.prewedding.endTime,5)}:cfg.prewedding,dinner:{venue:text(b.dinner?.venue,200),address:text(b.dinner?.address,300),mapUrl:/^https:\/\//.test(b.dinner?.mapUrl||'')?text(b.dinner.mapUrl,1000):'',menu:text(b.dinner?.menu,2000)},venue:text(b.venue,200),address:text(b.address,300),mapUrl:/^https:\/\//.test(b.mapUrl)?text(b.mapUrl,1000):'',tablesPublished:false,scheduleConfirmed:b.scheduleConfirmed===true,example:b.example===true,timeline:(b.timeline||defaults.timeline).slice(0,8).map((t:any)=>({time:text(t.time,20),title:text(t.title,80),detail:text(t.detail,200)})),tables:cfg.tables||defaults.tables};
    requireOK(await db.from('wedding_settings').upsert({key:'wedding',value:next}));return json({ok:true,config:next});
   }
   if(path==='admin/album-pass'&&method==='GET'){const row=await settings('album');return row?json({token_ciphertext:row.ciphertext}):json({error:'Todavía no se ha creado el QR del álbum.'},404);}
   if(path==='admin/album-pass'&&method==='POST'){if(!b.token_hash||!b.token_ciphertext)return json({error:'Falta el acceso nuevo.'},400);requireOK(await db.from('wedding_settings').upsert({key:'album',value:{hash:b.token_hash,ciphertext:b.token_ciphertext}}));return json({ok:true,token_ciphertext:b.token_ciphertext});}
   if(path.startsWith('admin/media/')&&method==='PATCH'){requireOK(await db.from('wedding_media').update('hidden'in b?{hidden:b.hidden===true}:{approved:true}).eq('id',path.split('/')[2]).eq('status','ready'));return json({ok:true});}
   if(path.startsWith('admin/media/')&&method==='DELETE'){const row=requireOK(await db.from('wedding_media').select('*').eq('id',path.split('/')[2]).maybeSingle());if(row){requireOK(await db.storage.from(BUCKET).remove([row.object_key,...(row.thumbnail_key?[row.thumbnail_key]:[])]));requireOK(await db.from('wedding_media').update({status:'deleted'}).eq('id',row.id));}return json({ok:true});}
  }
  return json({error:'No se encontró esta acción.'},404);
 }catch(e){console.error('wedding-api operation failed',e instanceof Error?e.message:'unknown');return json({error:'No se ha podido completar. Inténtalo de nuevo.'},500);}
});
