import NaturalAccent from './natural-accent';
type Arrangement='programme'|'album'|'reply'|'gift'|'signature';
/** One pressed specimen per composition, with its original proportions. */
export default function BotanicalArrangement({variant,className=''}:{variant:Arrangement;className?:string}){
 const kind={programme:'oats',album:'cosmos',reply:'olive',gift:'sage',signature:'olive'} as const;
 return <span className={'botanical-arrangement arrangement-'+variant+' '+className} aria-hidden="true"><NaturalAccent kind={kind[variant]} className="arrangement-stem"/></span>;
}
