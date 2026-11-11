import NaturalAccent from './natural-accent';

type Arrangement='programme'|'album'|'reply'|'gift'|'signature';
/** Each arrangement has its own silhouette; plants keep their real proportions. */
export default function BotanicalArrangement({variant,className=''}:{variant:Arrangement;className?:string}){
 const stems={programme:['oats','olive'],album:['cosmos','daisy'],reply:['leafySage','flowers'],gift:['sage','oats'],signature:['olive','daisy']} as const;
 return <span className={'botanical-arrangement arrangement-'+variant+' '+className} aria-hidden="true">{stems[variant].map((kind,i)=><NaturalAccent key={kind} kind={kind} className={'arrangement-stem stem-'+i}/>)}</span>;
}
