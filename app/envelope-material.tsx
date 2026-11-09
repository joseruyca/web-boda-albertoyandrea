'use client';
import {useId} from 'react';

// The flap uses the same photograph. It is cut out of the shell so it can
// rotate around its actual fold without leaving a second closed flap behind.
const flap='M28 30 H1072 C1071 88 1055 133 1014 165 L582 520 Q554 540 525 520 L84 165 Q30 126 28 30 Z';
export default function EnvelopeMaterial({guest}:{guest?:string}){
 const id=useId().replaceAll(':','');
 return <>
  <div className="envelope-interior" aria-hidden="true"/>
  <svg className="envelope-shell" viewBox="0 0 1100 688" aria-hidden="true"><defs><clipPath id={id+'-body'} clipPathUnits="userSpaceOnUse"><path d={'M0 0 H1100 V688 H0 Z '+flap} clipRule="evenodd" fillRule="evenodd"/></clipPath></defs><image href="/assets/cotton-envelope-v2.webp" width="1100" height="688" clipPath={'url(#'+id+'-body)'}/></svg>
  <svg className="envelope-open-pocket" viewBox="0 0 1100 688" aria-hidden="true"><defs><pattern id={id+'-pocket'} width="600" height="600" patternUnits="userSpaceOnUse"><image href="/assets/cotton-paper.webp" width="600" height="600"/></pattern></defs><path d="M29 310 Q550 354 1071 310 L1071 650 Q550 660 29 650 Z" fill={'url(#'+id+'-pocket)'} stroke="#d6c7b1" strokeWidth="2"/><path d="M30 649 L420 386 M1070 649 L680 386" fill="none" stroke="#cfbea4" strokeWidth="1.5" opacity=".45"/></svg>
  <div className="envelope-moving-flap" aria-hidden="true">
   <svg className="envelope-flap-face" viewBox="0 0 1100 688"><defs><clipPath id={id+'-flap'}><path d={flap}/></clipPath></defs><image href="/assets/cotton-envelope-v2.webp" width="1100" height="688" clipPath={'url(#'+id+'-flap)'}/></svg>
   <div className="envelope-address"><strong>{guest||'ti, con todo nuestro cariño'}</strong></div>
  </div>
 </>;
}
