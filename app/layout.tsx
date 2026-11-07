import type { Metadata } from 'next';
import './globals.css';
import './identity.css';
export const metadata:Metadata={title:'Andrea + Alberto · Nos casamos',description:'Nos haría mucha ilusión celebrarlo contigo. Invitación, confirmación, mesas y recuerdos compartidos.',robots:{index:false,follow:false},referrer:'no-referrer',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="es"><body>{children}</body></html>;}
