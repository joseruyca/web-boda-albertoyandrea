'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, type ReactNode, type FormEvent } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, Check, Plus, X, MapPin, CalendarDays, Camera, Heart, Ticket, Music2, Bus, Download, QrCode, Copy, Settings2, LockKeyhole, Loader2, Upload, ChevronRight, LogOut, RotateCcw, Eye, CheckCircle2, Image as ImageIcon, Play, GlassWater, Menu }  from 'lucide-react';

import { defaults, type WeddingConfig } from './config';
import Envelope, {useInvitationMotion} from './envelope';
import Journey from './journey';
const Gallery=dynamic(()=>import('./gallery'),{loading:()=> <div className="album-loading" role="status">Abriendo el álbum…</div>});
import Monogram from './monogram';
import Venue from './venue';
import DayProgramme from './day-programme';
import Gift from './gift';
import NaturalAccent from './natural-accent';
import {InvitationAccess,GuestPass} from './invitation-access';
import type {Answer} from './rsvp';
const RSVP=dynamic(()=>import('./rsvp'),{loading:()=> <div className="album-loading" role="status">Preparando tu respuesta…</div>});
const Admin=dynamic(()=>import('./admin'),{loading:()=> <div className="album-loading" role="status">Preparando el panel…</div>});
import {isAlbumLink} from '../lib/invitation-access.mjs';
import {requestJSON} from '../lib/http.mjs';
import {parseEntry,createEntryLoader,isRejectedInvitation} from '../lib/entry-session.mjs';
import NetworkStatus from './network-status';
import InvitationStart from './invitation-start';

