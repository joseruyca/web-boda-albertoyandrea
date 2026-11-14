import {invitationPass} from '../../../lib/invitation-access.mjs';
import {invitationBackup} from '../../../lib/backup.mjs';
import { defaults } from '../../config';
import { previewResponse } from '../../../lib/preview.mjs';
import { adminSession, decryptToken, digest, encryptToken, equal, randomToken } from '../../../lib/security';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers});
function cookie(r:Request,name:string){return r.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||'';}
function setCookie(r:Request,name:string,value:string){return `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${value?'2592000':'0'}${new URL(r.url).protocol==='https:'?'; Secure':''}`;}
async function read(r:Request){if(Number(r.headers.get('content-length'))>1000000)throw Error('Demasiados datos.');const data=await r.text();if(data.length>1000000)throw Error('Demasiados datos.');return data?JSON.parse(data):{};}
async function handle(req:Request):Promise<Response>{
 try {
  const url=new URL(req.url);const path=url.pathname.replace(/^\/api\/?/,'');const method=req.method;
  if(method!=='GET'&&req.headers.get('origin')&&req.headers.get('origin')!==url.origin)return json({error:'Origen no permitido.'},403);
  const body=method==='GET'?{offset:Math.max(0,Math.floor(Number(url.searchParams.get('offset'))||0)),...Object.fromEntries(['scope','member','moment','kind','search'].map(k=>[k,url.searchParams.get(k)||'']))}:await read(req);
  const preview=previewResponse(req,path,method,body);if(preview)return preview;
  if(!process.env.WEDDING_API_URL||!process.env.WEDDING_BACKEND_SECRET){
   if(path==='config'&&method==='GET')return json({...defaults,setupPending:true});
   if(path==='me'&&method==='GET')return json({invitation:null,albumAccess:false,admin:false,setupPending:true});
   if(path==='media'&&method==='GET')return json({items:[],locked:true,setupPending:true});
   return json({error:'La organización todavía no ha activado las confirmaciones y subidas reales.'},503);
  }
  const organizer=!!cookie(req,'w_admin')&&equal(cookie(req,'w_admin'),adminSession());
  if(path==='admin/session'&&method==='POST'){
   if(!process.env.ADMIN_KEY||!equal(String(body.key||''),process.env.ADMIN_KEY))return json({error:'La clave no es correcta.'},401);
   const res=json({ok:true});res.headers.append('Set-Cookie',setCookie(req,'w_admin',adminSession()));res.headers.append('Set-Cookie',setCookie(req,'w_preview',''));return res;
  }
  if(path==='admin/session'&&method==='DELETE'){const res=json({ok:true});res.headers.set('Set-Cookie',setCookie(req,'w_admin',''));return res;}
  if(path.startsWith('admin/')&&!organizer)return json({error:'Acceso reservado a los novios.'},403);
  if(['session','album-session'].includes(path)&&method==='DELETE'){const res=json({ok:true});res.headers.set('Set-Cookie',setCookie(req,path==='session'?'w_invite':'w_album',''));return res;}
  if(path==='admin/restore'&&method==='POST'){const backup=invitationBackup(body);if(backup.invitations.length>300)return json({error:'Recupera un máximo de 300 invitaciones por tanda.'},400);body.items=backup.invitations.map((i:any)=>{const {token,...row}=i;return {...row,token_hash:digest(token),token_ciphertext:encryptToken(token)};});delete body.invitations;}
  if(path==='admin/invitations'&&method==='POST'){
   const rows=Array.isArray(body.items)?body.items:[body];if(rows.length>300)return json({error:'Importa un máximo de 300 invitaciones por tanda.'},400);
   body.bulk=Array.isArray(body.items);
   body.items=rows.map((i:any)=>{const t=randomToken();return {...i,token_hash:digest(t),token_ciphertext:encryptToken(t)};});
  }
  if((path.startsWith('admin/invitations/')&&method==='PATCH'&&body.rotate)||(path==='admin/album-pass'&&method==='POST')){const t=randomToken();body.token_hash=digest(t);body.token_ciphertext=encryptToken(t);}
  const uploaderId=cookie(req,'w_uploader')||randomToken();
  const response=await fetch(process.env.WEDDING_API_URL,{
   method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','X-Wedding-Backend':process.env.WEDDING_BACKEND_SECRET},
   body:JSON.stringify({path:path==='invitation-pass'&&method==='GET'?'me':path,method,body,organizer,invitationToken:cookie(req,'w_invite'),albumToken:cookie(req,'w_album'),uploaderId,memberId:cookie(req,'w_album_member'),networkKey:digest(process.env.WEDDING_BACKEND_SECRET+':'+(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim()),thumbnail:url.searchParams.has('thumb'),download:url.searchParams.has('download')})
  });
  const data=await response.json();
  if(path==='invitation-pass'&&method==='GET'){const pass=response.ok?invitationPass(data,cookie(req,'w_invite')):null;return pass?json(pass):json({error:'Abre tu enlace personal para guardar tu invitación.'},401);}
  if(response.ok&&path==='admin/export'&&Array.isArray(data.invitations)){data.invitations=data.invitations.map((i:any)=>{const {token_ciphertext,token_hash,...safe}=i;return {...safe,token:token_ciphertext?decryptToken(token_ciphertext):undefined};});}
  if(response.ok&&(path.startsWith('admin/invitations')||path==='admin/album-pass')){
   if(data.items)data.items=data.items.map((i:any)=>{const {token_ciphertext,...safe}=i;return {...safe,token:token_ciphertext?decryptToken(token_ciphertext):undefined};});
   if(data.token_ciphertext){data.token=decryptToken(data.token_ciphertext);delete data.token_ciphertext;}
  }
  if(response.ok&&path.startsWith('file/')){
   if(!data.url)return json({error:'El recuerdo no está disponible.'},404);
   return new Response(null,{status:307,headers:{...headers,Location:data.url}});
  }
  const res=json(data,response.status);
  if(response.ok&&path==='album/identity'&&method==='POST'&&data.current?.id)res.headers.append('Set-Cookie',setCookie(req,'w_album_member',data.current.id));
  if(response.ok&&!cookie(req,'w_uploader'))res.headers.append('Set-Cookie',setCookie(req,'w_uploader',uploaderId));
  if(response.ok&&['session','album-session'].includes(path)&&method==='POST'){res.headers.append('Set-Cookie',setCookie(req,'w_preview',''));res.headers.append('Set-Cookie',setCookie(req,path==='session'?'w_invite':'w_album',String(body.token||'')));}
  return res;
 }catch{return json({error:'No se ha podido completar la operación. Inténtalo de nuevo.'},500);}
}
export const GET=handle;export const POST=handle;export const PUT=handle;export const PATCH=handle;export const DELETE=handle;
