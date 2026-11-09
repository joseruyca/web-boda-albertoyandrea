'use client';
import Monogram from './monogram';
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <main className="recovery-page"><Monogram/><span>ANDREA & ALBERTO</span><h1>Un pequeño<br/><em>contratiempo.</em></h1><p>No hemos podido mostrar esta página. Puedes volver a intentarlo o abrir de nuevo la invitación.</p><button onClick={reset}>Volver a intentarlo</button><a href="/">Volver a la invitación</a></main>;
}
