'use client';
import {useEffect,useState} from 'react';
import {WifiOff} from 'lucide-react';
export default function NetworkStatus(){
 const [offline,setOffline]=useState(false);
 useEffect(()=>{const update=()=>setOffline(!navigator.onLine);update();window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 return offline?<div className="network-status" role="status"><WifiOff size={16}/><span>Sin conexión. Comprueba que tu respuesta o tus recuerdos se hayan guardado antes de salir.</span></div>:null;
}
