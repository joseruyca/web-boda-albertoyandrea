'use client';
import Monogram from './monogram';
import {RotateCcw} from 'lucide-react';
export default function InvitationStart({error,busy,onRetry}:{error:string;busy:boolean;onRetry:()=>void}){
 return <section className="invitation-start" aria-label={error?'No se ha podido abrir la invitación':'Preparando tu invitación'}><Monogram/>{error?<div role="alert"><h1>Vamos a intentarlo<br/><em>una vez más.</em></h1><p>No hemos podido cargar tu invitación. Comprueba la conexión y vuelve a intentarlo.</p><button onClick={onRetry} disabled={busy}>{busy?'Conectando…':'Volver a intentarlo'}<RotateCcw size={16}/></button></div>:<div role="status"><p>Preparando tu invitación</p><span className="start-progress" aria-hidden="true"/></div>}</section>;
}
