'use client';
import {useEffect,useRef,useState} from 'react';
import EnvelopeMaterial from './envelope-material';

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
 function open(){if(opening||loading)return;setOpening(true);onStart();timer.current=setTimeout(onOpen,matchMedia('(prefers-reduced-motion: reduce)').matches?0:2150);}
 return <section className={'envelope-entry stationery-envelope herbarium-envelope clean-envelope '+(opening?'is-opening':'')} aria-label={guest?`Una invitación para ${guest}`:"Una invitación para ti"}>
  <div className="entry-title"><span className="entry-names">{names.replace('+','&')}</span><h1>Nos<br/>casamos.</h1><p className="entry-full-date">{new Date(date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p></div>
  <div ref={surface} className="envelope-perspective" onPointerMove={e=>{if(e.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--tilt-x',`${((e.clientY-r.top)/r.height-.5)*-7}deg`);e.currentTarget.style.setProperty('--tilt-y',`${((e.clientX-r.left)/r.width-.5)*9}deg`);}} onPointerLeave={()=>{surface.current?.style.setProperty('--tilt-x','0deg');surface.current?.style.setProperty('--tilt-y','0deg');}}>
   <div className="envelope-object"><EnvelopeMaterial guest={guest}/><div className="letter-peek"><span>NOS CASAMOS</span><strong>{names.replace('+','&')}</strong><small>{new Date(date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</small></div><button className="wax-seal" onClick={open} disabled={opening||loading} aria-label="Abrir el sobre de Andrea y Alberto"><img className="wax-art" src="/assets/plain-carmine-wax.webp" width="512" height="512" alt="" aria-hidden="true"/></button></div>
   
  </div>
  <div className="entry-bottom">{error&&<div className="envelope-retry" role="alert"><p>No hemos podido cargar tu invitación. Comprueba tu conexión.</p><button onClick={onRetry} disabled={loading}>{loading?'Conectando…':'Volver a intentarlo'}</button></div>}<button onClick={open} disabled={opening||loading}>{opening?'Abriendo tu invitación…':'Abrir invitación'}<span aria-hidden="true">⟶</span></button><p className="hb-envelope-signature">Con todo nuestro cariño.</p></div>
 </section>;
}
