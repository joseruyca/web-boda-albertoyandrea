'use client';
import {useId} from 'react';

// The flap uses the same photograph. It is cut out of the shell so it can
// rotate around its actual fold without leaving a second closed flap behind.
const flap='M28 30 H1072 C1071 88 1055 133 1014 165 L582 520 Q554 540 525 520 L84 165 Q30 126 28 30 Z';
export default function EnvelopeMaterial({guest}:{guest?:string}){
 const id=useId().replaceAll(':','');
 return <>
  <div className="envelope-interior" aria-hidden="true"/>
  <svg className="envelope-shell" viewBox="0 0 1100 688" aria-hidden="true"><defs><mask id={id+'-body'} maskUnits="userSpaceOnUse" x="0" y="0" width="1100" height="688"><rect width="1100" height="688" fill="white"/><path d={flap} fill="black"/></mask></defs><image href="/assets/cotton-envelope-v2.webp" width="1100" height="688" mask={'url(#'+id+'-body)'}/></svg>
  <div className="envelope-moving-flap" aria-hidden="true">
   <svg className="envelope-flap-face" viewBox="0 0 1100 688"><defs><clipPath id={id+'-flap'}><path d={flap}/></clipPath></defs><image href="/assets/cotton-envelope-v2.webp" width="1100" height="688" clipPath={'url(#'+id+'-flap)'}/></svg>
   <div className="envelope-address"><strong>{guest||'ti, con todo nuestro cariño'}</strong></div>
  </div>
 </>;
}
