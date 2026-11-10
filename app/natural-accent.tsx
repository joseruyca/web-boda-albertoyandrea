const plants={flowers:{src:'pressed-chamomile-v2.webp',width:650,height:433},sage:{src:'sage-herbarium-v2.webp',width:450,height:1350},oats:{src:'pressed-oats.webp',width:400,height:600},olive:{src:'pressed-olive.webp',width:600,height:300},cosmos:{src:'pressed-cosmos.webp',width:400,height:600}};
export default function NaturalAccent({className='',kind='flowers'}:{className?:string;kind?:keyof typeof plants}){
 const plant=plants[kind];return <img className={'natural-accent botanical-'+kind+' '+className} src={'/assets/'+plant.src} width={plant.width} height={plant.height} alt="" aria-hidden="true" loading="lazy" decoding="async"/>;
}
