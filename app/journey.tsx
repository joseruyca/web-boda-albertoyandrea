'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,ArrowUpRight} from 'lucide-react';
import {weddingPhase,type WeddingConfig} from './config';
import Monogram from './monogram';
import Portrait from './portrait';
type Destination='day'|'rsvp'|'gallery'|'gift';
export function Countdown({date}:{date:string}) {
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{let timer:ReturnType<typeof setInterval>|undefined;const update=()=>setNow(Date.now());const visibility=()=>{if(timer)clearInterval(timer);if(document.visibilityState!=='hidden'){update();timer=setInterval(update,1000);}};visibility();document.addEventListener('visibilitychange',visibility);return()=>{if(timer)clearInterval(timer);document.removeEventListener('visibilitychange',visibility);};},[]);
 const left=now===null?null:Math.max(0,Math.floor((new Date(date+'T00:00:00+02:00').getTime()-now)/1000));
 const values=left===null?['—','—','—','—']:[String(Math.floor(left/86400)),String(Math.floor(left/3600)%24).padStart(2,'0'),String(Math.floor(left/60)%60).padStart(2,'0'),String(left%60).padStart(2,'0')];
 return <div className="countdown" aria-label="Cuenta atrás para el día de la boda">{values.map((v,i)=><div key={i}><strong>{v}</strong><span>{['días','horas','minutos','segundos'][i]}</span></div>)}</div>;
}
export default function Journey({config,guest,preview,onGo,openInvite}:{config:WeddingConfig;guest?:string;preview:boolean;onGo:(view:Destination)=>void;openInvite:()=>void}) {
 const [phase,setPhase]=useState(config.phase==='auto'?'before':config.phase);
 useEffect(()=>{const update=()=>setPhase(weddingPhase(config));update();const timer=setInterval(update,60000);return()=>clearInterval(timer);},[config.phase,config.date]);
 const [a,b]=config.names.split('+').map(s=>s.trim());
 const date=new Date(config.date+'T12:00:00');
 const fullDate=date.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
 const links=[{title:'El gran día',detail:'El lugar, los momentos y cómo llegar',view:'day'},{title:'Confirmación',detail:'Tu respuesta y lo que necesitas',view:'rsvp'},{title:'Nuestros recuerdos',detail:'Fotos y vídeos para compartir',view:'gallery'}] as const;
 return <section className={'natural-invitation phase-'+phase} aria-label="La invitación de Andrea y Alberto">
  <div className="keepsake-cover">
   <p className="keepsake-eyebrow">{phase==='before'?'NOS CASAMOS':phase==='during'?'HOY ES NUESTRO DÍA':'GRACIAS POR ACOMPAÑARNOS'}</p>
   <div className="keepsake-stationery">
    <img className="keepsake-bow" src="/assets/linen-bow.webp" alt="" aria-hidden="true" width="640" height="960"/>
    <div className="keepsake-photo-block">
     <figure className="keepsake-photo"><Portrait src={config.story[0]?.photo||'/assets/andrea-alberto-portrait.webp'} alt="Andrea y Alberto juntos"/><figcaption>{config.story[0]?.caption||'Nosotros. Y todo lo que viene.'}</figcaption></figure>
     <div className="keepsake-label"><h1>{a}<span>&</span>{b}</h1><p>{fullDate}</p></div>
    </div>
    <div className="keepsake-links">
     <p className="personal-salutation">{guest?<>Para {guest},<br/>con todo nuestro cariño.</>:<>Una invitación para ti,<br/>con todo nuestro cariño.</>}</p>
     <nav aria-label="Dentro de tu invitación">{links.map((link,i)=><button key={link.view} onClick={()=>onGo(link.view)}><span className="keepsake-link-number">0{i+1}</span><span><strong>{link.title}</strong><small>{link.detail}</small></span><ArrowUpRight size={18}/></button>)}{(config.giftEnabled||preview)&&<button onClick={()=>onGo('gift')}><span className="keepsake-link-number">04</span><span><strong>Un detalle con cariño</strong><small>Lo mejor será celebrarlo contigo</small></span><ArrowUpRight size={18}/></button>}</nav>
     <p className="keepsake-scroll">UN DÍA PARA RECORDAR <span aria-hidden="true">↓</span></p>
    </div>
    <img className="keepsake-botanical" src="/assets/dried-chamomile.webp" alt="" aria-hidden="true" width="500" height="750" loading="lazy"/>
   </div>
  </div>
  <section className="letter-message" data-reveal>
   <span className="hand-note">{phase==='before'?'Qué ilusión compartirlo contigo.':phase==='during'?'Ha llegado el día.':'Lo volveríamos a vivir contigo.'}</span>
   <h2>{phase==='after'?<>Hay días que pasan.<br/><em>Y recuerdos que se quedan.</em></>:<>Nuestra historia continúa.<br/><em>Y queremos que estés.</em></>}</h2>
   <p>{phase==='after'?config.thankYou:phase==='during'?'Disfruta de cada momento. Aquí tienes el plan del día y un lugar para guardar todas esas fotos que nos harán volver a vivirlo.':'El próximo '+fullDate+' nos casamos. Nos hace mucha ilusión reunir a las personas que queremos y celebrar juntos todo lo que está por venir.'}</p>
   <button className="solid-btn" onClick={()=>phase==='before'?(guest?onGo('rsvp'):openInvite()):onGo('gallery')}>{phase==='before'?'Confirmar mi asistencia':'Ver los recuerdos'}<ArrowRight size={17}/></button>
   <Monogram/>
  </section>
  {config.story.length>0&&<div className="photo-narrative" aria-label="Nuestra historia">{config.story.map((moment,i)=><article key={i} className={'story-moment moment-'+i%3}><figure><img src={moment.photo} alt={moment.caption||'Un recuerdo de Andrea y Alberto'} loading="lazy"/><figcaption>{moment.caption}</figcaption></figure><div data-reveal><span>NUESTRA HISTORIA · {String(i+1).padStart(2,'0')}</span><p>{moment.text||moment.caption}</p></div></article>)}</div>}
  {phase==='before'&&<section className="date-keepsake" data-reveal><span>CUENTA ATRÁS PARA VERNOS</span><p>{fullDate}</p><Countdown date={config.date}/><button className="date-details-link" onClick={()=>onGo('day')}>Los detalles del día<ArrowUpRight size={16}/></button></section>}
  <footer className="natural-signature"><span>Con todo nuestro cariño,</span><p>{config.names.replace('+','&')}</p><small>{fullDate}</small></footer>
 </section>;
}
export function PracticalDetails({config}:{config:WeddingConfig}){
 const facts=[['Autobuses',config.practical.bus],['Dónde alojarse',config.practical.accommodation],['Cómo venir vestidos',config.practical.dressCode],['¿Necesitas algo?',config.practical.contact]].filter(([,value])=>value);
 return <div className="practical-details">{facts.length>0&&<div className="practical-grid">{facts.map(([title,text])=><article key={title}><span>LOS DETALLES DEL DÍA</span><h2>{title}</h2><p>{text}</p></article>)}</div>}{config.faq.length>0&&<section className="wedding-faq"><span>LAS PEQUEÑAS DUDAS</span><h2>Antes de vernos.</h2>{config.faq.map((f,i)=><details key={i}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</section>}</div>;
}
