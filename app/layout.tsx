import type { Metadata } from 'next';
import './globals.css';
import './identity.css';
import './natural.css';
export const metadata:Metadata={title:'Andrea + Alberto · Nos casamos',description:'Nos haría mucha ilusión celebrarlo contigo. Invitación, confirmación de asistencia y recuerdos compartidos.',robots:{index:false,follow:false},referrer:'no-referrer',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="es"><body>{children}</body></html>;}
