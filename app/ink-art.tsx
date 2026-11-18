type InkKind='poppy'|'rose'|'meadow'|'vine'|'magnolia'|'flax'|'cosmos';
const dimensions:Record<InkKind,[number,number]>={poppy:[1536,1024],rose:[1024,1536],meadow:[1024,1536],vine:[1536,1024],magnolia:[1024,1536],flax:[1024,1536],cosmos:[1024,1536]};
export default function InkArt({kind,className='',eager=false}:{kind:InkKind;className?:string;eager?:boolean}){
 const [width,height]=dimensions[kind];
 const edition:Partial<Record<InkKind,string>>={rose:'rose',magnolia:'rose',meadow:'meadow',flax:'meadow',vine:'vine'};
 const source=edition[kind]?'/assets/editorial-'+edition[kind]+'-v3.webp':'/assets/ink-'+kind+'.webp';
 return <img className={'hb-ink hb-ink-'+kind+' '+className} src={source} width={width} height={height} alt="" aria-hidden="true" loading={eager?'eager':'lazy'} decoding="async"/>;
}
