type InkKind='poppy'|'rose'|'meadow'|'vine'|'magnolia'|'flax'|'cosmos';
const dimensions:Record<InkKind,[number,number]>={poppy:[1536,1024],rose:[1536,1024],meadow:[1024,1536],vine:[1536,1024],magnolia:[1536,1024],flax:[1024,1536],cosmos:[1024,1536]};
export default function InkArt({kind,className='',eager=false}:{kind:InkKind;className?:string;eager?:boolean}){
 const [width,height]=dimensions[kind];
 return <img className={'hb-ink hb-ink-'+kind+' '+className} src={'/assets/ink-'+kind+'.webp'} width={width} height={height} alt="" aria-hidden="true" loading={eager?'eager':'lazy'} decoding="async"/>;
}
