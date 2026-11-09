'use client';
import {useEffect,useRef,useState} from 'react';
import Monogram from './monogram';

/** Pointer depth and scroll depth use CSS variables, avoiding React renders on scroll. */
export function useInvitationMotion(active:boolean){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=root.current;if(!active||!el)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
  const update=()=>{frame=0;el.style.setProperty('--scroll-depth',media.matches?'0px':`${Math.min(window.scrollY,1400)}px`);};
  const scroll=()=>{if(!media.matches&&!frame)frame=requestAnimationFrame(update);};
  const change=()=>{cancelAnimationFrame(frame);frame=0;update();};
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-revealed');observer?.unobserve(e.target);}}),{threshold:.08}):null;
  const observe=()=>el.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach(n=>{if(observer)observer.observe(n);else n.classList.add('is-revealed');});observe();
  const mutations=new MutationObserver(observe);mutations.observe(el,{childList:true,subtree:true});
  media.addEventListener('change',change);window.addEventListener('scroll',scroll,{passive:true});update();
  return()=>{window.removeEventListener('scroll',scroll);media.removeEventListener('change',change);cancelAnimationFrame(frame);observer?.disconnect();mutations.disconnect();el.style.removeProperty('--scroll-depth');};
 },[active]);
 return root;
}

export default function Envelope({names,guest,date,loading,onStart,onOpen,error,onRetry}:{names:string;guest?:string;date:string;loading:boolean;onStart:()=>void;onOpen:()=>void;error?:string;onRetry?:()=>void}){
 const [opening,setOpening]=useState(false);const surface=useRef<HTMLDivElement>(null);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 function open(){if(opening||loading)return;setOpening(true);onStart();timer.current=setTimeout(onOpen,matchMedia('(prefers-reduced-motion: reduce)').matches?0:1700);}
 return <section className={'envelope-entry '+(opening?'is-opening':'')} aria-label="Una invitación para ti">
  <div className="entry-top"><span>ANDREA & ALBERTO · NOS CASAMOS</span><span>{new Date(date+'T12:00:00').toLocaleDateString('es-ES')}</span></div>
  <div className="entry-title"><span>Con todo nuestro cariño</span><h1>Hay algo que queremos<br/>celebrar contigo.</h1></div>
  <div ref={surface} className="envelope-perspective" onPointerMove={e=>{if(e.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--tilt-x',`${((e.clientY-r.top)/r.height-.5)*-7}deg`);e.currentTarget.style.setProperty('--tilt-y',`${((e.clientX-r.left)/r.width-.5)*9}deg`);}} onPointerLeave={()=>{surface.current?.style.setProperty('--tilt-x','0deg');surface.current?.style.setProperty('--tilt-y','0deg');}}>
   <div className="envelope-object"><div className="envelope-back"/><div className="envelope-lining" aria-hidden="true"><Monogram/></div><div className="letter-peek"><span>NOS CASAMOS</span><strong>{names.replace('+','&')}</strong><small>{new Date(date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</small></div><div className="envelope-front"/><div className="envelope-fold"/><div className="envelope-flap"/><div className="envelope-address"><span>PARA</span><strong>{loading?'Una invitación muy especial':guest||'ti, que formas parte de nuestra vida'}</strong></div><button className="wax-seal" onClick={open} disabled={opening||loading} aria-label="Abrir el sobre de Andrea y Alberto"><svg className="wax-art" viewBox="280 270 1600 1660" aria-hidden="true"><image href="/assets/aa-wax-seal.webp" width="2048" height="2048"/></svg></button><span className="envelope-postmark"><Monogram/><span>CON CARIÑO · 2027</span></span></div>
  </div>
  <div className="entry-bottom">{error&&<div className="envelope-retry" role="alert"><p>No hemos podido cargar tu invitación. Comprueba tu conexión.</p><button onClick={onRetry} disabled={loading}>{loading?'Conectando…':'Volver a intentarlo'}</button></div>}<span className="entry-edition">UNA INVITACIÓN PARA GUARDAR</span><button onClick={open} disabled={opening||loading}>{opening?'Abriendo tu invitación…':'Toca el sello para abrir'}<span aria-hidden="true">↗</span></button><p>{names} · Nos casamos</p></div>
 </section>;
}