type Invitation={id:string;label:string;guests:string[];response:Answer|null;};
type Media={hidden?:boolean;thumbnail_ready?:boolean;id:string;name:string;mime:string;size:number;author:string;approved:number;created:string;src?:string;sample?:boolean};
type View='invitation'|'day'|'venue'|'rsvp'|'gallery'|'gift'|'admin';
type Person={invitation:Invitation|null;albumAccess:boolean;admin:boolean;preview?:boolean;setupPending?:boolean};
const EMPTY:Person={invitation:null,albumAccess:false,admin:false};
const sampleInvite:Invitation={id:'example',label:'Ana + Luis',guests:['Ana','Luis'],response:null};
const samples:Media[]=[1,2,3,4].map((n)=>({id:`sample-${n}`,name:'Fotografía de ejemplo',mime:'image/jpeg',size:0,author:'Un adelanto de lo que vendrá',approved:1,created:'',src:`/assets/memory-${n}.jpg`,sample:true}));
async function api(path:string,method='GET',data?:unknown):Promise<any> {return requestJSON('/api/'+path,{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});}
const pretty=(d:string,opts:Intl.DateTimeFormatOptions={day:'numeric',month:'long',year:'numeric'})=>new Date(d+'T12:00:00').toLocaleDateString('es-ES',opts);
const pad=(v:number)=>String(v).padStart(2,'0');
const mediaUrl=(m:Media)=>m.src||'/api/file/'+m.id;
function Star({className=''}:{className?:string}) {return <svg className={className} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M50 0 56 36 79 12 66 42 100 50 65 57 80 87 56 65 50 100 43 65 15 87 35 58 0 50 35 43 20 13 44 36Z"/></svg>;}
function Modal({children,onClose,label}:{children:ReactNode;onClose:()=>void;label:string}) {const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();const d=ref.current;const cb=()=>onClose();d?.addEventListener('cancel',cb);return()=>d?.removeEventListener('cancel',cb);},[onClose]);return <dialog ref={ref} className="modal" aria-label={label} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><button className="close icon-btn" onClick={onClose} aria-label="Cerrar"><X/></button>{children}</dialog>;}
export default function Wedding() {
 const [view,setView]=useState<View>('invitation');const [config,setConfig]=useState<WeddingConfig>(defaults);const [person,setPerson]=useState<Person>(EMPTY);const [ready,setReady]=useState(false);const [toast,setToast]=useState('');const [qr,setQr]=useState<{url:string;title:string}|null>(null);const [qrImg,setQrImg]=useState('');const [manual,setManual]=useState(false);
 const albumBusy=useRef(false);const rsvpDirty=useRef(false);
 const entryLoader=useRef<ReturnType<typeof createEntryLoader>|null>(null);const entryPersonal=useRef(false);const starting=useRef(false);
 const [presentationReady,setPresentationReady]=useState(false);
 const [startupError,setStartupError]=useState(''),[qrError,setQrError]=useState(''),[qrAttempt,setQrAttempt]=useState(0),[qrSource,setQrSource]=useState('');
 const validQrImg=qrSource===qr?.url?qrImg:'';
 const [menuOpen,setMenuOpen]=useState(false);const [passOpen,setPassOpen]=useState(false);const [entryError,setEntryError]=useState('');
 const [unsealed,setUnsealed]=useState(false);const [openingLetter,setOpeningLetter]=useState(false);const [privacy,setPrivacy]=useState(false);
 const motionRoot=useInvitationMotion(unsealed);
 const demo=!!person.preview||(!person.invitation&&config.example);const inv=person.invitation||(demo?sampleInvite:null);
 function notify(s:string){setToast(s);}
 function go(v:View){if(v!==view&&(albumBusy.current||rsvpDirty.current)&&!window.confirm(albumBusy.current?'Hay recuerdos pendientes de subir. Si sales, se detendrán y tendrás que volver a seleccionar los archivos. ¿Quieres salir?':'Tu respuesta tiene cambios sin guardar. ¿Quieres salir y descartarlos?'))return;setView(v);history.replaceState(null,'','#'+v);window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>{document.getElementById('main-content')?.focus({preventScroll:true});});}
 async function refresh(){const [c,p]=await Promise.all([api('config'),api('me')]);setConfig({...defaults,...c,story:c.story||[],dinner:{...defaults.dinner,...c.dinner},prewedding:{...defaults.prewedding,...c.prewedding},practical:{...defaults.practical,...c.practical},faq:c.faq||[]});setPerson(p);return p as Person;}
 async function loadEntry(){
  if(starting.current||!entryLoader.current)return;starting.current=true;setStartupError('');setReady(false);
  try{await entryLoader.current.load();setPresentationReady(true);}
  catch(e){if(entryPersonal.current&&entryLoader.current.needsSession&&isRejectedInvitation(e)){history.replaceState(null,'',location.pathname);setUnsealed(true);setEntryError((e as Error).message);setManual(true);setPresentationReady(true);}else setStartupError((e as Error).message||'No hemos podido cargar la invitación.');}
  finally{starting.current=false;setReady(true);}
 }
 useEffect(()=>{
  if(entryLoader.current)return;
  const entry=parseEntry(location.hash);entryPersonal.current=entry.personal;setView(entry.view as View);
  let opened=false;try{opened=sessionStorage.getItem('aa-envelope-open')==='yes';}catch{}
  setUnsealed(entry.view!=='invitation'||(!entry.personal&&opened));
  entryLoader.current=createEntryLoader({entry,exchange:(path:string,data:unknown)=>api(path,'POST',data),refresh,onAuthenticated:(destination:string)=>{history.replaceState(null,'',location.pathname+(destination==='invitation'?'':'#'+destination));}});
  void loadEntry();
 },[]);
 useEffect(()=>{document.title=config.names+' · Nos casamos';},[config.names]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),6500);return()=>clearTimeout(t);},[toast]);
 useEffect(()=>{
  let cancelled=false;setQrImg('');setQrError('');if(!qr)return;
  import('qrcode').then(m=>m.default.toDataURL(qr.url,{width:600,margin:3,color:{dark:'#465640',light:'#f7f5ef'}})).then(value=>{if(!cancelled){setQrSource(qr.url);setQrImg(value);}}).catch(()=>{if(!cancelled)setQrError('No se ha podido preparar el QR. Puedes copiar el enlace o volver a intentarlo.');});
  return()=>{cancelled=true;};
 },[qr,qrAttempt]);
 async function invitationOpened(){await refresh();setEntryError('');setManual(false);setPassOpen(false);try{sessionStorage.removeItem('aa-envelope-open');}catch{}go('invitation');setUnsealed(false);notify('Tu invitación está lista. Toca el sello para abrirla.');}

 const day=new Date(config.date+'T12:00:00');const days=Math.max(0,Math.ceil((day.getTime()-Date.now())/86400000));
 const nav=[{v:'invitation',label:'Invitación',short:'Invitación',icon:ImageIcon},{v:'day',label:'El día',short:'El día',icon:CalendarDays},{v:'venue',label:'Lugares',short:'Lugares',icon:MapPin},{v:'rsvp',label:'Confirmar',short:'Confirmar',icon:CheckCircle2},{v:'gallery',label:'Álbum',short:'Álbum',icon:Camera}] as const;
 function openEnvelope(){setOpeningLetter(false);try{sessionStorage.setItem('aa-envelope-open','yes');}catch{}setUnsealed(true);window.scrollTo({top:0});requestAnimationFrame(()=>{const heading=motionRoot.current?.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}});}
 return <><NetworkStatus/>{!presentationReady&&<InvitationStart error={startupError} busy={!ready} onRetry={()=>void loadEntry()}/>}<div ref={motionRoot} className={'wedding envelope-edition natural-edition stationery-edition herbarium-edition view-'+view+(!unsealed&&!openingLetter?' invitation-concealed':'')+(openingLetter?' is-unfolding':'')+(!presentationReady?' boot-concealed':'')} inert={!unsealed||!presentationReady}>
  <a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>Ir al contenido</a><header className="masthead"><button onClick={()=>go('invitation')} className="brand" aria-label="Volver a la invitación"><Monogram className="brand-mark"/></button><button className="icon-btn site-menu-trigger" onClick={()=>setMenuOpen(true)} aria-label="Abrir menú" aria-haspopup="dialog"><Menu size={22}/></button></header>
  {view!=='admin'&&<nav className="scene-nav" aria-label="Explorar la invitación">{nav.map((n,i)=><button key={n.v} onClick={()=>go(n.v)} aria-label={n.v==='venue'?'Cómo llegar':undefined} className={view===n.v?'active':''} aria-current={view===n.v?'page':undefined}><n.icon size={17}/><span className="nav-full">{n.label}</span><span className="nav-short">{n.short}</span><small>0{i+1}</small></button>)}</nav>}
  {startupError&&<div className="startup-notice" role="alert"><div><strong>No hemos podido cargar todos los detalles.</strong><p>{startupError}</p></div><button className="outline-btn" onClick={()=>void loadEntry()} disabled={!ready}>{ready?'Volver a intentarlo':'Conectando…'}<RotateCcw size={15}/></button></div>}{person.preview&&<div className="preview-ribbon"><span>PREVISUALIZACIÓN PARA JOSE · respuestas y archivos solo de prueba</span><button onClick={async()=>{try{await api('preview','DELETE');await refresh();go('invitation');}catch(e){notify((e as Error).message);}}}>Salir <X size={12}/></button></div>}<main key={view} className="scene" id="main-content" tabIndex={-1}>
  {view==='invitation'&&<Journey config={config} guest={inv?.label} preview={!!person.preview} onGo={go} openInvite={()=>setManual(true)}/>}
  {view==='day'&&<DayProgramme config={config} onDirections={()=>go('venue')}/>}
  {view==='venue'&&<Venue config={config} onConfirm={()=>go('rsvp')}/>}
  {view==='rsvp'&&<RSVP key={inv?.id||'locked'} invitation={inv} demo={demo} config={config} onSaved={async()=>{await refresh();}} openInvite={()=>setManual(true)} onGo={go} onDirtyChange={dirty=>{rsvpDirty.current=dirty;}}/>}
  {view==='gallery'&&<Gallery person={person} demo={demo} notify={notify} showQr={setQr} onBusyChange={busy=>{albumBusy.current=busy;}}/>}
  {view==='gift'&&<Gift config={config} canSee={!!person.invitation||person.admin} openInvite={()=>setManual(true)} notify={notify} onBack={()=>go('invitation')}/>}
  {view==='admin'&&<Admin person={person} config={config} onRefresh={refresh} notify={notify} showQr={setQr} onGo={go}/>}
  </main>
  {toast&&<div className="toast" role="status"><span>{toast}</span><button onClick={()=>setToast('')} aria-label="Cerrar aviso"><X size={16}/></button></div>}
  {!ready&&<span className="loading-dot" aria-label="Cargando invitación"/>}
  {menuOpen&&<Modal label="Menú" onClose={()=>setMenuOpen(false)}><div className="modal-content site-menu"><Monogram/><nav aria-label="Opciones de la invitación">{person.invitation&&<button onClick={()=>{setMenuOpen(false);setPassOpen(true);}}>Mi invitación<Ticket size={18}/></button>}<button onClick={()=>{setMenuOpen(false);if(albumBusy.current||rsvpDirty.current){notify('Guarda tu respuesta o termina las subidas antes de volver al sobre.');return;}try{sessionStorage.removeItem('aa-envelope-open');}catch{}setUnsealed(false);go('invitation');}}>Volver al sobre<ArrowUpRight size={18}/></button><button onClick={()=>{setMenuOpen(false);go('gift');}}>Un detalle<Heart size={18}/></button><button onClick={()=>{setMenuOpen(false);setPrivacy(true);}}>Privacidad<LockKeyhole size={18}/></button><button onClick={()=>{setMenuOpen(false);go('admin');}}>Panel de los novios<Settings2 size={18}/></button></nav></div></Modal>}
  {privacy&&<Modal label="Tus datos y el álbum" onClose={()=>setPrivacy(false)}><div className="modal-content privacy-content"><Monogram/><h2>Tu invitación.<br/><em>Tus recuerdos.</em></h2><h3>La invitación personal</h3><p>El enlace da acceso a las personas incluidas en esa invitación. Compartidlo solo con ellas. Las respuestas, indicaciones de menú y mensajes personales solo los ven los novios.</p><h3>El álbum compartido</h3><p>Cualquier persona que visite el álbum puede ver y descargar los recuerdos. El nombre que acompaña una subida no está verificado. Comparte imágenes que puedas publicar y evita datos personales de otras personas.</p><h3>¿Quieres retirar algo?</h3><p>Puedes avisar a los novios desde cada recuerdo. También puedes pedirles que corrijan tus datos o retiren tus respuestas y archivos.</p><p>La web utiliza cookies necesarias para recordar tu invitación y las subidas. No incorpora publicidad ni seguimiento comercial.</p><button className="solid-btn" onClick={()=>setPrivacy(false)}>Entendido <Check size={17}/></button></div></Modal>}
  {manual&&<Modal label="Encontrar tu invitación" onClose={()=>setManual(false)}><InvitationAccess initialError={entryError} onOpened={invitationOpened}/></Modal>}
  {passOpen&&<Modal label="Tu pase personal" onClose={()=>setPassOpen(false)}><GuestPass notify={notify} onQr={(url,title)=>{setPassOpen(false);setQr({url,title});}}/></Modal>}

  {qr&&<Modal label={qr.title} onClose={()=>setQr(null)}><div className="modal-content qr-content"><QrCode/><h2>{qr.title}</h2>{validQrImg?<img src={validQrImg} alt={'Código QR de '+qr.title}/>:qrError?<div className="qr-failure" role="alert"><p>{qrError}</p><button className="outline-btn" onClick={()=>setQrAttempt(n=>n+1)}>Reintentar QR<RotateCcw size={15}/></button></div>:<Loader2 className="spin" aria-label="Preparando el QR"/>}<p>Escanea con la cámara del móvil.</p><button className="outline-btn" disabled={!validQrImg} onClick={async()=>{try{const {decoratedQrCard}=await import('../lib/qr-card.mjs');const u=URL.createObjectURL(new Blob([await decoratedQrCard(validQrImg,qr.title,config.names,isAlbumLink(qr.url)?'album':'invitation',config.date)],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=u;a.download=isAlbumLink(qr.url)?'tarjeta-album-andrea-alberto.svg':'invitacion-personal-andrea-alberto.svg';a.click();setTimeout(()=>URL.revokeObjectURL(u),10000);}catch(e){notify((e as Error).message);}}}><Download size={17}/> Tarjeta para imprimir</button>{validQrImg&&<a className="solid-btn" href={validQrImg} download={isAlbumLink(qr.url)?'qr-album-boda.png':'qr-invitacion-personal.png'}><Download size={18}/> Descargar QR</a>}<button className="underline-link" onClick={()=>navigator.clipboard.writeText(qr.url).then(()=>notify('Enlace copiado.')).catch(()=>notify('No se pudo copiar. Usa el enlace mostrado.'))}>Copiar enlace <Copy size={15}/></button><input className="share-input" readOnly value={qr.url} onFocus={e=>e.target.select()}/></div></Modal>}
 </div>{presentationReady&&!unsealed&&<Envelope names={config.names} date={config.date} guest={inv?.label} loading={!ready} onStart={()=>setOpeningLetter(true)} onOpen={openEnvelope} error={startupError} onRetry={()=>void loadEntry()}/>}</>;
}

