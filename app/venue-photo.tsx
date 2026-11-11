import NaturalAccent from './natural-accent';

const photographs={
 huerta:{src:'/assets/huerta-del-conde-garden.webp',width:1280,height:960,alt:'La Casa Palacio Huerta del Conde, con su torre, el jardín y la fuente',credit:'Huerta del Conde',source:'https://huertadelconde.es/'},
 corral:{src:'/assets/corral-ciguenas-patio.webp',width:1280,height:720,alt:'El patio de El Corral de las Cigüeñas, con su palmera, las mesas y los muros de hiedra',credit:'El Corral de las Cigüeñas',source:'https://elcorralcc.com/el-patio/'}
};
export default function VenuePhoto({name}:{name:string}){
 const normalized=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const key=normalized.includes('huerta del conde')?'huerta':normalized.includes('corral')&&normalized.includes('ciguen')?'corral':null;
 if(!key)return null;
 const photo=photographs[key];
 return <figure className={'venue-photo venue-photo-'+key}><div className="venue-photo-mount"><img className="venue-photograph" src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} loading="lazy" decoding="async"/><NaturalAccent kind={key==='huerta'?'flowers':'cosmos'} className="venue-photo-flowers"/><NaturalAccent kind="olive" className="venue-photo-leaf"/></div><figcaption>Foto: <a href={photo.source} target="_blank" rel="noreferrer">{photo.credit}</a></figcaption></figure>;
}
