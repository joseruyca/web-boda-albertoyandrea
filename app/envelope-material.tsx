'use client';

// The flap uses the same photograph. It is cut out of the shell so it can
// rotate around its actual fold without leaving a second closed flap behind.
export default function EnvelopeMaterial({guest}:{guest?:string}){
 return <>
  <div className="envelope-interior" aria-hidden="true"/>
  <img className="envelope-shell" src="/assets/cotton-envelope-v2.webp" width="1100" height="688" alt="" aria-hidden="true" style={{clipPath:'polygon(2.5% 4.36%,2.5% 96%,97.5% 96%,97.5% 4.36%,96% 14%,92.18% 24%,52.9% 75.58%,50.36% 78.48%,47.72% 75.58%,7.63% 24%,3.7% 18%)'}}/>
  <div className="envelope-moving-flap" aria-hidden="true">
   <img className="envelope-flap-face" src="/assets/cotton-envelope-v2.webp" width="1100" height="688" alt="" style={{clipPath:'polygon(2.5% 4.36%,97.5% 4.36%,96% 14%,92.18% 24%,52.9% 75.58%,50.36% 78.48%,47.72% 75.58%,7.63% 24%,3.7% 18%)'}}/>
   <div className="envelope-address"><strong>{guest?'Para '+guest:'Para ti'}</strong></div>
  </div>
 </>;
}
