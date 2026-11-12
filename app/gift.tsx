'use client';
import {ArrowRight,Check,Copy} from 'lucide-react';
import {useState} from 'react';
import type {WeddingConfig} from './config';


export default function Gift({config,canSee,openInvite,notify}:{config:WeddingConfig;canSee:boolean;openInvite:()=>void;notify:(message:string)=>void}){
 const [copied,setCopied]=useState(false);
 const configured=config.giftEnabled&&!!config.giftIban&&!!config.giftHolder;
 async function copy(){try{await navigator.clipboard.writeText(config.giftIban);setCopied(true);notify('Número de cuenta copiado.');}catch{notify('Selecciona el número de cuenta para copiarlo.');}}
 return <section className="content-scene gift-scene editorial-gift"><header className="stationery-heading"><span className="eyebrow">CON CARIÑO</span><h1 className="display-title">Un <em>detalle.</em></h1></header><div className="gift-stationery"><figure className="gift-specimen" aria-hidden="true"><img src="/assets/sage-herbarium-v2.webp" width="450" height="1350" alt=""/></figure><div className="gift-letter"><p className="gift-opening">El mejor regalo<br/>es que estés.</p><p>Si además te apetece tener un detalle con nosotros, aquí encontrarás nuestra cuenta.</p>{!canSee?<button className="underline-link" onClick={openInvite}>Abrir mi invitación<ArrowRight size={16}/></button>:configured?<div className="gift-account"><span className="eyebrow">TITULAR</span><p>{config.giftHolder}</p><label>Número de cuenta<input className="iban-field" readOnly value={config.giftIban.match(/.{1,4}/g)?.join(' ')||config.giftIban} onFocus={e=>e.target.select()}/></label><button className="solid-btn" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Cuenta copiada':'Copiar número de cuenta'}</button></div>:<p className="gift-pending">Compartiremos aquí los detalles más adelante.</p>}<p className="gift-signature">Gracias por acompañarnos.<br/>Andrea & Alberto</p></div></div></section>;
}
