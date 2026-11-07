import {createHash,timingSafeEqual} from 'node:crypto';
// Preview capability only: never grants access to real guests, answers or files.
export const PREVIEW_CODE_HASH='7c70872668aee3d718c47e3521cc1640a5cc2ceb40cf6dda7680212946c73640';
export const PREVIEW_INVITATION={id:'preview-jose',label:'Jose',guests:['Jose'],response:null,tableNo:7};
export function normalizePreviewCode(value){return typeof value==='string'?value.trim().toUpperCase().replace(/\s/g,''):'';}
export function isPreviewCode(value,expected=PREVIEW_CODE_HASH){const a=Buffer.from(createHash('sha256').update(normalizePreviewCode(value)).digest('hex'));const b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
export function readPreviewCookie(req){return req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('w_preview='))?.slice(10)||'';}
export function previewResponse(req,path,method,body={}){
 const response=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 const cookie=(name,value)=>`${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${value?'604800':'0'}${new URL(req.url).protocol==='https:'?'; Secure':''}`;
 if(path==='preview'&&method==='DELETE'){const r=response({ok:true});r.headers.append('Set-Cookie',cookie('w_preview',''));return r;}
 if(path==='session'&&method==='POST'&&isPreviewCode(body.token)){const r=response({ok:true,preview:true});r.headers.append('Set-Cookie',cookie('w_preview',normalizePreviewCode(body.token)));r.headers.append('Set-Cookie',cookie('w_invite',''));r.headers.append('Set-Cookie',cookie('w_album',''));return r;}
 if(!isPreviewCode(readPreviewCookie(req)))return null;
 if(path==='invitation-pass'&&method==='GET')return response({token:readPreviewCookie(req),label:PREVIEW_INVITATION.label,guests:PREVIEW_INVITATION.guests,preview:true});
 if(path==='preview'&&method==='GET')return response({token:readPreviewCookie(req)});
 if(path==='me'&&method==='GET')return response({invitation:PREVIEW_INVITATION,albumAccess:true,admin:false,preview:true});
 if(path==='media'&&method==='GET')return response({items:[],preview:true});
 if(path==='config'&&method==='GET')return null;
 if(['session','album-session'].includes(path)&&method==='POST')return null;
 return response({error:'Esta es una previsualización. Las respuestas y archivos de prueba no se guardan en la boda.'},403);
}
