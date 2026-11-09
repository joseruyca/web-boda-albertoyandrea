'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, type ReactNode, type FormEvent } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, Check, Plus, X, MapPin, CalendarDays, Camera, Heart, Ticket, Music2, Bus, Download, QrCode, Copy, Settings2, LockKeyhole, Loader2, Upload, ChevronRight, LogOut, RotateCcw, Eye, CheckCircle2, Image as ImageIcon, Play, GlassWater } from 'lucide-react';

import { defaults, type WeddingConfig } from './config';
import Envelope, {useInvitationMotion} from './envelope';
import Journey,{PracticalDetails} from './journey';
const Gallery=dynamic(()=>import('./gallery'),{loading:()=> <div className="album-loading" role="status">Abriendo el álbum…</div>});
import Monogram from './monogram';
import {InvitationAccess,GuestPass} from './invitation-access';
import type {Answer} from './rsvp';
const RSVP=dynamic(()=>import('./rsvp'),{loading:()=> <div className="album-loading" role="status">Preparando tu respuesta…</div>});
const Admin=dynamic(()=>import('./admin'),{loading:()=> <div className="album-loading" role="status">Preparando el panel…</div>});
import {isAlbumLink} from '../lib/invitation-access.mjs';
import {requestJSON} from '../lib/http.mjs';
import {parseEntry,createEntryLoader,isRejectedInvitation} from '../lib/entry-session.mjs';
import NetworkStatus from './network-status';
import {weddingCalendar} from '../lib/calendar.mjs';

