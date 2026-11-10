'use client';
import type {Dispatch,SetStateAction} from 'react';
import type {WeddingConfig,Prewedding} from './config';

export default function PreweddingSettings({draft,setDraft}:{draft:WeddingConfig;setDraft:Dispatch<SetStateAction<WeddingConfig>>}){
 function update(patch:Partial<Prewedding>){setDraft(current=>({...current,prewedding:{...current.prewedding,...patch}}));}
 const event=draft.prewedding;
 return <div className="admin-card"><h2>El encuentro de la preboda.</h2><p>La fecha puede quedar vacía hasta que esté confirmada. Se mostrará como pendiente.</p><div className="form-grid"><label>Lugar de la preboda<input maxLength={200} value={event.venue} onChange={e=>update({venue:e.target.value})}/></label><label>Fecha de la preboda<input type="date" value={event.date} onChange={e=>update({date:e.target.value})}/></label><label>Desde<input type="time" value={event.startTime} onChange={e=>update({startTime:e.target.value})}/></label><label>Hasta<input type="time" value={event.endTime} onChange={e=>update({endTime:e.target.value})}/></label><label>Dirección de la preboda<input maxLength={300} value={event.address} onChange={e=>update({address:e.target.value})}/></label><label>Enlace del mapa de la preboda<input type="url" pattern="https://.*" maxLength={1000} value={event.mapUrl} onChange={e=>update({mapUrl:e.target.value})}/></label></div></div>;
}
