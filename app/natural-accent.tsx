/** Decorative botanical photographs never receive focus or capture taps. */
export default function NaturalAccent({className='',kind='flowers'}:{className?:string;kind?:'flowers'|'sage'}){
 return <img className={'natural-accent '+className} src={kind==='sage'?'/assets/sage-herbarium-v2.webp':'/assets/pressed-chamomile-v2.webp'} width={kind==='sage'?450:650} height={kind==='sage'?1350:433} alt="" aria-hidden="true" loading="lazy"/>;
}
