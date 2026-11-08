import {brandPath,brandViewBox} from '../lib/brand.mjs';
export default function Monogram({className=''}:{className?:string}){return <svg className={'aa-monogram '+className} viewBox={brandViewBox} role="img" aria-label="Andrea y Alberto"><path d={brandPath} fill="currentColor"/></svg>;}
