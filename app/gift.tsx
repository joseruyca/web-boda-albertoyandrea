'use client';
import {ArrowUpRight,Check,Copy} from 'lucide-react';
import {useState} from 'react';
import type {WeddingConfig} from './config';
import InkArt from './ink-art';
export default function Gift({config,canSee,openInvite,notify,onBack}:{config:WeddingConfig;canSee:boolean;openInvite:()=>void;notify:(message:string)=>void;onBack:()=>void}){
 const [copied,setCopied]=useState(false),configured=config.giftEnabled&&!!config.giftIban&&!!config.giftHolder;
 async function copy(){try{await navigator.clipboard.writeText(config.giftIban);setCopied(true);notify('Número de cuenta copiado.');}catch{notify('Selecciona el número de cuenta para copiarlo.');}}
 return <section className="content-scene hb-gift"><div className="hb-gift-letter"><span className="hb-folio">UN DETALLE</span><InkArt kind="flax" className="hb-gift-art" eager/><div className="hb-gift-copy"><h1>El mejor regalo,<br/>verte <em>aquí.</em></h1><p>Si además queréis acompañarnos en esta nueva etapa, aquí compartiremos nuestra cuenta.</p>{!canSee?<button className="underline-link" onClick={openInvite}>Abrir mi invitación<ArrowUpRight size={16}/></button>:configured?<div className="gift-account"><span className="eyebrow">TITULAR</span><p>{config.giftHolder}</p><label>Número de cuenta<input className="iban-field" readOnly value={config.giftIban.match(/.{1,4}/g)?.join(' ')||config.giftIban} onFocus={e=>e.target.select()}/></label><button className="solid-btn" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Cuenta copiada':'Copiar número de cuenta'}</button></div>:<div className="hb-gift-pending"><strong>Cuenta por confirmar</strong><span>Los detalles, muy pronto.</span></div>}<p className="hb-gift-signature">{config.names.replace('+','&')}</p></div></div><footer className="hb-page-close"><button className="underline-link" onClick={onBack}>Volver a la invitación<ArrowUpRight size={16}/></button></footer></section>;
}
