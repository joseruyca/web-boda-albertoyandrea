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
  const {path,method,body:b={},organizer=false,invitationToken='',albumToken='',uploaderId='',download=false}=await req.json();
  const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
  const secret=secretKeys.default||Object.values(secretKeys)[0]||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const db=createClient(Deno.env.get('SUPABASE_URL')!,secret as string,{auth:{persistSession:false,autoRefreshToken:false}});
  const settings=async(key:string)=>requireOK(await db.from('wedding_settings').select('value').eq('key',key).maybeSingle())?.value;
  const cfg={...defaults,...(await settings('wedding')||{})};
  const inv=invitationToken?requireOK(await db.from('invitations').select('*').eq('token_hash',await hash(invitationToken)).eq('revoked',false).maybeSingle()):null;
  const albumSettings=albumToken?await settings('album'):null;
  const albumAllowed=true; // The shared album is open to every visitor; invitations remain private.
  const uploadOwner=inv?'invite:'+inv.id:albumAllowed&&uploaderId?'album:'+await hash(uploaderId):organizer?'organizer':null;
  const safeInvite=(i:any)=>({id:i.id,label:i.label,guests:i.guests,response:i.response,tableNo:cfg.tablesPublished?i.table_no:null});
  if(path==='config'&&method==='GET')return json(inv||organizer?cfg:{...cfg,giftHolder:'',giftIban:''});
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
   const response={attending:b.attending,allergies:text(b.allergies,1000),bus:b.attending.some(Boolean)&&b.bus===true,song:text(b.song,200),note:text(b.note,1000)};
   requireOK(await db.from('invitations').update({response,updated_at:new Date().toISOString()}).eq('id',inv.id));return json({ok:true,response});
  }
  if(path==='media'&&method==='GET'){
   let q=db.from('wedding_media').select('id,name,mime,size,author,caption,approved,created_at').eq('status','ready').order('created_at',{ascending:false}).order('id',{ascending:false}).range(Math.max(0,Math.floor(Number(b.offset)||0)),Math.max(0,Math.floor(Number(b.offset)||0))+60);
   const rows=requireOK(await q);return json({items:rows.slice(0,60).map((r:any)=>({...r,created:r.created_at,approved:1})),hasMore:rows.length>60});
  }
  if(path==='media/prepare'&&method==='POST'){
   if(!uploadOwner)return json({error:'Abre tu invitación o escanea el QR del álbum.'},401);
   const size=Number(b.size),mime=text(b.mime,80),name=text(b.name,150),author=inv?.label||text(b.author,80);
   if(!MIME.has(mime))return json({error:'Formato no compatible. Usa una foto o un vídeo MP4, MOV o WebM.'},415);
   if(!Number.isSafeInteger(size)||size<1||size>MAX)return json({error:'El archivo supera los 50 MB permitidos.'},413);
   if(!author)return json({error:'Indica tu nombre para acompañar los recuerdos.'},400);
   const quota=requireOK(await db.from('wedding_media').select('size').eq('upload_owner',uploadOwner).in('status',['reserved','ready']));
   if(quota.length>=200||quota.reduce((n:number,r:any)=>n+Number(r.size),0)+size>1024*1024*1024)return json({error:'Has alcanzado el límite de esta invitación. Contacta con los novios.'},429);
   const id=crypto.randomUUID();const key=`album/${inv?.id||'compartido'}/${id}`;
   const row={id,invitation_id:inv?.id||null,upload_owner:uploadOwner,object_key:key,name:name||'recuerdo',mime,size,author,caption:text(b.caption,300)};
   requireOK(await db.from('wedding_media').insert(row));
   const signed=requireOK(await db.storage.from(BUCKET).createSignedUploadUrl(key,{upsert:false}));
   return json({ok:true,id,bucket:BUCKET,path:key,token:signed.token,uploadUrl:signed.signedUrl,transport:'signed-put',endpoint:Deno.env.get('SUPABASE_URL')!.replace('.supabase.co','.storage.supabase.co')+'/storage/v1/upload/resumable'});
  }
  if(path==='media/resume'&&method==='POST'){
   if(!uploadOwner)return json({error:'Abre tu invitación para continuar.'},401);
   const row=requireOK(await db.from('wedding_media').select('*').eq('id',text(b.id,80)).eq('upload_owner',uploadOwner).eq('status','reserved').maybeSingle());
   if(!row)return json({error:'Esta subida ya no está disponible.'},404);
   const signed=requireOK(await db.storage.from(BUCKET).createSignedUploadUrl(row.object_key,{upsert:false}));
   return json({ok:true,id:row.id,bucket:BUCKET,path:row.object_key,token:signed.token,uploadUrl:signed.signedUrl,transport:'signed-put',endpoint:Deno.env.get('SUPABASE_URL')!.replace('.supabase.co','.storage.supabase.co')+'/storage/v1/upload/resumable'});
  }
  if(path==='media/complete'&&method==='POST'){
   if(!uploadOwner)return json({error:'Abre tu invitación para completar la subida.'},401);
   const row=requireOK(await db.from('wedding_media').select('*').eq('id',text(b.id,80)).eq('upload_owner',uploadOwner).in('status',['reserved','ready']).maybeSingle());
   if(!row)return json({error:'Esta subida no está autorizada.'},403);
   const folder=row.object_key.substring(0,row.object_key.lastIndexOf('/'));const leaf=row.object_key.split('/').pop();
   const objects=requireOK(await db.storage.from(BUCKET).list(folder,{search:leaf,limit:10}));const object=objects.find((o:any)=>o.name===leaf);
   if(!object)return json({error:'El archivo aún no se ha terminado de subir.'},409);
   if(Number(object.metadata?.size)!==Number(row.size)||!MIME.has(object.metadata?.mimetype||row.mime))return json({error:'El archivo no coincide con la subida autorizada.'},400);
   requireOK(await db.from('wedding_media').update({status:'ready',approved:true}).eq('id',row.id));return json({ok:true,id:row.id,pending:false});
  }
  if(path.startsWith('file/')&&method==='GET'){
   const row=requireOK(await db.from('wedding_media').select('*').eq('id',path.slice(5)).eq('status','ready').maybeSingle());
   if(!row)return json({error:'No existe este recuerdo.'},404);
   const signed=requireOK(await db.storage.from(BUCKET).createSignedUrl(row.object_key,900,{download:download?row.name:false}));return json({url:signed.signedUrl});
  }
  if(path.startsWith('admin/')){
   if(!organizer)return json({error:'Acceso reservado a los novios.'},403);
   if(path==='admin/invitations'&&method==='GET')return json({items:requireOK(await db.from('invitations').select('*').order('created_at',{ascending:false}).limit(2000))});
   if(path==='admin/invitations'&&method==='POST'){
    const items=Array.isArray(b.items)?b.items:[];if(!items.length||items.length>300)return json({error:'Añade entre 1 y 300 invitaciones.'},400);
    const rows=items.map((i:any)=>{const guests=(Array.isArray(i.guests)?i.guests:[]).map((g:unknown)=>text(g,80)).filter(Boolean).slice(0,15);if(!guests.length||!/^\w{64}$/.test(i.token_hash)||!i.token_ciphertext)throw Error('Invitación no válida');return {label:text(i.label,120)||guests.join(' + '),guests,phone:text(i.phone,30).replace(/[^0-9+]/g,''),token_hash:i.token_hash,token_ciphertext:i.token_ciphertext};});
    const inserted=requireOK(await db.from('invitations').insert(rows).select('*'));return json({ok:true,items:inserted,...(!b.bulk?{token_ciphertext:inserted[0].token_ciphertext}:{})});
   }
   if(path.startsWith('admin/invitations/')&&method==='PATCH'){
    const id=path.split('/')[2];const update:Record<string,unknown>={updated_at:new Date().toISOString()};
    if(b.rotate){if(!b.token_hash||!b.token_ciphertext)return json({error:'Falta el enlace nuevo.'},400);update.token_hash=b.token_hash;update.token_ciphertext=b.token_ciphertext;update.revoked=false;}
    if('tableNo'in b){if(b.tableNo!==null&&!cfg.tables.some((t:any)=>t.n===Number(b.tableNo)))return json({error:'Elige una mesa del plano.'},400);update.table_no=b.tableNo===null?null:Number(b.tableNo);}
    if('revoked'in b)update.revoked=!!b.revoked;
    if('sent'in b)update.sent_at=b.sent?new Date().toISOString():null;
    if('phone'in b)update.phone=text(b.phone,30).replace(/[^0-9+]/g,'');
    const row=requireOK(await db.from('invitations').update(update).eq('id',id).select('*').single());return json({ok:true,...(b.rotate?{token_ciphertext:row.token_ciphertext}:{})});
   }
   if(path==='admin/config'&&method==='PUT'){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||(b.deadline&&!/^\d{4}-\d{2}-\d{2}$/.test(b.deadline)))return json({error:'Revisa las fechas.'},400);
    if(!Array.isArray(b.tables)||!b.tables.length||b.tables.length>30||new Set(b.tables.map((t:any)=>Number(t.n))).size!==b.tables.length)return json({error:'El plano debe tener entre 1 y 30 mesas, sin números repetidos.'},400);
    if(b.giftEnabled===true&&(!text(b.giftHolder,120)||!validIban(text(b.giftIban,50))))return json({error:'Revisa el titular y el IBAN antes de activar los regalos.'},400);
    const next={phase:['auto','before','during','after'].includes(b.phase)?b.phase:'auto',thankYou:text(b.thankYou,1000)||defaults.thankYou,story:(Array.isArray(b.story)?b.story:[]).slice(0,12).filter((m:any)=>safePhoto(text(m.photo,2000))).map((m:any)=>({photo:text(m.photo,2000),caption:text(m.caption,160),text:text(m.text,1000)})),practical:Object.fromEntries(['bus','accommodation','dressCode','contact'].map(k=>[k,text(b.practical?.[k],1000)])),faq:(Array.isArray(b.faq)?b.faq:[]).slice(0,15).map((f:any)=>({question:text(f.question,200),answer:text(f.answer,1000)})).filter((f:any)=>f.question&&f.answer),giftEnabled:b.giftEnabled===true,giftHolder:text(b.giftHolder,120),giftIban:normalizeIban(text(b.giftIban,50)),names:text(b.names,80),date:b.date,deadline:text(b.deadline,10),venue:text(b.venue,200),address:text(b.address,300),mapUrl:/^https:\/\//.test(b.mapUrl)?text(b.mapUrl,1000):'',tablesPublished:b.tablesPublished===true,scheduleConfirmed:b.scheduleConfirmed===true,example:b.example===true,timeline:(b.timeline||defaults.timeline).slice(0,8).map((t:any)=>({time:text(t.time,20),title:text(t.title,80),detail:text(t.detail,200)})),tables:b.tables.map((t:any)=>({n:Math.max(1,Math.min(99,Math.floor(Number(t.n)||1))),name:text(t.name,80),x:Math.max(8,Math.min(92,Number(t.x)||50)),y:Math.max(12,Math.min(88,Number(t.y)||50))}))};
    requireOK(await db.from('wedding_settings').upsert({key:'wedding',value:next}));return json({ok:true,config:next});
   }
   if(path==='admin/album-pass'&&method==='GET'){const row=await settings('album');return row?json({token_ciphertext:row.ciphertext}):json({error:'Todavía no se ha creado el QR del álbum.'},404);}
   if(path==='admin/album-pass'&&method==='POST'){if(!b.token_hash||!b.token_ciphertext)return json({error:'Falta el acceso nuevo.'},400);requireOK(await db.from('wedding_settings').upsert({key:'album',value:{hash:b.token_hash,ciphertext:b.token_ciphertext}}));return json({ok:true,token_ciphertext:b.token_ciphertext});}
   if(path.startsWith('admin/media/')&&method==='PATCH'){requireOK(await db.from('wedding_media').update({approved:true}).eq('id',path.split('/')[2]).eq('status','ready'));return json({ok:true});}
   if(path.startsWith('admin/media/')&&method==='DELETE'){const row=requireOK(await db.from('wedding_media').select('*').eq('id',path.split('/')[2]).maybeSingle());if(row){requireOK(await db.storage.from(BUCKET).remove([row.object_key]));requireOK(await db.from('wedding_media').update({status:'deleted'}).eq('id',row.id));}return json({ok:true});}
  }
  return json({error:'No se encontró esta acción.'},404);
 }catch(e){console.error('wedding-api operation failed',e instanceof Error?e.message:'unknown');return json({error:'No se ha podido completar. Inténtalo de nuevo.'},500);}
});