type Invitation={id:string;label:string;guests:string[];response:Answer|null;};
type Media={hidden?:boolean;thumbnail_ready?:boolean;id:string;name:string;mime:string;size:number;author:string;approved:number;created:string;src?:string;sample?:boolean};
type View='invitation'|'day'|'rsvp'|'gallery'|'gift'|'admin';
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
 const [startupError,setStartupError]=useState(''),[qrError,setQrError]=useState(''),[qrAttempt,setQrAttempt]=useState(0),[qrSource,setQrSource]=useState('');
 const validQrImg=qrSource===qr?.url?qrImg:'';
 const [passOpen,setPassOpen]=useState(false);const [entryError,setEntryError]=useState('');
 const [unsealed,setUnsealed]=useState(false);const [openingLetter,setOpeningLetter]=useState(false);const [privacy,setPrivacy]=useState(false);
 const motionRoot=useInvitationMotion(unsealed);
 const demo=!!person.preview||(!person.invitation&&config.example);const inv=person.invitation||(demo?sampleInvite:null);
 function notify(s:string){setToast(s);}
 function go(v:View){if(v!==view&&(albumBusy.current||rsvpDirty.current)&&!window.confirm(albumBusy.current?'Hay recuerdos pendientes de subir. Si sales ahora, se cancelarán las subidas. ¿Quieres salir?':'Tu respuesta tiene cambios sin guardar. ¿Quieres salir y descartarlos?'))return;setView(v);history.replaceState(null,'','#'+v);window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>{document.getElementById('main-content')?.focus({preventScroll:true});});}
 async function refresh(){const [c,p]=await Promise.all([api('config'),api('me')]);setConfig({...defaults,...c,story:c.story||[],practical:{...defaults.practical,...c.practical},faq:c.faq||[]});setPerson(p);return p as Person;}
 async function loadEntry(){
  if(starting.current||!entryLoader.current)return;starting.current=true;setStartupError('');setReady(false);
  try{await entryLoader.current.load();}
  catch(e){if(entryPersonal.current&&entryLoader.current.needsSession&&isRejectedInvitation(e)){history.replaceState(null,'',location.pathname);setUnsealed(true);setEntryError((e as Error).message);setManual(true);}else setStartupError((e as Error).message||'No hemos podido cargar la invitación.');}
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
 const nav=[{v:'invitation',label:'La invitación',short:'Invitación',icon:Heart},{v:'day',label:'El gran día',short:'El día',icon:CalendarDays},{v:'rsvp',label:'Confirmar',short:'Confirmar',icon:Ticket},{v:'gallery',label:'Los recuerdos',short:'Álbum',icon:Camera}] as const;
 function openEnvelope(){setOpeningLetter(false);try{sessionStorage.setItem('aa-envelope-open','yes');}catch{}setUnsealed(true);window.scrollTo({top:0});requestAnimationFrame(()=>{const heading=motionRoot.current?.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}});}
 return <><NetworkStatus/><div ref={motionRoot} className={'wedding envelope-edition natural-edition view-'+view+(!unsealed&&!openingLetter?' invitation-concealed':'')+(openingLetter?' is-unfolding':'')} inert={!unsealed}>
  <a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>Ir al contenido</a><header className="masthead"><button onClick={()=>go('invitation')} className="brand" aria-label="Volver a la invitación"><Monogram className="brand-mark"/><span className="brand-name">{config.names}<small>{pretty(config.date,{day:'2-digit',month:'2-digit',year:'numeric'}).replaceAll('/',' · ')}</small></span></button><div className="top-right">{person.invitation&&<button className="personal-pass-trigger" aria-label="Guardar mi invitación personal" title="Mi invitación personal" onClick={()=>setPassOpen(true)}><Ticket size={15}/><span>Mi invitación</span></button>}<button className="replay-envelope" onClick={()=>{if(albumBusy.current||rsvpDirty.current){notify('Guarda tu respuesta o termina las subidas antes de volver al sobre.');return;}try{sessionStorage.removeItem('aa-envelope-open');}catch{}setUnsealed(false);go('invitation');}}>El sobre ↗</button>{config.example&&<span className="example-label"><span/>DISEÑO DE MUESTRA</span>}<button className="small-link admin-link" onClick={()=>go('admin')} title="Panel de los novios" aria-label="Panel de los novios"><Settings2 size={17}/><span>Los novios</span></button></div></header>
  {startupError&&<div className="startup-notice" role="alert"><div><strong>No hemos podido cargar todos los detalles.</strong><p>{startupError}</p></div><button className="outline-btn" onClick={()=>void loadEntry()} disabled={!ready}>{ready?'Volver a intentarlo':'Conectando…'}<RotateCcw size={15}/></button></div>}{person.preview&&<div className="preview-ribbon"><span>PREVISUALIZACIÓN PARA JOSE · respuestas y archivos solo de prueba</span><button onClick={async()=>{try{await api('preview','DELETE');await refresh();go('invitation');}catch(e){notify((e as Error).message);}}}>Salir <X size={12}/></button></div>}<main key={view} className="scene" id="main-content" tabIndex={-1}>
  {view==='invitation'&&<Journey config={config} guest={inv?.label} preview={!!person.preview} onGo={go} openInvite={()=>setManual(true)}/>}
  {view==='day'&&<section className="day-scene content-scene"><div className="scene-label">EL GRAN DÍA <span className="scene-date">{pretty(config.date,{day:'2-digit',month:'2-digit',year:'numeric'}).replaceAll('/',' · ')}</span></div><img className="detail-botanical" src="/assets/dried-chamomile.webp" alt="" aria-hidden="true" width="500" height="750"/><div className="day-layout"><div><h1 className="display-title">Un día<br/><em>para nosotros.</em></h1><p className="intro-copy">Los momentos que compartiremos<br/>y los detalles para acompañarnos.</p><div className="venue-note"><MapPin/><div><h2>{config.venue}</h2><p>{config.address}</p>{config.mapUrl?<a href={config.mapUrl} target="_blank" rel="noreferrer" className="underline-link">Cómo llegar <ArrowUpRight size={16}/></a>:<small>Pronto compartiremos la ubicación y cómo llegar.</small>}</div></div><button className="outline-btn" onClick={()=>{const blob=new Blob([weddingCalendar(config)],{type:'text/calendar'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='nos-vemos-en-la-boda.ics';a.click();URL.revokeObjectURL(u);}}><CalendarDays size={18}/> Guardar la fecha</button></div><div className="timeline">{!config.scheduleConfirmed&&<p className="schedule-note">EL PLAN ESTÁ TOMANDO FORMA · HORARIOS PROVISIONALES</p>}{config.timeline.map((t,i)=><article key={i} className="timeline-row" data-reveal><span className="timeline-time">{t.time}</span><span className="timeline-no">0{i+1}</span><div><h2>{t.title}</h2><p>{t.detail}</p></div>{i===0?<Heart/>:i===1?<GlassWater/>:i===2?<Ticket/>:<Music2/>}</article>)}<div className="bus-note"><Bus/><p>¿Necesitas autobús? Indícalo al confirmar.<br/><small>Compartiremos las paradas y los horarios cuando estén confirmados.</small></p></div></div></div><PracticalDetails config={config}/></section>}
  {view==='rsvp'&&<RSVP key={inv?.id||'locked'} invitation={inv} demo={demo} config={config} onSaved={async()=>{await refresh();}} openInvite={()=>setManual(true)} onGo={go} onDirtyChange={dirty=>{rsvpDirty.current=dirty;}}/>}
  {view==='gallery'&&<Gallery person={person} demo={demo} notify={notify} showQr={setQr} onBusyChange={busy=>{albumBusy.current=busy;}}/>}
  {view==='gift'&&<Gift config={config} person={person} openInvite={()=>setManual(true)} notify={notify}/>}
  {view==='admin'&&<Admin person={person} config={config} onRefresh={refresh} notify={notify} showQr={setQr} onGo={go}/>}
  </main><footer className="privacy-footer"><Monogram/><button className="small-link" onClick={()=>setPrivacy(true)}>Tus datos y el álbum</button></footer>
  {view!=='admin'&&<nav className="scene-nav" aria-label="Explorar la invitación">{nav.map((n,i)=><button key={n.v} onClick={()=>go(n.v)} className={view===n.v?'active':''} aria-current={view===n.v?'page':undefined}><n.icon size={17}/><span className="nav-full">{n.label}</span><span className="nav-short">{n.short}</span><small>0{i+1}</small></button>)}</nav>}
  {toast&&<div className="toast" role="status"><span>{toast}</span><button onClick={()=>setToast('')} aria-label="Cerrar aviso"><X size={16}/></button></div>}
  {!ready&&<span className="loading-dot" aria-label="Cargando invitación"/>}
  {privacy&&<Modal label="Tus datos y el álbum" onClose={()=>setPrivacy(false)}><div className="modal-content privacy-content"><Monogram/><h2>Tu invitación.<br/><em>Tus recuerdos.</em></h2><h3>La invitación personal</h3><p>El enlace da acceso a las personas incluidas en esa invitación. Compartidlo solo con ellas. Las respuestas, indicaciones de menú y mensajes personales solo los ven los novios.</p><h3>El álbum compartido</h3><p>Cualquier persona que visite el álbum puede ver y descargar los recuerdos. El nombre que acompaña una subida no está verificado. Comparte imágenes que puedas publicar y evita datos personales de otras personas.</p><h3>¿Quieres retirar algo?</h3><p>Puedes avisar a los novios desde cada recuerdo. También puedes pedirles que corrijan tus datos o retiren tus respuestas y archivos.</p><p>La web utiliza cookies necesarias para recordar tu invitación y las subidas. No incorpora publicidad ni seguimiento comercial.</p><button className="solid-btn" onClick={()=>setPrivacy(false)}>Entendido <Check size={17}/></button></div></Modal>}
  {manual&&<Modal label="Encontrar tu invitación" onClose={()=>setManual(false)}><InvitationAccess initialError={entryError} onOpened={invitationOpened}/></Modal>}
  {passOpen&&<Modal label="Tu pase personal" onClose={()=>setPassOpen(false)}><GuestPass notify={notify} onQr={(url,title)=>{setPassOpen(false);setQr({url,title});}}/></Modal>}

  {qr&&<Modal label={qr.title} onClose={()=>setQr(null)}><div className="modal-content qr-content"><QrCode/><h2>{qr.title}</h2>{validQrImg?<img src={validQrImg} alt={'Código QR de '+qr.title}/>:qrError?<div className="qr-failure" role="alert"><p>{qrError}</p><button className="outline-btn" onClick={()=>setQrAttempt(n=>n+1)}>Reintentar QR<RotateCcw size={15}/></button></div>:<Loader2 className="spin" aria-label="Preparando el QR"/>}<p>Escanea con la cámara del móvil.</p><button className="outline-btn" disabled={!validQrImg} onClick={async()=>{try{const {qrCard}=await import('../lib/qr-card.mjs');const u=URL.createObjectURL(new Blob([qrCard(validQrImg,qr.title,config.names,isAlbumLink(qr.url)?'album':'invitation')],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=u;a.download=isAlbumLink(qr.url)?'tarjeta-album-andrea-alberto.svg':'invitacion-personal-andrea-alberto.svg';a.click();setTimeout(()=>URL.revokeObjectURL(u),10000);}catch(e){notify((e as Error).message);}}}><Download size={17}/> Tarjeta para imprimir</button>{validQrImg&&<a className="solid-btn" href={validQrImg} download={isAlbumLink(qr.url)?'qr-album-boda.png':'qr-invitacion-personal.png'}><Download size={18}/> Descargar QR</a>}<button className="underline-link" onClick={()=>navigator.clipboard.writeText(qr.url).then(()=>notify('Enlace copiado.')).catch(()=>notify('No se pudo copiar. Usa el enlace mostrado.'))}>Copiar enlace <Copy size={15}/></button><input className="share-input" readOnly value={qr.url} onFocus={e=>e.target.select()}/></div></Modal>}
 </div>{!unsealed&&<Envelope names={config.names} date={config.date} guest={person.invitation?.label} loading={!ready} onStart={()=>setOpeningLetter(true)} onOpen={openEnvelope} error={startupError} onRetry={()=>void loadEntry()}/>}</>;
}

function Gift({config,person,openInvite,notify}:{config:WeddingConfig;person:Person;openInvite:()=>void;notify:(s:string)=>void}){
 const canSee=!!person.invitation||person.admin;
 const configured=config.giftEnabled&&!!config.giftIban&&!!config.giftHolder;
 return <section className="gift-scene content-scene"><div className="scene-label">UN DETALLE CON CARIÑO <Heart size={18}/></div><div className="gift-layout"><div><span className="hand-note">Gracias por estar cerca</span><h1>El mejor regalo<br/><em>es compartirlo.</em></h1><p>Que nos acompañes es lo que más ilusión nos hace. Si además te apetece tener un detalle con nosotros, aquí encontrarás cómo hacerlo.</p></div><div className="gift-paper"><Heart size={30}/>{!canSee?<><h2>Un detalle personal.</h2><p>Los datos del regalo están dentro de tu invitación.</p><button className="solid-btn" onClick={openInvite}>Abrir mi invitación <ArrowRight size={17}/></button></>:configured?<><p className="gift-label">TRANSFERENCIA BANCARIA</p><h2>{config.giftHolder}</h2><label>IBAN<input readOnly value={config.giftIban.match(/.{1,4}/g)?.join(' ')||config.giftIban} onFocus={e=>e.target.select()}/></label><button className="solid-btn" onClick={()=>navigator.clipboard.writeText(config.giftIban).then(()=>notify('IBAN copiado.')).catch(()=>notify('Selecciona el IBAN para copiarlo.'))}><Copy size={17}/> Copiar IBAN</button><p className="gift-thanks">Gracias por formar parte de nuestra historia.</p></>:<><h2>Con todo nuestro cariño.</h2><p>{person.preview?'Aquí aparecerán el titular y el IBAN cuando los novios los añadan. Esta vista no contiene una cuenta bancaria.':'Los novios todavía no han añadido los detalles del regalo.'}</p></>}</div></div></section>;
}
